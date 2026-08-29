from django.urls import path

from .views import LoginView, MeView, RiderListView


urlpatterns = [
    path("auth/login/", LoginView.as_view(), name="login"),
    path("auth/me/", MeView.as_view(), name="me"),
    path("riders/", RiderListView.as_view(), name="rider-list"),
]