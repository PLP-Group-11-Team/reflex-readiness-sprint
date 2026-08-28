Reflex Prototype - Architecture Freeze & Shared
API Contract
Version: 1.0 - Prototype Freeze
Project: Reflex Readiness Sprint
Purpose: Shared backend/frontend/integration contract for the group prototype
Source basis: Reflex, The Readiness Sprint and Team Briefing - Reflex Readiness Sprint
 
1. Freeze decision
Reflex is a lightweight delivery-management prototype for small Kenyan retailers. The prototype must make one delivery move clearly through the full workflow:
Retailer creates delivery
| v
OPEN
|
Dispatcher assigns rider
| v
ASSIGNED
|
Rider picks up | v
PICKED_UP
|
Rider begins delivery | v
IN_TRANSIT
|
Customer presents confirmation QR |
Rider scans and backend validates
| v
DELIVERED
|
Retailer sees final confirmation
 
2. Technology stack - frozen
Layer	Choice	Why it fits this prototype
Frontend	Tool(s) of choice	Clear role-based dashboards and simple API integration
Backend	Python, Django, Django REST Framework	Fast development, built-in ORM,
validation, permissions and mature REST tooling
Database	SQLite	Zero-configuration local database suitable for a small prototype
API style	REST + JSON	Simple to build, test, document and defend
Authentication	Simple JWT	Lets the backend identify Retailer,
Dispatcher and Rider
roles
Near-real-time updates	Frontend polling every 3-5 seconds	Simple and sufficient for a short prototype
QR confirmation	Backend creates token;
frontend renders/scans
QR	Keeps QR handling simple and leaves validation in the backend
 
3. Architecture
+-------------------------------+ | Frontend	| |	|
| Retailer | Dispatcher | Rider|
+---------------+---------------+
|
| REST / JSON
v
+-------------------------------+
|	Django + DRF Backend	|
|	|
| Authentication / Roles	|
| Delivery API	|
| Assignment rules	|
| Status-transition rules	|
| Delivery-health calculation |
| QR confirmation validation	|
| Delivery event recording	|
+---------------+---------------+
|
| Django ORM v
+-------------------------------+
|	SQLite	|
|	|
| Users	|
| Deliveries	|
| Delivery Confirmations	|
| Delivery Events	|
+-------------------------------+
The architecture is intentionally a single backend application. This makes the prototype easier to build, debug, test and explain. A production system could later move to PostgreSQL and introduce additional services only when scale or operational needs justify them.
 
4. User roles and permissions
Retailer
Can: - Create a delivery request. - View deliveries created by that retailer. Track delivery status and health. - View proof of delivery after confirmation. View/render the delivery confirmation QR for the customer.
Cannot: - Assign riders. - Update rider-only delivery statuses. - Confirm a delivery as delivered.
Dispatcher
Can: - View open and active deliveries. - View riders available for assignment. Assign a rider to an open delivery. - Monitor delivery status and delivery health.
Cannot: - Perform rider-only status transitions. - Confirm delivery on behalf of a rider in the normal workflow.
Rider
Can: - View deliveries assigned to that rider. - Move an assigned delivery from ASSIGNED to PICKED_UP. - Move it from PICKED_UP to IN_TRANSIT. - Scan the customer’s confirmation QR and confirm delivery.
Cannot: - Assign themselves to a delivery. - Update another rider’s delivery. See the secret confirmation token before scanning it from the customer.
 
5. Delivery status model - frozen
The normal delivery states are:
OPEN -> ASSIGNED -> PICKED_UP -> IN_TRANSIT -> DELIVERED
Allowed transitions:
Current status	Allowed next status	Who performs it
OPEN	ASSIGNED	Dispatcher
ASSIGNED	PICKED_UP	Assigned Rider
PICKED_UP	IN_TRANSIT	Assigned Rider
IN_TRANSIT	DELIVERED	Successful confirmation flow
DELIVERED	None	Terminal state
An invalid transition should return 409 Conflict.
Examples:
OPEN -> DELIVERED	INVALID
ASSIGNED -> IN_TRANSIT INVALID
DELIVERED -> PICKED_UP INVALID
The backend is the source of truth for these rules. The frontend may disable impossible buttons, but it must never be the only place enforcing the workflow.
 
