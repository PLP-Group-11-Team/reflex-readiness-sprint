# REFLEX — Presentation Deck
Structure: Problem → Solution → Architecture → Trade-offs → Roadmap

---

## SLIDE 1 — REFLEX

**Key takeaway:** Reflex turns informal WhatsApp/phone delivery coordination into a
traceable, role-based system.

**Visual:** Logo/title slide + one-line tagline: *"From WhatsApp threads to a
system of record."*

**Speaker notes:** Open with the positioning line, not a feature list. Reflex is a
delivery *visibility and readiness* system for small Kenyan retailers — not a full
logistics platform. Say what it is in one sentence and move on.


---

## SLIDE 2 — THE PROBLEM

**Key takeaway:** Small retailers coordinate deliveries with no record, no status
visibility, and no proof of delivery.

**Visual:** Simple "before" diagram — phone/WhatsApp icons with a question mark
over "where is my delivery?"

**Speaker notes:** Electronics shops, pharmacies, hardware stores in Kenya
currently assign and track deliveries over WhatsApp and phone calls. There is no
shared record of who is assigned, what state a delivery is in, or whether it was
actually delivered. This is the case-study problem statement Reflex was built to
answer.


---

## SLIDE 3 — WHO EXPERIENCES IT?

**Key takeaway:** Three roles, three distinct jobs — Retailer, Dispatcher, Rider.

**Visual:** Three-column persona card (Retailer / Dispatcher / Rider) with one
verb each: *Create → Assign → Deliver.*

**Speaker notes:** Retailer logs the delivery request. Dispatcher sees open
requests and assigns a rider. Rider sees only their own assigned deliveries and
moves them through pickup, transit, and confirmation. Each role is enforced on the
backend, not just hidden in the UI (evidence: `deliveries/services.py` raises
`PermissionDenied` for out-of-role actions; `accounts/views.py` restricts the
rider list to Dispatchers only).


---

## SLIDE 4 — THE SOLUTION

**Key takeaway:** One delivery, one clear lifecycle, backend-enforced at every
step.

**Visual:** `OPEN → ASSIGNED → PICKED_UP → IN_TRANSIT → DELIVERED` pipeline
diagram.

**Speaker notes:** Reflex gives every delivery a single authoritative status.
Retailer staff create it, a dispatcher assigns it, a rider updates it, and a
QR-based confirmation step closes it out. The backend — not the UI — decides
whether a transition is legal.


---

## SLIDE 5 — HOW REFLEX WORKS (LIFECYCLE)

**Key takeaway:** Every status change is validated server-side and recorded as an
event.

**Visual:** Sequence diagram: Retailer creates → Dispatcher assigns → Rider
picks up → Rider in transit → Customer QR scanned → Delivered.

**Speaker notes:** Walk through the lifecycle once, end to end, without diving
into code. Mention that every step also writes a `DeliveryEvent` record
(`CREATED`, `ASSIGNED`, `STATUS_CHANGED`, `CONFIRMED`) — this is the audit trail
question the panel is likely to ask about later.


---

## SLIDE 6 — ARCHITECTURE

**Key takeaway:** A conventional, defensible three-tier stack: React/TypeScript
frontend, Django REST backend, JWT auth.

**Visual:** Layered architecture diagram — Frontend (React/Vite) → REST/JSON →
Django + DRF (roles, assignment, status rules, health, QR validation, events) →
ORM → Database.

**Speaker notes — state each choice and why, verified against the repo:**
- **Frontend:** React 19 + TypeScript + Vite (`frontend/package.json`).
- **Backend:** Django 6.1 + Django REST Framework (`backend/requirements.txt`).
- **Auth:** JWT via `djangorestframework-simplejwt`, with an access/refresh token
  pair issued at login and a token-refresh endpoint (`accounts/views.py`,
  `accounts/urls.py`).
- **Database:** SQLite by default; the deployed backend also ships
  `psycopg2-binary` and `dj-database-url`, meaning the Render deployment can run
  on PostgreSQL if a `DATABASE_URL` environment variable is set
  (`config/settings.py`). **Verify live which database Render is actually using
  before stating this on stage** — the README documents SQLite, but the
  dependency list supports Postgres too.
- **Near-real-time updates:** Frontend polling every 4 seconds
  (`ReflexContext.tsx`), not WebSockets/SSE.
- **Deployment:** Frontend on Vercel, backend on Render, deployed separately.


