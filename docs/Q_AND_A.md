# REFLEX — Q&A / Defense Prep

Framework for every answer: **STATE → CONTEXT → EVIDENCE**. 

---

## A. PROBLEM / PRODUCT

**QUESTION:** Why does Reflex need to exist?
**SHORT ANSWER:** Small retailers currently have no shared record of delivery
assignment, status, or proof of delivery — Reflex creates one.
**STATE:** Reflex exists to replace informal WhatsApp/phone coordination with a
role-based system of record.
**CONTEXT:** The case study identifies electronics shops, pharmacies, and
hardware stores as the target users, coordinating through fragmented channels
with no visibility.
**EVIDENCE:** `README.md` describes this exact problem statement, and the
`Delivery`, `DeliveryEvent`, and `DeliveryConfirmation` models exist specifically
to give every delivery a persistent, auditable record.
**IF PUSHED FURTHER:** If asked why not just use a shared spreadsheet: a
spreadsheet has no permission model and no way to enforce who can transition a
delivery's status, which is the core reliability guarantee Reflex adds.

**QUESTION:** Who is the primary user?
**SHORT ANSWER:** There are three: Retailer staff, Dispatcher, Rider — no single
"primary" user, since the system's value depends on all three roles interacting.
**STATE / CONTEXT / EVIDENCE:** See Slide 3 of the deck; enforced via
role checks in `deliveries/services.py` and `accounts/views.py`.

**QUESTION:** Why is this better than WhatsApp/phone coordination?
**SHORT ANSWER:** Enforced roles, a single authoritative status per delivery, and
an audit trail no chat thread provides.
**CONTEXT:** WhatsApp has no permission model, no status machine, and no way to
prove a delivery was actually completed.
**EVIDENCE:** `DeliveryEvent` records every state transition with an actor and
timestamp; illegal transitions are rejected with a 409, not silently accepted.

---

## B. ARCHITECTURE

**QUESTION:** Why Django?
**STATE:** Django + Django REST Framework gave us a fast path to a
permission-aware REST API with a mature ORM.
**CONTEXT:** The team needed authentication, role enforcement, and a relational
data model in a one-week sprint; Django's batteries-included approach (auth,
admin, ORM, migrations) reduced boilerplate.
**EVIDENCE:** `backend/requirements.txt` lists Django 6.1 and DRF 3.18; the whole
permission/status/health/QR logic lives in ~4 backend files.

**QUESTION:** Why REST?
**STATE:** REST/JSON is simple to build, test, and defend within the sprint
timeline.
**CONTEXT:** No requirement for bidirectional push in the frozen scope; polling
was judged sufficient (see Trade-off 2).
**EVIDENCE:** All backend endpoints are plain DRF `APIView` classes returning
JSON (`deliveries/views.py`, `accounts/views.py`).

**QUESTION:** Why PostgreSQL / why SQLite?
**STATE:** SQLite is the default for local development; the deployed backend has
PostgreSQL support installed but the actual production database has not been
confirmed in this documentation pass.
**CONTEXT:** This is genuinely unresolved — see Trade-off Log item 1.
**EVIDENCE:** `psycopg2-binary` and `dj-database-url` are in
`requirements.txt`; `settings.py` reads `DATABASE_URL` if present.
**IF PUSHED FURTHER:** "I don't know which database Render is actually running
right now — here's how I'd find out: check the Render service's environment
variables for `DATABASE_URL`, or query `/api/` and inspect Django's database
vendor via the admin panel."

**QUESTION:** Why JWT?
**STATE:** JWT lets the backend identify a Retailer/Dispatcher/Rider on every
request without server-side session state.
**CONTEXT:** `djangorestframework-simplejwt` issues an access/refresh pair on
login; the frontend attaches the access token as a Bearer header and refreshes it
transparently on 401.
**EVIDENCE:** `accounts/views.py::LoginView`, `frontend/src/utils/api.ts`
(`refreshAccessToken`).

**QUESTION:** Why separate frontend and backend deployment?
**STATE:** Independent deploy targets (Vercel for a static/Vite frontend, Render
for a Python backend) matched each stack's natural hosting fit.
**CONTEXT:** CORS is explicitly configured to allow the specific Vercel domain.
**EVIDENCE:** `CORS_ALLOWED_ORIGINS` and `CSRF_TRUSTED_ORIGINS` in
`config/settings.py` list the exact Vercel URL.

**QUESTION:** How are roles enforced?
**STATE:** On the backend, in the service layer — not just hidden UI buttons.
**CONTEXT:** Every service function (`create_delivery`, `assign_rider`,
`update_delivery_status`, `confirm_delivery`) checks `user.role` and raises
`PermissionDenied` if the actor is wrong.
**EVIDENCE:** `deliveries/services.py`; automated tests
`test_non_retailer_cannot_create_delivery`,
`test_non_dispatcher_cannot_assign_rider`,
`test_wrong_rider_cannot_update_delivery`.

