# Copyright Yuan Chen. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License"). You
# may not use this file except in compliance with the License. A copy of
# the License is located at
#
# https://www.yuanchen.io/apache2.0/
#
# or in the "license" file accompanying this file. This file is
# distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF
# ANY KIND, either express or implied. See the License for the specific
# language governing permissions and limitations under the License.
import logging
from django.contrib import messages
from django.contrib.auth.mixins import LoginRequiredMixin
from django.core.exceptions import PermissionDenied
from django.core.paginator import EmptyPage, PageNotAnInteger, Paginator
from django.db.models import QuerySet
from django.http import HttpResponse, JsonResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import reverse_lazy
from django.views.generic import FormView, TemplateView
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from tracks.forms import ApplicationRecordForm
from tracks.models import ApplicationRecord, Company
from .serializers import ApplicationRecordSerializer
from .services.gmail_service import GmailService
from .services.company_service import CompanyService
from django.contrib.auth.decorators import login_required


def report_statistics(items: QuerySet[ApplicationRecord]):
    """
    Displays statistics about the job applications
    :param items: QuerySet of ApplicationRecord objects
    :return: a dictionary with the statistics of applications
    """
    rejected = len(items.filter(status='REJECTED'))
    oa = len(items.filter(status='OA'))
    vo = len(items.filter(status='VO'))
    offer = len(items.filter(status='OFFER'))
    statistics = {"oa": oa, "rejected": rejected, "vo": vo, "offer": offer}
    return statistics


@login_required
def index(request, *args, **kwargs):
    items = ApplicationRecord.objects.filter(user=request.user)
    statistics = report_statistics(items)
    paginator = Paginator(items, 10)
    page = request.GET.get("page")
    try:
        items = paginator.page(page)
    except PageNotAnInteger:
        items = paginator.page(1)
    except EmptyPage:
        items = paginator.page(paginator.num_pages)
    context = {"items": items, "statistics": statistics}
    return render(request, "tracks/index.html", context)


class ApplicationRecordView(LoginRequiredMixin, FormView):
    template_name = "tracks/application-record.html"
    form_class = ApplicationRecordForm
    success_url = reverse_lazy("tracks:success")

    def form_valid(self, form):
        application = form.save(commit=False)
        application.user = self.request.user
        application.save()
        return super().form_valid(form)


class ApplicationRecordSuccessView(TemplateView):
    template_name = "tracks/success.html"


@login_required
def edit_application(request, id):
    application = get_object_or_404(ApplicationRecord, id=id)
    if application.user != request.user:
        raise PermissionDenied
        
    if request.method == "POST":
        form = ApplicationRecordForm(request.POST, instance=application)
        if form.is_valid():
            form.save()
            return redirect("tracks:index")
    else:
        form = ApplicationRecordForm(instance=application)
    return render(request, "tracks/edit-application.html", {"form": form})


@login_required
def add_application(request, *args, **kwargs):
    if request.method == "POST":
        form = ApplicationRecordForm(request.POST)
        if form.is_valid():
            application = form.save(commit=False)
            application.user = request.user
            application.save()
            return redirect("tracks:index")
    else:
        form = ApplicationRecordForm()
    return render(request, "tracks/add-application.html", {"form": form})


@login_required
def companies(request):
    companies = Company.objects.all()
    context = {"companies": companies}
    return render(request, "companies.html", context)


@login_required
def sync_gmail(request):
    if request.method == "POST":
        email = request.POST.get("email") or request.user.email
        if not email:
            messages.error(request, "No email provided and no email found in user profile")
            return JsonResponse({"status": "error", "message": "Email is required"})
        
        service = GmailService()
        try:
            result = service.sync_applications(email, request.user)
            messages.success(request, f"Successfully synced {result['synced']} applications")
            return JsonResponse({"status": "success", "data": result})
        except Exception as e:
            messages.error(request, str(e))
            return JsonResponse({"status": "error", "message": str(e)})
    return render(request, "tracks/sync_gmail.html")


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def sync_gmail_api(request):
    email = request.data.get("email") or request.user.email
    if not email:
        return Response(
            {"error": "No email provided and no email found in user profile"}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        service = GmailService()
        result = service.sync_applications(email, request.user)
        return Response({
            "status": "success",
            "message": "Successfully synced applications",
            "data": result
        })
    except Exception as e:
        return Response(
            {"error": str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


class ApplicationRecordViewSet(viewsets.ModelViewSet):
    serializer_class = ApplicationRecordSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return ApplicationRecord.objects.filter(user=self.request.user)