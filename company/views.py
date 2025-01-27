import json
import logging
import urllib.request
from collections import defaultdict

from django.contrib.auth.models import User
from django.core.paginator import EmptyPage, PageNotAnInteger, Paginator
from django.shortcuts import render, get_object_or_404
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action, api_view

from tracks.models import ApplicationRecord, Company
from .serializers import CompanySerializer

# Create your views here.


def display_grace_hopper(request):
    return render(request, "company/grace-hopper.html")


def display_internships(request):
    context = defaultdict()
    items = list()
    with urllib.request.urlopen(
        "https://raw.githubusercontent.com/SimplifyJobs/Summer2024-Internships/dev/.github/scripts/listings.json"
    ) as url:
        data = json.loads(url.read().decode("utf-8"))
        for item in data:
            try:
                # logging.info(item)
                items.append(item)
            except:
                logging.warning("An exception occurred")
    # context['internships'] = internships
    # Paginate items

    # Get page number from request,
    # default to first page
    default_page = 1
    page = request.GET.get("page", default_page)

    items_per_page = 100
    paginator = Paginator(items, items_per_page)

    try:
        items_page = paginator.page(page)
    except PageNotAnInteger:
        items_page = paginator.page(default_page)
    except EmptyPage:
        items_page = paginator.page(paginator.num_pages)

    # Provide filtered, paginated library items
    context["items_page"] = items_page

    return render(request, "company/internships.html", context)


def display_newgrads(request):
    with urllib.request.urlopen(
        "http://maps.googleapis.com/maps/api/geocode/json?address=google"
    ) as url:
        data = json.load(url)
        logging.info(data)
    return render(request, "company/grace-hopper.html")


@api_view(['GET'])
def api_internships(request):
    """API endpoint for internships data"""
    try:
        with urllib.request.urlopen(
            "https://raw.githubusercontent.com/SimplifyJobs/Summer2024-Internships/dev/.github/scripts/listings.json"
        ) as url:
            data = json.loads(url.read().decode("utf-8"))
            
            # Get page number from request, default to first page
            page = int(request.GET.get("page", 1))
            items_per_page = 100
            
            # Calculate pagination
            total_items = len(data)
            start_idx = (page - 1) * items_per_page
            end_idx = min(start_idx + items_per_page, total_items)
            
            paginated_data = data[start_idx:end_idx]
            
            response_data = {
                "count": total_items,
                "next": f"/api/internships?page={page + 1}" if end_idx < total_items else None,
                "previous": f"/api/internships?page={page - 1}" if page > 1 else None,
                "results": paginated_data
            }
            
            return Response(response_data)
    except Exception as e:
        return Response({"error": str(e)}, status=500)
