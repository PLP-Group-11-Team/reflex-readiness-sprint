# Reflex — Delivery Visibility Prototype

**PLP Group 11 | Reflex Readiness Sprint**

Reflex is a lightweight delivery-management prototype designed for small Kenyan retailers who currently coordinate deliveries through WhatsApp and phone calls without a centralized record of assignments, delivery status, or proof of delivery.

The prototype provides a role-based workflow that allows a delivery to move from creation through assignment, pickup, transit, customer confirmation, and final delivery.

## Core Workflow

```text
Retailer creates delivery
        ↓
      OPEN
        ↓
Dispatcher assigns rider
        ↓
    ASSIGNED
        ↓
Rider picks up delivery
        ↓
   PICKED_UP
        ↓
Rider begins delivery
        ↓
   IN_TRANSIT
        ↓
Customer presents confirmation QR
        ↓
Rider scans QR
        ↓
Backend validates confirmation
        ↓
    DELIVERED
```

The backend is the source of truth for delivery status, permissions, delivery health, and QR confirmation.

---

## User Roles

### Retailer

Can:

* Log in securely.
* Create delivery requests.
* View deliveries created by the retailer.
* Track delivery status and delivery health.
* View the customer confirmation QR.
* View final delivery confirmation.

Cannot:

* Assign riders.
* Perform rider-only status transitions.
* Confirm a delivery as delivered.

### Dispatcher

Can:

* View open and active deliveries.
* View available riders.
* Assign riders to open deliveries.
* Monitor delivery status and delivery health.

Cannot:

* Perform rider-only status transitions.
* Confirm delivery on behalf of a rider.

### Rider

Can:

* View deliveries assigned to them.
* Mark a delivery as `PICKED_UP`.
* Mark a delivery as `IN_TRANSIT`.
* Confirm delivery by scanning the customer's QR code.

Cannot:

* Assign themselves to deliveries.
* Update another rider's delivery.
* Access the secret confirmation token before the confirmation process.

---

## Delivery Status

The prototype uses the following status model:

```text
OPEN → ASSIGNED → PICKED_UP → IN_TRANSIT → DELIVERED
```

Invalid status transitions are rejected by the backend with an appropriate error response.

`DELIVERED` is a terminal state.

---

## Delivery Health

Delivery health is calculated separately from delivery status.

### Active deliveries

* `ON_TIME`
* `AT_RISK`
* `DELAYED`

The prototype uses a **30-minute at-risk window**.

### Completed deliveries

* `DELIVERED_ON_TIME`
* `DELIVERED_LATE`

Health is derived from the expected delivery time and delivery timestamps. Users cannot manually edit delivery health.

---

## QR Confirmation

The prototype uses a backend-generated confirmation token.

The flow is:

1. Retailer creates a delivery.
2. Backend generates a secure confirmation token.
3. Retailer interface renders the token as a QR code.
4. Customer receives the QR outside the Reflex system.
5. Rider reaches the customer.
6. Customer presents the QR.
7. Rider scans the QR.
8. Frontend sends the scanned token to the backend.
9. Backend validates the delivery, rider, token, and current status.
10. Delivery becomes `DELIVERED`.

The backend prevents unauthorized or invalid confirmations.

Repeated confirmation of an already-confirmed delivery is handled idempotently and does not create a second confirmation record.

---

## Technology Stack

| Layer                  | Technology                              |
| ---------------------- | --------------------------------------- |
| Frontend               | React + TypeScript + Vite               |
| Backend                | Python + Django + Django REST Framework |
| Authentication         | JWT                                     |
| Database               | SQLite                                  |
| API                    | REST + JSON                             |
| QR Confirmation        | Backend-generated token rendered as QR  |
| Near-real-time updates | Frontend polling                        |

The prototype uses polling rather than WebSockets/SSE because polling is simpler to implement, test, debug, and demonstrate within the sprint.

---

## Architecture

```text
┌─────────────────────────────────┐
│            Frontend             │
│                                 │
│ Retailer │ Dispatcher │ Rider   │
└───────────────┬─────────────────┘
                │
           REST / JSON
                │
                ▼
┌─────────────────────────────────┐
│        Django + DRF Backend     │
│                                 │
│ Authentication / Roles          │
│ Delivery API                    │
│ Assignment Rules                │
│ Status Transition Rules         │
│ Delivery Health                 │
│ QR Confirmation Validation      │
│ Delivery Event Recording        │
└───────────────┬─────────────────┘
                │
           Django ORM
                │
                ▼
┌─────────────────────────────────┐
│             SQLite              │
│                                 │
│ Users                           │
│ Deliveries                      │
│ Confirmations                   │
│ Delivery Events                 │
└─────────────────────────────────┘
```

---

## Repository Structure

```text
reflex-readiness-sprint/
│
├── backend/
│   ├── accounts/
│   ├── deliveries/
│   ├── config/
│   ├── manage.py
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── utils/
│   │   ├── App.tsx
│   │   ├── index.css
│   │   ├── main.tsx
│   │   └── types.ts
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
│
├── docs/
│   └── API-CONTRACT.md
│
├── .gitignore
└── README.md
```

---

## Backend Setup

From the project root:

```powershell
cd backend
```

Create and activate a virtual environment if one does not already exist:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

