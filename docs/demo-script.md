# 10-Minute Demo Script

## 1. Open with the problem

- This project solves Part 2 of the assignment by consuming a live REST API from a modern frontend.
- The idea is useful for students and fresh graduates who want to explore real job opportunities quickly.

## 2. Introduce the provider

- Provider: `Arbeitnow`
- It publishes public job opportunities.
- The service is useful because it exposes jobs as a REST resource that can be queried directly.

## 3. Explain the REST resource

- Root URL: `https://www.arbeitnow.com`
- Resource path: `/api/job-board-api`
- Full resource URL: `https://www.arbeitnow.com/api/job-board-api`
- HTTP method: `GET`
- Representation returned: `JSON`
- Example query parameters: `?page=2` and `?visa_sponsorship=true`

## 4. Show the API response

- Open the API in Postman or the browser.
- Show that the response contains structured JSON fields such as:
  - `slug`
  - `company_name`
  - `title`
  - `location`
  - `remote`
  - `tags`
  - `job_types`
  - `url`
  - `description`

## 5. Show the frontend implementation

- Open the running React app.
- Show the English LTR layout.
- Show the summary cards loaded from real API data.
- Switch the request mode from recent jobs to visa-sponsorship jobs.
- Demonstrate search by title/company/location.
- Demonstrate filtering by job type and remote-only.
- Open one job and show the original application link.

## 6. Explain the useful scenario

- A student or graduate opens the interface.
- The app loads real jobs from the API.
- The user narrows the list locally with search and filters.
- The user chooses a suitable opportunity and goes to the original provider page.

## 7. Close with implementation details

- Frontend stack: `React + Vite + TypeScript`
- Data access: browser `fetch`
- No mock data in the main flow
- The `visa_sponsorship=true` request is implemented as a real query-parameter example, not just a slide note.
- Real screenshots are stored in the `evidence/` folder
- The Postman collection is stored in the `postman/` folder
