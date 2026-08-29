from datetime import datetime, timezone as dt_timezone

from django.test import SimpleTestCase

from .models import Delivery
from .services import DeliveryHealth, calculate_delivery_health


class DeliveryHealthTests(SimpleTestCase):
    def setUp(self):
        self.expected = datetime(
            2026,
            8,
            28,
            14,
            0,
            tzinfo=dt_timezone.utc,
        )

    def make_delivery(self, delivered_at=None):
        return Delivery(
            expected_delivery_at=self.expected,
            delivered_at=delivered_at,
        )

    def test_active_delivery_before_at_risk_window_is_on_time(self):
        delivery = self.make_delivery()

        now = datetime(
            2026,
            8,
            28,
            13,
            29,
            tzinfo=dt_timezone.utc,
        )

        health = calculate_delivery_health(delivery, now=now)

        self.assertEqual(health, DeliveryHealth.ON_TIME)

    def test_active_delivery_inside_at_risk_window_is_at_risk(self):
        delivery = self.make_delivery()

        now = datetime(
            2026,
            8,
            28,
            13,
            30,
            tzinfo=dt_timezone.utc,
        )

        health = calculate_delivery_health(delivery, now=now)

        self.assertEqual(health, DeliveryHealth.AT_RISK)

    def test_active_delivery_after_deadline_is_delayed(self):
        delivery = self.make_delivery()

        now = datetime(
            2026,
            8,
            28,
            14,
            1,
            tzinfo=dt_timezone.utc,
        )

        health = calculate_delivery_health(delivery, now=now)

        self.assertEqual(health, DeliveryHealth.DELAYED)

    def test_delivery_completed_by_deadline_is_delivered_on_time(self):
        delivered_at = datetime(
            2026,
            8,
            28,
            14,
            0,
            tzinfo=dt_timezone.utc,
        )

        delivery = self.make_delivery(delivered_at=delivered_at)

        health = calculate_delivery_health(delivery)

        self.assertEqual(
            health,
            DeliveryHealth.DELIVERED_ON_TIME,
        )

    def test_delivery_completed_after_deadline_is_delivered_late(self):
        delivered_at = datetime(
            2026,
            8,
            28,
            14,
            1,
            tzinfo=dt_timezone.utc,
        )

        delivery = self.make_delivery(delivered_at=delivered_at)

        health = calculate_delivery_health(delivery)

        self.assertEqual(
            health,
            DeliveryHealth.DELIVERED_LATE,
        )