# Design Document

## Overview

This design implements Supabase PostgreSQL functions to support the H1BFilters component with efficient filtering and dropdown population capabilities. The solution provides dedicated functions for retrieving unique values and applying complex filters directly at the database level, ensuring optimal performance and security.

## Architecture

### Database Layer
- **PostgreSQL Functions**: Server-side functions for data retrieval and filtering
- **Indexes**: Optimized indexes for filter columns (employer_name, case_status, job_title, salary fields)
- **Security**: SECURITY DEFINER functions with authenticated user access control

### Function Categories
1. **Unique Value Functions**: Retrieve distinct values for dropdown population
2. **Filter Functions**: Apply complex filtering with multiple criteria
3. **Utility Functions**: Helper functions for data validation and formatting

### Performance Strategy
- Use database indexes for fast lookups
- Limit result sets for dropdown functions (top N most frequent values)
- Combine multiple filters in single queries to minimize round trips
- Cache-friendly function design for repeated calls

## Components and Interfaces

### Core Functions

#### 1. get_h1b_unique_employers(limit_count INTEGER)
```sql
RETURNS JSON
```
- **Purpose**: Retrieve unique employer names for dropdown
- **Parameters**: 
  - `limit_count`: Maximum number of employers to return (default: 50)
- **Returns**: JSON array of employer names ordered by frequency
- **Performance**: Uses employer_name index, limits to top N employers

#### 2. get_h1b_unique_statuses()
```sql
RETURNS JSON
```
- **Purpose**: Retrieve all unique case statuses for dropdown
- **Returns**: JSON array of case status values
- **Performance**: Uses case_status index, excludes null/empty values

#### 3. get_h1b_unique_job_titles(limit_count INTEGER)
```sql
RETURNS JSON
```
- **Purpose**: Retrieve unique job titles for dropdown
- **Parameters**:
  - `limit_count`: Maximum number of job titles to return (default: 30)
- **Returns**: JSON array of job titles ordered by frequency
- **Performance**: Uses job_title index, limits to top N titles

#### 4. get_h1b_filtered_applications(filters JSON, page_size INTEGER, page_number INTEGER)
```sql
RETURNS JSON
```
- **Purpose**: Apply complex filtering with pagination
- **Parameters**:
  - `filters`: JSON object containing filter criteria
  - `page_size`: Number of records per page (default: 20)
  - `page_number`: Page number (1-based, default: 1)
- **Returns**: JSON object with filtered data and pagination metadata
- **Filter Support**:
  - `employer`: Partial match on employer_name
  - `status`: Exact match on case_status
  - `jobTitle`: Partial match on job_title
  - `minSalary`: Minimum salary filter
  - `maxSalary`: Maximum salary filter
  - `searchTerm`: Text search across multiple fields

### Filter JSON Structure
```json
{
  "employer": "string|null",
  "status": "string|null", 
  "jobTitle": "string|null",
  "minSalary": "number|null",
  "maxSalary": "number|null",
  "searchTerm": "string|null"
}
```

### Response JSON Structure
```json
{
  "data": [
    {
      "id": "number",
      "case_number": "string",
      "case_status": "string",
      "job_title": "string",
      "employer_name": "string",
      "wage_rate_of_pay_from": "number",
      "wage_rate_of_pay_to": "number",
      "received_date": "string",
      "decision_date": "string"
    }
  ],
  "pagination": {
    "totalRecords": "number",
    "totalPages": "number", 
    "currentPage": "number",
    "pageSize": "number",
    "hasNextPage": "boolean",
    "hasPreviousPage": "boolean"
  }
}
```

## Data Models

### H1B Applications Table Schema
The functions will operate on the existing `h1b_applications` table with these key columns:
- `id`: Primary key
- `case_number`: Unique case identifier
- `case_status`: Application status (CERTIFIED, DENIED, etc.)
- `job_title`: Position title
- `employer_name`: Company name
- `wage_rate_of_pay_from`: Minimum salary
- `wage_rate_of_pay_to`: Maximum salary
- `received_date`: Application received date
- `decision_date`: Decision date

### Index Strategy
```sql
-- Existing indexes (from previous implementation)
idx_h1b_applications_employer_name
idx_h1b_applications_case_status
idx_h1b_applications_salary

-- New indexes for filtering
idx_h1b_applications_job_title
idx_h1b_applications_composite_search (employer_name, job_title, case_number)
idx_h1b_applications_salary_range (wage_rate_of_pay_from, wage_rate_of_pay_to)
```

## Error Handling

### Input Validation
- Validate JSON filter parameters
- Sanitize string inputs to prevent SQL injection
- Validate numeric ranges (salary, pagination parameters)
- Handle null/empty filter values gracefully

### Error Response Format
```json
{
  "error": true,
  "message": "User-friendly error message",
  "code": "ERROR_CODE",
  "details": "Additional error context (development only)"
}
```

### Common Error Scenarios
1. **Invalid JSON**: Malformed filter JSON parameters
2. **Invalid Pagination**: Negative page numbers or invalid page sizes
3. **Invalid Salary Range**: Min salary greater than max salary
4. **Database Errors**: Connection issues, table access problems

## Testing Strategy

### Unit Testing
- Test each function with various input combinations
- Validate JSON response structure and data types
- Test edge cases (empty results, null inputs, boundary values)
- Performance testing with large datasets

### Integration Testing
- Test function integration with H1BFilters component
- Validate dropdown population with real data
- Test complex filter combinations
- Verify pagination functionality

### Performance Testing
- Benchmark function execution times with various dataset sizes
- Test concurrent access scenarios
- Validate index effectiveness
- Monitor memory usage for large result sets

### Test Data Scenarios
1. **Empty Database**: Functions should handle empty tables gracefully
2. **Large Dataset**: Test with 100K+ records for performance validation
3. **Diverse Data**: Test with various employer names, job titles, and statuses
4. **Edge Cases**: Null values, empty strings, extreme salary ranges

## Security Considerations

### Access Control
- Functions use SECURITY DEFINER for controlled execution
- Grant EXECUTE permissions only to authenticated users
- No direct table access required for frontend

### Input Sanitization
- All string inputs are properly escaped
- JSON parameters are validated before processing
- Numeric inputs are type-checked and range-validated

### Data Privacy
- Functions only return necessary data fields
- No sensitive information exposed in error messages
- Audit logging for function usage (if required)

## Performance Optimization

### Query Optimization
- Use appropriate indexes for all filter conditions
- Combine multiple filters in single WHERE clauses
- Limit result sets at database level, not application level
- Use EXPLAIN ANALYZE for query plan validation

### Caching Strategy
- Functions designed to be cache-friendly
- Unique value functions suitable for client-side caching
- Consistent result ordering for predictable caching

### Scalability Considerations
- Functions designed to handle millions of records
- Pagination prevents memory issues with large result sets
- Index maintenance strategy for growing datasets