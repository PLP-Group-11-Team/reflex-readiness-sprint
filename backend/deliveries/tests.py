from datetime import datetime, timezone as dt_timezone

from django.test import SimpleTestCase

from .models import Delivery
from .services import DeliveryHealth, calculate_delivery_health

from django.contrib.auth import get_user_model
from django.core.exceptions import PermissionDenied
from django.test import TestCase

from .models import DeliveryEvent
from .services import create_delivery


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
        
        

class CreateDeliveryTests(TestCase):
    def setUp(self):
        User = get_user_model()

        self.retailer = User.objects.create_user(
            email="retailer@reflex.test",
            password="test-password",
            name="Test Retailer",
            role=User.Role.RETAILER,
        )

        self.dispatcher = User.objects.create_user(
            email="dispatcher@reflex.test",
            password="test-password",
            name="Test Dispatcher",
            role=User.Role.DISPATCHER,
        )

        self.expected_delivery_at = datetime(
            2026,
            8,
            30,
            14,
            0,
            tzinfo=dt_timezone.utc,
        )

    def test_retailer_can_create_delivery(self):
        delivery = create_delivery(
            retailer=self.retailer,
            customer_name="Peter Mwangi",
            customer_phone="0712345678",
            delivery_address="Nyeri",
            item_description="Printer",
            expected_delivery_at=self.expected_delivery_at,
        )

        self.assertEqual(delivery.status, delivery.Status.OPEN)
        self.assertEqual(delivery.created_by, self.retailer)
        self.assertEqual(delivery.reference, "DEL-001")
        self.assertIsNotNone(delivery.confirmation_token)

    def test_creating_delivery_records_created_event(self):
        delivery = create_delivery(
            retailer=self.retailer,
            customer_name="Peter Mwangi",
            customer_phone="0712345678",
            delivery_address="Nyeri",
            item_description="Printer",
            expected_delivery_at=self.expected_delivery_at,
        )

        event = delivery.events.get()

        self.assertEqual(
            event.event_type,
            DeliveryEvent.EventType.CREATED,
        )
        self.assertEqual(event.actor, self.retailer)
        self.assertIsNone(event.from_status)
        self.assertEqual(event.to_status, delivery.Status.OPEN)

    def test_non_retailer_cannot_create_delivery(self):
        with self.assertRaises(PermissionDenied):
            create_delivery(
                retailer=self.dispatcher,
                customer_name="Peter Mwangi",
                customer_phone="0712345678",
                delivery_address="Nyeri",
                item_description="Printer",
                expected_delivery_at=self.expected_delivery_at,
            )