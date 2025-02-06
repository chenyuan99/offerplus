from django.db import models
from django.contrib.postgres.fields import ArrayField

# Create your models here.

class JobPosting(models.Model):
    id = models.UUIDField(primary_key=True)
    company_name = models.CharField(max_length=200)
    locations = ArrayField(models.CharField(max_length=200))
    title = models.CharField(max_length=200)
    date_posted = models.BigIntegerField()  # Unix timestamp
    terms = ArrayField(models.CharField(max_length=100))
    active = models.BooleanField(default=True)
    url = models.URLField(max_length=500)
    is_visible = models.BooleanField(default=True)
    source = models.CharField(max_length=100)
    company_url = models.URLField(max_length=500, blank=True)
    date_updated = models.BigIntegerField()  # Unix timestamp
    sponsorship = models.CharField(max_length=100)

    class Meta:
        indexes = [
            models.Index(fields=['company_name']),
            models.Index(fields=['date_posted']),
            models.Index(fields=['active']),
            models.Index(fields=['is_visible'])
        ]
        ordering = ['-date_posted']

    def __str__(self):
        return f"{self.title} at {self.company_name}"
