Feature: Account API - validation, authentication and authorization

  # Test plan cases A2-A4, A6-A10, A12. Expected responses were verified
  # live against demoqa.com. Users come from createUser and are deleted
  # after each scenario, pass or fail (see karate-config.js).

  Background:
    * url baseUrl
    * def uniqueName = function(prefix){ return prefix + '_' + java.util.UUID.randomUUID() }

  @P1
  Scenario: A2 - register with an existing username is rejected
    * def user = call createUser

    Given path 'Account/v1/User'
    And request { userName: '#(user.userName)', password: '#(password)' }
    When method post
    Then status 406
    And match response == { code: '1204', message: 'User exists!' }

  @P1
  Scenario: A3 - register without a password is rejected
    Given path 'Account/v1/User'
    And request { userName: '#(uniqueName("karate_nopw"))' }
    When method post
    Then status 400
    And match response == { code: '1200', message: 'UserName and Password required.' }

  @P1
  Scenario: A4 - register with a weak password is rejected server-side
    Given path 'Account/v1/User'
    And request { userName: '#(uniqueName("karate_weak"))', password: 'abc' }
    When method post
    Then status 400
    And match response.code == '1300'
    And match response.message contains 'eight characters or longer'

  @P0
  Scenario: A6 - login with a wrong password returns HTTP 200 with status Failed
    * def user = call createUser

    Given path 'Account/v1/GenerateToken'
    And request { userName: '#(user.userName)', password: 'Wrong@1234!' }
    When method post
    Then status 200
    And match response == errors.failedLogin

  @P1
  Scenario: A7 - login with an unknown username is indistinguishable from A6
    Given path 'Account/v1/GenerateToken'
    And request { userName: '#(uniqueName("karate_nobody"))', password: '#(password)' }
    When method post
    Then status 200
    And match response == errors.failedLogin

  @P0
  Scenario: A8 - auth-required call without a token is rejected
    * def user = call createUser

    Given path 'Account/v1/User/' + user.userId
    When method get
    Then status 401
    And match response == errors.unauthorized

  @P0
  Scenario: A9 - auth-required call with a tampered token is rejected
    * def user = call createUser

    Given path 'Account/v1/User/' + user.userId
    And header Authorization = 'Bearer ' + user.token + 'tampered'
    When method get
    Then status 401
    And match response == errors.unauthorized

  @P0
  Scenario: A10 - a user cannot read or delete another user's account
    * def user = call createUser
    * def otherUser = call createUser

    Given path 'Account/v1/User/' + user.userId
    And headers otherUser.auth
    When method get
    Then status 401
    And match response == errors.unauthorized

    Given path 'Account/v1/User/' + user.userId
    And headers otherUser.auth
    When method delete
    Then status 401
    And match response == errors.unauthorized

    # The victim account is untouched
    Given path 'Account/v1/User/' + user.userId
    And headers user.auth
    When method get
    Then status 200

  @P1
  Scenario: A12 - a deleted user can no longer be read or log in
    * def user = call createUser

    Given path 'Account/v1/User/' + user.userId
    And headers user.auth
    When method delete
    Then status 204

    Given path 'Account/v1/User/' + user.userId
    And headers user.auth
    When method get
    Then status 401
    And match response == { code: '1207', message: 'User not found!' }

    Given path 'Account/v1/GenerateToken'
    And request { userName: '#(user.userName)', password: '#(password)' }
    When method post
    Then status 200
    And match response == errors.failedLogin