---

## SLIDE 7 — DELIVERY READINESS (DIFFERENTIATOR)

**Key takeaway:** Reflex doesn't just show status — it shows whether a delivery is
on track, using a simple, rule-based readiness signal.

**Visual:** Three-state badge: ON_TIME (green) → AT_RISK (amber) → DELAYED (red),
plus DELIVERED_ON_TIME / DELIVERED_LATE for closed deliveries.

**Speaker notes:** This is calculated, not manually set. The backend computes it
from `expected_delivery_at` versus current time, using a fixed 30-minute at-risk
window (`deliveries/services.py::calculate_delivery_health`). Be precise about
what this is **not**: it is a deadline-proximity signal, not a prediction. It does
not use traffic, GPS, route distance, or machine learning. The frontend also
computes its own version of this same signal independently
(`frontend/src/utils/deliveryHealth.ts`) for display — flag this only if asked,
see Trade-off Log item 4.


---

## SLIDE 8 — LIVE DEMO

**Key takeaway:** We will show one delivery move end-to-end across all three
roles, live.

**Visual:** Just a "Live Demo" title card — no bullet list, let the screen do the
talking.

**Speaker notes:** State exactly what will happen before switching to the screen:
retailer creates a delivery, dispatcher assigns a rider, rider updates status
through pickup and transit, delivery is confirmed via the QR flow, and the
resulting delivery-health and event history are shown. Full script in
`docs/demo/DEMO_SCRIPT.md`.


---

## SLIDE 9 — TRADE-OFFS

**Key takeaway:** Every simplification was a deliberate MVP decision, not an
oversight.

**Visual:** Three-row table: Decision | Why | Cost (see `TRADE_OFF_LOG.md` for
full detail — do not reproduce the whole log on the slide).

**Speaker notes:** Name three, briefly, in the presenter's own words:
1. SQLite as the default database.
2. Polling instead of WebSockets for near-real-time updates.
3. Deadline-only delivery health (no traffic/GPS/route data).
Then say: "here's why each was acceptable for a one-week sprint, and what we'd
change with more time" — and move to the next slide before the panel starts
asking, since Slide 10 covers the honest weak points.


---

## SLIDE 10 — LIMITATIONS

**Key takeaway:** We know exactly where this system is weakest, and we're not
hiding it.

**Visual:** Short bulleted list, plain text, no icons — this slide should look
deliberately unpolished/honest.

**Speaker notes:** Cover, briefly:
- No automated CI/CD (`no .github/workflows`, no `render.yaml` found in the
  repository); deployment is manual.
- The `main` branch on GitHub is an earlier, unrelated scaffold (an AI
  Studio/Gemini-based prototype) — the actual working system lives on
  `feature/backend`, which is also what's deployed. This should be resolved
  (merged or made default) before submission.
- The QR "scan" in the current frontend is a simulated scan button, not a real
  camera-based QR reader (`QRScannerModal.tsx`) — see Trade-off Log item 5.
- Tokens are stored in browser `localStorage`, which is a common but real XSS
  exposure surface for the access/refresh tokens.


---

## SLIDE 11 — ROADMAP

**Key takeaway:** The roadmap fixes today's known trade-offs in priority order —
it does not add speculative new features.

**Visual:** Simple horizontal phase timeline, Phase 1 (current) → Phase 5.

**Speaker notes:**
- **Phase 1 (current):** Frozen MVP delivery workflow — create, assign, track,
  confirm.
- **Phase 2:** Real-time updates via WebSockets/SSE instead of polling; move to
  PostgreSQL in production if not already running there.
- **Phase 3:** Real camera-based QR scanning; CI/CD pipeline; branch hygiene
  (retire or replace the stale `main` branch).
- **Phase 4:** Notification infrastructure (SMS/WhatsApp/email) so retailers and
  customers don't need to rely on the app alone.
- **Phase 5:** Route/traffic-aware readiness signals — explicitly **not**
  predictive AI or machine learning unless and until such a component is actually
  built and tested.


---

## SLIDE 12 — FINAL TAKEAWAY

**Key takeaway:** Reflex replaces guesswork with a system of record — small,
honest, and defensible.

**Visual:** Return to the before/after: WhatsApp thread → Reflex status timeline.

**Speaker notes:** Close on the positioning statement from Slide 1, reinforced by
what was just demonstrated. End the presentation here and open the floor to
cross-examination.
