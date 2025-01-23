from django.template.defaulttags import url
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register(r'api/applications', views.ApplicationRecordViewSet, basename='application')

urlpatterns = [
    path('', include(router.urls)),
    path("", views.index, name="index"),
    path("hardware", views.hardware, name="hardware"),
    path("h1b", views.display_h1b, name="h1b"),
    path("yuanc", views.yuanc, name="yuanc"),
    path("companies", views.companies, name="companies"),
    path("add-application/", views.add_application, name="add-application"),
    path(
        "application/edit/<int:id>/",
        views.edit_application,
        name="application-edit",
    ),
]