Install dependencies:

```powershell
pip install -r requirements.txt
```

Apply migrations:

```powershell
python manage.py migrate
```

Start the backend:

```powershell
python manage.py runserver
```

The API will be available at:

```text
http://127.0.0.1:8000/
```

---

## Frontend Setup

Open a second terminal and move to the frontend:

```powershell
cd frontend
```

Install dependencies:

```powershell
npm install
```

Start the development server:

```powershell
npm run dev
```

Vite will display the local URL in the terminal.

If port `3000` is already in use, Vite may automatically select another available port such as `3001`.

---

## Demo Accounts

The current local prototype database contains the following demonstration users:

| Role       | Email                  |
| ---------- | ---------------------- |
| Retailer   | `retailer@mwangaza.ke` |
| Dispatcher | `dispatch@reflex.ke`   |
| Rider      | `brian@reflex.ke`      |
| Rider      | `james@reflex.ke`      |

The current demo password is:

```text
password123
```

These are local prototype accounts. The SQLite database is intentionally excluded from Git, so demo users may need to be recreated when setting up a fresh environment.

---

## API Endpoints

### Authentication

```text
POST /api/auth/login/
GET  /api/auth/me/
```

### Deliveries

```text
POST  /api/deliveries/
GET   /api/deliveries/
GET   /api/deliveries/{id}/
PATCH /api/deliveries/{id}/assign/
PATCH /api/deliveries/{id}/status/
POST  /api/deliveries/{id}/confirm/
```

### Riders

```text
GET /api/riders/
```

For the complete request and response contract, see:

```text
docs/API-CONTRACT.md
```

---

## Testing

The backend includes automated tests covering the core delivery workflow, permissions, status transitions, delivery health, QR confirmation, duplicate confirmation, invalid tokens, and assignment conflicts.

Run the test suite from the `backend` directory:

```powershell
python manage.py test
```

Current test result:

```text
Found 27 test(s).

Ran 27 tests

OK
```

**27/27 tests passed.**

---

## End-to-End Demo Flow

The recommended demonstration follows one complete delivery:

1. Retailer logs in.
2. Retailer creates a delivery.
3. Delivery appears as `OPEN`.
4. Retailer view displays the customer confirmation QR.
5. Dispatcher sees the delivery.
6. Dispatcher assigns Brian.
7. Brian sees the assigned delivery.
8. Brian marks it `PICKED_UP`.
9. Brian marks it `IN_TRANSIT`.
10. Delivery health is displayed.
11. Customer presents the confirmation QR.
12. Brian scans the QR.
13. Backend validates the confirmation.
14. Delivery becomes `DELIVERED`.
15. Delivery health becomes `DELIVERED_ON_TIME` or `DELIVERED_LATE`.
16. Retailer and Dispatcher can see the final delivery state.

---

## Key Design Trade-offs

### SQLite instead of PostgreSQL

SQLite was selected because the prototype is small and requires minimal setup.

**Trade-off:** SQLite provides less scalability and coarser concurrency handling than PostgreSQL.

**Future improvement:** Move to PostgreSQL for production deployment.

### Polling instead of WebSockets/SSE

The frontend polls for updated delivery information.

**Trade-off:** Updates may be delayed by a few seconds and polling creates repeated requests.

**Future improvement:** Use WebSockets or Server-Sent Events for genuinely real-time dashboards.

### Single Django Backend

The prototype uses one Django application instead of microservices.

**Trade-off:** Individual components cannot be scaled independently.

**Future improvement:** Split services only when system scale or operational requirements justify it.

### Time-based Delivery Health

Delivery health is calculated using expected delivery time and timestamps.

**Trade-off:** The calculation does not consider traffic, route distance, weather, or rider location.

**Future improvement:** Incorporate GPS, route information, and traffic-aware ETA calculations.

### QR Confirmation Without Customer Accounts

Customers do not need to create Reflex accounts.

**Trade-off:** The retailer must provide the QR to the customer outside the Reflex application.

**Future improvement:** Integrate an approved customer communication channel or introduce additional proof-of-delivery methods.

---

## Project Documentation

The shared architecture and API contract are documented in:

```text
docs/API-CONTRACT.md
```

The API contract defines:

* System architecture
* Technology choices
* User roles
* Permissions
* Delivery status transitions
* Delivery health rules
* QR confirmation flow
* Data model
* API endpoints
* Error responses
* Polling behaviour
* Concurrency rules
* Integration testing requirements
* Architecture trade-offs
* Vertical-slice demo sequence

---

## Prototype Scope

Reflex is intentionally a prototype.

The current scope focuses on:

```text
Create
  ↓
Assign
  ↓
Pick Up
  ↓
In Transit
  ↓
Confirm
  ↓
Deliver
```

The prototype does not attempt to implement a full production logistics platform.

Features such as customer accounts, automated customer messaging, GPS tracking, traffic-aware routing, and production-scale infrastructure are outside the current prototype scope.

---

## Team Goal

The prototype demonstrates how a small retailer can move from informal delivery coordination toward a simple, traceable workflow with:

* Role-based access
* Delivery visibility
* Rider assignment
* Status tracking
* Delivery health
* QR-based confirmation
* Audit events
* Backend-enforced business rules
