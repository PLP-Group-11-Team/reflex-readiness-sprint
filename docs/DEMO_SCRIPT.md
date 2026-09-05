# REFLEX — Demo Script

Deployed system used for this demo:

- Frontend: https://reflex-readiness-sprint-t45m.vercel.app/
- Backend: https://reflex-readiness-sprint-p76o.onrender.com/

Demo accounts (from `README.md`)

| Role       | Email                  | Password         |
| ---------- | ----------------------- | ---------------- |
| Retailer   | `retailer@mwangaza.ke`  | `ReflexDemo123!` |
| Dispatcher | `dispatch@reflex.ke`    | `ReflexDemo123!` |
| Rider      | `brian@reflex.ke`       | `ReflexDemo123!` |
| Rider      | `james@reflex.ke`       | `ReflexDemo123!` |

---

## Step 1 — Retailer login

**ACTION:** Log in as `retailer@mwangaza.ke`.
**WHAT THE AUDIENCE SEES:** The retailer dashboard.
**WHAT THE PRESENTER SAYS:** "This is the retailer view — the person logging a
delivery request."
**EXPECTED RESULT:** Authenticated session; retailer's own deliveries list loads.
**BACKUP PLAN:** If login fails, switch to pre-captured screenshots
(`[SCREENSHOT: Retailer Dashboard]`) and narrate the flow instead of clicking
through it live.

## Step 2 — Create a delivery

**ACTION:** Fill out the create-delivery form (customer name, phone, address,
item description, expected delivery time) and submit.
**WHAT THE AUDIENCE SEES:** A new delivery card appears with status `OPEN`.
**WHAT THE PRESENTER SAYS:** "The retailer logs a request — this is the record
that used to only exist in a WhatsApp message."
**EXPECTED RESULT:** `POST /api/deliveries/` returns 201; delivery appears with a
generated reference like `DEL-004`.
**BACKUP PLAN:** Use an already-created OPEN delivery from before the session if
the create call fails live.

## Step 3 — Show OPEN state + confirmation QR

**ACTION:** Open the new delivery's detail view.
**WHAT THE AUDIENCE SEES:** Status `OPEN`, delivery health (e.g. `ON_TIME`), and a
QR code rendered from the backend-generated confirmation token.
**WHAT THE PRESENTER SAYS:** "The backend already generated a secret confirmation
token for this delivery — only the retailer can see it right now. This is what
the rider will need to scan later to close the delivery out."
**EXPECTED RESULT:** `confirmation_token` is present only because this user is
the retailer who created it (backend enforces this — `DeliveryDetailSerializer`).
**BACKUP PLAN:** Screenshot fallback: `[SCREENSHOT: Retailer QR view]`.

## Step 4 — Dispatcher assigns a rider

**ACTION:** Log out, log in as `dispatch@reflex.ke`. Open the open-deliveries
list, select the new delivery, assign it to Brian.
**WHAT THE AUDIENCE SEES:** Delivery list of open/active deliveries (dispatchers
do not see delivered ones by default); after assignment, status becomes
`ASSIGNED`.
**WHAT THE PRESENTER SAYS:** "The dispatcher only sees riders — never customer
payment info or anything outside their job. Assignment is a single action."
**EXPECTED RESULT:** `PATCH /api/deliveries/{id}/assign/` returns 200; delivery
now shows `assigned_rider: Brian`.
**BACKUP PLAN:** If a delivery is already assigned by the time this runs, use a
second pre-seeded OPEN delivery.

## Step 5 — Rider sees the assignment

**ACTION:** Log out, log in as `brian@reflex.ke`.
**WHAT THE AUDIENCE SEES:** Only deliveries assigned to Brian — not the full
delivery list.
**WHAT THE PRESENTER SAYS:** "Brian only ever sees his own assignments — this is
enforced on the backend, not just hidden in the UI."
**EXPECTED RESULT:** Rider's delivery list returns only deliveries where
`assigned_rider == brian`.
**BACKUP PLAN:** `[SCREENSHOT: Rider assigned-deliveries view]`.

## Step 6 — Mark PICKED_UP

**ACTION:** Rider marks the delivery as picked up.
**WHAT THE AUDIENCE SEES:** Status changes `ASSIGNED → PICKED_UP`.
**WHAT THE PRESENTER SAYS:** "Only the assigned rider can do this — anyone else
gets rejected."
**EXPECTED RESULT:** `PATCH /api/deliveries/{id}/status/` with
`{"status": "PICKED_UP"}` returns 200.
**BACKUP PLAN:** If the request fails, explain the intended behavior and show the
automated test that proves it (`test_assigned_rider_can_mark_delivery_picked_up`).

## Step 7 — Mark IN_TRANSIT

