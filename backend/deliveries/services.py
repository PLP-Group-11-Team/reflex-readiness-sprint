from datetime import timedelta

from django.utils import timezone

from django.core.exceptions import PermissionDenied, ValidationError

from django.db import transaction

import secrets

from .models import Delivery, DeliveryConfirmation, DeliveryEvent


AT_RISK_WINDOW = timedelta(minutes=30)


class DeliveryHealth:
    ON_TIME = "ON_TIME"
    AT_RISK = "AT_RISK"
    DELAYED = "DELAYED"
    DELIVERED_ON_TIME = "DELIVERED_ON_TIME"
    DELIVERED_LATE = "DELIVERED_LATE"


def calculate_delivery_health(delivery, now=None):
    """
    Derive delivery health from its timestamps.

    Health is not stored in the database. It is calculated whenever
    the application needs the current health of a delivery.
    """

    expected = delivery.expected_delivery_at

    # Completed delivery: compare actual completion time to deadline.
    if delivery.delivered_at is not None:
        if delivery.delivered_at <= expected:
            return DeliveryHealth.DELIVERED_ON_TIME

        return DeliveryHealth.DELIVERED_LATE

    # Active delivery: compare current time to deadline.
    current_time = now or timezone.now()
    at_risk_from = expected - AT_RISK_WINDOW

    if current_time > expected:
        return DeliveryHealth.DELAYED

    if current_time >= at_risk_from:
        return DeliveryHealth.AT_RISK

    return DeliveryHealth.ON_TIME

def record_delivery_event(
    *,
    delivery,
    actor,
    event_type,
    from_status=None,
    to_status=None,
):
    event = DeliveryEvent(
        delivery=delivery,
        actor=actor,
        event_type=event_type,
        from_status=from_status,
        to_status=to_status,
    )

    event.full_clean()
    event.save()

    return event


@transaction.atomic
def create_delivery(
    *,
    retailer,
    customer_name,
    customer_phone,
    delivery_address,
    item_description,
    expected_delivery_at,
):
    if retailer.role != retailer.Role.RETAILER:
        raise PermissionDenied("Only Retailers can create deliveries.")

    delivery = Delivery(
        customer_name=customer_name,
        customer_phone=customer_phone,
        delivery_address=delivery_address,
        item_description=item_description,
        expected_delivery_at=expected_delivery_at,
        created_by=retailer,
        status=Delivery.Status.OPEN,
    )

    delivery.full_clean()
    delivery.save()

    delivery.reference = f"DEL-{delivery.pk:03d}"
    delivery.full_clean()
    delivery.save(update_fields=["reference"])

    record_delivery_event(
        delivery=delivery,
        actor=retailer,
        event_type=DeliveryEvent.EventType.CREATED,
        from_status=None,
        to_status=Delivery.Status.OPEN,
    )

    return delivery

@transaction.atomic
def assign_rider(*, dispatcher, delivery_id, rider):
    if dispatcher.role != dispatcher.Role.DISPATCHER:
        raise PermissionDenied("Only Dispatchers can assign riders.")

    if rider.role != rider.Role.RIDER:
        raise ValidationError("The selected user is not a Rider.")

    delivery = Delivery.objects.select_for_update().get(pk=delivery_id)

    if delivery.status != Delivery.Status.OPEN:
        raise DeliveryConflict(
            "Only OPEN deliveries can be assigned."
        )

    if delivery.assigned_rider is not None:
        raise DeliveryConflict(
            "This delivery already has an assigned Rider."
        )

    delivery.assigned_rider = rider
    delivery.status = Delivery.Status.ASSIGNED
    delivery.assigned_at = timezone.now()

    delivery.full_clean()
    delivery.save(
        update_fields=[
            "assigned_rider",
            "status",
            "assigned_at",
            "updated_at",
        ]
    )

    record_delivery_event(
        delivery=delivery,
        actor=dispatcher,
        event_type=DeliveryEvent.EventType.ASSIGNED,
        from_status=Delivery.Status.OPEN,
        to_status=Delivery.Status.ASSIGNED,
    )

    return delivery


