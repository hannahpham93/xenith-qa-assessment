@ignore
Feature: Helper - best-effort cleanup of a throwaway user

  # Logs in afresh (the scenario's token may be missing if it failed
  # early) and deletes the user. No status assertion: cleanup must never
  # fail a run, and the user may already have been deleted by the test.

  Scenario:
    * url baseUrl

    Given path 'Account/v1/GenerateToken'
    And request { userName: '#(userName)', password: '#(password)' }
    When method post
    * def cleanupToken = response.token

    Given path 'Account/v1/User/' + userId
    And header Authorization = 'Bearer ' + cleanupToken
    When method delete
    * karate.log('[cleanup] delete user', userName, '->', responseStatus)