**QUESTION:** How does delivery state change?
**STATE:** Through a fixed transition table, checked server-side on every
status-update request.
**CONTEXT:** `allowed_transitions = {ASSIGNED: PICKED_UP, PICKED_UP: IN_TRANSIT}`
in `update_delivery_status`; `DELIVERED` can only be reached via
`confirm_delivery`, not the generic status endpoint.
**EVIDENCE:** `test_assigned_delivery_cannot_skip_pickup`,
`test_delivered_status_cannot_be_set_through_status_service`.

---

## C. DATA

**QUESTION:** What entities exist?
**STATE:** `User` (with role), `Delivery`, `DeliveryConfirmation`,
`DeliveryEvent`.
**EVIDENCE:** `accounts/models.py`, `deliveries/models.py`.

**QUESTION:** How are deliveries related to users?
**STATE:** A delivery has a `created_by` (Retailer) and an optional
`assigned_rider` (Rider), both foreign keys to `User`.
**EVIDENCE:** `Delivery.created_by`, `Delivery.assigned_rider` in
`deliveries/models.py`, both `on_delete=PROTECT` so a delivery can't silently
lose its owner if a user is deleted.

**QUESTION:** How are delivery events stored?
**STATE:** A separate `DeliveryEvent` table, one row per state change, ordered by
creation time.
**EVIDENCE:** `DeliveryEvent` model with `event_type`, `from_status`,
`to_status`, `actor`, `created_at`; `Meta.ordering = ["created_at", "id"]`.

**QUESTION:** How is proof/confirmation represented?
**STATE:** A one-to-one `DeliveryConfirmation` record, created only once per
delivery, linked to the confirming rider.
**EVIDENCE:** `DeliveryConfirmation` model (`OneToOneField` to `Delivery`);
`confirm_delivery` returns `ALREADY_CONFIRMED` idempotently rather than creating
a duplicate row (`test_duplicate_confirmation_is_idempotent`).

---

## D. SECURITY

**QUESTION:** How are passwords handled?
**STATE:** Hashed via Django's built-in password hashing (`set_password`), never
stored in plaintext.
**CONTEXT:** Django's standard `AUTH_PASSWORD_VALIDATORS` (similarity, minimum
length, common password, numeric) are configured.
**EVIDENCE:** `accounts/models.py::UserManager.create_user` calls
`user.set_password(password)`; `config/settings.py::AUTH_PASSWORD_VALIDATORS`.

**QUESTION:** How is authentication implemented?
**STATE:** JWT via SimpleJWT, `IsAuthenticated` required on every delivery/rider
endpoint.
**EVIDENCE:** `REST_FRAMEWORK["DEFAULT_AUTHENTICATION_CLASSES"]` in
`settings.py`; every view class sets `permission_classes = [IsAuthenticated]`
except `LoginView` (`AllowAny`).

**QUESTION:** How are permissions enforced?
**STATE:** Twice — role checks in the service layer, and object-level checks
(e.g. `user_can_view_delivery`) in the view layer for read access.
**EVIDENCE:** `deliveries/views.py::user_can_view_delivery`;
`deliveries/services.py` role checks.

**QUESTION:** What security weaknesses remain?
**STATE:** Honestly: tokens in `localStorage` (XSS exposure), no confirmed token
rotation/blacklist configuration, `DEBUG` defaults to `False` but relies on an
environment variable being set correctly in production, and no rate limiting
observed on the login endpoint.
**CONTEXT:** These are typical prototype-stage gaps, not unique failures.
**EVIDENCE:** Trade-off Log item 6; no `SIMPLE_JWT` block or DRF throttling
classes found in `config/settings.py`.
**IF PUSHED FURTHER:** "We haven't load- or penetration-tested the login
endpoint — I'd want to add rate limiting and confirm `DEBUG=False` is actually
set on Render before calling this production-ready."

---

## E. EDGE CASES

**QUESTION:** What happens if two dispatchers act on the same delivery at once?
**STATE:** The second assignment attempt is rejected with a conflict error.
**CONTEXT:** `assign_rider` uses `select_for_update()` inside an atomic
transaction and checks `delivery.status != OPEN` / `assigned_rider is not None`
before assigning, raising `DeliveryConflict` → HTTP 409.
**EVIDENCE:** `test_delivery_cannot_be_assigned_twice`.

**QUESTION:** What happens if a rider updates an invalid state?
**STATE:** Rejected with a 409 and a clear message naming the attempted
transition.
**EVIDENCE:** `test_assigned_delivery_cannot_skip_pickup`,
`test_wrong_rider_and_invalid_transition_are_rejected`.

**QUESTION:** What happens if the API fails (network/server error)?
**STATE:** The frontend surfaces the error as a toast notification rather than
silently failing.
**CONTEXT:** `apiFetch` in `frontend/src/utils/api.ts` catches network errors and
throws a descriptive message; the UI (`addToast`) shows it to the user.
**EVIDENCE:** `frontend/src/utils/api.ts` catch block.
**IF PUSHED FURTHER:** "We haven't tested behavior under a slow/flaky
connection specifically, only hard failure — that's a gap I'd want to close."

