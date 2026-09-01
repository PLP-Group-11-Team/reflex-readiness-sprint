from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from accounts.models import User
from deliveries.models import Delivery, DeliveryEvent


class Command(BaseCommand):
    help = "Create demo users and sample deliveries for the Reflex prototype."

    def handle(self, *args, **options):
        password = "ReflexDemo123!"

        # Demo users
        dispatcher, _ = User.objects.update_or_create(
            email="dispatch@reflex.ke",
            defaults={
                "name": "Reflex Dispatcher",
                "role": User.Role.DISPATCHER,
                "is_active": True,
            },
        )
        dispatcher.set_password(password)
        dispatcher.save()

        brian, _ = User.objects.update_or_create(
            email="brian@reflex.ke",
            defaults={
                "name": "Brian",
                "role": User.Role.RIDER,
                "is_active": True,
            },
        )
        brian.set_password(password)
        brian.save()

        james, _ = User.objects.update_or_create(
            email="james@reflex.ke",
            defaults={
                "name": "James",
                "role": User.Role.RIDER,
                "is_active": True,
            },
        )
        james.set_password(password)
        james.save()

        retailer, _ = User.objects.update_or_create(
            email="retailer@mwangaza.ke",
            defaults={
                "name": "Mwangaza Retailer",
                "role": User.Role.RETAILER,
                "is_active": True,
            },
        )
        retailer.set_password(password)
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
        self.stdout.write("Retailer:   retailer@mwangaza.ke")
        self.stdout.write("Dispatcher: dispatch@reflex.ke")
        self.stdout.write("Rider 1:    brian@reflex.ke")
        self.stdout.write("Rider 2:    james@reflex.ke")
        self.stdout.write("Password:   ReflexDemo123!")
        self.stdout.write("Delivery:   REF-DEMO-001")
