from datetime import datetime, timezone as dt_timezone

from django.test import SimpleTestCase, TestCase

from .models import Delivery, DeliveryConfirmation, DeliveryEvent

from django.contrib.auth import get_user_model

from unittest.mock import patch

from django.core.exceptions import PermissionDenied, ValidationError


from .services import (
    ConfirmationOutcome,
    DeliveryConflict,
    DeliveryHealth,
    InvalidConfirmationToken,
    assign_rider,
    calculate_delivery_health,
    confirm_delivery,
    create_delivery,
    update_delivery_status,
)



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
            
            
class AssignRiderTests(TestCase):
    def setUp(self):
        User = get_user_model()

        self.retailer = User.objects.create_user(
            email="retailer-assignment@reflex.test",
            password="test-password",
            name="Test Retailer",
            role=User.Role.RETAILER,
        )

        self.dispatcher = User.objects.create_user(
            email="dispatcher-assignment@reflex.test",
            password="test-password",
            name="Test Dispatcher",
            role=User.Role.DISPATCHER,
        )

        self.rider = User.objects.create_user(
            email="rider@reflex.test",
            password="test-password",
            name="Brian Rider",
            role=User.Role.RIDER,
        )

        self.second_rider = User.objects.create_user(
            email="rider-two@reflex.test",
            password="test-password",
            name="Amina Rider",
            role=User.Role.RIDER,
        )

        self.expected_delivery_at = datetime(
            2026,
            8,
            30,
            14,
            0,
            tzinfo=dt_timezone.utc,
        )

        self.delivery = create_delivery(
            retailer=self.retailer,
            customer_name="Peter Mwangi",
            customer_phone="0712345678",
            delivery_address="Nyeri",
            item_description="Printer",
            expected_delivery_at=self.expected_delivery_at,
        )

    def test_dispatcher_can_assign_rider_to_open_delivery(self):
        delivery = assign_rider(
            dispatcher=self.dispatcher,
            delivery_id=self.delivery.id,
            rider=self.rider,
        )

        self.assertEqual(
            delivery.status,
            Delivery.Status.ASSIGNED,
        )

        self.assertEqual(
            delivery.assigned_rider,
            self.rider,
        )

        self.assertIsNotNone(delivery.assigned_at)

        event = delivery.events.get(
            event_type=DeliveryEvent.EventType.ASSIGNED
        )

        self.assertEqual(event.actor, self.dispatcher)
        self.assertEqual(
            event.from_status,
            Delivery.Status.OPEN,
        )
        self.assertEqual(
            event.to_status,
            Delivery.Status.ASSIGNED,
        )

    def test_non_dispatcher_cannot_assign_rider(self):
        with self.assertRaises(PermissionDenied):
            assign_rider(
                dispatcher=self.retailer,
                delivery_id=self.delivery.id,
                rider=self.rider,
            )

        self.delivery.refresh_from_db()

        self.assertEqual(
            self.delivery.status,
            Delivery.Status.OPEN,
        )

        self.assertIsNone(self.delivery.assigned_rider)

    def test_selected_user_must_be_rider(self):
        with self.assertRaises(ValidationError):
            assign_rider(
                dispatcher=self.dispatcher,
                delivery_id=self.delivery.id,
                rider=self.retailer,
            )

        self.delivery.refresh_from_db()

        self.assertEqual(
            self.delivery.status,
            Delivery.Status.OPEN,
        )

        self.assertIsNone(self.delivery.assigned_rider)

    def test_delivery_cannot_be_assigned_twice(self):
        assign_rider(
            dispatcher=self.dispatcher,
            delivery_id=self.delivery.id,
            rider=self.rider,
        )

        with self.assertRaises(DeliveryConflict):
            assign_rider(
                dispatcher=self.dispatcher,
                delivery_id=self.delivery.id,
                rider=self.second_rider,
            )

        self.delivery.refresh_from_db()

        self.assertEqual(
            self.delivery.status,
            Delivery.Status.ASSIGNED,
        )

        self.assertEqual(
            self.delivery.assigned_rider,
            self.rider,
        )            
        
