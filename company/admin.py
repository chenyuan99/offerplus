from django.contrib import admin
from .models import Company, Job

# Register your models here.

@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ('name', 'location', 'website', 'created_at', 'updated_at')
    search_fields = ('name', 'location')
    list_filter = ('created_at', 'updated_at')
    ordering = ('-created_at',)

@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    list_display = ('title', 'company', 'location', 'employment_type', 'status', 'deadline')
    list_filter = ('status', 'employment_type', 'company', 'created_at')
    search_fields = ('title', 'description', 'requirements', 'location')
    filter_horizontal = ('applicants',)
    ordering = ('-created_at',)
