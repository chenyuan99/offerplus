from django.urls import path
from . import views

urlpatterns = [
    path("grace-hopper", views.display_grace_hopper, name="grace-hopper"),
    path("internships", views.display_internships, name="internships"),
    path("api/internships", views.api_internships, name="api-internships"),
]
