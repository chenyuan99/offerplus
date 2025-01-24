"""offer_plus URL Configuration."""

from django.contrib import admin
from django.urls import include, path, re_path
from django.views.generic.base import TemplateView
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)
from django.conf import settings
from django.conf.urls.static import static
from django.views.static import serve

urlpatterns = [
    path("", TemplateView.as_view(template_name="index.html"), name="index"),
    path("yuanc", TemplateView.as_view(template_name="yuanc.html"), name="yuanc"),
    path("companies", TemplateView.as_view(template_name="companies.html"), name="companies"),
    path("add-application/", TemplateView.as_view(template_name="add-application.html"), name="add-application"),
    path("application/edit/<int:id>/", TemplateView.as_view(template_name="edit-application.html"), name="application-edit"),
    path("accounts/", include("accounts.urls")),
    path("admin/", admin.site.urls),
    path("jobgpt/", include("jobgpt.urls")),
    path("", include("tracks.urls")),  
    path("", include("company.urls")),  
    path("", include("accounts.urls")),  
    path("", include("jobgpt.urls")),  
    path("api/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/token/verify/", TokenVerifyView.as_view(), name="token_verify"),
    
    # Serve media files
    re_path(r'^media/(?P<path>.*)$', serve, {
        'document_root': settings.MEDIA_ROOT,
        'show_indexes': True
    }),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