6. Delivery health - frozen
Delivery health is separate from delivery status.
Active-delivery health values
•	ON_TIME • AT_RISK
•	DELAYED
Completed-delivery health values
•	DELIVERED_ON_TIME
•	DELIVERED_LATE
Meaning of AT_RISK
AT_RISK means the expected delivery time has not yet passed, but the delivery is close enough to the deadline that it needs attention.
For the prototype, use a 30-minute at-risk window.
Example where expected_delivery_at = 2:00 PM:
Time / condition	Health
Before 1:30 PM and not delivered	ON_TIME
1:30 PM through 2:00 PM and not delivered	AT_RISK
After 2:00 PM and not delivered	DELAYED
Delivered at or before 2:00 PM	DELIVERED_ON_TIME
Delivered after 2:00 PM	DELIVERED_LATE
Examples of combined state:
status = IN_TRANSIT health = AT_RISK and later:
status = DELIVERED health = DELIVERED_LATE
Health is derived by the backend from timestamps and should not be manually edited by a user.
 
7. QR confirmation - simplest approved prototype flow
Decision
The backend generates a secure delivery confirmation token. The frontend converts that token into a QR code for the retailer. The retailer can display or print the QR as a customer confirmation slip and provide it to the customer outside Reflex. At delivery, the customer presents the QR and the assigned rider scans it.
The token should not be exposed to the rider before the scan, otherwise the rider could confirm a delivery without receiving anything from the customer.
Flow
Retailer creates DEL-001
|
Backend creates secret confirmation token
|
Retailer frontend receives token
|
Frontend renders token as QR
|
Retailer prints/displays/shares QR to customer
|
Customer keeps confirmation QR
|
Assigned rider reaches customer
|
Customer presents QR
|
Rider scans QR
|
Frontend submits scanned token to backend
|
Backend validates delivery + token + rider + status
|
DeliveryConfirmation created
|
Delivery becomes DELIVERED
What happens outside Reflex?
For the prototype, customer delivery of the QR is out of system. The retailer can print it on a confirmation slip or share it manually using an existing channel. Reflex does not build a customer account, SMS service, email service or WhatsApp integration.
What the frontend does
The frontend only needs to: 1. Render the token as a QR code on the Retailer view. 2. Provide a scan action on the Rider view. 3. Read the QR value. 4. Send the scanned token to the backend confirmation endpoint.
The frontend does not decide whether the token is valid.
What the backend does
The backend must verify:
Does this token belong to this delivery?
Is the caller the rider assigned to the delivery?
Is the delivery currently IN_TRANSIT?
Has this delivery already been confirmed?
Only after those checks succeed should the delivery become DELIVERED.
Duplicate scan behaviour
A delivery has only one authoritative DeliveryConfirmation record. If the same QR is submitted again after successful confirmation, the API should return an idempotent response such as:
{
"result": "ALREADY_CONFIRMED",
"reference": "DEL-001",
"status": "DELIVERED"
}
It must not create a second confirmation record.
Demo fallback
If camera scanning becomes unreliable during the prototype demo, the Rider interface may include a manual paste/input fallback for the exact same QR value. This does not change the backend contract or validation rules.
 
8. Core data model - frozen
User
Field	Notes
id	Primary key
name	Display name
email	Login identifier
password	Managed securely by Django auth
role	RETAILER, DISPATCHER, RIDER
Delivery
Field	Notes
id	Internal primary key
reference	Human-readable value such as DEL-001
customer_name	Required by case study
customer_phone	Required by case study
delivery_address	Required by case study
item_description	Required by case study
status	Frozen status model
created_by	Retailer user
assigned_rider	Nullable until assignment
expected_delivery_at	Required for Delivery Health
confirmation_token	Secret backend-generated value; not exposed to rider
created_at	Creation timestamp
assigned_at	Assignment timestamp
picked_up_at	Pickup timestamp
in_transit_at	In-transit timestamp
delivered_at	Final delivery timestamp
updated_at	Last update timestamp
DeliveryConfirmation
Field	Notes
id	Primary key
delivery	One-to-one with Delivery
confirmed_by	Assigned rider
confirmation_method QR for prototype confirmed_at Confirmation timestamp
The confirmation token itself does not need to be copied into this table. The Delivery record already owns the expected token.
DeliveryEvent
 
	id	Primary key
delivery	Related delivery actor	User who caused the event event_type	Created, Assigned, Status Changed, Confirmed, etc.
from_status Previous status when applicable
Field	Notes
to_status	New status when applicable
created_at	Event timestamp
Example timeline:
10:00 Retailer created DEL-001
10:05 Dispatcher assigned Brian
10:30 Brian changed ASSIGNED -> PICKED_UP
10:35 Brian changed PICKED_UP -> IN_TRANSIT
12:04 Brian confirmed delivery by QR
This gives the prototype a small but useful audit trail.
 
