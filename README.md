# COM4381 Assignment 1 - Job Explorer

Small React app for Part 2 of the assignment. Calls the Arbeitnow public jobs API from the browser, parses the JSON, and lets you search, filter, and sort the results.

## Group members

| Name | Student ID |
|------|------------|
| Osama Abujarad | 1202883 |
| Iyas Qasqas | 1220248 |

## API used

- Provider: Arbeitnow Job Board API
- Root URL: `https://www.arbeitnow.com`
- Resource path: `/api/job-board-api`
- Method: `GET`
- Format: `application/json`
- Query parameters demoed live: `?page=2`, `?visa_sponsorship=true`

## What the app does

- Fires one GET per request mode (recent, page 2, visa sponsorship) and renders the response.
- Search by title, company, location, or tag.
- Filter by job type. Sort by newest, company, or remote first.
- Click a row to see the description and open the original posting.
- A copy button next to the active GET URL helps when paste-testing in Postman.

Search, filter, and sort run in the browser so we only hit the API when the request mode changes.

## Run it

Requires Node 20+ and pnpm 9+.

```powershell
cd assignment1
pnpm install
pnpm dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

Production build:

```powershell
cd assignment1
pnpm build
```

Lint:

```powershell
cd assignment1
pnpm lint
```

## Repo layout

```
.
assignment1/   React + Vite + TypeScript source
docs/          demo script and presentation checklist
evidence/      screenshots of the app and API responses
postman/       Postman collection with the three requests
```

## Stack

React 19, Vite 8, TypeScript. No UI library, no backend, no proxy. `fetch` goes from the browser straight to Arbeitnow.

## Notes for the demo

- `docs/demo-script.md` is the 10-minute walkthrough.
- `docs/presentation-checklist.md` is what to click during the live demo.
- `postman/arbeitnow-assignment1.postman_collection.json` covers the three requests one-to-one with the UI tabs.
- Screenshots in `evidence/` are real captures from the running app and the live API.