@transaction.atomic
def update_delivery_status(*, rider, delivery_id, new_status):
    if rider.role != rider.Role.RIDER:
        raise PermissionDenied(
            "Only Riders can perform rider-controlled status updates."
        )

    delivery = Delivery.objects.select_for_update().get(pk=delivery_id)

    if delivery.assigned_rider_id != rider.id:
        raise PermissionDenied(
            "Only the assigned Rider can update this delivery."
        )

    allowed_transitions = {
        Delivery.Status.ASSIGNED: Delivery.Status.PICKED_UP,
        Delivery.Status.PICKED_UP: Delivery.Status.IN_TRANSIT,
    }

    expected_next_status = allowed_transitions.get(delivery.status)

    if expected_next_status != new_status:
        raise DeliveryConflict(
            f"Delivery cannot move from "
            f"{delivery.status} to {new_status}."
        )

    previous_status = delivery.status
    current_time = timezone.now()

    delivery.status = new_status

    if new_status == Delivery.Status.PICKED_UP:
        delivery.picked_up_at = current_time

    elif new_status == Delivery.Status.IN_TRANSIT:
        delivery.in_transit_at = current_time

    delivery.full_clean()

    update_fields = [
        "status",
        "updated_at",
    ]

    if new_status == Delivery.Status.PICKED_UP:
        update_fields.append("picked_up_at")

    if new_status == Delivery.Status.IN_TRANSIT:
        update_fields.append("in_transit_at")

    delivery.save(update_fields=update_fields)

    record_delivery_event(
        delivery=delivery,
        actor=rider,
        event_type=DeliveryEvent.EventType.STATUS_CHANGED,
        from_status=previous_status,
        to_status=new_status,
    )

    return delivery

@transaction.atomic
def confirm_delivery(*, rider, delivery_id, token):
    if rider.role != rider.Role.RIDER:
        raise PermissionDenied(
            "Only Riders can confirm deliveries."
        )

    delivery = Delivery.objects.select_for_update().get(pk=delivery_id)

    if delivery.assigned_rider_id != rider.id:
        raise PermissionDenied(
            "Only the assigned Rider can confirm this delivery."
        )

    existing_confirmation = DeliveryConfirmation.objects.filter(
        delivery=delivery
    ).first()

    if existing_confirmation is not None:
        return (
            delivery,
            existing_confirmation,
            ConfirmationOutcome.ALREADY_CONFIRMED,
        )

    if delivery.status != Delivery.Status.IN_TRANSIT:
        raise DeliveryConflict(
            "Only IN_TRANSIT deliveries can be confirmed."
        )

    submitted_token = token.strip() if token else ""

    if not submitted_token or not secrets.compare_digest(
        submitted_token,
        delivery.confirmation_token,
    ):
        raise InvalidConfirmationToken(
            "The confirmation token is invalid."
        )

    confirmation = DeliveryConfirmation(
        delivery=delivery,
        confirmed_by=rider,
        confirmation_method=DeliveryConfirmation.Method.QR,
    )

    confirmation.full_clean()
    confirmation.save()

    previous_status = delivery.status

    delivery.status = Delivery.Status.DELIVERED
    delivery.delivered_at = timezone.now()

    delivery.full_clean()
    delivery.save(
        update_fields=[
            "status",
            "delivered_at",
            "updated_at",
        ]
    )

    record_delivery_event(
        delivery=delivery,
        actor=rider,
        event_type=DeliveryEvent.EventType.CONFIRMED,
        from_status=previous_status,
        to_status=Delivery.Status.DELIVERED,
    )

    return (
        delivery,
        confirmation,
        ConfirmationOutcome.CONFIRMED,
    )

class DeliveryConflict(Exception):
    """Raised when a delivery operation conflicts with its current state."""

    pass

class InvalidConfirmationToken(Exception):
    """Raised when the submitted confirmation token is invalid."""

    pass


class ConfirmationOutcome:
    CONFIRMED = "CONFIRMED"
    ALREADY_CONFIRMED = "ALREADY_CONFIRMED"