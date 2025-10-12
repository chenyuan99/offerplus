# Design Document

## Overview

The H1B Data Viewer is a client-side HTML application that displays H1B visa application data in an interactive, user-friendly format. The application will be built as a single HTML file with embedded CSS and JavaScript, making it easy to deploy and share. It will load data from the sample.json file and provide comprehensive filtering, sorting, and viewing capabilities.

## Architecture

### Client-Side Architecture
- **Single Page Application**: Self-contained HTML file with embedded CSS and JavaScript
- **Data Loading**: Fetch API to load JSON data from the sample.json file
- **State Management**: Vanilla JavaScript with object-based state management
- **Rendering**: DOM manipulation for dynamic content updates
- **Responsive Design**: CSS Grid and Flexbox for mobile-friendly layout

### Data Flow
1. Page loads → Fetch H1B data from JSON file
2. Data processing → Parse and structure data for display
3. Initial render → Display table with pagination and summary stats
4. User interactions → Update filters/search → Re-render filtered data
5. Detail view → Modal display with complete record information

## Components and Interfaces

### Core Components

#### 1. DataManager
```javascript
class DataManager {
  constructor(rawData)
  filterData(filters)
  sortData(column, direction)
  searchData(searchTerm)
  getStatistics(data)
  getPaginatedData(data, page, pageSize)
}
```

#### 2. TableRenderer
```javascript
class TableRenderer {
  renderTable(data, currentPage, totalPages)
  renderTableHeader(sortColumn, sortDirection)
  renderTableRows(data)
  renderPagination(currentPage, totalPages)
}
```

#### 3. FilterManager
```javascript
class FilterManager {
  initializeFilters(data)
  renderFilterControls()
  applyFilters()
  clearFilters()
  getUniqueValues(data, field)
}
```

#### 4. ModalManager
```javascript
class ModalManager {
  showDetailModal(record)
  hideModal()
  renderDetailContent(record)
  formatFieldValue(field, value)
}
```

#### 5. StatisticsRenderer
```javascript
class StatisticsRenderer {
  renderSummaryCards(stats)
  calculateSalaryStats(data)
  getTopEmployers(data)
  formatCurrency(amount)
}
```

### Data Models

#### H1BRecord Interface
```javascript
{
  CASE_NUMBER: string,
  CASE_STATUS: string,
  RECEIVED_DATE: string,
  DECISION_DATE: string,
  VISA_CLASS: string,
  JOB_TITLE: string,
  SOC_CODE: string,
  SOC_TITLE: string,
  FULL_TIME_POSITION: string,
  BEGIN_DATE: string,
  END_DATE: string,
  EMPLOYER_NAME: string,
  EMPLOYER_CITY: string,
  EMPLOYER_STATE: string,
  WAGE_RATE_OF_PAY_FROM: number,
  WAGE_UNIT_OF_PAY: string,
  PREVAILING_WAGE: number,
  WORKSITE_CITY: string,
  WORKSITE_STATE: string,
  // ... additional fields
}
```

#### FilterState Interface
```javascript
{
  employer: string,
  status: string,
  jobTitle: string,
  minSalary: number,
  maxSalary: number,
  searchTerm: string
}
```

#### AppState Interface
```javascript
{
  rawData: H1BRecord[],
  filteredData: H1BRecord[],
  currentPage: number,
  pageSize: number,
  sortColumn: string,
  sortDirection: 'asc' | 'desc',
  filters: FilterState,
  isLoading: boolean
}
```

## User Interface Design

### Layout Structure
```
┌─────────────────────────────────────────────────────────┐
│                    Header & Title                       │
├─────────────────────────────────────────────────────────┤
│              Summary Statistics Cards                   │
├─────────────────────────────────────────────────────────┤
│  Search Bar  │  Filters  │  Clear  │  Export (Future)  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│                  Data Table                             │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                   Pagination                            │
└─────────────────────────────────────────────────────────┘
```

### Key UI Elements

#### Summary Cards
- Total Applications count
- Average Salary with currency formatting
- Top Employer name and count
- Certification Rate percentage

#### Filter Controls
- Employer dropdown (top 20 employers + "Other")
- Case Status dropdown (Certified, Withdrawn, Denied)
- Job Title search/dropdown (top job titles)
- Salary range slider with min/max inputs
- Global search input

#### Data Table Columns (Primary View)
1. Case Number (clickable for details)
2. Employer Name
3. Job Title
4. Case Status (with color coding)
5. Salary (formatted as currency)
6. Location (City, State)
7. Decision Date

#### Responsive Breakpoints
- Desktop: Full table with all columns
- Tablet: Hide less important columns, stack some data
- Mobile: Card-based layout instead of table

## Data Processing Strategy

### Data Transformation
1. **Date Parsing**: Convert ISO date strings to Date objects
2. **Salary Normalization**: Handle different pay units (Year, Hour, etc.)
3. **Location Standardization**: Combine city/state for display
4. **Status Categorization**: Group similar statuses for filtering

### Performance Optimizations
1. **Virtual Scrolling**: For large datasets (future enhancement)
2. **Debounced Search**: Prevent excessive filtering on keystroke
3. **Memoized Calculations**: Cache expensive operations like statistics
4. **Lazy Loading**: Load data in chunks if file becomes large

## Styling and Visual Design

### Color Scheme
- Primary: #2563eb (Blue for headers and actions)
- Success: #16a34a (Green for certified status)
- Warning: #d97706 (Orange for pending status)
- Error: #dc2626 (Red for denied/withdrawn status)
- Neutral: #6b7280 (Gray for secondary text)

### Typography
- Headers: System font stack with fallback to sans-serif
- Body: 14px base font size with 1.5 line height
- Monospace: For case numbers and codes

### Interactive Elements
- Hover effects on table rows
- Loading spinners for data operations
- Smooth transitions for modal open/close
- Visual feedback for sort direction

## Error Handling

### Data Loading Errors
- Network failure: Display retry button with error message
- Invalid JSON: Show data format error with contact information
- Empty dataset: Display appropriate empty state message

### User Input Validation
- Salary range: Ensure min ≤ max values
- Search terms: Handle special characters safely
- Filter combinations: Prevent impossible filter states

### Graceful Degradation
- JavaScript disabled: Show static table with basic data
- Slow connections: Progressive loading with skeleton screens
- Old browsers: Provide basic functionality without advanced features

## Testing Strategy

### Unit Testing Areas
- Data filtering and sorting logic
- Salary calculation and formatting
- Date parsing and display
- Search functionality

### Integration Testing
- Filter combinations working correctly
- Pagination with filtered data
- Modal display with complete data
- Responsive layout on different screen sizes

### User Acceptance Testing
- Search finds relevant results
- Filters work as expected
- Table sorting maintains filter state
- Detail modal shows complete information
- Mobile experience is usable

## Future Enhancements

### Phase 2 Features
- Data export to CSV/Excel
- Advanced analytics and charts
- Comparison tools between employers
- Historical trend analysis

### Performance Improvements
- Server-side filtering for large datasets
- Caching strategies for repeated queries
- Progressive web app capabilities

### Accessibility Improvements
- Screen reader optimization
- Keyboard navigation support
- High contrast mode
- Focus management for modals