# H1B Data Upload to Supabase

This directory contains scripts to process H1B visa application data and upload it to your Supabase database for use with the H1B Data Viewer.

## Overview

The process involves:
1. **Parsing** - Convert Excel H1B data to JSON format
2. **Uploading** - Create database table and upload data to Supabase
3. **Configuring** - Set up the viewer to connect to your Supabase database

## Prerequisites

- Python 3.7 or higher
- Supabase account and project
- H1B data file (Excel format)

## Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Environment Configuration

Create a `.env` file in your project root with your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
VITE_SUPABASE_ANON_KEY=your_anon_key
```

You can find these values in your Supabase project dashboard under Settings > API.

### 3. Prepare Data

Place your H1B data Excel file in the `data/raw/` directory and update the filename in `parser.py`:

```python
filename = "LCA_Disclosure_Data_FY2025_Q3"  # Update this to your file name
```

## Usage

### Option 1: Automated Setup (Recommended)

Run the automated setup script:

```bash
python setup_and_upload.py
```

This script will:
- Install dependencies
- Check for required files
- Parse the data
- Upload to Supabase
- Configure the viewer

### Option 2: Manual Steps

#### Step 1: Parse Data

```bash
python parser.py
```

This converts the Excel file to JSON format in `data/output/`.

#### Step 2: Upload to Supabase

```bash
python upload_to_supabase.py
```

This script will:
- Create the `h1b_applications` table in your Supabase database
- Upload all H1B records
- Create necessary indexes for performance
- Set up Row Level Security (RLS) policies

#### Step 3: Configure Viewer

```bash
python configure_viewer.py
```

This updates the H1B Data Viewer HTML file with your Supabase credentials.

## Database Schema

The script creates a table called `h1b_applications` with the following key fields:

- `case_number` - Unique case identifier
- `employer_name` - Company name
- `job_title` - Position title
- `case_status` - Application status (Certified, Denied, etc.)
- `wage_rate_of_pay_from` - Salary amount
- `worksite_city` - Work location city
- `worksite_state` - Work location state
- `decision_date` - Date of decision
- And many more fields from the H1B data

## Features

### Data Processing
- Handles large datasets efficiently with batch uploads
- Validates data integrity
- Handles duplicate records gracefully
- Converts data types appropriately

### Performance Optimization
- Creates database indexes on commonly queried fields
- Implements batch processing for large datasets
- Optimizes for filtering and sorting operations

### Security
- Uses Row Level Security (RLS) for data protection
- Supports both service role and anonymous key authentication
- Provides public read access while protecting write operations

## Troubleshooting

### Common Issues

1. **Missing Environment Variables**
   - Ensure your `.env` file is in the project root
   - Check that all required variables are set

2. **Permission Errors**
   - Make sure you're using the service role key for uploads
   - Check your Supabase project permissions

3. **Data File Not Found**
   - Verify the Excel file is in `data/raw/`
   - Update the filename in `parser.py`

4. **Upload Failures**
   - Check your internet connection
   - Verify Supabase project is active
   - Review error messages for specific issues

### Verification

After upload, you can verify the data in several ways:

1. **Supabase Dashboard**
   - Go to your project dashboard
   - Navigate to Table Editor
   - Check the `h1b_applications` table

2. **Script Verification**
   - The upload script automatically runs verification
   - Check the console output for statistics

3. **H1B Data Viewer**
   - Open the configured HTML file in your browser
   - Data should load from Supabase automatically

## File Structure

```
h1b/
├── data/
│   ├── raw/                    # Place Excel files here
│   ├── output/                 # Generated JSON files
│   └── company.json           # Company name mappings
├── parser.py                  # Excel to JSON converter
├── upload_to_supabase.py      # Database upload script
├── configure_viewer.py        # Viewer configuration
├── setup_and_upload.py       # Automated setup
├── requirements.txt           # Python dependencies
└── README.md                  # This file
```

## Data Sources

This tool is designed to work with H1B LCA (Labor Condition Application) disclosure data from the U.S. Department of Labor, available at:
https://www.dol.gov/agencies/eta/foreign-labor/performance

## Support

If you encounter issues:

1. Check the console output for detailed error messages
2. Verify your Supabase configuration
3. Ensure all dependencies are installed
4. Check that your data file is in the correct format

## Next Steps

After successful upload:

1. Open `h1b-data-viewer.html` in your browser
2. The viewer will automatically load data from Supabase
3. Use the filtering and search features to explore the data
4. Share the viewer with others (they'll need the same Supabase access)

## Security Notes

- The service role key has full database access - keep it secure
- The anonymous key is used for read-only access in the viewer
- RLS policies ensure data security while allowing public read access
- Consider implementing additional security measures for production use