class UpdateDeliveryStatusTests(TestCase):
    def setUp(self):
        User = get_user_model()

        self.retailer = User.objects.create_user(
            email="retailer-status@reflex.test",
            password="test-password",
            name="Test Retailer",
            role=User.Role.RETAILER,
        )

        self.dispatcher = User.objects.create_user(
            email="dispatcher-status@reflex.test",
            password="test-password",
            name="Test Dispatcher",
            role=User.Role.DISPATCHER,
        )

        self.rider = User.objects.create_user(
            email="rider-status@reflex.test",
            password="test-password",
            name="Brian Rider",
            role=User.Role.RIDER,
        )

        self.other_rider = User.objects.create_user(
            email="other-rider-status@reflex.test",
            password="test-password",
            name="Amina Rider",
            role=User.Role.RIDER,
        )

        expected_delivery_at = datetime(
            2026,
            8,
            30,
            14,
            0,
            tzinfo=dt_timezone.utc,
        )

        self.delivery = create_delivery(
            retailer=self.retailer,
            customer_name="Peter Mwangi",
            customer_phone="0712345678",
            delivery_address="Nyeri",
            item_description="Printer",
            expected_delivery_at=expected_delivery_at,
        )

        self.delivery = assign_rider(
            dispatcher=self.dispatcher,
            delivery_id=self.delivery.id,
            rider=self.rider,
        )

    def test_assigned_rider_can_mark_delivery_picked_up(self):
        delivery = update_delivery_status(
            rider=self.rider,
            delivery_id=self.delivery.id,
            new_status=Delivery.Status.PICKED_UP,
        )

        self.assertEqual(
            delivery.status,
            Delivery.Status.PICKED_UP,
        )
        self.assertIsNotNone(delivery.picked_up_at)

        event = delivery.events.get(
            event_type=DeliveryEvent.EventType.STATUS_CHANGED
        )

        self.assertEqual(event.actor, self.rider)
        self.assertEqual(
            event.from_status,
            Delivery.Status.ASSIGNED,
        )
        self.assertEqual(
            event.to_status,
            Delivery.Status.PICKED_UP,
        )

    def test_picked_up_delivery_can_move_to_in_transit(self):
        update_delivery_status(
            rider=self.rider,
            delivery_id=self.delivery.id,
            new_status=Delivery.Status.PICKED_UP,
        )

        delivery = update_delivery_status(
            rider=self.rider,
            delivery_id=self.delivery.id,
            new_status=Delivery.Status.IN_TRANSIT,
        )

        self.assertEqual(
            delivery.status,
            Delivery.Status.IN_TRANSIT,
        )
        self.assertIsNotNone(delivery.in_transit_at)

    def test_wrong_rider_cannot_update_delivery(self):
        with self.assertRaises(PermissionDenied):
            update_delivery_status(
                rider=self.other_rider,
                delivery_id=self.delivery.id,
                new_status=Delivery.Status.PICKED_UP,
            )

        self.delivery.refresh_from_db()

        self.assertEqual(
            self.delivery.status,
            Delivery.Status.ASSIGNED,
        )

    def test_assigned_delivery_cannot_skip_pickup(self):
        with self.assertRaises(DeliveryConflict):
            update_delivery_status(
                rider=self.rider,
                delivery_id=self.delivery.id,
                new_status=Delivery.Status.IN_TRANSIT,
            )

        self.delivery.refresh_from_db()

        self.assertEqual(
            self.delivery.status,
            Delivery.Status.ASSIGNED,
        )

    def test_delivered_status_cannot_be_set_through_status_service(self):
        with self.assertRaises(DeliveryConflict):
            update_delivery_status(
                rider=self.rider,
                delivery_id=self.delivery.id,
                new_status=Delivery.Status.DELIVERED,
            )

        self.delivery.refresh_from_db()

        self.assertEqual(
            self.delivery.status,
            Delivery.Status.ASSIGNED,
        )
        
