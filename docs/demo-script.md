# Demo script (10 minutes)

Short plan for the in-class demo. One screen, one browser, one terminal.

## 1. What I built and why (1 min)

- Frontend that consumes a public REST API straight from the browser.
- Picked a job-board API so the demo has a real, useful scenario for students who are about to graduate.

## 2. The provider (1 min)

- Arbeitnow publishes a public jobs feed with no authentication.
- Useful because the response is plain JSON and they expose query parameters for filtering on the server side.

## 3. REST resource (2 min)

Open Postman, run the three saved requests:

- `GET https://www.arbeitnow.com/api/job-board-api`  -> base resource, returns the latest jobs.
- `GET https://www.arbeitnow.com/api/job-board-api?page=2`  -> shows pagination via a query parameter.
- `GET https://www.arbeitnow.com/api/job-board-api?visa_sponsorship=true`  -> shows filtering via a query parameter.

Point out for the slides / verbal explanation:

- Root URL: `https://www.arbeitnow.com`
- Resource path: `/api/job-board-api`
- HTTP method: `GET` (we only read)
- Representation: `application/json`

## 4. JSON response (1 min)

Expand one item in Postman so the class sees the fields the app actually uses:

`slug, company_name, title, description, location, remote, tags, job_types, url, created_at`.

## 5. Frontend (3 min)

- Open the running app.
- Show the API summary panel on the right side of the hero. It mirrors the same root URL / resource / method we just demoed in Postman.
- Click the three request mode tabs in order: Recent, Page 2, Visa sponsorship. After each click, the GET URL on the dark request line updates and the network panel shows a single new fetch.
- Click the small copy button on the request line, paste in Postman or the URL bar, and show it is the exact same URL.
- Type a search query, change the sort, toggle remote-only. The counter at the bottom of the controls updates ("X of Y jobs match"). No new network requests because filtering is local.
- Click Reset filters to clear them in one move.
- Pick a job on the left. The right panel shows the description and the "Open the original posting" button which goes to Arbeitnow.

## 6. The scenario (1 min)

A student or fresh graduate opens the app, narrows the list by skill or location, and clicks through to the original posting. The same code could be reused for any other Arbeitnow query.

## 7. Stack and code (1 min)

- React 19, Vite, TypeScript.
- One `fetch` call lives in `assignment1/src/lib/api.ts`.
- All UI state lives in `assignment1/src/App.tsx`.
- No backend, no proxy, no mock data.
- Three Postman requests map one-to-one to the three UI tabs.
