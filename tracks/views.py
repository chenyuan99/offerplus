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
from django.http import HttpResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import reverse_lazy
from django.views.generic import FormView, TemplateView
from rest_framework import viewsets, permissions
from tracks.forms import ApplicationRecordForm
from tracks.models import ApplicationRecord, Company
from .serializers import ApplicationRecordSerializer

# Create your views here.


def report_statistics(items: QuerySet[ApplicationRecord]):
    """
    Displays statistics about the job applications
    :param items: QuerySet of ApplicationRecord objects
    :return: a dictionary with the statistics of applications
    """
    rejected = len(items.filter(outcome__contains="REJECT"))
    oa = len(items.filter(outcome="OA"))
    vo = len(items.filter(outcome="VO"))
    offer = len(items.filter(outcome="OFFER"))
    statistics = {"oa": oa, "rejected": rejected, "vo": vo, "offer": offer}
    return statistics


def index(request, *args, **kwargs):
    if not request.user.is_authenticated:
        return redirect('login')

    items = ApplicationRecord.objects.filter(
        applicant__username=request.user.username
    )
    # for item in items: print((item.applicant.username, request.user.username))
    # myFilter = facultyFilter(request.GET, queryset=items)
    # items = myFilter.qs
    statistics = report_statistics(items)
    logging.info(statistics)
    logging.info(request.GET.get('outcome'))
    if request.GET.get('outcome') == "rejected":
        items = items.filter(outcome__contains="REJECT")
    elif request.GET.get('outcome') == "oa":
        items = items.filter(outcome="OA")
    elif request.GET.get('outcome') == "vo":
        items = items.filter(outcome="VO")
    elif request.GET.get('outcome') == "offer":
        items = items.filter(outcome="OFFER")

    # Paginate items

    # Get page number from request,
    # default to first page
    default_page = 1
    page = request.GET.get("page", default_page)
    items_per_page = 10
    paginator = Paginator(items, items_per_page)
    try:
        items_page = paginator.page(page)
    except PageNotAnInteger:
        items_page = paginator.page(default_page)
    except EmptyPage:
        items_page = paginator.page(paginator.num_pages)
    context = {"items_page": items_page, "statistics": statistics}
    return render(request, "index.html", context)



# Pre Post Form related view
class ApplicationRecordView(LoginRequiredMixin, FormView):
    template_name = "tracks/application-record.html"
    form_class = ApplicationRecordForm
    success_url = reverse_lazy("tracks:success")


class ApplicationRecordSuccessView(LoginRequiredMixin, TemplateView):
    template_name = "tracks/success.html"


def edit_application(request, id):
    post = get_object_or_404(ApplicationRecord, id=id)

    if request.method == "GET":
        context = {"form": ApplicationRecordForm(instance=post), "id": id}
        return render(request, "tracks/application-record.html", context)

    if request.method == "POST":
        form = ApplicationRecordForm(request.POST, instance=post)
        if form.is_valid():
            form.applicant = request.user.username
            form.save()
            messages.success(
                request, "The post has been updated successfully."
            )
            return redirect("index")
        else:
            messages.error(request, "Please correct the following errors:")
            return render(
                request, "tracks/application-record.html", {"form": form}
            )


def hardware(request):
    return render(request, "hardware.html")

def display_h1b(request):
    return render(request, "h1b.html")


# -------------------------add-----------------------------------
def add_application(request, *args, **kwargs):
    if not request.user.is_authenticated:
        raise PermissionDenied

    logging.info(request.GET.get('company'))

    if request.method == "POST":
        form = ApplicationRecordForm(request.POST, hide_condition=True)

        if form.is_valid():
            form.applicant = request.user.username
            logging.info(form)
            form.save()
            return redirect("index")

    else:
        form = ApplicationRecordForm(hide_condition=True)
        form.initial["applicant"] = request.user.username
        form.initial["outcome"] = "TO DO"
        if request.GET.get('company'): form.initial["company_name"] = request.GET.get('company')
        return render(request, "add_new.html", {"form": form})


def companies(request):
    companies = Company.objects.all()
    context = {"companies": companies}
    return render(request, "companies.html", context)


def yuanc(request):
    companies = Company.objects.all()
    context = {"companies": companies}
    return render(request, "yuanc.html", context)


class ApplicationRecordViewSet(viewsets.ModelViewSet):
    serializer_class = ApplicationRecordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ApplicationRecord.objects.filter(applicant=self.request.user).order_by('-created')