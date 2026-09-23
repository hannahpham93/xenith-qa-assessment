Feature: Bookstore end-to-end flow (Account + BookStore API) - data-driven

  # Register & login -> search & add book -> view collection -> delete ->
  # logout, once per row of bookIndices.csv (each row picks a different
  # catalog book by index). ISBNs are resolved live from
  # GET /BookStore/v1/Books rather than hard-coded.

  Background:
    * url baseUrl
    * def password = 'Test@1234!'

  Scenario Outline: <scenario> - register, login, add catalog book #<bookIndex>, view, delete, logout

    * def randomUser = 'karate_user_' + java.lang.System.currentTimeMillis() + '_<bookIndex>'

    # 1. Register & login
    Given path 'Account/v1/User'
    And request { userName: '#(randomUser)', password: '#(password)' }
    When method post
    Then status 201
    * def userId = response.userID

    Given path 'Account/v1/GenerateToken'
    And request { userName: '#(randomUser)', password: '#(password)' }
    When method post
    Then status 200
    And match response.status == 'Success'
    * def token = response.token

    # 2. Search and add book to collection
    Given path 'BookStore/v1/Books'
    When method get
    Then status 200
    * def targetBook = response.books[<bookIndex>]
    * def isbn = targetBook.isbn

    Given path 'BookStore/v1/Books'
    And header Authorization = 'Bearer ' + token
    And request { userId: '#(userId)', collectionOfIsbns: [{ isbn: '#(isbn)' }] }
    When method post
    Then status 201
    And match response.books[0].isbn == isbn

    # 3. See list of book collection
    Given path 'Account/v1/User/' + userId
    And header Authorization = 'Bearer ' + token
    When method get
    Then status 200
    And match response.books[*].isbn contains isbn

    # 4. Delete book from collection
    Given path 'BookStore/v1/Book'
    And header Authorization = 'Bearer ' + token
    And request { isbn: '#(isbn)', userId: '#(userId)' }
    When method delete
    Then status 204

    Given path 'Account/v1/User/' + userId
    And header Authorization = 'Bearer ' + token
    When method get
    Then status 200
    And match response.books == '#[0]'

    # 5. Logout (client-side token discard) + cleanup so demoqa doesn't
    # accumulate throwaway accounts from every test run.
    Given path 'Account/v1/User/' + userId
    And header Authorization = 'Bearer ' + token
    When method delete
    Then status 204

    Examples:
    | read('classpath:bookstore/testdata/bookIndices.csv') |
