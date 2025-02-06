from django.contrib import admin
from django.utils import timezone
from .models import JobPosting

# Register your models here.

@admin.register(JobPosting)
class JobPostingAdmin(admin.ModelAdmin):
    list_display = ('title', 'company_name', 'formatted_date_posted', 'active', 'is_visible', 'sponsorship')
    list_filter = ('active', 'is_visible', 'source', 'sponsorship')
    search_fields = ('title', 'company_name', 'locations')
    readonly_fields = ('id', 'formatted_date_posted', 'formatted_date_updated')
    ordering = ('-date_posted',)

    def formatted_date_posted(self, obj):
        return timezone.datetime.fromtimestamp(obj.date_posted).strftime('%Y-%m-%d %H:%M:%S')
    formatted_date_posted.short_description = 'Date Posted'
    formatted_date_posted.admin_order_field = 'date_posted'

    def formatted_date_updated(self, obj):
        return timezone.datetime.fromtimestamp(obj.date_updated).strftime('%Y-%m-%d %H:%M:%S')
    formatted_date_updated.short_description = 'Last Updated'
    formatted_date_updated.admin_order_field = 'date_updated'

    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'title', 'company_name', 'company_url')
        }),
        ('Job Details', {
            'fields': ('locations', 'terms', 'sponsorship')
        }),
        ('Status', {
            'fields': ('active', 'is_visible', 'source')
        }),
        ('URLs', {
            'fields': ('url',)
        }),
        ('Timestamps', {
            'fields': ('formatted_date_posted', 'formatted_date_updated'),
        })
    )