**ACTION:** Rider marks the delivery as in transit.
**WHAT THE AUDIENCE SEES:** Status changes `PICKED_UP → IN_TRANSIT`; delivery
health badge visible (e.g. `ON_TIME` or `AT_RISK` depending on the demo's
expected-delivery-time setup).
**WHAT THE PRESENTER SAYS:** "This is where delivery health starts to matter —
it's ticking toward the deadline we set when the delivery was created."
**EXPECTED RESULT:** `PATCH /api/deliveries/{id}/status/` with
`{"status": "IN_TRANSIT"}` returns 200.
**BACKUP PLAN:** Pre-set an `expected_delivery_at` a few minutes in the future
before the panel starts, so the AT_RISK/DELAYED transition can be shown live
without waiting.

## Step 8 — Confirm delivery (QR flow)

**ACTION:** Open the QR confirmation screen on the rider's view and confirm.
**WHAT THE AUDIENCE SEES:** A confirmation interaction, then status becomes
`DELIVERED`.
**WHAT THE PRESENTER SAYS:** State plainly what this actually is: "In production
this token comes from scanning the customer's real QR code. In the current build,
the token is supplied to the confirm action rather than read from a live camera
scan — the camera-based scan itself is not yet implemented. The backend
validation is real: it checks the rider, the delivery state, and the token."
**EXPECTED RESULT:** `POST /api/deliveries/{id}/confirm/` returns 200 with
`result: CONFIRMED`; status becomes `DELIVERED`.
**BACKUP PLAN:** If the confirm call fails (e.g. token not available to this
role in this session), fall back to narrating the flow and showing the passing
automated tests (`test_assigned_rider_can_confirm_with_correct_token`,
`test_duplicate_confirmation_is_idempotent`) as evidence instead of a live click.

## Step 9 — Show delivery health outcome

**ACTION:** View the completed delivery.
**WHAT THE AUDIENCE SEES:** `DELIVERED_ON_TIME` or `DELIVERED_LATE`.
**WHAT THE PRESENTER SAYS:** "Health flips to a completed state automatically —
no one manually marks this."
**EXPECTED RESULT:** Health field reflects `delivered_at` vs `expected_delivery_at`.
**BACKUP PLAN:** `[SCREENSHOT: Delivered state with health badge]`.

## Step 10 — Show delivery event history

**ACTION:** Scroll to the delivery's event/audit log.
**WHAT THE AUDIENCE SEES:** `CREATED → ASSIGNED → STATUS_CHANGED → STATUS_CHANGED
→ CONFIRMED`, each with an actor and timestamp.
**WHAT THE PRESENTER SAYS:** "Every state change is recorded with who did it and
when — this is the audit trail a WhatsApp thread never gave the retailer."
**EXPECTED RESULT:** `events` array on `DeliveryDetailSerializer` response is
populated and ordered chronologically.
**BACKUP PLAN:** `[SCREENSHOT: Delivery event history]`.

## Step 11 — Retailer/Dispatcher see final state

**ACTION:** Log back in as retailer (and optionally dispatcher) and show the same
delivery now marked delivered.
**WHAT THE AUDIENCE SEES:** Consistent final state across roles.
**WHAT THE PRESENTER SAYS:** "Same delivery, same source of truth, three
different views."
**EXPECTED RESULT:** All roles see status `DELIVERED` for this delivery
(retailer/dispatcher via their respective list/detail views).
**BACKUP PLAN:** `[SCREENSHOT: Retailer view post-delivery]`.

---

## DEMO FAILURE PLAN

| Failure | Response |
|---|---|
| **Frontend unavailable** (Vercel down/build broken) | Switch immediately to pre-captured screenshots for each step above; narrate using the same script. Do not attempt live debugging on stage. |
| **Backend unavailable / Render cold-start hang** | Explain Render free-tier cold starts if relevant; fall back to screenshots and the automated test output (`27/27 tests passed`) as evidence the logic works, independent of the live deployment. |
| **Authentication failure** | Try one retry with re-typed credentials off-screen. If it still fails, fall back to screenshots and explain the JWT flow verbally, citing `accounts/views.py::LoginView`. |
| **API failure on a specific action** (e.g. assign, confirm) | State the expected behavior plainly, then cite the specific automated test that proves it works in isolation (e.g. `test_dispatcher_can_assign_rider_to_open_delivery`). Say "the live call didn't complete, here's the test that verifies the underlying logic" rather than guessing why. |
| **Demo data already changed** (delivery already assigned/delivered from a prior run) | Keep at least one spare OPEN delivery seeded before the session; use it instead of creating one live. |
| **Network failure in the room** | Use recorded screen capture of a full run-through as the final fallback, captured during a prior successful dry run. |

