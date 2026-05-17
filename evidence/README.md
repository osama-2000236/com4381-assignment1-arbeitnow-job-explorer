# Evidence

Real screenshots from the running app and the live API. Used for the slide deck and as proof of work for the marker.

## App screenshots

- `app-desktop-home.png` - top of the page, hero + API summary visible.
- `app-fullscreen-home.png` - full home view including stats and the job list.
- `app-fullscreen-workflow.png` - mid-demo, a search typed in and a job selected.
- `app-fullscreen-visa-query.png` - visa sponsorship tab active.
- `app-details-view.png` - close-up of the right detail panel.
- `app-mobile-view.png` - the mobile layout.

If we re-shoot after a UI change, add these too:
- `app-fullscreen-page2-query.png` for the new Page 2 tab.
- `app-saved-only.png` for the bookmark / saved-only filter.

## API screenshots

- `api-response-base.png` - JSON for the base `GET` request.
- `api-response-page2.png` - JSON for `?page=2`.
- `api-response-visa.png` - JSON for `?visa_sponsorship=true`.

## Saved payloads

The actual JSON pulled from the endpoint during implementation, plus a small HTML wrapper used to render that JSON in the browser for clean screenshots.

- `api-base-live.json` / `api-base-live.html`
- `api-page2-live.json` / `api-page2-live.html`
- `api-visa-live.json` / `api-visa-live.html`

Note: the JSON files are responses captured from `https://www.arbeitnow.com/api/job-board-api`. The HTML files only re-render that JSON in the browser so a screenshot of the data is readable; they are not the source of truth, the JSON is.
