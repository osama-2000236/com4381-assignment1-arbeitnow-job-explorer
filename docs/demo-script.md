# Demo script (10 minutes)

What to say and what to click. Iyas presents 1-4, I take 5-7. Swap if the order changes on the day.

## 1. Why a jobs API (1 min)

Most public APIs in the public-apis list want a key or an OAuth flow. Arbeitnow does not. It hands you JSON and lets you filter on the server. Useful for graduating students who want to look at the market without making an account.

## 2. The provider (1 min)

Arbeitnow runs a public job board, mostly Germany and EU, with a feed at `https://www.arbeitnow.com/api/job-board-api`. No registration. CORS works from the browser, which is what we needed for a frontend-only project.

## 3. REST principles in Postman (2 min)

Open the saved Postman collection. Run all three requests once.

- Root URL: `https://www.arbeitnow.com`
- Resource path: `/api/job-board-api` (the jobs collection as one resource)
- Method: `GET`. We only read, so it fits.
- Representation: `application/json`. One representation, no `Accept` negotiation.
- Two query parameters demoed live:
  - `?page=2` for pagination
  - `?visa_sponsorship=true` for server-side filtering

## 4. JSON shape (1 min)

Expand one job in Postman so the class sees the fields the UI actually uses: `slug, company_name, title, description, location, remote, tags, job_types, url, created_at`. Point out `created_at` is a Unix timestamp, which is why we format it in the page.

## 5. Frontend walk-through (3 min)

- Open the running app at `localhost:5173`.
- Hero on the right shows the same root URL / resource / method we just demoed in Postman.
- Click the three request tabs: **Latest jobs** (no params), **Older page** (`?page=2`), **Visa-friendly only** (`?visa_sponsorship=true`). The dark URL line and the helper note under the tabs both update. DevTools network panel shows exactly one new request per click.
- Hit the small copy button next to the GET URL, paste into the URL bar, prove it is the same string.
- Type in the search box. Toggle remote-only. Switch sort. The counter at the bottom updates ("X of Y match"). Network stays quiet because everything below the tabs is local.
- Click the star on two or three jobs. The number in the topbar pill goes up.
- Click that pill. The list flips to saved-only. Refresh the page. The saves survive (localStorage).
- Open one job. Show the description and click "Open the original posting".

## 6. The scenario (1 min)

A Birzeit student opens this near the end of the semester, stars a handful of jobs over a few days, then goes back to those when CV time comes. No login, no account, no email leak. State lives in the browser. That is the whole pitch.

## 7. Stack (1 min)

- React 19 + Vite + TypeScript.
- One `fetch` lives in `src/lib/api.ts`. Three lines decide the query string.
- All state in `src/App.tsx`. Saves in `localStorage` under one key.
- No backend, no mock data, no proxy. The fetch goes browser straight to Arbeitnow.
- Postman collection in `postman/` mirrors the three UI tabs one for one.
