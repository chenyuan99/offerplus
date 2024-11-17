from django.urls import include, path

from . import views

urlpatterns = [
    path("", include("django.contrib.auth.urls")),
    path("profile/", views.display_profile, name="profile"),
    path("register/", views.register, name="register"),
    path("logout/", views.logout_request, name="logout"),
]
