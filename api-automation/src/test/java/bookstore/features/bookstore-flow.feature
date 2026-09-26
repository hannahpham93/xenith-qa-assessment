Feature: Bookstore end-to-end flow (Account + BookStore API) - data-driven

  # The required flow at the API layer, once per row of bookIndices.csv
  # (each row picks a different catalog book by index). ISBNs are resolved
  # live from GET /BookStore/v1/Books rather than hard-coded.
  # Covers test plan cases A1, A5, A11, B1, B2, B6.

  Background:
    * url baseUrl

  @P0
  Scenario Outline: <scenario> - register, login, add catalog book #<bookIndex>, view, delete

    * def userName = 'karate_' + java.lang.System.currentTimeMillis() + '_<bookIndex>'

    # A1 - Register
    Given path 'Account/v1/User'
    And request { userName: '#(userName)', password: '#(password)' }
    When method post
    Then status 201
    And match response == { userID: '#uuid', username: '#(userName)', books: [] }
    * def userId = response.userID
    * def user = { userId: '#(userId)', userName: '#(userName)', password: '#(password)' }

    # A5 - Login
    Given path 'Account/v1/GenerateToken'
    And request { userName: '#(userName)', password: '#(password)' }
    When method post
    Then status 200
    And match response contains { status: 'Success', token: '#string' }
    * def auth = { Authorization: '#("Bearer " + response.token)' }

    # B1 - List catalog (search is client-side filtering over this list).
    # Each book must match the BookModal schema from the Swagger contract.
    Given path 'BookStore/v1/Books'
    When method get
    Then status 200
    And match each response.books == read('classpath:bookstore/features/common/schemas/book.json')
    * def isbn = response.books[<bookIndex>].isbn

    # B2 - Add book to collection
    Given path 'BookStore/v1/Books'
    And headers auth
    And request { userId: '#(userId)', collectionOfIsbns: [{ isbn: '#(isbn)' }] }
    When method post
    Then status 201
    And match response.books[0].isbn == isbn

    # A11 - View collection
    Given path 'Account/v1/User/' + userId
    And headers auth
    When method get
    Then status 200
    And match response.books[*].isbn == [ '#(isbn)' ]

    # B6 - Delete book, collection is empty again
    Given path 'BookStore/v1/Book'
    And headers auth
    And request { isbn: '#(isbn)', userId: '#(userId)' }
    When method delete
    Then status 204

    Given path 'Account/v1/User/' + userId
    And headers auth
    When method get
    Then status 200
    And match response.books == '#[0]'

    # Logout has no API endpoint (the UI only clears its cookie; plan F2),
    # so it is covered by Playwright (U8). The user is deleted after the scenario.

    Examples:
    | read('classpath:bookstore/testdata/bookIndices.csv') |
