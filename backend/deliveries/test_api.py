from datetime import timedelta

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Delivery, DeliveryConfirmation


class ReflexAPITests(APITestCase):
    def setUp(self):
        User = get_user_model()

        self.password = "test-password"

        self.retailer = User.objects.create_user(
            email="retailer-api@reflex.test",
            password=self.password,
            name="Test Retailer",
            role=User.Role.RETAILER,
        )

        self.dispatcher = User.objects.create_user(
            email="dispatcher-api@reflex.test",
            password=self.password,
            name="Test Dispatcher",
            role=User.Role.DISPATCHER,
        )

        self.rider = User.objects.create_user(
            email="rider-api@reflex.test",
            password=self.password,
            name="Brian Rider",
            role=User.Role.RIDER,
        )

        self.other_rider = User.objects.create_user(
            email="other-rider-api@reflex.test",
            password=self.password,
            name="Amina Rider",
            role=User.Role.RIDER,
        )

    def authenticate_as(self, user):
        self.client.force_authenticate(user=user)

    def create_delivery_as_retailer(self):
        self.authenticate_as(self.retailer)

        response = self.client.post(
            "/api/deliveries/",
            {
                "customer_name": "Peter Mwangi",
                "customer_phone": "0712345678",
                "delivery_address": "Nyeri",
                "item_description": "Printer",
                "expected_delivery_at": (
                    timezone.now() + timedelta(hours=2)
                ).isoformat(),
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

        return response

    def test_login_and_me_with_jwt(self):
        self.client.force_authenticate(user=None)

        login_response = self.client.post(
            "/api/auth/login/",
            {
                "email": self.dispatcher.email,
                "password": self.password,
            },
            format="json",
        )

        self.assertEqual(
            login_response.status_code,
            status.HTTP_200_OK,
        )

        self.assertIn("access", login_response.data)
        self.assertIn("refresh", login_response.data)

        access_token = login_response.data["access"]

        self.client.force_authenticate(user=None)
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {access_token}"
        )

        me_response = self.client.get("/api/auth/me/")

        self.assertEqual(
            me_response.status_code,
            status.HTTP_200_OK,
        )
        self.assertEqual(
            me_response.data["email"],
            self.dispatcher.email,
        )
        self.assertEqual(
            me_response.data["role"],
            "DISPATCHER",
        )

    def test_complete_delivery_lifecycle_through_api(self):
        # Retailer creates delivery.
        create_response = self.create_delivery_as_retailer()

        delivery_id = create_response.data["id"]
        confirmation_token = create_response.data[
            "confirmation_token"
        ]

        self.assertEqual(
            create_response.data["status"],
            Delivery.Status.OPEN,
        )
        self.assertIsNotNone(confirmation_token)

        # Dispatcher assigns rider.
        self.authenticate_as(self.dispatcher)

        assign_response = self.client.patch(
            f"/api/deliveries/{delivery_id}/assign/",
            {
                "rider_id": self.rider.id,
            },
            format="json",
        )

        self.assertEqual(
            assign_response.status_code,
            status.HTTP_200_OK,
        )
        self.assertEqual(
            assign_response.data["status"],
            Delivery.Status.ASSIGNED,
        )

        # Dispatcher must not receive secret QR token.
        self.assertIsNone(
            assign_response.data["confirmation_token"]
        )

        # Assigned Rider marks picked up.
        self.authenticate_as(self.rider)

        pickup_response = self.client.patch(
            f"/api/deliveries/{delivery_id}/status/",
            {
                "status": Delivery.Status.PICKED_UP,
            },
            format="json",
        )

        self.assertEqual(
            pickup_response.status_code,
            status.HTTP_200_OK,
        )
        self.assertEqual(
            pickup_response.data["status"],
            Delivery.Status.PICKED_UP,
        )

        # Rider moves delivery to in transit.
        transit_response = self.client.patch(
            f"/api/deliveries/{delivery_id}/status/",
            {
                "status": Delivery.Status.IN_TRANSIT,
            },
            format="json",
        )

        self.assertEqual(
            transit_response.status_code,
            status.HTTP_200_OK,
        )
        self.assertEqual(
            transit_response.data["status"],
            Delivery.Status.IN_TRANSIT,
        )

        # Rider API still must not expose token.
        self.assertIsNone(
            transit_response.data["confirmation_token"]
        )

        # Rider scans the QR displayed on Retailer screen.
        confirm_response = self.client.post(
            f"/api/deliveries/{delivery_id}/confirm/",
            {
                "token": confirmation_token,
            },
            format="json",
        )

        self.assertEqual(
            confirm_response.status_code,
            status.HTTP_200_OK,
        )
        self.assertEqual(
            confirm_response.data["result"],
            "CONFIRMED",
        )
        self.assertEqual(
            confirm_response.data["status"],
            Delivery.Status.DELIVERED,
        )

        # Duplicate scan must be idempotent.
        duplicate_response = self.client.post(
            f"/api/deliveries/{delivery_id}/confirm/",
            {
                "token": confirmation_token,
            },
            format="json",
        )

        self.assertEqual(
            duplicate_response.status_code,
            status.HTTP_200_OK,
        )
        self.assertEqual(
            duplicate_response.data["result"],
            "ALREADY_CONFIRMED",
        )

        self.assertEqual(
            DeliveryConfirmation.objects.filter(
                delivery_id=delivery_id
            ).count(),
            1,
        )

        # Retailer can view final detail and audit timeline.
        self.authenticate_as(self.retailer)

        detail_response = self.client.get(
            f"/api/deliveries/{delivery_id}/"
        )

        self.assertEqual(
            detail_response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            detail_response.data["status"],
            Delivery.Status.DELIVERED,
        )

        event_types = [
            event["event_type"]
            for event in detail_response.data["events"]
        ]

        self.assertEqual(
            event_types,
            [
                "CREATED",
                "ASSIGNED",
                "STATUS_CHANGED",
                "STATUS_CHANGED",
                "CONFIRMED",
            ],
        )

    def test_wrong_rider_and_invalid_transition_are_rejected(self):
        create_response = self.create_delivery_as_retailer()
        delivery_id = create_response.data["id"]

        self.authenticate_as(self.dispatcher)

        self.client.patch(
            f"/api/deliveries/{delivery_id}/assign/",
            {
                "rider_id": self.rider.id,
            },
            format="json",
        )

        # Wrong Rider cannot update it.
        self.authenticate_as(self.other_rider)

        wrong_rider_response = self.client.patch(
            f"/api/deliveries/{delivery_id}/status/",
            {
                "status": Delivery.Status.PICKED_UP,
            },
            format="json",
        )

        self.assertEqual(
            wrong_rider_response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

        # Correct Rider cannot skip PICKED_UP.
        self.authenticate_as(self.rider)

        invalid_response = self.client.patch(
            f"/api/deliveries/{delivery_id}/status/",
            {
                "status": Delivery.Status.IN_TRANSIT,
            },
            format="json",
        )

        self.assertEqual(
            invalid_response.status_code,
            status.HTTP_409_CONFLICT,
        )
        self.assertEqual(
            invalid_response.data["error"],
            "INVALID_STATUS_TRANSITION",
        )

    def test_rider_detail_does_not_expose_confirmation_token(self):
        create_response = self.create_delivery_as_retailer()

        delivery_id = create_response.data["id"]

        self.authenticate_as(self.dispatcher)

        self.client.patch(
            f"/api/deliveries/{delivery_id}/assign/",
            {
                "rider_id": self.rider.id,
            },
            format="json",
        )

        self.authenticate_as(self.rider)

        response = self.client.get(
            f"/api/deliveries/{delivery_id}/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertIsNone(
            response.data["confirmation_token"]
        )