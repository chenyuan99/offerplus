# Claude Code Developer Guide

This document provides guidance for developers using Claude Code with the OfferPlus project.

## Project Overview

OfferPlus is an AI-powered job offer seeker built with:
- **Frontend**: React application
- **Backend**: Python services
- **Database**: Supabase (PostgreSQL + Storage)
- **Auth**: Supabase Auth

## Directory Structure

Key directories for development:

- **frontend/**: React TypeScript application
- **backend/**: Python backend services
- **supabase/**: Database configuration, migrations, and utility scripts
- **h1b/**: H1B visa data processing
- **scripts/**: General utility scripts

## Development Workflow

### Setup

1. Clone the repository
2. Create a `.env` file based on `.env.example` with Supabase credentials
3. Set up frontend: `cd frontend && npm install`
4. Set up backend dependencies as needed

### Supabase Scripts

Utility scripts are located in `supabase/scripts/`:

- **test_supabase_storage.py**: Verify Supabase Storage connectivity
- **upload_to_supabase.py**: Upload H1B data to the database

Run scripts from the project root:
```bash
python supabase/scripts/test_supabase_storage.py
python supabase/scripts/upload_to_supabase.py
```

### Database Migrations

Database migrations are stored in `supabase/migrations/` and should be applied through Supabase CLI or dashboard.

## Common Tasks

### Working with Frontend

```bash
cd frontend
npm install      # Install dependencies
npm run dev      # Start dev server
npm run build    # Build for production
```

### Working with Backend

Backend code is organized by feature with Python services and scripts.

### Working with Supabase

- Access Supabase dashboard: https://app.supabase.com
- Apply migrations through Supabase CLI or SQL editor
- Review schema using `supabase/config.toml`

## Environment Variables

Required environment variables (see `.env.example`):

- `VITE_SUPABASE_URL`: Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Anonymous API key
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key (for admin operations)

## Key Files and Their Purpose

- **frontend/src/**: React components and utilities
- **backend/**: Python service implementations
- **supabase/migrations/**: SQL migration files
- **supabase/config.toml**: Supabase local development config
- **README.md**: User-facing project documentation

## Running Tests

Tests are configured in the project. Check individual directories for test scripts:
- Frontend: `npm test`
- Backend: Follow backend-specific test instructions

## Committing Changes

Follow conventional commit messages:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `refactor:` Code refactoring
- `test:` Test additions/changes
- `chore:` Build/dependency updates

Example: `feat: add H1B data filtering`

## Troubleshooting

### Supabase Connection Issues

If you encounter connection errors when running Supabase scripts:

1. Verify environment variables are set correctly
2. Check Supabase project status in dashboard
3. Ensure API keys have appropriate permissions
4. Run with service role key if needed: `python script.py --service-key`

### Frontend/Backend Integration

- Frontend communicates with Supabase directly via API keys
- For sensitive operations, use service role key through secure backend endpoints
- Check browser console and backend logs for errors

## Getting Help

- Check existing documentation in `docs/` directory
- Review commit history for similar changes
- Refer to Supabase documentation: https://supabase.com/docs
- Check frontend framework docs (React/Next.js)
