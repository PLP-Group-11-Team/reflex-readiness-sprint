# REFLEX — User Manual

A guide for someone using Reflex for the first time. No technical background
required.

---

## 1. What is Reflex?

Reflex is a simple tool that helps small shops track deliveries from the moment
a customer orders something to the moment it arrives. Instead of coordinating
deliveries over WhatsApp messages and phone calls — where it's easy to lose
track of who's doing what — Reflex gives everyone involved a shared, up-to-date
view of every delivery.

## 2. Who uses Reflex?

There are three kinds of users:

- **Retailer staff** — the shop employee who logs a new delivery request.
- **Dispatcher** — the person who assigns each delivery to a rider.
- **Rider** — the person who picks up and delivers the item, and confirms when
  it's done.

Each person only sees what's relevant to their job.

## 3. Getting started

You'll be given a login (an email address and a password) for one of the three
roles above. Open the Reflex web app in your browser and log in with those
details.


## 4. Login

1. Enter your email and password.
2. Tap or click "Log in."
3. You'll be taken to the dashboard for your role automatically — you don't
   choose your role, the system already knows it.


## 5. Retailer workflow

As Retailer staff, you can:

1. **Create a delivery request** — fill in the customer's name, phone number,
   delivery address, and a description of the item, plus when it's expected to
   arrive.
2. **See your own deliveries** — you'll only see deliveries you created, not
   every delivery in the system.
3. **Track status and health** — watch each delivery move from `OPEN` through
   to `DELIVERED`, and see whether it's on schedule.
4. **View the confirmation QR code** — after you create a delivery, Reflex
   generates a QR code. You give this to the customer (printed, shown on your
   phone, or however works for your shop) so the rider can confirm delivery when
   they arrive.



You cannot assign riders or mark a delivery as delivered — that's the
dispatcher's and rider's job.

## 6. Dispatcher workflow

As Dispatcher, you can:

1. **See all open and active deliveries** — every retailer's delivery request
   that still needs attention.
2. **See the list of available riders.**
3. **Assign a rider to a delivery** — pick one open delivery and one rider.
4. **Monitor status and health** across all active deliveries.


You cannot perform the rider's status updates or confirm delivery yourself.

## 7. Rider workflow

As Rider, you can:

1. **See only the deliveries assigned to you** — not anyone else's.
2. **Mark a delivery "Picked Up"** once you have the item.
3. **Mark it "In Transit"** once you're on your way.
4. **Confirm delivery** by scanning the customer's QR code when you arrive.


You cannot assign deliveries to yourself, and you cannot see or act on another
rider's deliveries.

## 8. Delivery status lifecycle

Every delivery moves through the same stages, in order:

```
OPEN → ASSIGNED → PICKED_UP → IN_TRANSIT → DELIVERED
```

- **OPEN** — created, not yet assigned to a rider.
- **ASSIGNED** — a dispatcher has picked a rider for it.
- **PICKED_UP** — the rider has the item.
- **IN_TRANSIT** — the rider is on the way.
- **DELIVERED** — confirmed complete. This is final — a delivery can't be
  "un-delivered."

You can never skip a stage, and only the right role can move a delivery to the
next one.

## 9. Delivery readiness / health

Alongside status, Reflex shows a health indicator so you can see at a glance
whether a delivery is on track:

- **On Time** — plenty of time before the expected delivery time.
- **At Risk** — getting close to the expected delivery time (within 30 minutes)
  and not yet delivered.
- **Delayed** — past the expected delivery time and still not delivered.
- **Delivered On Time** / **Delivered Late** — the final outcome once the
  delivery is confirmed.

This is based on the expected delivery time you set when the delivery was
created, compared to the current time — nobody sets this by hand, and it can't
be edited manually. It does not account for traffic or the rider's actual
location.

## 10. Confirmation / proof of delivery

When a delivery is created, Reflex generates a secret confirmation code and
turns it into a QR code that only the retailer can see. The retailer gives this
QR code to the customer (outside of Reflex — printed, texted, whatever works).
When the rider arrives, the customer shows the QR code, the rider scans it, and
Reflex checks that it matches before marking the delivery `DELIVERED`. If the
same delivery is confirmed twice by accident, Reflex recognizes it's already
done and won't create a duplicate record.

## 11. Understanding delivery history/events

Every delivery keeps a running history of what happened to it — who created it,
who it was assigned to and when, every status change, and the final
confirmation — each with a timestamp. This gives everyone a clear record of
exactly what happened, which is the main thing a WhatsApp thread never provided.


## 12. Common problems

- **"I can't see a delivery I expect to see."** Check you're logged in as the
  right role — retailers only see their own deliveries, riders only see
  deliveries assigned to them.
- **"I tried to change a status and got an error."** Only certain transitions
  are allowed in order (see Section 8). You may be trying to skip a stage, or
  it may not be your delivery to update.
- **"The QR code confirmation didn't work."** Check the code matches the
  delivery being confirmed, and that the delivery is in the `IN_TRANSIT` stage
  — confirmation only works at that point in the lifecycle.
- **"The page seems slow to update."** Reflex checks for updates automatically
  every few seconds rather than instantly — give it a moment.

## 13. Demo credentials

The following accounts exist in the current prototype/demo environment. These
are for demonstration purposes only and should not be treated as real customer
accounts.

| Role       | Email                  |
| ---------- | ----------------------- |
| Retailer   | `retailer@mwangaza.ke`  |
| Dispatcher | `dispatch@reflex.ke`    |
| Rider      | `brian@reflex.ke`       |
| Rider      | `james@reflex.ke`       |


## 14. Known limitations

Reflex is a prototype, not a finished production product. Currently:

- QR confirmation in the current build uses a "simulate scan" step rather than
  reading a real QR code through your camera.
- There is no SMS, WhatsApp, or email notification when a delivery's status
  changes — you need to check the app.
- The app checks for updates every few seconds rather than instantly.
- Delivery readiness is based only on the expected delivery time, not real
  traffic or the rider's live location.
- The app does not yet handle poor or lost internet connectivity gracefully.
