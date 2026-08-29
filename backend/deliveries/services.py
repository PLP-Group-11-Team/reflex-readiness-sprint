from datetime import timedelta

from django.utils import timezone

from django.core.exceptions import PermissionDenied
from django.db import transaction

from .models import Delivery, DeliveryEvent

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