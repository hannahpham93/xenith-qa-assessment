# Bookstore QA Automation — Xenith Senior QA Assessment (Task B)

Automates one flow on the [demoqa.com](https://demoqa.com) Book Store app: **register & login → search & add book → view collection → delete book → logout**, plus negative, authorization and UI edge cases. Test names carry case IDs (A = Account API, B = BookStore API, U = Web UI).

| Suite | Tool | Style |
|---|---|---|
| `web-automation/` | Playwright + TypeScript | Page Object Model, data-driven |
| `api-automation/` | Karate | Scenario Outline, data-driven |

## Architecture

```mermaid
flowchart TB
    subgraph Web["web-automation (Playwright)"]
        Spec["bookstore-flow.spec.ts (data-driven via books.json)
bookstore-edge-cases.spec.ts"]
        Fixture["pages.fixture.ts
Page Objects + testUsers"]
        Pages["Page Objects
Login · BookStore · BookDetail · Profile"]
        Base["BasePage"]
        Utils["utils/
env · testDataFactory · bookstoreApiClient"]
        Spec --> Fixture --> Pages --> Base
        Spec --> Utils
        Fixture --> Utils
    end

    subgraph API["api-automation (Karate)"]
        Runner["BookstoreTest.java"] --> Feature["bookstore-flow.feature (Outline via bookIndices.csv)
account-api.feature · bookstore-api.feature"]
        Feature --> Common["common/
create-user · delete-user · cleanup-users.js · schemas/book.json"]
        Feature --> Config["karate-config.js"]
    end

    Demoqa[("demoqa.com
Account + BookStore REST API")]
    Utils -->|provision / cleanup users| Demoqa
    Pages -->|drives a real browser| Demoqa
    Feature -->|direct HTTP calls| Demoqa
```

## Flow

Registration is provisioned via API rather than the UI — see [Notable findings](#notable-findings).

```mermaid
sequenceDiagram
    participant T as Test
    participant API as Account API
    participant UI as Browser

    T->>API: POST /Account/v1/User (provision)
    API-->>T: 201 userID

    T->>UI: Login
    UI->>API: POST /Account/v1/GenerateToken
    API-->>UI: 200 token
    UI-->>T: redirected to /profile

    T->>UI: Search, open book, "Add To Your Collection"
    UI->>API: POST /BookStore/v1/Books

    T->>UI: Delete icon, then OK on confirm dialog
    UI->>API: DELETE /BookStore/v1/Book

    T->>UI: Logout
    T->>API: cleanup (GenerateToken + DELETE user)
```

Karate exercises the same steps at the API layer, including the register call (logout has no API endpoint, so it is UI-only). The negative and authorization cases run as separate scenarios tagged `@P0`/`@P1`, so `mvn test -Dkarate.options="--tags @P0"` runs only P0.

To add a Karate test, set `* url baseUrl` and use `* def user = call createUser`. `karate-config.js` provides `createUser`, the shared error bodies (`errors.*`) and a global cleanup hook; store the result as `user` or `otherUser` and it is deleted after the scenario, whether it passes or fails.

## Setup

Prerequisites: **Node.js 20+**, **Java 17+**, **Maven 3.9+**.

```bash
# Web
cd web-automation
npm install && npx playwright install chromium
npm test                 # headless, Chromium
npm run test:headed      # watch it run
npm run report           # last HTML report

# API
cd api-automation
mvn test                 # report: target/karate-reports/karate-summary.html
mvn test -Dkarate.options="--tags @P0"   # P0 only
mvn test -Dkarate.options="classpath:bookstore/features/bookstore-api.feature:17"   # one scenario
```

Both suites create disposable test users and delete them on teardown — no manual setup, no shared state between runs.

### Cross-browser & device coverage

`playwright.config.ts` also defines **Firefox**, **WebKit**, and mobile emulation (**Pixel 5**, **iPhone 13**) as opt-in projects — verified working with the same Page Objects, no locator changes needed. `npm test` stays on Chromium by default for fast feedback; run the full matrix or a single project with:

```bash
npm run test:cross-browser        # all 5 projects
npx playwright test --project=firefox
npx playwright test --project=mobile-safari
```

## Data-driven design

- `web-automation/testdata/books.json` — one row per scenario, consumed by a loop in `bookstore-flow.spec.ts`. Each row searches with a partial term (lowercase `git`, multi-word `Design Patterns`), so the data also exercises the search matching.
- `api-automation/.../bookIndices.csv` — one row per scenario, consumed by a Karate `Scenario Outline`.
- Neither hard-codes an ISBN; both resolve it live from `GET /BookStore/v1/Books`.

## Security

- No secrets committed: `.env` is git-ignored, `.env.example` holds placeholders only; `.gitignore` also excludes `node_modules/`, `target/`, and build/report output.
- Every run generates a disposable `qa_user_*` / `karate_*` account and deletes it afterwards (Playwright's `testUsers` fixture and Karate's global `afterScenario` hook both run even on failure).
- The test password comes from `TEST_USER_PASSWORD` in both suites (a policy-compliant dummy, with a fallback for local runs).
- CI (`.github/workflows/qa-automation.yml`) runs both suites the same way, with `BASE_URL` as a variable (read by both suites), not a hard-coded value. A test that only passes on retry fails the run (`failOnFlakyTests`).
- CI runs with a read-only `GITHUB_TOKEN` (`permissions: contents: read`), installs from the lockfile (`npm ci`), and type-checks before testing.
- Karate logs at INFO (`logback-test.xml`), so request bodies with passwords and tokens stay out of the CI console.

## Notable findings

Surfaced by running the suites against the live app, not by reading a tutorial:

| Finding | Fix |
|---|---|
| `/register` is gated by an invisible reCAPTCHA v3 that never resolves under automated Chromium — verified with headed/headless runs, forced clicks, and ad-blocking; zero `POST /Account/v1/User` calls ever fire, while the identical Login form works instantly. | Provision users via the Account API (`bookstoreApiClient.registerUser`); drive login → logout through the real UI. Karate also registers via the API. |
| "Add To Your Collection" and "Back To Book Store" share the same `id="addNewRecordButton"`; the Logout button reuses `id="submit"` from unrelated forms. | Target by accessible role + name instead of id. |
| Clicking a collection row's delete icon only opens a "Delete Book" dialog — it doesn't call the API. The dialog's OK button (`#closeSmallModal-ok`) fires the actual `DELETE`. | `ProfilePage.deleteBook()` clicks both; U7 covers Cancel. |
| A failed login returns HTTP `200` with `status: "Failed"`, not `401`. | U2 checks the UI still shows the error; A6 pins the API behaviour. |
