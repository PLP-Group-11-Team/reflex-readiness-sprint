from django.urls import path

from .views import (
    AssignRiderView,
    ConfirmDeliveryView,
    DeliveryDetailView,
    DeliveryListCreateView,
    UpdateDeliveryStatusView,
)


urlpatterns = [
    path(
        "deliveries/",
        DeliveryListCreateView.as_view(),
        name="delivery-list-create",
    ),
    path(
        "deliveries/<int:delivery_id>/",
        DeliveryDetailView.as_view(),
        name="delivery-detail",
    ),
    path(
        "deliveries/<int:delivery_id>/assign/",
        AssignRiderView.as_view(),
        name="delivery-assign",
    ),
    path(
        "deliveries/<int:delivery_id>/status/",
        UpdateDeliveryStatusView.as_view(),
        name="delivery-status",
    ),
    path(
        "deliveries/<int:delivery_id>/confirm/",
        ConfirmDeliveryView.as_view(),
        name="delivery-confirm",
    ),
]