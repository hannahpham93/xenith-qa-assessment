Feature: BookStore API - collection rules and authorization

  # Test plan cases B3-B5, B7. Expected responses were verified live
  # against demoqa.com. Users come from createUser and are deleted after
  # each scenario, pass or fail (see karate-config.js).

  Background:
    * url baseUrl
    * def user = call createUser

    Given path 'BookStore/v1/Books'
    When method get
    Then status 200
    * def isbn = response.books[0].isbn

  @P1
  Scenario: B3 - adding an ISBN that is not in the catalog is rejected
    Given path 'BookStore/v1/Books'
    And headers user.auth
    And request { userId: '#(user.userId)', collectionOfIsbns: [{ isbn: '0000000000000' }] }
    When method post
    Then status 400
    And match response == { code: '1205', message: 'ISBN supplied is not available in Books Collection!' }

  @P1
  Scenario: B4 - adding the same ISBN twice is rejected and creates no duplicate
    Given path 'BookStore/v1/Books'
    And headers user.auth
    And request { userId: '#(user.userId)', collectionOfIsbns: [{ isbn: '#(isbn)' }] }
    When method post
    Then status 201

    Given path 'BookStore/v1/Books'
    And headers user.auth
    And request { userId: '#(user.userId)', collectionOfIsbns: [{ isbn: '#(isbn)' }] }
    When method post
    Then status 400
    And match response == { code: '1210', message: "ISBN already present in the User's Collection!" }

    Given path 'Account/v1/User/' + user.userId
    And headers user.auth
    When method get
    Then status 200
    And match response.books == '#[1]'

  @P1
  Scenario: B5 - deleting a book that is not in the collection is rejected
    Given path 'BookStore/v1/Book'
    And headers user.auth
    And request { userId: '#(user.userId)', isbn: '#(isbn)' }
    When method delete
    Then status 400
    And match response == { code: '1206', message: "ISBN supplied is not available in User's Collection!" }

  @P0
  Scenario: B7 - a user cannot add to or delete from another user's collection
    * def otherUser = call createUser

    Given path 'BookStore/v1/Books'
    And headers user.auth
    And request { userId: '#(user.userId)', collectionOfIsbns: [{ isbn: '#(isbn)' }] }
    When method post
    Then status 201

    Given path 'BookStore/v1/Books'
    And headers otherUser.auth
    And request { userId: '#(user.userId)', collectionOfIsbns: [{ isbn: '#(isbn)' }] }
    When method post
    Then status 401
    And match response == errors.unauthorized

    Given path 'BookStore/v1/Book'
    And headers otherUser.auth
    And request { userId: '#(user.userId)', isbn: '#(isbn)' }
    When method delete
    Then status 401
    And match response == errors.unauthorized

    # The victim's collection is unchanged
    Given path 'Account/v1/User/' + user.userId
    And headers user.auth
    When method get
    Then status 200
    And match response.books[*].isbn == [ '#(isbn)' ]
