# Requirements Document

## Introduction

This feature adds Supabase database functions to support the H1BFilters component, enabling efficient filtering and dropdown population for H1B visa application data. The functions will provide unique values for filter dropdowns and support complex filtering operations directly at the database level for optimal performance.

## Requirements

### Requirement 1

**User Story:** As a user viewing H1B statistics, I want to filter applications by employer, so that I can see data specific to companies I'm interested in.

#### Acceptance Criteria

1. WHEN the H1BFilters component loads THEN the system SHALL provide a list of unique employer names
2. WHEN a user selects an employer filter THEN the system SHALL return only applications from that employer
3. IF no employer is selected THEN the system SHALL return applications from all employers
4. WHEN retrieving unique employers THEN the system SHALL limit results to the top 50 most frequent employers for performance

### Requirement 2

**User Story:** As a user analyzing H1B data, I want to filter by case status, so that I can focus on approved, denied, or pending applications.

#### Acceptance Criteria

1. WHEN the H1BFilters component loads THEN the system SHALL provide a list of all unique case statuses
2. WHEN a user selects a status filter THEN the system SHALL return only applications with that status
3. WHEN no status is selected THEN the system SHALL return applications with any status
4. WHEN retrieving case statuses THEN the system SHALL exclude null or empty values

### Requirement 3

**User Story:** As a user researching job opportunities, I want to filter by job title, so that I can see H1B data for specific roles.

#### Acceptance Criteria

1. WHEN the H1BFilters component loads THEN the system SHALL provide a list of unique job titles
2. WHEN a user selects a job title filter THEN the system SHALL return only applications for that job title
3. WHEN no job title is selected THEN the system SHALL return applications for all job titles
4. WHEN retrieving job titles THEN the system SHALL limit results to the top 30 most frequent titles for performance

### Requirement 4

**User Story:** As a user analyzing salary data, I want to filter by salary range, so that I can see applications within my target compensation range.

#### Acceptance Criteria

1. WHEN a user sets a minimum salary THEN the system SHALL return only applications with salaries at or above that amount
2. WHEN a user sets a maximum salary THEN the system SHALL return only applications with salaries at or below that amount
3. WHEN both min and max salary are set THEN the system SHALL return applications within that salary range
4. WHEN salary filters are applied THEN the system SHALL use the higher of wage_rate_of_pay_from or wage_rate_of_pay_to for comparison

### Requirement 5

**User Story:** As a user searching H1B data, I want to perform text searches across multiple fields, so that I can quickly find relevant applications.

#### Acceptance Criteria

1. WHEN a user enters a search term THEN the system SHALL search across employer name, job title, and case number fields
2. WHEN performing text search THEN the system SHALL use case-insensitive matching
3. WHEN performing text search THEN the system SHALL support partial matches using ILIKE
4. WHEN no search term is provided THEN the system SHALL return all applications matching other filters

### Requirement 6

**User Story:** As a developer integrating the filter functions, I want efficient database functions, so that the UI remains responsive with large datasets.

#### Acceptance Criteria

1. WHEN retrieving unique values THEN the system SHALL use database indexes for optimal performance
2. WHEN applying multiple filters THEN the system SHALL combine all conditions in a single query
3. WHEN functions are called THEN the system SHALL return results in under 2 seconds for datasets up to 1 million records
4. WHEN functions are created THEN the system SHALL include proper error handling and security measures

### Requirement 7

**User Story:** As a system administrator, I want secure database functions, so that H1B data access is properly controlled.

#### Acceptance Criteria

1. WHEN database functions are created THEN the system SHALL use SECURITY DEFINER for controlled access
2. WHEN functions are executed THEN the system SHALL only allow access to authenticated users
3. WHEN functions handle user input THEN the system SHALL prevent SQL injection attacks
4. WHEN functions encounter errors THEN the system SHALL return appropriate error messages without exposing internal details