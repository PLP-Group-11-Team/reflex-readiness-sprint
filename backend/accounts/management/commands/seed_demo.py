from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from accounts.models import User
from deliveries.models import Delivery, DeliveryEvent


class Command(BaseCommand):
    help = "Create demo users and sample deliveries for the Reflex prototype."

    def handle(self, *args, **options):
        # Demo users
        dispatcher, _ = User.objects.update_or_create(
            email="dispatcher@reflex.demo",
            defaults={
                "name": "Demo Dispatcher",
                "role": User.Role.DISPATCHER,
                "is_active": True,
            },
        )
        dispatcher.set_password("ReflexDemo123!")
        dispatcher.save()

        rider, _ = User.objects.update_or_create(
            email="rider@reflex.demo",
            defaults={
                "name": "Demo Rider",
                "role": User.Role.RIDER,
                "is_active": True,
            },
        )
        rider.set_password("ReflexDemo123!")
        rider.save()

        retailer, _ = User.objects.update_or_create(
            email="retailer@reflex.demo",
            defaults={
                "name": "Demo Retailer",
                "role": User.Role.RETAILER,
                "is_active": True,
            },
        )
        retailer.set_password("ReflexDemo123!")
        retailer.save()

        # Sample delivery
        delivery, created = Delivery.objects.get_or_create(
            reference="REF-DEMO-001",
            defaults={
                "customer_name": "Demo Customer",
                "customer_phone": "+254700000000",
                "delivery_address": "Nairobi CBD",
                "item_description": "Demo Reflex Package",
                "status": Delivery.Status.OPEN,
                "created_by": retailer,
                "expected_delivery_at": timezone.now() + timedelta(days=1),
            },
        )

        if created:
            DeliveryEvent.objects.create(
                delivery=delivery,
                actor=retailer,
                event_type=DeliveryEvent.EventType.CREATED,
                to_status=Delivery.Status.OPEN,
            )

        self.stdout.write(
            self.style.SUCCESS(
                "Reflex demo data created/updated successfully."
            )
        )
        self.stdout.write("Dispatcher: dispatcher@reflex.demo")
        self.stdout.write("Rider:      rider@reflex.demo")
        self.stdout.write("Retailer:   retailer@reflex.demo")
        self.stdout.write("Password:   ReflexDemo123!")
        self.stdout.write("Delivery:   REF-DEMO-001")
