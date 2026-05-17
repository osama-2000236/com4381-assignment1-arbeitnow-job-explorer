# COM4381 Assignment 1

## Group members

| Name | Student ID |
|------|------------|
| Osama Abujarad | 1202883 |
| Iyas Qasqas | 1220248 |

## Description

Frontend web app that consumes the public **Arbeitnow Job Board REST API** (`https://www.arbeitnow.com/api/job-board-api`) from the browser. The user can pick between three live request modes (base URL, `?page=2`, `?visa_sponsorship=true`), search and sort the returned jobs locally, and save jobs for later in the browser's `localStorage`.

## How to run

Requires Node 20+ and pnpm 9+.

```bash
cd assignment1
pnpm install
pnpm dev
```

Then open the URL Vite prints (usually `http://localhost:5173`).
