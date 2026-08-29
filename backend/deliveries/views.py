from django.core.exceptions import PermissionDenied, ValidationError
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import User

from .models import Delivery
from .serializers import (
    AssignRiderSerializer,
    ConfirmDeliverySerializer,
    DeliveryCreateSerializer,
    DeliveryDetailSerializer,
    DeliveryListSerializer,
    StatusUpdateSerializer,
)
from .services import (
    ConfirmationOutcome,
    DeliveryConflict,
    InvalidConfirmationToken,
    assign_rider,
    confirm_delivery,
    create_delivery,
    update_delivery_status,
)


def error_response(code, message, status_code):
    return Response(
        {
            "error": code,
            "message": message,
        },
        status=status_code,
    )


def user_can_view_delivery(user, delivery):
    if user.role == User.Role.RETAILER:
        return delivery.created_by_id == user.id

    if user.role == User.Role.DISPATCHER:
        return True

    if user.role == User.Role.RIDER:
        return delivery.assigned_rider_id == user.id

    return False


class DeliveryListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        queryset = Delivery.objects.select_related(
            "assigned_rider",
            "created_by",
        )

        if user.role == User.Role.RETAILER:
            queryset = queryset.filter(created_by=user)

        elif user.role == User.Role.DISPATCHER:
            queryset = queryset.exclude(
                status=Delivery.Status.DELIVERED
            )

        elif user.role == User.Role.RIDER:
            queryset = queryset.filter(assigned_rider=user)

        else:
            queryset = queryset.none()

        queryset = queryset.order_by("-created_at")

        return Response(
            DeliveryListSerializer(
                queryset,
                many=True,
            ).data,
            status=status.HTTP_200_OK,
        )

    def post(self, request):
        if request.user.role != User.Role.RETAILER:
            return error_response(
                "FORBIDDEN",
                "Only Retailers can create deliveries.",
                status.HTTP_403_FORBIDDEN,
            )

        serializer = DeliveryCreateSerializer(
            data=request.data
        )
        serializer.is_valid(raise_exception=True)

        try:
            delivery = create_delivery(
                retailer=request.user,
                **serializer.validated_data,
            )
        except PermissionDenied as exc:
            return error_response(
                "FORBIDDEN",
                str(exc),
                status.HTTP_403_FORBIDDEN,
            )
        except ValidationError as exc:
            return error_response(
                "VALIDATION_ERROR",
                str(exc),
                status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            DeliveryDetailSerializer(
                delivery,
                context={"request": request},
            ).data,
            status=status.HTTP_201_CREATED,
        )


class DeliveryDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, delivery_id):
        delivery = get_object_or_404(
            Delivery.objects.select_related(
                "created_by",
                "assigned_rider",
                "confirmation",
                "confirmation__confirmed_by",
            ).prefetch_related(
                "events",
                "events__actor",
            ),
            pk=delivery_id,
        )

        if not user_can_view_delivery(
            request.user,
            delivery,
        ):
            return error_response(
                "FORBIDDEN",
                "You do not have access to this delivery.",
                status.HTTP_403_FORBIDDEN,
            )

        return Response(
            DeliveryDetailSerializer(
                delivery,
                context={"request": request},
            ).data,
            status=status.HTTP_200_OK,
        )


class AssignRiderView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, delivery_id):
        serializer = AssignRiderSerializer(
            data=request.data
        )
        serializer.is_valid(raise_exception=True)

        rider = get_object_or_404(
            User,
            pk=serializer.validated_data["rider_id"],
        )

        try:
            delivery = assign_rider(
                dispatcher=request.user,
                delivery_id=delivery_id,
                rider=rider,
            )
        except PermissionDenied as exc:
            return error_response(
                "FORBIDDEN",
                str(exc),
                status.HTTP_403_FORBIDDEN,
            )
        except ValidationError as exc:
            return error_response(
                "VALIDATION_ERROR",
                str(exc),
                status.HTTP_400_BAD_REQUEST,
            )
        except DeliveryConflict as exc:
            return error_response(
                "ALREADY_ASSIGNED",
                str(exc),
                status.HTTP_409_CONFLICT,
            )
        except Delivery.DoesNotExist:
            return error_response(
                "NOT_FOUND",
                "Delivery not found.",
                status.HTTP_404_NOT_FOUND,
            )

        return Response(
            DeliveryDetailSerializer(
                delivery,
                context={"request": request},
            ).data,
            status=status.HTTP_200_OK,
        )


class UpdateDeliveryStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, delivery_id):
        serializer = StatusUpdateSerializer(
            data=request.data
        )
        serializer.is_valid(raise_exception=True)

        try:
            delivery = update_delivery_status(
                rider=request.user,
                delivery_id=delivery_id,
                new_status=serializer.validated_data["status"],
            )
        except PermissionDenied as exc:
            return error_response(
                "FORBIDDEN",
                str(exc),
                status.HTTP_403_FORBIDDEN,
            )
        except DeliveryConflict as exc:
            return error_response(
                "INVALID_STATUS_TRANSITION",
                str(exc),
                status.HTTP_409_CONFLICT,
            )
        except Delivery.DoesNotExist:
            return error_response(
                "NOT_FOUND",
                "Delivery not found.",
                status.HTTP_404_NOT_FOUND,
            )

        return Response(
            DeliveryDetailSerializer(
                delivery,
                context={"request": request},
            ).data,
            status=status.HTTP_200_OK,
        )


class ConfirmDeliveryView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, delivery_id):
        serializer = ConfirmDeliverySerializer(
            data=request.data
        )
        serializer.is_valid(raise_exception=True)

        try:
            delivery, confirmation, outcome = confirm_delivery(
                rider=request.user,
                delivery_id=delivery_id,
                token=serializer.validated_data["token"],
            )
        except PermissionDenied as exc:
            return error_response(
                "FORBIDDEN",
                str(exc),
                status.HTTP_403_FORBIDDEN,
            )
        except InvalidConfirmationToken as exc:
            return error_response(
                "INVALID_CONFIRMATION_TOKEN",
                str(exc),
                status.HTTP_400_BAD_REQUEST,
            )
        except DeliveryConflict as exc:
            return error_response(
                "INVALID_STATUS_TRANSITION",
                str(exc),
                status.HTTP_409_CONFLICT,
            )
        except Delivery.DoesNotExist:
            return error_response(
                "NOT_FOUND",
                "Delivery not found.",
                status.HTTP_404_NOT_FOUND,
            )

        if outcome == ConfirmationOutcome.ALREADY_CONFIRMED:
            return Response(
                {
                    "result": "ALREADY_CONFIRMED",
                    "reference": delivery.reference,
                    "status": delivery.status,
                },
                status=status.HTTP_200_OK,
            )

        return Response(
            {
                "result": "CONFIRMED",
                "reference": delivery.reference,
                "status": delivery.status,
                "confirmed_at": confirmation.confirmed_at,
            },
            status=status.HTTP_200_OK,
        )