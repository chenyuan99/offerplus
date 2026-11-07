# API Contract & Type Synchronization

This document explains how the frontend and backend stay in sync using OpenAPI and auto-generated TypeScript types.

## Overview

The API contract is defined in **`backend/openapi.yaml`**, which is the single source of truth for all API endpoints, request/response schemas, and authentication.

Frontend TypeScript types are **auto-generated** from this spec, ensuring perfect alignment between what the frontend expects and what the backend provides.

## Architecture

```
backend/openapi.yaml (Single Source of Truth)
         ↓
openapi-typescript
         ↓
frontend/src/types/api.ts (Auto-generated, Do Not Edit)
         ↓
frontend/src/services/api.ts (Uses generated types)
         ↓
React Components (Always use correct types)
```

## Updating the API Contract

### When you add/change a backend endpoint:

1. **Update the OpenAPI spec:**
   ```bash
   # Edit backend/openapi.yaml
   # Add your new endpoint to the paths section
   ```

2. **Regenerate frontend types:**
   ```bash
   cd frontend
   npm run generate:api-types
   ```

3. **The TypeScript compiler will:**
   - ✅ Flag any breaking changes
   - ✅ Auto-complete endpoints in the IDE
   - ✅ Validate request/response shapes

### Example: Adding a new endpoint

1. Add to `backend/openapi.yaml`:
   ```yaml
   /api/companies/{id}/:
     get:
       summary: Get company details
       tags:
         - Companies
       parameters:
         - name: id
           in: path
           required: true
           schema:
             type: integer
       responses:
         '200':
           description: Company details
           content:
             application/json:
               schema:
                 $ref: '#/components/schemas/Company'
   ```

2. Regenerate types:
   ```bash
   npm run generate:api-types
   ```

3. Update `frontend/src/services/api.ts`:
   ```typescript
   export const companiesApi = {
     get: (id: number) => api.get<Company>(`/api/companies/${id}/`),
   };
   ```

4. Use in components - TypeScript autocomplete will guide you:
   ```typescript
   const { data } = await companiesApi.get(1); // Type-safe!
   ```

## Current Generated Types

The generated `frontend/src/types/api.ts` includes:

- **Paths**: All endpoint definitions (`/api/auth/login/`, `/api/applications/`, etc.)
- **Schemas**: Request/response models (User, Application, UserProfile, etc.)
- **Operations**: Typed request/response pairs for each endpoint

## Using Generated Types

### Avoid doing this:
```typescript
// ❌ Manual types (can drift from spec)
interface Application {
  id: number;
  title: string;
}
```

### Do this instead:
```typescript
// ✅ Use auto-generated types
import type { paths } from '../types/api';

type Application = paths['/api/applications/']['get']['responses']['200']['content']['application/json'][number];
```

### Or use helper types:
```typescript
import type { paths } from '../types/api';

// Get request body type
type CreateApplicationRequest = paths['/api/applications/']['post']['requestBody']['content']['application/json'];

// Get response type  
type CreateApplicationResponse = paths['/api/applications/']['post']['responses']['201']['content']['application/json'];
```

## Validation Workflow

### TypeScript Compilation
```bash
npm run build
```
If the spec changed and code doesn't match, TypeScript will error immediately.

### Runtime Contract Testing (Future)
We recommend adding contract tests with Dredd:

```bash
npm install -D dredd
dredd backend/openapi.yaml http://localhost:8000
```

This validates:
- ✅ All endpoints exist
- ✅ Request parameters match spec
- ✅ Response schemas match spec
- ✅ Status codes are correct

## Best Practices

1. **Never manually edit `src/types/api.ts`** - it's auto-generated
2. **Update the OpenAPI spec first** - then regenerate types
3. **Use TypeScript strict mode** - catches type mismatches
4. **Test endpoints against spec** - add Dredd to CI/CD
5. **Keep spec and code in same PR** - spec + implementation together

## Common Patterns

### Using API types in components:
```typescript
import type { paths } from '../types/api';
import { applicationsApi } from '../services/api';

type Application = paths['/api/applications/']['get']['responses']['200']['content']['application/json'][number];

export function ApplicationList() {
  const [apps, setApps] = useState<Application[]>([]);
  
  // Types are enforced throughout
  const handleFetch = async () => {
    const { data } = await applicationsApi.list();
    setApps(data); // Type-safe
  };
}
```

### Typing API responses:
```typescript
// ✅ Correct - types inferred from spec
const response = await applicationsApi.create({
  company: { id: 1, name: 'Google' },
  job_title: 'SWE', // Required
  status: 'APPLIED', // Enum enforced
});

// ❌ Wrong - TypeScript will error
const response = await applicationsApi.create({
  company: { id: 1 },
  job_title: 'SWE',
  status: 'INVALID_STATUS', // Error: not in enum
});
```

## Regenerating Types

Whenever the OpenAPI spec changes:

```bash
cd frontend
npm run generate:api-types
```

This is fast (~50ms) and safe - it only overwrites the generated file.

## Troubleshooting

**Q: TypeScript says type doesn't exist**
- Run `npm run generate:api-types` to regenerate
- Check OpenAPI spec has the path defined

**Q: IDE autocomplete not working**
- Restart TypeScript server (Cmd+Shift+P → "Restart TS Server" in VS Code)
- Ensure `src/types/api.ts` exists

**Q: Breaking type changes in spec**
- Run build: `npm run build`
- TypeScript will show exactly what broke
- Fix code to match new spec

## Files Involved

| File | Purpose | Edit? |
|------|---------|-------|
| `backend/openapi.yaml` | API contract definition | ✅ Yes |
| `frontend/src/types/api.ts` | Auto-generated types | ❌ No |
| `frontend/package.json` | Has generate:api-types script | ✅ Update scripts |
| `frontend/src/services/api.ts` | API client using types | ✅ Yes |

## Next Steps

1. **Review the generated types:**
   ```bash
   cat frontend/src/types/api.ts | less
   ```

2. **Test the type system:**
   ```bash
   cd frontend
   npm run build
   ```

3. **Add contract testing (optional):**
   ```bash
   npm install -D dredd
   ```

4. **Add to CI/CD** (optional):
   - Run `npm run generate:api-types` before build
   - Fail if types changed (ensuring spec is kept in sync)
