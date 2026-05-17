# Evidence

Real screenshots and saved API responses used during the assignment.

## App screenshots

- `app-desktop-home.png` - top of the page with hero and API summary.
- `app-fullscreen-home.png` - full home view including stats and list.
- `app-fullscreen-workflow.png` - mid-demo: search typed in, a job selected.
- `app-fullscreen-visa-query.png` - visa sponsorship tab active.
- `app-details-view.png` - close-up of the right detail panel.
- `app-mobile-view.png` - the mobile layout.

If you re-shoot after a UI change, also capture `app-fullscreen-page2-query.png` so the page=2 tab is in evidence too.

## API responses (raw)

- `api-response-base.png` - JSON for the base `GET` request.
- `api-response-page2.png` - JSON for `?page=2`.
- `api-response-visa.png` - JSON for `?visa_sponsorship=true`.

## Saved payloads

JSON pulled live from the endpoint and a small local HTML wrapper used to render it for clean screenshots:

- `api-base-live.json` / `api-base-live.html`
- `api-page2-live.json` / `api-page2-live.html`
- `api-visa-live.json` / `api-visa-live.html`

Note: the JSON files are the actual responses captured from `https://www.arbeitnow.com/api/job-board-api` during the assignment. The HTML files only re-render that same JSON in the browser so a screenshot of the data is readable.
