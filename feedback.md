# Feedback — NYC 311 Explorer

Detailed, tracked items live in [roadmap.md](roadmap.md). This is the short version.

## Security

- User-supplied ZIP and complaint type are inserted directly into the NYC API query — validate and escape them.
- Some endpoints are open to anyone: `/api/check-alerts` (triggers all alert checks) and `/api/test-slack` (pings Slack). Lock these down.
- No rate limiting on login/register — add it to slow down password guessing.
- CORS accepts every origin — restrict to the frontend.
- Fail fast on startup if `JWT_SECRET`, `MONGODB_URI`, or `NYC_311_API_URL` are missing.

## Code structure

- The backend is one 639-line file and the frontend one 427-line file. Split each into focused pieces (routes, NYC API client, auth for the backend; contexts and hooks for the frontend).
- Add tests, especially around the stats and alert-trigger logic.

## Reliability & UX

- Every search hits the live NYC API and recomputes from scratch — slow and fragile. Store a daily snapshot for speed and resilience.
- Failures show a single generic "Could not…" message. Give more specific feedback and a way to retry.
- Add a note on where the data comes from and how fresh it is.
- Verify the search form and chart work well on mobile.

## Feature ideas

- Map view of complaints (dataset has lat/long).
- Search multiple ZIPs or compare neighborhoods.
- Smarter alerts: daily digests, SMS.
- Account flows: password reset, OAuth login.