9. API endpoint skeleton - frozen
The endpoint shape follows the team’s agreed briefing and adds only the minimal rider-list and authentication endpoints needed by the working prototype.
Method	Endpoint	Primary role	Purpose
POST	/api/deliveries/ Retailer	Create delivery
GET	/api/deliveries/ All authenticated roles	Role-filtered list
GET	/api/deliveries/{id}/Permitted roles	Delivery detail
PATCH	/api/deliveries/{id}/assign/Dispatcher	Assign rider
PATCH	/api/deliveries/{id}/status/Assigned Rider	Update
rider-controlled status
POST	/api/deliveries/{id}/confirm/Assigned Rider	Submit scanned QR token
GET	/api/riders/	Dispatcher	Populate rider assignment list
POST	/api/auth/login/ Public	Obtain demo JWT
GET	/api/auth/me/	Authenticated	Current user + role
 
10. Shared API contract
The endpoint path alone is not enough. Backend, Frontend and Integration should agree on the exact request, response, role and error behaviour below.
10.1 Login
POST /api/auth/login/ Request:
{
"email": "dispatcher@reflex.demo",
"password": "demo-password"
}
Success - 200 OK:
{
"access": "<jwt>",
"refresh": "<jwt>",
"user": {
"id": 2,
"name": "Demo Dispatcher",
"role": "DISPATCHER"
}
}
Common errors: - 401 Unauthorized - invalid credentials.
For the prototype, accounts may be seeded instead of providing public registration.
 
10.2 Current user GET /api/auth/me/ Success - 200 OK:
{
"id": 2,
"name": "Demo Dispatcher",
"email": "dispatcher@reflex.demo",
"role": "DISPATCHER"
}
 
10.3 Create delivery
POST /api/deliveries/
Allowed role: RETAILER Request:
{
"customer_name": "Peter Mwangi",
"customer_phone": "0712345678",
"delivery_address": "Nyeri",
"item_description": "Printer",
"expected_delivery_at": "2026-08-27T14:00:00+03:00"
}
Backend sets:
reference = generated, e.g. DEL-001 status = OPEN created_by = authenticated retailer confirmation_token = secure generated token created_at = current time Success - 201 Created:
{
"id": 1,
"reference": "DEL-001",
"customer_name": "Peter Mwangi",
"customer_phone": "0712345678",
"delivery_address": "Nyeri",
"item_description": "Printer",
"status": "OPEN",
"health": "ON_TIME",
"expected_delivery_at": "2026-08-27T14:00:00+03:00",
"confirmation_token": "<secret-token>"
}
Important contract rule: confirmation_token is available to the owning Retailer view for QR rendering. It should not be exposed in Rider delivery responses.
Common errors: - 400 Bad Request - required information missing or invalid. - 403 Forbidden - caller is not a Retailer.
 
10.4 List deliveries
GET /api/deliveries/
Role-filtering rules:
RETAILER	-> own deliveries
DISPATCHER -> open and active deliveries needed for dispatch/monitoring RIDER -> deliveries assigned to current rider Example success - 200 OK:
[
{
"id": 1,
"reference": "DEL-001",
"customer_name": "Peter Mwangi",
"delivery_address": "Nyeri",
"item_description": "Printer",
"status": "IN_TRANSIT",
"health": "AT_RISK",
"expected_delivery_at": "2026-08-27T14:00:00+03:00",
"assigned_rider": {
"id": 3,
"name": "Brian"
}
}
]
 
10.5 Delivery detail
GET /api/deliveries/{id}/
Success - 200 OK returns the complete permitted view of the delivery, current health, assignment and confirmation if present.
Common errors: - 403 Forbidden - user has no access to this delivery. - 404 Not Found - delivery does not exist.
Security rule: Rider responses must not reveal the secret confirmation token before the rider scans it from the customer. Delivery activity / audit timeline:
The delivery detail response must include an events array ordered chronologically. These events come from DeliveryEvent records created automatically by the backend when meaningful delivery actions occur, including creation, rider assignment, status changes and successful confirmation.
The frontend should use this array to display a delivery activity/timeline view. The frontend does not create or modify audit events itself.
Any authenticated user who is permitted to view the delivery may view its event timeline. The list-deliveries endpoint does not need to include events; events are returned with delivery detail to keep list responses lightweight.

 
10.6 List riders
GET /api/riders/
Allowed role: DISPATCHER Success - 200 OK:
[
{
"id": 3,
"name": "Brian",
"role": "RIDER"
},
{
"id": 4,
"name": "Amina",
"role": "RIDER"
}
]
 
