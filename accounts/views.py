import logging

from django.contrib import messages
from django.contrib.auth import login, logout
from django.contrib.auth.forms import UserCreationForm
from django.shortcuts import redirect, render
from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth.models import User
from .serializers import UserSerializer, RegisterSerializer

# Create your views here.


def logout_request(request):
    logout(request)
    messages.info(request, "Logged out successfully!")
    return redirect("index")


def privacy(request):
    return render(request, "accounts/privacy-policy.html")


def register(request):
    if request.method == "POST":
        form = UserCreationForm(request.POST)
        if form.is_valid():
            user = form.save()
            username = form.cleaned_data.get("username")
            login(request, user)
            return redirect("index")
        else:
            for msg in form.error_messages:
                logging.info(form.error_messages[msg])
            return render(
                request=request,
                template_name="accounts/register.html",
                context={"form": form},
            )
    form = UserCreationForm
    return render(
        request=request,
        template_name="accounts/register.html",
        context={"form": form},
    )


# Create your views here.
def display_profile(request):
    context = {"user": request.user}
    logging.info(context)
    return render(request, "registration/profile.html", context)


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = RegisterSerializer


class UserDetailView(generics.RetrieveUpdateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_object(self):
        return self.request.user
