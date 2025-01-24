import logging

from django.contrib import messages
from django.contrib.auth import login, logout
from django.contrib.auth.forms import UserCreationForm
from django.shortcuts import redirect, render
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth.models import User
from .serializers import UserSerializer, RegisterSerializer, UserProfileSerializer
from .models import UserProfile
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from django.shortcuts import get_object_or_404

# Create your views here.


def logout_request(request):
    logout(request)
    messages.info(request, "Logged out successfully!")
    return redirect("index")


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
    serializer_class = RegisterSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        # Create user profile
        UserProfile.objects.create(user=user)
        return Response({
            "user": UserSerializer(user, context=self.get_serializer_context()).data,
            "message": "User created successfully"
        })

class UserDetailView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user

class UserProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserProfileSerializer
    parser_classes = (MultiPartParser, FormParser)

    def get_object(self):
        profile, created = UserProfile.objects.get_or_create(user=self.request.user)
        return profile

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        # Handle resume upload
        resume_file = request.FILES.get('resume')
        if resume_file:
            # Validate file type
            allowed_types = ['application/pdf', 'application/msword', 
                           'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
            if resume_file.content_type not in allowed_types:
                return Response({
                    'error': 'Invalid file type. Please upload a PDF or Word document.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Validate file size (5MB limit)
            if resume_file.size > 5 * 1024 * 1024:
                return Response({
                    'error': 'File size must be less than 5MB.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            instance.resume = resume_file
            instance.resume_name = resume_file.name

        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        return Response(serializer.data)
