# H1B Statistics with PostgreSQL Functions

This implementation provides high-performance H1B visa statistics using PostgreSQL functions in Supabase, replacing client-side calculations with optimized database operations.

## 🚀 Features

### PostgreSQL Functions
- **`get_h1b_statistics()`** - Comprehensive statistics with filtering
- **`get_top_h1b_employers()`** - Top employers with pagination
- **`get_h1b_salary_by_job_title()`** - Salary analysis by job title
- **`get_h1b_trends()`** - Time-based trend analysis
- **`get_h1b_statistics_by_state()`** - Geographic statistics

### Performance Optimizations
- **Database Indexes** - Optimized for common query patterns
- **Caching** - Client-side caching with configurable TTL
- **Error Handling** - Retry logic and graceful degradation
- **Validation** - Input validation before database calls

### React Integration
- **Custom Hooks** - Easy-to-use React hooks for statistics
- **Components** - Pre-built UI components
- **Real-time Updates** - Auto-refresh capabilities

## 📊 Available Statistics

### Core Metrics
- Total applications
- Average/median/min/max salaries
- Certification rates
- Top employers
- Status breakdown

### Advanced Analytics
- Trends over time (monthly/quarterly/yearly)
- Geographic distribution by state
- Salary analysis by job title
- Employer performance metrics

## 🛠 Setup Instructions

### 1. Run Database Migration

```bash
# Apply the migration to create functions and indexes
supabase db push
```

Or manually run the SQL file in Supabase SQL Editor:
```sql
-- Copy and paste contents of supabase/migrations/20240125_create_h1b_statistics_functions.sql
```

### 2. Test Functions

Run the test script to verify everything works:
```sql
-- Copy and paste contents of test-h1b-functions.sql in Supabase SQL Editor
```

### 3. Use in React Components

```tsx
import { H1BStatisticsComponent } from './components/h1b/H1BStatistics';
import { useH1BStatistics } from './hooks/useH1BStatistics';

// Basic usage
function MyComponent() {
  return <H1BStatisticsComponent enableCache={true} />;
}

// With filters
function FilteredStats() {
  const filters = {
    employer: 'Google',
    minSalary: 100000,
    status: 'CERTIFIED'
  };
  
  return <H1BStatisticsComponent filters={filters} />;
}

// Using hooks directly
function CustomComponent() {
  const { statistics, loading, error } = useH1BStatistics({
    filters: { employer: 'Microsoft' },
    enableCache: true
  });
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return <div>Total: {statistics?.totalApplications}</div>;
}
```

## 🔧 API Reference

### PostgreSQL Functions

#### `get_h1b_statistics()`
```sql
SELECT get_h1b_statistics(
  p_employer_filter TEXT DEFAULT NULL,
  p_status_filter TEXT DEFAULT NULL,
  p_job_title_filter TEXT DEFAULT NULL,
  p_min_salary NUMERIC DEFAULT NULL,
  p_max_salary NUMERIC DEFAULT NULL,
  p_search_term TEXT DEFAULT NULL
);
```

#### `get_top_h1b_employers()`
```sql
SELECT get_top_h1b_employers(
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0,
  p_search_term TEXT DEFAULT NULL
);
```

#### `get_h1b_trends()`
```sql
SELECT get_h1b_trends(
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL,
  p_group_by TEXT DEFAULT 'month' -- 'month', 'quarter', 'year'
);
```

### React Hooks

#### `useH1BStatistics()`
```tsx
const { statistics, loading, error, refresh } = useH1BStatistics({
  filters?: Partial<H1BFilters>,
  enableCache?: boolean,
  autoRefresh?: boolean,
  refreshInterval?: number
});
```

#### `useTopH1BEmployers()`
```tsx
const { employers, loading, error, totalCount } = useTopH1BEmployers(
  limit?: number,
  searchTerm?: string
);
```

#### `useH1BTrends()`
```tsx
const { trends, loading, error } = useH1BTrends(
  startDate?: Date,
  endDate?: Date,
  groupBy?: 'month' | 'quarter' | 'year'
);
```

### Service Methods

#### `H1BStatisticsService`
```tsx
// Get statistics with filters
const stats = await H1BStatisticsService.getStatistics(filters);

// Get cached statistics (5-minute cache)
const cachedStats = await H1BStatisticsService.getCachedStatistics(filters);

// Get statistics with retry logic
const reliableStats = await H1BStatisticsService.getStatisticsWithRetry(filters, 3);

// Clear cache
H1BStatisticsService.clearCache();
```

## 📈 Performance Benefits

### Before (Client-side calculations)
- ❌ Large data transfers from database
- ❌ Client-side processing overhead
- ❌ Slower response times
- ❌ Limited filtering capabilities

### After (PostgreSQL functions)
- ✅ Minimal data transfer (only results)
- ✅ Database-optimized calculations
- ✅ Fast response times with indexes
- ✅ Advanced filtering and aggregation
- ✅ Caching for repeated queries

## 🔍 Example Queries

### Get basic statistics
```tsx
const { statistics } = useH1BStatistics();
console.log(`Total applications: ${statistics?.totalApplications}`);
```

### Filter by employer and salary
```tsx
const { statistics } = useH1BStatistics({
  filters: {
    employer: 'Google',
    minSalary: 150000,
    maxSalary: 300000
  }
});
```

### Get top 10 employers
```tsx
const { employers } = useTopH1BEmployers(10);
employers.forEach(emp => {
  console.log(`${emp.name}: ${emp.count} applications, $${emp.averageSalary} avg`);
});
```

### Analyze trends
```tsx
const { trends } = useH1BTrends(
  new Date('2023-01-01'),
  new Date('2023-12-31'),
  'quarter'
);
```

## 🛡 Error Handling

The system includes comprehensive error handling:

```tsx
const { statistics, error } = useH1BStatistics({
  filters: { employer: 'InvalidEmployer' }
});

if (error) {
  // Handle error gracefully
  console.error('Statistics error:', error);
}
```

## 🔧 Troubleshooting

### Common Issues

1. **Functions not found**
   - Ensure migration has been applied
   - Check function permissions in Supabase

2. **Slow performance**
   - Verify indexes are created
   - Check query execution plans
   - Consider adding more specific indexes

3. **Cache issues**
   - Clear cache: `H1BStatisticsService.clearCache()`
   - Disable cache temporarily for testing

### Performance Monitoring

```sql
-- Check function performance
EXPLAIN ANALYZE SELECT get_h1b_statistics();

-- Monitor index usage
SELECT * FROM pg_stat_user_indexes WHERE relname = 'h1b_records';
```

## 📝 Data Requirements

Ensure your `h1b_applications` table has these columns:
- `case_number` (string)
- `case_status` (string)
- `employer_name` (string)
- `job_title` (string)
- `wage_rate_of_pay_from` (numeric)
- `wage_rate_of_pay_to` (numeric)
- `received_date` (date)
- `worksite_state` (string)
- `employer_state` (string)

## 🚀 Deployment

1. **Development**: Run migration locally with Supabase CLI
2. **Production**: Apply migration through Supabase dashboard
3. **Testing**: Use provided test script to verify functionality

## 📊 Monitoring

Monitor function performance in Supabase:
1. Go to Database → Functions
2. Check execution times and error rates
3. Monitor index usage in Database → Indexes

This PostgreSQL-based approach provides significant performance improvements and better scalability for H1B statistics analysis.