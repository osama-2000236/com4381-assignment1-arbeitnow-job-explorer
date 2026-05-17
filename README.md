# COM4381 Assignment 1 - Baydar Jobs

Frontend-only React app for Part 2 of the COM4381 assignment at Birzeit University. We pick a public REST API, call it from the browser, and show the results in a UI that we would actually use ourselves.

## Group members

| Name | Student ID |
|------|------------|
| Osama Abujarad | 1202883 |
| Iyas Qasqas | 1220248 |

## The API we picked

Arbeitnow Job Board. A public German / EU jobs feed with no API key and friendly CORS.

| Thing | Value |
|------|-------|
| Provider | Arbeitnow Job Board API |
| Root URL | `https://www.arbeitnow.com` |
| Resource | `/api/job-board-api` |
| Method | `GET` |
| Format | `application/json` |
| Query params demoed live | `?page=2`, `?visa_sponsorship=true` |

We looked at a few other APIs from the public-apis list. Most either gated behind a key (OMDb, OpenWeather), or had CORS turned off for browser calls, or returned schemas too thin to build a real UI on. Arbeitnow hit the sweet spot: anonymous, JSON, and rich enough to make a useful screen.

## What the app does

- Sends one GET per request mode (recent / `?page=2` / `?visa_sponsorship=true`). Each tab in the UI is a different URL, mapped one to one to a saved Postman request.
- Lets you search by title, company, location, or tag. Filter by job type. Sort by date, company, or remote first.
- Has a small star button on every job. Whatever you save is kept in `localStorage`, so the list survives a refresh. There is a "Saved only" toggle and a count pill in the topbar.
- Shows the active GET URL on a dark request line with a copy button. Useful in the demo for paste-checking in Postman.
- Skeleton placeholders while loading, friendly error messages for offline and HTTP 429, screen-reader-friendly live counter.

We kept search and sort in the browser so the network only fires when the request mode actually changes. That matches what the REST notes section in the page explains.

## Run it

Needs Node 20+ and pnpm 9+.

```powershell
cd assignment1
pnpm install
pnpm dev
```

Open the URL Vite prints. Usually `http://localhost:5173`.

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
docs/          demo script + presentation checklist
evidence/      screenshots of the running app and the live API
postman/       Postman collection with the three requests
```

## Stack

React 19, Vite 8, TypeScript 6. No UI library, no Tailwind, no backend, no proxy. Plain CSS with custom properties for the design tokens. `fetch` is the only network primitive.

## Look and feel

Visual tokens come from a personal design system we maintain (olive primary, terracotta accent, IBM Plex). Felt cleaner than slapping a generic Bootstrap on it. The values live in `assignment1/src/index.css`.

## Notes for the demo

- `docs/demo-script.md` is the 10-minute walkthrough we'll follow on the day.
- `docs/presentation-checklist.md` is the click-by-click list during the live portion.
- `postman/arbeitnow-assignment1.postman_collection.json` matches the three UI tabs.
- Screenshots in `evidence/` are real captures.
