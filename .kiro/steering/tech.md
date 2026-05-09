# Technology Stack

## Architecture

- **Frontend**: React + TypeScript with Vite
- **Backend**: Supabase (Backend-as-a-Service)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **AI/ML**: OpenAI GPT models
- **Deployment**: Vercel (frontend), Supabase (backend)

## Frontend Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + PostCSS
- **Routing**: React Router DOM
- **State Management**: React Context + hooks
- **UI Components**: Lucide React icons, React Icons
- **Testing**: Vitest + React Testing Library
- **E2E Testing**: Cypress
- **Analytics**: Vercel Analytics & Speed Insights

## Backend Stack

- **Backend-as-a-Service**: Supabase
- **Database**: PostgreSQL via Supabase
- **Authentication**: Supabase Auth with JWT tokens
- **AI Integration**: OpenAI API (client-side)
- **File Storage**: Supabase Storage
- **Real-time**: Supabase Realtime
- **Edge Functions**: Supabase Edge Functions (when needed)

## Database & Storage

- **Primary Database**: Supabase (PostgreSQL)
- **File Storage**: Supabase Storage buckets
- **Local Development**: Supabase local development stack
- **Migrations**: Supabase migrations system

## Development Tools

- **Package Management**: npm (frontend)
- **Code Quality**: ESLint, Prettier, TypeScript
- **Version Control**: Git with GitHub Actions CI/CD
- **Local Development**: Supabase CLI
- **IDE Support**: VS Code extensions configuration

## Common Commands

### Frontend Development

```bash
cd frontend
npm install          # Install dependencies
npm run dev         # Start development server
npm run build       # Build for production
npm run test        # Run tests
npm run test:coverage # Run tests with coverage
npm run lint        # Run linter
npm run format      # Format code
npm run preview     # Preview production build
npm run cypress     # Open Cypress E2E tests
npm run cypress:headless # Run Cypress tests headlessly
```

### Python Scripts (Optional)

```bash
pip install -r requirements.txt  # Install Python dependencies (for scripts only)
python test_supabase_storage.py  # Test Supabase storage connection
```

### Database Management

```bash
supabase start      # Start local Supabase
supabase stop       # Stop local Supabase
supabase db reset   # Reset local database
supabase db diff    # Generate migration from schema changes
supabase db push    # Apply local migrations to remote
```

### Docker Development (Optional)

```bash
docker-compose up --build    # Build and start frontend development
docker-compose down          # Stop all services
docker build -t offersplus . # Build production frontend image
```

### Data Management

```bash
npm run upload-applications     # Upload application data
tsx scripts/uploadApplications.ts  # TypeScript data upload script
tsx scripts/checkTable.ts      # Check table structure
tsx scripts/listTables.ts      # List all tables
```