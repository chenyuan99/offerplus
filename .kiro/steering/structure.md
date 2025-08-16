# Project Structure

## Root Directory Organization

```text
offer-plus/
├── frontend/           # React TypeScript frontend application
├── backend/           # Legacy backend configuration files
├── supabase/          # Supabase configuration and migrations
├── scripts/           # Data management and utility scripts
├── docs/              # Project documentation
├── licenses/          # Third-party license files
├── poc/               # Proof of concept notebooks
├── .kiro/             # Kiro AI assistant configuration
├── .github/           # GitHub workflows and templates
├── .vscode/           # VS Code configuration
├── docker-compose.yml # Frontend development Docker setup
├── Dockerfile         # Frontend production container build
├── requirements.txt   # Python dependencies (for scripts only)
├── package.json       # Root-level Node.js scripts
├── CONTRIBUTING.md    # Contribution guidelines
├── SECURITY.md        # Security policy
└── test_supabase_storage.py # Supabase storage test
```

## Frontend Structure (`frontend/`)

```text
frontend/
├── src/
│   ├── app/           # App router structure (Next.js style)
│   │   ├── (auth)/    # Auth route group
│   │   └── (dashboard)/ # Dashboard route group
│   ├── components/    # Reusable React components
│   │   ├── auth/      # Authentication-related components
│   │   ├── dashboard/ # Dashboard-specific components
│   │   ├── landing/   # Landing page components
│   │   └── providers/ # Context providers
│   ├── pages/         # Route-level page components
│   │   └── auth/      # Authentication pages
│   ├── services/      # API service layers
│   ├── hooks/         # Custom React hooks
│   ├── contexts/      # React context providers
│   ├── lib/           # Utility libraries and configurations
│   ├── types/         # TypeScript type definitions
│   ├── utils/         # Helper functions
│   └── test/          # Test files and utilities
├── public/            # Static assets
├── scripts/           # Build and data scripts
├── cypress/           # E2E test specifications
└── vercel.json        # Vercel deployment configuration
```

## Backend Structure

```text
backend/
├── nginx.conf         # Nginx configuration (legacy)
└── schema.json        # API schema definition (legacy)

supabase/
├── config.toml        # Supabase configuration
├── migrations/        # Database migrations
└── .temp/             # Temporary files

scripts/
├── uploadApplications.ts  # Data upload utilities
├── checkTable.ts         # Table structure checker
└── listTables.ts         # Table listing utility
```

## Key Configuration Files

### Frontend Configuration

- `vite.config.ts` - Vite build configuration
- `tailwind.config.js` - Tailwind CSS configuration
- `postcss.config.js` - PostCSS configuration
- `tsconfig.json` - TypeScript configuration
- `package.json` - Dependencies and scripts
- `cypress.config.ts` - E2E testing configuration
- `vercel.json` - Vercel deployment configuration

### Backend Configuration

- `requirements.txt` - Python dependencies (for scripts only)
- `docker-compose.yml` - Frontend development setup
- `Dockerfile` - Frontend production container build

### Database Configuration

- `supabase/config.toml` - Supabase local development settings
- `supabase/migrations/` - Database schema migrations

## Development Workflow

### File Organization Conventions

- **Components**: Organized by feature/domain in subdirectories
- **Pages**: Mirror the routing structure
- **Services**: API integration layers, one per external service
- **Types**: Shared TypeScript interfaces and types
- **Utils**: Pure functions and helper utilities
- **App Directory**: Next.js-style app router structure for organization

### Import Conventions

- Use relative imports for local files
- Use absolute imports from `src/` for cross-domain imports
- Group imports: external libraries, internal modules, relative imports

### Naming Conventions

- **Files**: PascalCase for components, camelCase for utilities
- **Directories**: lowercase with hyphens for multi-word names
- **Components**: PascalCase matching filename
- **Functions**: camelCase
- **Constants**: UPPER_SNAKE_CASE

### Key Features Structure

- **JobGPT**: AI-powered job assistance (`pages/JobGPT.tsx`, `services/jobgptService.ts`)
- **Authentication**: Supabase auth integration (`components/auth/`, `services/auth.ts`)
- **Dashboard**: Main application interface (`pages/Dashboard.tsx`, `components/dashboard/`)
- **Company Management**: Company research tools (`pages/Companies.tsx`, `pages/CompanyDetail.tsx`)
- **Application Tracking**: Job application management (`pages/AddApplication.tsx`, `pages/EditApplication.tsx`)

## Data Flow Architecture

1. **Frontend** → API calls via services layer
2. **Services** → Supabase client for database operations
3. **Database** → Supabase PostgreSQL database
4. **Authentication** → Supabase Auth with JWT tokens
5. **File Storage** → Supabase Storage buckets
6. **AI Integration** → Direct OpenAI API calls from frontend