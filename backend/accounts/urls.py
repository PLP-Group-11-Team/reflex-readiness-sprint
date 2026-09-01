from django.urls import path

from .views import LoginView, MeView, RiderListView
from rest_framework_simplejwt.views import TokenRefreshView


urlpatterns = [
    path("auth/login/", LoginView.as_view(), name="login"),
    path("auth/me/", MeView.as_view(), name="me"),
    path(
    "auth/token/refresh/",
    TokenRefreshView.as_view(),
    name="token_refresh",
),
    path("riders/", RiderListView.as_view(), name="rider-list"),
]
