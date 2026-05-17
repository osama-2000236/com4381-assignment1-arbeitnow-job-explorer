# COM4381 Assignment 1 - English Job Explorer

## Group Members

- Member 1: ______________________________
- Student ID: ____________________________
- Member 2: ______________________________
- Student ID: ____________________________
- Member 3: ______________________________
- Student ID: ____________________________

## Project Description

This project is a real frontend implementation for **COM4381: Web Services Technologies**.
It consumes the live **Arbeitnow Job Board API** from the browser using `fetch` and presents the returned jobs in a polished English LTR interface inspired by the Baydar / PalNet visual direction.

The scenario is practical for students and fresh graduates:

- load real job data from a public REST API
- search jobs by title, company, or location
- filter by job type and remote availability
- switch the live REST request between recent jobs and visa-sponsorship jobs
- inspect job details in the interface
- open the original application link from the provider

## Selected API

- Provider: `Arbeitnow Job Board API`
- Root URL: `https://www.arbeitnow.com`
- Resource path: `/api/job-board-api`
- HTTP method used: `GET`
- Response format: `JSON`
- Demo query parameters: `?page=2`, `?visa_sponsorship=true`

## Repository Structure

```text
.
├─ assignment1/   # React + Vite source code
├─ docs/          # presentation and demo notes
├─ evidence/      # real screenshots from the running app and API
└─ postman/       # Postman collection for Part 1
```

## How to Run

### Requirements

- Node.js 20+
- pnpm 9+

### Steps

```powershell
cd assignment1
pnpm install
pnpm dev
```

Then open the local URL shown by Vite in the terminal, usually:

```text
http://localhost:5173
```

## Build for Production

```powershell
cd assignment1
pnpm build
```

## Notes for the Class Demo

- The API is consumed directly from the frontend with no backend proxy.
- The app fetches one selected live API resource at a time, then performs search/filter/sort locally to avoid unnecessary API requests.
- See `docs/demo-script.md` for the suggested 10-minute presentation flow.
