# REFLEX — Trade-off Log

---

# Trade-off 1

## Decision
Use SQLite as the default database, with PostgreSQL support present in
dependencies but not confirmed as the active production database.

## Why We Chose It
SQLite requires zero configuration for local development and is enough to prove
the workflow within a one-week sprint.

## Benefit
Fast local setup (`python manage.py migrate` and go); no external database
service to provision during development.

## Weakness / Cost
SQLite has coarser write concurrency than PostgreSQL and is not a realistic
production database for multiple simultaneous dispatchers/riders. There is also
an unresolved ambiguity: `requirements.txt` includes `psycopg2-binary` and
`dj-database-url`, and `settings.py` reads `DATABASE_URL` via
`dj_database_url.config(...)`, which means the Render deployment *may* actually
be running PostgreSQL rather than SQLite as the README's technology table states.
This has not been confirmed against the live Render environment.

## Why It Was Acceptable for the MVP
A single-writer prototype demo does not need PostgreSQL-grade concurrency, and
the code is already structured to move to PostgreSQL without an application
rewrite (Django ORM, `dj-database-url`).

## What We Would Do Differently
Confirm and document which database Render is actually using, and standardize
local development to match production (or explicitly document the difference).

## Evidence
`backend/config/settings.py` (DATABASES config), `backend/requirements.txt`
(`psycopg2-binary`, `dj-database-url`), `README.md` (Technology Stack table).

---

# Trade-off 2

## Decision
Use frontend polling (every 4 seconds) instead of WebSockets or Server-Sent
Events for near-real-time delivery updates.

## Why We Chose It
Polling is simpler to implement, test, and demonstrate within the sprint
timeline than a persistent-connection protocol.

## Benefit
No additional infrastructure (no channel layer, no WebSocket server); simple to
reason about and debug.

## Weakness / Cost
Updates can lag up to ~4 seconds behind the true backend state, and every active
user's browser issues a request every 4 seconds regardless of whether anything
changed — this does not scale well with many concurrent users.

## Why It Was Acceptable for the MVP
For a demo with a handful of users and deliveries, a few seconds of latency and
modest request volume are invisible and inconsequential.

## What We Would Do Differently
Move to WebSockets or Server-Sent Events for dashboards with many concurrent
dispatchers/riders, and/or increase the polling interval or add backoff for idle
sessions to reduce request volume.

## Evidence
`frontend/src/context/ReflexContext.tsx` (`window.setInterval(..., 4000)`);
`README.md` ("Near-real-time updates: Frontend polling").

---

# Trade-off 3

## Decision
Delivery health (`ON_TIME` / `AT_RISK` / `DELAYED` / `DELIVERED_ON_TIME` /
`DELIVERED_LATE`) is calculated purely from `expected_delivery_at` versus the
current time, with a fixed 30-minute at-risk window.

## Why We Chose It
A deadline-only rule is simple to implement, simple to test deterministically,
and easy to defend under questioning — there is no hidden model or external
dependency.

## Benefit
Fully backend-derived, not stored or manually editable
(`calculate_delivery_health` in `deliveries/services.py`), and covered by
dedicated automated tests for each health state.

## Weakness / Cost
It ignores traffic conditions, route distance, rider location, and any real
signal of *why* a delivery might be at risk — it only knows the clock. Framing
it as "readiness" is accurate as a deadline-proximity signal, but it must not be
oversold as predictive or traffic-aware in the presentation.

## Why It Was Acceptable for the MVP
The case study asked for a health/readiness signal the retailer can see; a
transparent, testable, deadline-based rule satisfies that without requiring GPS
or third-party traffic data that was out of scope for a one-week sprint.

## What We Would Do Differently
Incorporate route distance, live rider location, and/or traffic data before
calling this "readiness" in a production pitch; consider historical delivery-time
data as a future, clearly-labeled predictive feature (see Roadmap Phase 5).

## Evidence
`backend/deliveries/services.py` (`AT_RISK_WINDOW = timedelta(minutes=30)`,
`calculate_delivery_health`); `backend/deliveries/tests.py` (health-state tests).

---

# Trade-off 4

## Decision
Delivery health is calculated independently in two places: once authoritatively
on the backend (`deliveries/services.py`), and a second time on the frontend
(`frontend/src/utils/deliveryHealth.ts`) for display purposes.

## Why We Chose It
Not confirmed as an intentional architectural decision from the repository
history — it reads as parallel development between backend and frontend workstreams,
each independently satisfying the same "frozen specification" (a comment in the
frontend file explicitly references a "frozen Delivery Health Specification").

## Benefit
The frontend can render a health badge without waiting on a fresh API response,
and includes extra UI-only fields (progress percentage, "traffic condition"
labels) not present in the backend's response.

## Weakness / Cost
Two independent implementations of the same business rule can drift out of sync.
Concretely, the frontend's calculation (`deliveryHealth.ts`) parses times as
minutes-since-midnight rather than full timestamps, which is a different (and
narrower) model than the backend's full-datetime comparison — this is a real
discrepancy, not a hypothetical one. The frontend also labels its "traffic
condition" field with names like "Corridor Flow Normal" and "Delivery Deadline
Exceeded," which sound like live traffic data but are purely derived from the
same deadline-based health value — this must be described accurately and not
implied to be real traffic monitoring.

