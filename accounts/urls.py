from django.urls import include, path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from . import views

urlpatterns = [
    # API endpoints
    path('api/auth/register/', views.RegisterView.as_view(), name='auth_register'),
    path('api/auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/user/', views.UserDetailView.as_view(), name='user_detail'),
    
    # Existing URLs
    path("", include("django.contrib.auth.urls")),
    path("profile/", views.display_profile, name="profile"),
    path("register/", views.register, name="register"),
    path("logout/", views.logout_request, name="logout"),
]
