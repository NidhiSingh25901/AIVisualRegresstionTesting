Feature: User authentication

  Background:
    Given the user is on the home page
    And the page should match the visual baseline "home-page-actual.png"
    And the user navigates to the authentication page

  Scenario Outline: Successful login returns the same token in the API and UI
    When the user logs in with email "<email>" and password "<password>"
    Then the login API response status should be <statusCode>
    And the authenticated email should be "<email>"
    And the token displayed in the UI should match the login API token
    And the page should match the visual baseline "successful-login.png"

    Examples:
      | email               | password    | statusCode |
      | test@automation.com | password123 | 200        |