## Why It Was Acceptable for the MVP
The demo dataset is small and short-lived enough that the two calculations are
unlikely to visibly disagree during a live presentation, and the backend value is
still the one persisted and returned by the API.

## What We Would Do Differently
Make the backend's `health` field (already present in `DeliveryListSerializer`
and `DeliveryDetailSerializer`) the single source of truth the frontend renders
directly, and remove or clearly relabel the frontend's "traffic condition" copy
so it cannot be mistaken for real traffic data.

## Evidence
`backend/deliveries/serializers.py` (`get_health`); `frontend/src/utils/
deliveryHealth.ts` (`deriveDeliveryHealth`, `trafficLabels`); `frontend/src/
types.ts` (`Delivery` interface has no `health` field returned from the API,
confirming the frontend does not consume the backend's computed value directly).

---

# Trade-off 5

## Decision
The QR "scan" in the deployed frontend is a simulated confirmation button, not a
real camera-based QR reader.

## Why We Chose It
Camera integration (device permissions, QR decoding library, cross-browser
support) adds real engineering time that was not the priority for proving the
end-to-end workflow within the sprint.

## Benefit
The confirmation *endpoint* and its validation logic are fully real and tested
(token match, correct rider, correct delivery state, idempotent on repeat
confirmation) — only the client-side act of reading a physical QR code is
simulated.

## Weakness / Cost
The demo cannot show an actual phone camera reading a real printed QR code end
to end; the "scan" button in `QRScannerModal.tsx` triggers a timed animation and
then calls the same confirmation function a real scan would call, using the
token already available to that session rather than a freshly decoded one.

## Why It Was Acceptable for the MVP
The case study's core requirement is that scanning *triggers backend
validation* — which it genuinely does. The optical capture step is a UI
convenience layer that can be swapped in without changing the backend contract.

## What We Would Do Differently
Integrate a real browser-based QR decoding library (e.g. reading from
`getUserMedia` camera input) so the rider actually scans a physical or on-screen
QR code rather than tapping a button.

## Evidence
`frontend/src/components/rider/QRScannerModal.tsx` (`handleSimulateScan`,
comment "tap below to simulate verification"); `frontend/src/context/
ReflexContext.tsx` (`confirmDeliveryQR`, which does call the real
`/api/deliveries/{id}/confirm/` endpoint).

---

# Trade-off 6

## Decision
JWT access and refresh tokens are stored in browser `localStorage`.

## Why We Chose It
`localStorage` is the simplest place to persist a token across page reloads
without additional backend session infrastructure.

## Benefit
Simple session persistence; works well for a demo/prototype without extra
server-side session state.

## Weakness / Cost
Tokens in `localStorage` are readable by any JavaScript running on the page,
which is a known XSS exposure pattern; an httpOnly cookie is the more
production-appropriate pattern for token storage.

## Why It Was Acceptable for the MVP
The application has no user-generated content or third-party script injection
surface in its current scope, which limits (but does not eliminate) the
practical XSS risk during the sprint/demo period.

## What We Would Do Differently
Move to httpOnly, secure cookies for token storage in a production-hardening
pass, alongside the token rotation/blacklisting settings SimpleJWT supports but
that are not currently configured (`REST_FRAMEWORK` in `settings.py` sets only
the default authentication class, with no explicit `SIMPLE_JWT` rotation/
blacklist configuration found in the repository).

## Evidence
`frontend/src/utils/api.ts` (`localStorage.setItem(ACCESS_TOKEN_KEY, ...)`);
`backend/config/settings.py` (`REST_FRAMEWORK` block, no `SIMPLE_JWT` settings
present).

---

## Trade-off Summary

| Decision | Benefit | Cost | Future Improvement |
|----------|---------|------|--------------------|
| SQLite by default (Postgres deps present, live DB unconfirmed) | Zero-config local setup | Ambiguous prod database; SQLite concurrency limits | Confirm/standardize on PostgreSQL in production |
| Polling every 4s instead of WebSockets/SSE | Simple, no extra infra | Up to ~4s lag; scales poorly with many users | Move to WebSockets/SSE |
| Deadline-only delivery health (30-min window) | Simple, fully tested, transparent | Ignores traffic/route/GPS; not predictive | Add route/traffic data or historical prediction (clearly labeled) |
| Health computed separately on frontend and backend | Frontend can render richer UI state | Two implementations can drift; frontend uses time-of-day only | Make backend's `health` field the single source of truth |
| Simulated QR "scan" (real backend validation, no real camera scan) | Backend confirmation logic is fully real and tested | Can't demo an actual physical QR scan | Add real camera-based QR decoding |
| JWT tokens stored in `localStorage` | Simple session persistence | XSS exposure surface; no rotation/blacklist configured | Move to httpOnly cookies + token rotation |