10.7 Assign rider
PATCH /api/deliveries/{id}/assign/
Allowed role: DISPATCHER Request:
{
"rider_id": 3
}
Backend checks:
caller is DISPATCHER rider exists and has RIDER role
delivery exists delivery status is OPEN delivery is not already assigned Success - 200 OK:
{
"id": 1,
"reference": "DEL-001",
"status": "ASSIGNED",
"assigned_rider": {
"id": 3,
"name": "Brian"
},
"assigned_at": "2026-08-27T10:05:00+03:00"
}
Common errors: - 403 Forbidden - caller is not Dispatcher. - 404 Not Found delivery or rider does not exist. - 409 Conflict - delivery is not in a state that can be assigned.
 
10.8 Update delivery status
PATCH /api/deliveries/{id}/status/
Allowed role: assigned RIDER
Request examples:
{
"status": "PICKED_UP"
}
or:
{
"status": "IN_TRANSIT"
}
Backend checks:
caller is a RIDER caller is the assigned rider requested transition is legal Success - 200 OK:
{
"id": 1,
"reference": "DEL-001",
"status": "PICKED_UP",
"health": "ON_TIME",
"updated_at": "2026-08-27T10:30:00+03:00"
}
Common errors: - 403 Forbidden - wrong rider or wrong role. - 404 Not Found - delivery not found. - 409 Conflict - invalid status transition.
The normal Rider status endpoint does not accept DELIVERED; delivery completion happens through the confirmation endpoint.
 
10.9 Confirm delivery
POST /api/deliveries/{id}/confirm/
Allowed role: assigned RIDER Request:
{
"token": "<scanned-secret-token>"
}
Backend checks:
caller is assigned rider delivery status is IN_TRANSIT token matches delivery confirmation token delivery has not already been confirmed Success - 200 OK:
{
"result": "CONFIRMED",
"id": 1,
"reference": "DEL-001",
"status": "DELIVERED",
"health": "DELIVERED_ON_TIME",
"confirmed_at": "2026-08-27T13:52:00+03:00",
"confirmed_by": {
"id": 3,
"name": "Brian"
}
}
Duplicate confirmation - 200 OK:
{
"result": "ALREADY_CONFIRMED",
"reference": "DEL-001",
"status": "DELIVERED"
}
Common errors: - 400 Bad Request - malformed/missing token. - 403 Forbidden - wrong rider or wrong role. - 404 Not Found - delivery not found.
- 409 Conflict - delivery is not IN_TRANSIT. - 422 Unprocessable Entity or 400 Bad Request - invalid confirmation token. The team should choose one and use it consistently.
Freeze recommendation: use 400 Bad Request for an incorrect token to keep prototype error handling simple.
 
11. Error response shape - shared convention
All API errors should use a simple predictable structure where practical:
{
"error": "INVALID_STATUS_TRANSITION",
"message": "Delivery cannot move from ASSIGNED to IN_TRANSIT."
}
Suggested error codes:
VALIDATION_ERROR
FORBIDDEN
NOT_FOUND
INVALID_STATUS_TRANSITION
ALREADY_ASSIGNED
INVALID_CONFIRMATION_TOKEN
This makes frontend error handling and Integration tests easier.
 
12. Near-real-time dashboard behaviour - frozen
The frontend may poll the relevant delivery endpoint every 3-5 seconds.
Example:
10:00:00 Dispatcher GET /api/deliveries/ -> no new delivery
10:00:02 Retailer creates DEL-001
10:00:04 Dispatcher GET /api/deliveries/ -> DEL-001 appears
Polling is initiated by the frontend. The backend does not push a request to the browser.
This is intentionally near-real-time rather than true real-time. WebSockets/SSE are deferred because polling is simpler and adequate for the prototype.
 
