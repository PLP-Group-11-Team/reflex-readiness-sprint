from rest_framework import serializers

from accounts.serializers import RiderSerializer

from .models import Delivery, DeliveryConfirmation, DeliveryEvent
from .services import calculate_delivery_health


class DeliveryEventSerializer(serializers.ModelSerializer):
    actor = serializers.SerializerMethodField()

    class Meta:
        model = DeliveryEvent
        fields = [
            "id",
            "event_type",
            "from_status",
            "to_status",
            "actor",
            "created_at",
        ]

    def get_actor(self, obj):
        if obj.actor is None:
            return None

        return {
            "id": obj.actor.id,
            "name": obj.actor.name,
            "role": obj.actor.role,
        }


class DeliveryConfirmationSerializer(serializers.ModelSerializer):
    confirmed_by = RiderSerializer(read_only=True)

    class Meta:
        model = DeliveryConfirmation
        fields = [
            "id",
            "confirmed_by",
            "confirmation_method",
            "confirmed_at",
        ]


class DeliveryListSerializer(serializers.ModelSerializer):
    health = serializers.SerializerMethodField()
    assigned_rider = RiderSerializer(read_only=True)

    class Meta:
        model = Delivery
        fields = [
            "id",
            "reference",
            "customer_name",
            "delivery_address",
            "item_description",
            "status",
            "health",
            "expected_delivery_at",
            "assigned_rider",
        ]

    def get_health(self, obj):
        return calculate_delivery_health(obj)


class DeliveryDetailSerializer(serializers.ModelSerializer):
    health = serializers.SerializerMethodField()
    assigned_rider = RiderSerializer(read_only=True)
    confirmation = DeliveryConfirmationSerializer(read_only=True)
    events = DeliveryEventSerializer(many=True, read_only=True)
    confirmation_token = serializers.SerializerMethodField()

    class Meta:
        model = Delivery
        fields = [
            "id",
            "reference",
            "customer_name",
            "customer_phone",
            "delivery_address",
            "item_description",
            "status",
            "health",
            "assigned_rider",
            "expected_delivery_at",
            "confirmation_token",
            "created_at",
            "assigned_at",
            "picked_up_at",
            "in_transit_at",
            "delivered_at",
            "updated_at",
            "confirmation",
            "events",
        ]

    def get_health(self, obj):
        return calculate_delivery_health(obj)

    def get_confirmation_token(self, obj):
        request = self.context.get("request")

        if request is None or not request.user.is_authenticated:
            return None

        user = request.user

        if (
            user.role == user.Role.RETAILER
            and obj.created_by_id == user.id
        ):
            return obj.confirmation_token

        return None
    
    
class DeliveryCreateSerializer(serializers.Serializer):
    customer_name = serializers.CharField(max_length=150)
    customer_phone = serializers.CharField(max_length=30)
    delivery_address = serializers.CharField()
    item_description = serializers.CharField()
    expected_delivery_at = serializers.DateTimeField()


class AssignRiderSerializer(serializers.Serializer):
    rider_id = serializers.IntegerField()


class StatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(
        choices=Delivery.Status.choices
    )


class ConfirmDeliverySerializer(serializers.Serializer):
    token = serializers.CharField(
        allow_blank=False,
        trim_whitespace=True,
    )