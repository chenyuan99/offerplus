# h1b-explorer Specification

## Purpose
The H1B Data Explorer (`/h1b`) lets job seekers browse, filter, sort and export H1B visa
application records stored in the Supabase `h1b_applications` table, and see summary
statistics for the current filter selection.

## Requirements
### Requirement: Paginated application table
The system SHALL display H1B applications in a paginated table with the columns case number,
employer, job title, status, salary and decision date. The default page size SHALL be 50, the
user SHALL be able to choose 25, 50 or 100 rows per page, and the service SHALL clamp any
requested page size to between 1 and 100.

#### Scenario: Initial load
- **WHEN** a user opens `/h1b`
- **THEN** the first 50 applications are shown, newest (highest id) first, with pagination controls and the total result count

#### Scenario: Change page size
- **WHEN** the user selects 100 rows per page
- **THEN** the table reloads showing up to 100 applications per page

#### Scenario: No matching applications
- **WHEN** the current filters match no applications
- **THEN** the table shows a "No applications found" message

### Requirement: Filtering
The system SHALL filter applications by employer, case status, job title, salary range and a
free-text search term. All active filters SHALL be combined with AND logic and evaluated in the
database query.

#### Scenario: Employer and job title filters
- **WHEN** the user sets an employer or job title filter
- **THEN** only applications whose employer name or job title contains the value (case-insensitive) are shown

#### Scenario: Status filter
- **WHEN** the user selects a case status
- **THEN** only applications whose status exactly matches it are shown

#### Scenario: Salary range
- **WHEN** the user sets a minimum and/or maximum salary
- **THEN** an application matches a bound if either `wage_rate_of_pay_from` or `wage_rate_of_pay_to` satisfies that bound

#### Scenario: Text search
- **WHEN** the user enters a search term
- **THEN** only applications whose employer name, job title or case number contains the term (case-insensitive) are shown

#### Scenario: Invalid salary range
- **WHEN** the minimum salary is greater than the maximum, a salary is negative, or the search term exceeds 100 characters
- **THEN** no query is run and an "Invalid filters" error is shown

#### Scenario: Clear filters
- **WHEN** the user clears filters
- **THEN** all filters are removed and the unfiltered result set is shown

### Requirement: Filter dropdown options
The system SHALL populate filter dropdowns with distinct, non-empty values sorted
alphabetically: up to 50 employers, up to 30 job titles, and all case statuses.

#### Scenario: Dropdowns exclude empty values
- **WHEN** the explorer loads dropdown options
- **THEN** null and empty-string values are omitted from every list

### Requirement: Column sorting
The system SHALL sort the table server-side by case number, employer, job title, status,
salary (`wage_rate_of_pay_from`) or decision date.

#### Scenario: Toggle sort direction
- **WHEN** the user clicks a column header
- **THEN** the table sorts ascending by that column, and clicking the same header again sorts descending

### Requirement: Application detail view
The system SHALL show a detail modal for an application when its row is clicked, including
case number, status, employer, job title, salary and wage unit, worksite location, decision,
begin and end dates, full-time flag and SOC code. Missing values SHALL display as "N/A".

#### Scenario: Open and close details
- **WHEN** the user clicks a table row and then closes the modal
- **THEN** the modal shows that application's details and closing it returns to the table unchanged

### Requirement: Shareable filter URLs
The system SHALL keep the active filters in the page URL and restore them on load. It SHALL
accept the query parameters `employer`, `status`, `jobTitle` (or `job_title`), `search`
(or `q`), `minSalary` (or `min_salary`) and `maxSalary` (or `max_salary`).

#### Scenario: Open a shared link
- **WHEN** a user opens `/h1b?employer=Google&minSalary=150000`
- **THEN** the explorer loads with the employer and minimum salary filters applied

#### Scenario: Copy link
- **WHEN** the user clicks "Copy Link"
- **THEN** a URL encoding the current filters is copied to the clipboard

### Requirement: Summary statistics
The system SHALL show summary cards for the current filters: total applications, average
salary, certification rate (share of CERTIFIED and CERTIFIED-WITHDRAWN cases) and the top
employer with its application count. Statistics for a given filter set SHALL be cached in
memory for 5 minutes, and an expired cached value SHALL be used if a refresh fails.

#### Scenario: Statistics follow filters
- **WHEN** the user changes the filters
- **THEN** the summary cards are recalculated for the filtered applications

### Requirement: CSV export
The system SHALL export applications to CSV, either the current page or all applications
matching the current filters (capped at 50,000 rows), using the file names
`h1b_filtered_data_<date>.csv` and `h1b_all_filtered_data_<date>.csv`.

#### Scenario: Export all filtered results
- **WHEN** the user chooses to export all filtered data
- **THEN** a CSV file with every matching application (up to 50,000) is downloaded

### Requirement: Degraded data source handling
When a load error occurs, the system SHALL show a demo/setup message with a retry action if the
error is a timeout or a missing table, or if no records have loaded; otherwise it SHALL show an
error panel with the error text and a retry action.

#### Scenario: Table not available
- **WHEN** loading fails because `h1b_applications` does not exist or the query times out
- **THEN** the explorer shows the demo message instead of an error, with a Retry button
