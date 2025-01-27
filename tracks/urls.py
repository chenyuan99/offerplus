from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'applications', views.ApplicationRecordViewSet, basename='application')

app_name = "tracks"
urlpatterns = [
    path("", views.index, name="index"),
    path("add/", views.add_application, name="add-application"),
    path("edit/<int:id>/", views.edit_application, name="edit-application"),
    path("companies/", views.companies, name="companies"),
    path("sync-gmail/", views.sync_gmail, name="sync-gmail"),
    path("api/", include(router.urls)),
    path("api/sync-gmail/", views.sync_gmail_api, name="sync-gmail-api"),
]
