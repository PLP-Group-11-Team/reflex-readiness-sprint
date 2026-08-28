import secrets

from django.conf import settings
from django.db import models


def generate_confirmation_token():
    """
    Generate a cryptographically secure token for customer QR confirmation.

    The frontend will encode this value into a QR code. The token itself is
    generated and validated by the backend.
    """
    
    alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    return "".join(secrets.choice(alphabet) for _ in range(12))


class Delivery(models.Model):
    class Status(models.TextChoices):
        OPEN = "OPEN", "Open"
        ASSIGNED = "ASSIGNED", "Assigned"
        PICKED_UP = "PICKED_UP", "Picked Up"
        IN_TRANSIT = "IN_TRANSIT", "In Transit"
        DELIVERED = "DELIVERED", "Delivered"

    reference = models.CharField(
        max_length=20,
        unique=True,
        null=True,
        blank=True,
        editable=False,
    )

    customer_name = models.CharField(max_length=150)
    customer_phone = models.CharField(max_length=30)
    delivery_address = models.TextField()
    item_description = models.TextField()

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.OPEN,
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="created_deliveries",
    )

    assigned_rider = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="assigned_deliveries",
        null=True,
        blank=True,
    )

    expected_delivery_at = models.DateTimeField()

    confirmation_token = models.CharField(
        max_length=64,
        unique=True,
        default=generate_confirmation_token,
        editable=False,
    )

    created_at = models.DateTimeField(auto_now_add=True)
    assigned_at = models.DateTimeField(null=True, blank=True)
    picked_up_at = models.DateTimeField(null=True, blank=True)
    in_transit_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.reference or f"Delivery {self.pk}"


class DeliveryConfirmation(models.Model):
    class Method(models.TextChoices):
        QR = "QR", "QR"

    delivery = models.OneToOneField(
        Delivery,
        on_delete=models.CASCADE,
        related_name="confirmation",
    )

    confirmed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="delivery_confirmations",
    )

    confirmation_method = models.CharField(
        max_length=20,
        choices=Method.choices,
        default=Method.QR,
    )

    confirmed_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Confirmation for {self.delivery}"


class DeliveryEvent(models.Model):
    class EventType(models.TextChoices):
        CREATED = "CREATED", "Created"
        ASSIGNED = "ASSIGNED", "Assigned"
        STATUS_CHANGED = "STATUS_CHANGED", "Status Changed"
        CONFIRMED = "CONFIRMED", "Confirmed"

    delivery = models.ForeignKey(
        Delivery,
        on_delete=models.CASCADE,
        related_name="events",
    )

    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="delivery_events",
        null=True,
        blank=True,
    )

    event_type = models.CharField(
        max_length=30,
        choices=EventType.choices,
    )

    from_status = models.CharField(
        max_length=20,
        choices=Delivery.Status.choices,
        null=True,
        blank=True,
    )

    to_status = models.CharField(
        max_length=20,
        choices=Delivery.Status.choices,
        null=True,
        blank=True,
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at", "id"]

    def __str__(self):
        return f"{self.delivery} - {self.event_type}"