**QUESTION:** What happens if the user loses connectivity?
**STATE:** Not explicitly handled beyond the standard fetch failure path; there
is no offline queue or retry-on-reconnect logic found in the repository.
**CONTEXT:** This is a genuine gap, not a tested/handled case.
**EVIDENCE:** No offline-detection or request-queueing code found in
`frontend/src/`.
**IF PUSHED FURTHER:** "I don't know how it behaves on flaky connectivity beyond
a failed fetch and an error toast — I'd test this by throttling the network in
dev tools and observing the actual behavior."

**QUESTION:** What happens if confirmation is attempted twice?
**STATE:** The second attempt is idempotent — it returns the existing
confirmation instead of creating a duplicate or erroring.
**EVIDENCE:** `confirm_delivery` in `deliveries/services.py` checks for an
`existing_confirmation` first; `test_duplicate_confirmation_is_idempotent`.

**QUESTION:** What happens if a rider is unavailable (e.g. offline, inactive)?
**STATE:** The dispatcher's rider list only includes riders with `is_active=True`,
but there is no explicit "availability" or "online/offline" status field on the
backend.
**CONTEXT:** The frontend has UI concepts like `RiderStatusType` ('Available',
'On Delivery', 'Offline'), but this needs to be checked against whether it's
backend-driven or frontend-only derived state.
**EVIDENCE:** `accounts/views.py::RiderListView` filters `is_active=True`;
`frontend/src/types.ts::RiderStatusType`. **UNVERIFIED** whether rider
availability is a real backend signal or a frontend-only heuristic — check
`ReflexContext.tsx::getRiderStatus` before answering with confidence on stage.

---

## F. SCALABILITY

**QUESTION:** What happens at 10x current volume?
**STATE:** Polling load would grow linearly with concurrent users, and SQLite
(if that's what's actually deployed) would become a write-concurrency
bottleneck first.
**CONTEXT:** No load testing has been performed.
**EVIDENCE:** Trade-off Log items 1 and 2.
**IF PUSHED FURTHER:** "We haven't load-tested this — I'd want to benchmark
concurrent write throughput on whichever database is actually deployed before
giving a number."

**QUESTION:** What would need to change for production scale?
**STATE:** Confirmed PostgreSQL, WebSockets/SSE instead of polling, and CI/CD.
**EVIDENCE:** Roadmap Phases 2–3 in the presentation deck.

**QUESTION:** What are current bottlenecks?
**STATE:** Polling frequency (every connected client, every 4 seconds) and
whichever database is actually in production.
**EVIDENCE:** `ReflexContext.tsx` polling interval; Trade-off Log item 1.

---

## G. TRADE-OFFS

**QUESTION:** What did you deliberately simplify?
**STATE:** See the six items in `TRADE_OFF_LOG.md` — database choice, polling vs.
WebSockets, deadline-only health, dual health calculation, simulated QR scan,
and token storage.
**EVIDENCE:** `docs/tradeoffs/TRADE_OFF_LOG.md`.

**QUESTION:** What is the weakest part of the system?
**STATE:** The team should agree on this honestly before the panel — the
strongest candidates from the evidence are the dual (backend/frontend) health
calculation, which can drift, and the unverified production database.
**CONTEXT:** Don't let the panel find these first; name one clearly.

**QUESTION:** What would you rebuild with more time?
**STATE:** Real camera-based QR scanning and a single source of truth for
delivery health (backend-only, frontend just renders it).
**EVIDENCE:** Trade-off Log items 4 and 5.

**QUESTION:** Which design decision are you least confident about?
**STATE:** Team-specific — answer honestly based on who actually built which
part. Do not fabricate a generic answer; this question rewards candor over
polish.

---

## H. CANDOR

**QUESTION:** What doesn't work yet?
**STATE:** Real camera-based QR scanning is not implemented (simulated instead);
there's no notification system (SMS/WhatsApp/email) outside the app itself; no
offline handling.
**EVIDENCE:** `QRScannerModal.tsx`; absence of any notification-sending code in
the repository.

**QUESTION:** What assumption did you make?
**STATE:** That polling every 4 seconds is "near-real-time enough" for a small
retailer's delivery volume, and that a 30-minute at-risk window is a reasonable
default across delivery types.
**CONTEXT:** Neither assumption has been validated with real retailers.

**QUESTION:** What did you not have time to implement?
**STATE:** Automated CI/CD, real QR scanning, WebSocket-based live updates, and
resolving the stale `main` branch (the working code lives on `feature/backend`,
not the repository's default branch).
**EVIDENCE:** No `.github/workflows` or `render.yaml` found; `main` branch
contains an unrelated earlier AI-Studio/Gemini-based scaffold, not the Django/
React application actually deployed.

**QUESTION:** What would you investigate next?
**STATE:** Which database Render is actually running, whether rider
"availability" status is real or frontend-only, and how the app behaves under
poor connectivity.
**EVIDENCE:** These are the three explicitly flagged "UNVERIFIED" items in this
documentation pass.
