from datetime import timedelta

from django.utils import timezone


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