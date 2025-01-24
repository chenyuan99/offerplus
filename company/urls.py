from django.urls import include, path, re_path
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'api/companies', views.CompanyViewSet)
router.register(r'api/jobs', views.JobViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path("", views.display_companies, name="companies"),
    path(
        "view/<str:company_name>/",
        views.display_company,
        name="company-detail",
    ),
    path("grace-hopper", views.display_grace_hopper, name="grace-hopper"),
    path("internships", views.display_internships, name="internships"),
    path("api/internships", views.api_internships, name="api-internships"),
]
