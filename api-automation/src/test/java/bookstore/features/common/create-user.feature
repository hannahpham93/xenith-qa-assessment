@ignore
Feature: Helper - register a throwaway user and log in

  # Called (as `createUser`) by every scenario that needs an authenticated
  # user. Returns userId, userName, password, token and an `auth` header map.
  # Store the result as `user` or `otherUser`: those are the names the
  # cleanup hook (cleanup-users.js) deletes.

  Scenario:
    * url baseUrl
    * def userName = 'karate_' + java.lang.System.currentTimeMillis() + '_' + java.util.UUID.randomUUID().toString().substring(0, 8)

    Given path 'Account/v1/User'
    And request { userName: '#(userName)', password: '#(password)' }
    When method post
    Then status 201
    * def userId = response.userID

    Given path 'Account/v1/GenerateToken'
    And request { userName: '#(userName)', password: '#(password)' }
    When method post
    Then status 200
    And match response.status == 'Success'
    * def token = response.token
    * def auth = { Authorization: '#("Bearer " + token)' }