class ConfirmDeliveryTests(TestCase):
    def setUp(self):
        User = get_user_model()

        self.retailer = User.objects.create_user(
            email="retailer-confirm@reflex.test",
            password="test-password",
            name="Test Retailer",
            role=User.Role.RETAILER,
        )

        self.dispatcher = User.objects.create_user(
            email="dispatcher-confirm@reflex.test",
            password="test-password",
            name="Test Dispatcher",
            role=User.Role.DISPATCHER,
        )

        self.rider = User.objects.create_user(
            email="rider-confirm@reflex.test",
            password="test-password",
            name="Brian Rider",
            role=User.Role.RIDER,
        )

        self.other_rider = User.objects.create_user(
            email="other-rider-confirm@reflex.test",
            password="test-password",
            name="Amina Rider",
            role=User.Role.RIDER,
        )

        self.expected_delivery_at = datetime(
            2026,
            8,
            30,
            14,
            0,
            tzinfo=dt_timezone.utc,
        )

        self.delivery = create_delivery(
            retailer=self.retailer,
            customer_name="Peter Mwangi",
            customer_phone="0712345678",
            delivery_address="Nyeri",
            item_description="Printer",
            expected_delivery_at=self.expected_delivery_at,
        )

        self.delivery = assign_rider(
            dispatcher=self.dispatcher,
            delivery_id=self.delivery.id,
            rider=self.rider,
        )

    def move_to_in_transit(self):
        update_delivery_status(
            rider=self.rider,
            delivery_id=self.delivery.id,
            new_status=Delivery.Status.PICKED_UP,
        )

        return update_delivery_status(
            rider=self.rider,
            delivery_id=self.delivery.id,
            new_status=Delivery.Status.IN_TRANSIT,
        )

    def test_assigned_rider_can_confirm_with_correct_token(self):
        delivery = self.move_to_in_transit()

        delivery, confirmation, outcome = confirm_delivery(
            rider=self.rider,
            delivery_id=delivery.id,
            token=delivery.confirmation_token,
        )

        self.assertEqual(
            outcome,
            ConfirmationOutcome.CONFIRMED,
        )
        self.assertEqual(
            delivery.status,
            Delivery.Status.DELIVERED,
        )
        self.assertIsNotNone(delivery.delivered_at)
        self.assertEqual(confirmation.confirmed_by, self.rider)

    def test_wrong_token_is_rejected(self):
        delivery = self.move_to_in_transit()

        with self.assertRaises(InvalidConfirmationToken):
            confirm_delivery(
                rider=self.rider,
                delivery_id=delivery.id,
                token="WRONGTOKEN",
            )

        delivery.refresh_from_db()

        self.assertEqual(
            delivery.status,
            Delivery.Status.IN_TRANSIT,
        )

        self.assertFalse(
            DeliveryConfirmation.objects.filter(
                delivery=delivery
            ).exists()
        )

    def test_wrong_rider_cannot_confirm_delivery(self):
        delivery = self.move_to_in_transit()

        with self.assertRaises(PermissionDenied):
            confirm_delivery(
                rider=self.other_rider,
                delivery_id=delivery.id,
                token=delivery.confirmation_token,
            )

        delivery.refresh_from_db()

        self.assertEqual(
            delivery.status,
            Delivery.Status.IN_TRANSIT,
        )

    def test_delivery_cannot_be_confirmed_before_in_transit(self):
        with self.assertRaises(DeliveryConflict):
            confirm_delivery(
                rider=self.rider,
                delivery_id=self.delivery.id,
                token=self.delivery.confirmation_token,
            )

        self.delivery.refresh_from_db()

        self.assertEqual(
            self.delivery.status,
            Delivery.Status.ASSIGNED,
        )

    def test_duplicate_confirmation_is_idempotent(self):
        delivery = self.move_to_in_transit()

        delivery, first_confirmation, first_outcome = confirm_delivery(
            rider=self.rider,
            delivery_id=delivery.id,
            token=delivery.confirmation_token,
        )

        delivery, second_confirmation, second_outcome = confirm_delivery(
            rider=self.rider,
            delivery_id=delivery.id,
            token=delivery.confirmation_token,
        )

        self.assertEqual(
            first_outcome,
            ConfirmationOutcome.CONFIRMED,
        )

        self.assertEqual(
            second_outcome,
            ConfirmationOutcome.ALREADY_CONFIRMED,
        )

        self.assertEqual(
            first_confirmation.id,
            second_confirmation.id,
        )

        self.assertEqual(
            DeliveryConfirmation.objects.filter(
                delivery=delivery
            ).count(),
            1,
        )

    def test_confirmation_records_event_and_final_health(self):
        delivery = self.move_to_in_transit()

        delivered_time = datetime(
            2026,
            8,
            30,
            13,
            55,
            tzinfo=dt_timezone.utc,
        )

        with patch(
            "deliveries.services.timezone.now",
            return_value=delivered_time,
        ):
            delivery, confirmation, outcome = confirm_delivery(
                rider=self.rider,
                delivery_id=delivery.id,
                token=delivery.confirmation_token,
            )

        self.assertEqual(
            calculate_delivery_health(delivery),
            DeliveryHealth.DELIVERED_ON_TIME,
        )

        event = delivery.events.get(
            event_type=DeliveryEvent.EventType.CONFIRMED
        )

        self.assertEqual(event.actor, self.rider)
        self.assertEqual(
            event.from_status,
            Delivery.Status.IN_TRANSIT,
        )
        self.assertEqual(
            event.to_status,
            Delivery.Status.DELIVERED,
        )