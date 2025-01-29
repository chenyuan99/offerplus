# Importing Job Applications from Simplify.jobs

This guide explains how to import job application data from a CSV file exported from Simplify.jobs into OfferPlus.

## Step 1: Export CSV from Simplify.jobs
1. Log in to your Simplify.jobs account.
2. Navigate to the section where you can export job applications.
3. Export the data as a CSV file.

## Step 2: Map CSV Columns to Database Fields
Identify how the columns in the CSV file map to the fields in your Django models. Here is an example mapping:

- **CSV Column: `Job Title`** -> **Model Field: `ApplicationRecord.position`**
- **CSV Column: `Company Name`** -> **Model Field: `ApplicationRecord.company`**
- **CSV Column: `Application Date`** -> **Model Field: `ApplicationRecord.applied_date`**
- **CSV Column: `Status`** -> **Model Field: `ApplicationRecord.status`**

## Step 3: Import CSV Data
Create a script to read the CSV file and import the data into your Django models. Use Django's ORM to create or update records in your database.

### Example Script
```python
import csv
from django.utils import timezone
from tracks.models import ApplicationRecord, Company

# Path to the CSV file
csv_file_path = 'path/to/your/simplify_jobs_export.csv'

with open(csv_file_path, newline='') as csvfile:
    reader = csv.DictReader(csvfile)
    for row in reader:
        # Get or create the company
        company, _ = Company.objects.get_or_create(name=row['Company Name'])

        # Create or update the application record
        ApplicationRecord.objects.update_or_create(
            position=row['Job Title'],
            company=company,
            defaults={
                'applied_date': timezone.datetime.strptime(row['Application Date'], '%Y-%m-%d'),
                'status': row['Status'],
                'source': 'Simplify.jobs'
            }
        )
```

## Step 4: Run the Import Script
1. Place the CSV file in a location accessible by your Django project.
2. Run the script to import the data into your database.

## Additional Notes
- Ensure that the date format in the CSV matches the format expected by the script.
- Modify the script as needed to accommodate any additional fields or custom logic specific to your application.
