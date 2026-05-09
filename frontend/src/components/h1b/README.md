# H1B Data Viewer React Components

This directory contains React components for the H1B Data Viewer, which provides an interactive interface for exploring H1B visa application data from Supabase.

## Components

### `H1BViewer`
Main container component that orchestrates all H1B data functionality.

**Features:**
- Data loading from Supabase
- Error handling and loading states
- Pagination management
- Filter and sort coordination

### `H1BFilters`
Filter controls component with debounced search and dropdown filters.

**Features:**
- Search across multiple fields (debounced)
- Employer dropdown filter
- Case status dropdown filter
- Job title dropdown filter
- Salary range filters (min/max)
- Clear all filters functionality

### `H1BStatistics`
Statistics dashboard showing key metrics and insights.

**Features:**
- Total applications count
- Average salary calculation
- Certification rate percentage
- Top employer display
- Loading state animations

### `H1BTable`
Data table with sorting, pagination, and detailed record view.

**Features:**
- Sortable columns with visual indicators
- Pagination controls
- Row click for detailed modal view
- Responsive design
- Status badges with color coding
- Currency and date formatting

## Custom Hook

### `useH1BData`
Custom React hook that manages all H1B data operations.

**Features:**
- Supabase data fetching
- Client-side filtering and sorting
- Statistics calculations
- Pagination logic
- Error handling
- Loading states

## Types

### `H1BRecord`
TypeScript interface for H1B application records.

### `H1BFilters`
Filter state interface.

### `H1BStatistics`
Statistics data interface.

### `PaginatedData<T>`
Generic pagination wrapper interface.

## Usage

```tsx
import { H1BViewer } from '../components/h1b/H1BViewer';

function MyPage() {
  return <H1BViewer />;
}
```

## Data Source

The components fetch data from a Supabase table called `h1b_applications` with the following key fields:

- `case_number` - Unique case identifier
- `employer_name` - Company name
- `job_title` - Position title
- `case_status` - Application status
- `wage_rate_of_pay_from` - Salary amount
- `worksite_city` - Work location city
- `worksite_state` - Work location state
- `decision_date` - Date of decision

## Performance Considerations

- Data is loaded once on component mount
- Filtering and sorting are performed client-side
- Pagination reduces DOM rendering load
- Search input is debounced (300ms)
- Unique values for dropdowns are cached

## Styling

Components use Tailwind CSS classes for styling and are designed to be responsive across all device sizes.

## Error Handling

- Network errors are caught and displayed to users
- Loading states provide visual feedback
- Retry functionality for failed requests
- Graceful handling of missing or invalid data