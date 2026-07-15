# NYC 311 Explorer — Roadmap

A living document capturing security hardening, architecture/refactoring work, and future feature ideas. Items are grouped by area and roughly ordered by priority within each section.

---

## 1. Security Audit

### Critical

- [ ] **SoQL injection in NYC API queries.** `zip` and `complaintType` are interpolated directly into the SoQL `$query` string in `calculateStats`, `/api/trend`, and `/api/complaints` (`server/index.js:41`, `:343`, `:599`). Validate/escape inputs — enforce a 5-digit ZIP regex, and pass `complaintType` via a parameterized `$where` with proper quoting/escaping (double single-quotes) or an allow-list drawn from `/api/complaint-types`.
- [ ] **JWT secret not validated at boot.** If `JWT_SECRET` is unset, tokens are signed/verified with `undefined`, silently weakening auth. Fail fast on startup if any required env var is missing.
- [ ] **Permissive CORS.** `app.use(cors())` allows every origin even though the API is authenticated. Restrict to the known frontend origin(s) via an env-configured allow-list.

### High

- [ ] **No rate limiting.** Auth endpoints (`/api/auth/login`, `/register`) and the NYC-proxy endpoints are open to brute force and abuse. Add `express-rate-limit`, stricter on auth routes.
- [ ] **Unauthenticated alert-check trigger.** `GET /api/check-alerts` (`server/index.js:572`) lets anyone force a full alert sweep (Slack/email fan-out, external API load). Protect it or restrict to an internal token / cron-only.
- [ ] **`/api/test-slack` exposes/uses server webhook.** (`server/index.js:266`) Anyone can POST to it and spam the configured Slack channel. Remove from production or gate behind auth.
- [ ] **No password strength or email format validation** on register (`server/index.js:150`). Enforce minimum length/complexity and validate email server-side.
- [ ] **SSRF via user-supplied `slackWebhookUrl`.** Users store an arbitrary URL that the server later POSTs to (`server/index.js:114`). Validate it against the `hooks.slack.com` host to prevent using the server as an SSRF pivot.

### Medium

- [ ] **No security headers.** Add `helmet` to the Express app.
- [ ] **JWT stored in `localStorage`** (client) is XSS-exfiltratable. Consider httpOnly cookies with CSRF protection, or accept the tradeoff explicitly.
- [ ] **No request body size limits / input length caps** — cap `express.json()` size and field lengths.
- [ ] **Generic error handling leaks nothing but also logs `error.message` only** — ensure no stack traces or secrets reach clients; add structured logging server-side.
- [ ] **Dependency & secret hygiene** — add `npm audit` to CI, confirm `.env` is git-ignored, rotate any keys that were ever committed.

---

## 2. Architecture & Refactoring

### Server

- [ ] **Break up the 639-line `index.js`.** Split into layers: `routes/` (auth, alerts, complaints, users), `controllers/`, `services/` (nyc311, stats, alerts), and `middleware/` (auth, error handler, validation). Mount routers from a thin `app.js`; keep `index.js` as the bootstrap.
- [ ] **Extract a NYC 311 client module** — one place that builds queries, sets timeouts/retries, and handles the SoQL escaping fix above. Both `stats` and `trend` duplicate the same fetch+query logic today.
- [ ] **Deduplicate stats/trend fetching** — both pull the same 5000-record window; a shared fetch + in-memory aggregation would halve external calls.
- [ ] **Centralized error-handling middleware** instead of repeated try/catch blocks that all log-and-500.
- [ ] **Input validation layer** (e.g. `zod` or `express-validator`) applied at route boundaries.
- [ ] **Config module** that reads + validates env once and exports typed config; no scattered `process.env` reads.
- [ ] **Move cron to a separate worker/process** so alert checking doesn't compete with request handling and can scale independently.
- [ ] **Add tests** — currently none. Unit tests for `calculateStats`/alert-trigger logic, integration tests for routes (supertest + mongodb-memory-server).

### Client

- [ ] **Decompose `App.jsx` (427 lines).** It holds all state, data fetching, auth, and view routing. Extract:
  - An `AuthContext` / `useAuth` hook for token+user+localStorage.
  - A data layer (`api.js` axios instance with a baseURL + auth interceptor) so the `Bearer` header isn't rebuilt in every call.
  - Custom hooks: `useComplaints`, `useTrend`, `useAlerts`.
- [ ] **Introduce a real router** (`react-router`) instead of the `view` state string; enables deep links and cleaner nav.
- [ ] **Add a data-fetching library** (TanStack Query) for caching, loading/error states, and request cancellation — removes most manual `loading`/`error` state.
- [ ] **Error boundary** around the app.
- [ ] **Consistent loading/error UX** — currently a single shared `error` string is reused across unrelated actions.

### Cross-cutting

- [ ] **Monorepo tooling** — root scripts to run client+server together (e.g. `concurrently`), shared lint/format config (ESLint + Prettier), `.editorconfig`.
- [ ] **TypeScript migration** (incremental) for both packages to catch shape mismatches between API and client.
- [ ] **CI pipeline** — lint, test, build, `npm audit` on PRs.
- [ ] **Environment/deploy docs** — document required env vars for both packages in one place.

---

## 3. Future Features

### Data & Search
- [ ] Search across multiple ZIPs, boroughs, or community districts (not just one ZIP).
- [ ] Map view of complaints (Leaflet/Mapbox) using the lat/long in the 311 dataset.
- [ ] Filter by status (Open/Closed), agency, date range, and descriptor.
- [ ] Compare two ZIPs or two complaint types side by side.
- [ ] Caching/materialized daily rollups so trends don't re-query 5000 records each time.

### Analytics
- [ ] Configurable trend windows (7/30/90 days) instead of fixed 14.
- [ ] Anomaly detection beyond a fixed % threshold (e.g. rolling z-score, seasonality-aware).
- [ ] Resolution-time analytics (created → closed) per agency/type.
- [ ] Downloadable reports (CSV/PDF export).

### Alerts & Notifications
- [ ] Additional channels: SMS (Twilio), push, webhooks.
- [ ] Digest mode — daily/weekly summary instead of per-crossing alerts.
- [ ] Per-alert notification method + custom message templates.
- [ ] Alert history / audit log of when each alert fired.
- [ ] Snooze / mute controls and re-arm cooldowns.

### Accounts & UX
- [ ] Email verification and password reset flows.
- [ ] OAuth login (Google) as an alternative to email/password.
- [ ] User dashboard with saved searches and favorite ZIPs.
- [ ] Dark mode and full mobile-responsive pass.
- [ ] Onboarding / empty states and inline data-source attribution.

### Platform
- [ ] Public read-only API / shareable trend links.
- [ ] Admin view for monitoring alert-check health and external API usage.
- [ ] Internationalization scaffolding.

---

_Last updated: 2026-07-15_
