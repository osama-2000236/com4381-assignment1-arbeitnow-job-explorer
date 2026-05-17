# Presentation checklist

Stuff to have ready and stuff to click while the projector is on us.

## Before we walk in

- [ ] GitHub repo open. Tab pinned.
- [ ] Root `README.md` rendered in another tab.
- [ ] Postman open, three saved requests visible in the sidebar.
- [ ] A browser tab on the raw API URL.
- [ ] Terminal in `assignment1/` running `pnpm dev`.
- [ ] DevTools network panel docked at the bottom so the class can see the fetches.
- [ ] Clear any stale stars from a previous demo (`localStorage.clear()` in the console).

## During the talk

- [ ] Run all three Postman requests in order. Comment on the URL change each time.
- [ ] Open the app. Walk through the hero and the API summary panel on the right.
- [ ] Click the **Older page** tab (fires `?page=2`). Point to the network panel.
- [ ] Click the **Visa-friendly only** tab (fires `?visa_sponsorship=true`). Same.
- [ ] Press the copy button. Paste it in a new tab to prove it matches.
- [ ] Type in the search. Watch the counter change. No new request.
- [ ] Change sort. Toggle remote. Counter updates.
- [ ] Star two or three jobs. The pill in the topbar shows the count.
- [ ] Click the pill. The list flips to saved-only.
- [ ] Refresh the page. The saves are still there. Mention `localStorage`.
- [ ] Click Clear filters to get back to the full list.
- [ ] Open one job. Show description. Click "Open the original posting".
- [ ] Verbally call out: provider, root URL, resource path, GET, JSON, `?page=2`, `?visa_sponsorship=true`.

## If something goes wrong

- [ ] If a fetch hangs, the dot in the status bar goes amber and the cards turn into skeletons. Click Refetch.
- [ ] If we see a 429, the error message says so. Wait a minute, then click Refetch.
- [ ] If offline, the error tells us to check the connection. Plug back in or switch to phone hotspot.