13. Concurrency and consistency rules
The brief expects the team to be able to explain what happens when two updates occur at once.
For this prototype: - Use Django transactions around state-changing operations.
- Validate the expected current state inside the same operation. - Prefer conditional database updates where possible so only a matching current state can change. - SQLite serialises writes more coarsely than a production database; this is acceptable for the prototype. - A production version would use PostgreSQL and stronger row-level concurrency controls.
Example race:
Dispatcher request A -> assign Brian to OPEN delivery
Dispatcher request B -> assign Amina to same OPEN delivery
Only the first valid assignment should transition the delivery out of OPEN. The second should observe that it is no longer assignable and receive 409 Conflict.
No distributed locking system is included because the prototype has one backend and one database
 
14. Integration test contract
At minimum, Integration & Testing should verify:
Test	Expected result
Retailer creates valid delivery	201, status OPEN
Missing required delivery field	400
Dispatcher assigns rider	200, status ASSIGNED
Retailer attempts assignment	403
Rider picks up own delivery	200, PICKED_UP
Wrong rider attempts update	403
Rider skips from ASSIGNED to IN_TRANSIT	409
Rider moves PICKED_UP to IN_TRANSIT	200
Active delivery enters 30-minute window	health AT_RISK
Expected time passes before delivery	health DELAYED
Valid QR token confirms delivery	200, DELIVERED
Delivery before deadline	DELIVERED_ON_TIME
Delivery after deadline	DELIVERED_LATE
Duplicate QR confirmation	200, ALREADY_CONFIRMED, no duplicate record
Wrong QR token	400
Two competing assignments	only one succeeds; other receives 409
Test evidence should record expected result, actual result, PASS/FAIL and evidence/screenshot/log where useful.
 
15. Architecture trade-offs to defend
Trade-off 1 - SQLite instead of PostgreSQL
Why accepted: Minimal setup and fast local development for a small prototype.
Cost: Coarse concurrency and limited production scaling. With more time / production: Move to PostgreSQL.
Trade-off 2 - Polling instead of WebSockets/SSE
Why accepted: Very easy for Frontend and Backend to integrate and debug. Cost: Updates are delayed by a few seconds and repeated GET requests create overhead.
With more time / production: Evaluate SSE or WebSockets for genuinely live dashboards.
Trade-off 3 - Single Django backend instead of microservices
Why accepted: One deployable application is easier to build, test and explain during the sprint.
Cost: Components cannot be scaled independently.
With more time / production: Split services only when load or team boundaries justify it.
Trade-off 4 - Time-only Delivery Health
Why accepted: Simple, deterministic and easy to demonstrate.
Cost: It does not understand traffic, route distance, weather or rider location. With more time / production: Add GPS/ETA and traffic-aware risk calculation.
Trade-off 5 - QR confirmation without automated customer messaging
Why accepted: Preserves the required scanning/confirmation concept without introducing a customer portal or messaging integrations. Cost: The retailer must provide the QR to the customer outside Reflex. With more time / production: Send a secure confirmation credential through an approved customer channel and consider stronger proof such as OTP/signature/GPS depending on business requirements.
 
16. First vertical-slice demo : Example
Customer: Peter Mwangi
Item: Printer
Destination: Nyeri Rider: Brian
Demo sequence:
1.	Retailer logs in.
2.	Retailer creates DEL-001 with expected delivery time.
3.	Retailer view displays customer confirmation QR.
4.	Dispatcher sees DEL-001 after refresh/poll.
5.	Dispatcher assigns Brian.
6.	Brian sees DEL-001 in Rider dashboard.
7.	Brian marks PICKED_UP.
8.	Brian marks IN_TRANSIT.
9.	Delivery Health is shown (ON_TIME / AT_RISK / DELAYED according to time).
10.	Customer presents the QR prepared by the retailer.
11.	Brian scans it.
12.	Backend validates the token and records confirmation.
13.	DEL-001 becomes DELIVERED.
14.	Health becomes DELIVERED_ON_TIME or DELIVERED_LATE.
15.	Retailer sees the final confirmation and timestamp.
  
17. Freeze summary
The prototype is frozen around one defensible workflow:
Create -> Assign -> Pick Up -> In Transit -> Confirm -> Deliver with:
Operational status:
OPEN -> ASSIGNED -> PICKED_UP -> IN_TRANSIT -> DELIVERED
Delivery health:
ON_TIME / AT_RISK / DELAYED
then
DELIVERED_ON_TIME / DELIVERED_LATE
Proof of delivery:
Backend-generated secret token -> Retailer QR -> Customer -> Rider scan -> Backend validation
Architecture:
React -> REST API -> Django/DRF -> SQLite
Near-real-time:
3-5 second frontend polling

