# RCore Template - Development Guidelines

This is a modern full-stack web application template built with Bun, React, TypeScript, and Prisma.

## Project Structure

```
backend/src/api/
├── main/          # Main site endpoints
├── auth/          # Authentication endpoints  
├── health.ts      # Health check endpoint
└── ...           # Add your API endpoints here
```

## Coding Standards

### File Naming
- All files should be in kebab-case
- Use `.tsx` for React components and `.ts` for pure TypeScript files

### Technology Stack
- **Runtime**: Bun (latest version)
- **Frontend**: React 19 + TypeScript
- **UI**: Shadcn UI + Tailwind CSS
- **Router**: Custom router library (file-based)
- **State Management**: Valtio + useLocal hook
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Better Auth

### State Management

#### Component State (useLocal)
For component-specific state, use the custom `useLocal` hook instead of `useState`:

```typescript
import { useLocal } from "@/lib/hooks/use-local";

const local = useLocal({data: []}, async () => {
    // async init function
    local.data = ['loaded'];
    local.render();
});
```

**Important**: `useLocal` can only be used in one component. For shared state, use Valtio.

#### Shared State (Valtio)
For state shared between components, create a Valtio state file:

```typescript
import { proxy } from "valtio";

export const state = {
  write: proxy({
    data: "hello"
  }),
  reset() {
    this.write.data = "hello";
  }
}
```

Use in components:

```typescript
import { state } from '@/lib/states/your-state'
import { useSnapshot } from "valtio";

export default () => {
  const read = useSnapshot(state.write);

  return <input type="text" value={read.data} onChange={(e) => {
    state.write.data = e.currentTarget.value;
  }}>
}
```

**Guidelines**:
- Use two-word naming for valtio states (e.g., `bookWrite`, `bookRead`)
- Don't pass valtio snapshots as props - use `useSnapshot` in each component
- Store all valtio states in `frontend/src/lib/states/`

### Database Operations

Prisma client is available globally as `db`. Example API endpoint:

```typescript
import { defineAPI } from "rlib/server";

export default defineAPI({
  name: "get_user",
  url: "/api/user",
  async handler(arg: { email: string }) {
    const user = await db.user.findFirst({
      where: { email: arg.email }
    });
    return user;
  },
});
```

### Frontend API Calls

Never use `fetch` directly. Use the generated API client:

```typescript
import { api } from "@/lib/gen/main";
const res = await api.get_user({ email: "user@example.com" });
```

### TypeScript Imports

When importing types, use type-only imports:

```typescript
// ❌ Wrong
import { User } from "better-auth/types";

// ✅ Correct
import type { User } from "better-auth/types";
```

### Best Practices

1. **Null/Undefined Checks**: Always check for null/undefined before accessing nested objects
2. **Page Props**: Don't assume props are always available - they can be empty during navigation
3. **Development**: Use Firefox or any browser except VSCode's built-in browser
4. **Error Handling**: Use IDE diagnostics integration for error checking

## Site Configuration

The template supports multiple sites from a single codebase. Configure sites in `config.json`:

```json
{
  "sites": {
    "main": {
      "devPort": 7000,
      "domains": ["localhost:7000"],
      "isDefault": true
    }
  }
}
```

Add new sites by adding entries to the `sites` object. Each site can have its own:
- API endpoints in `backend/src/api/[site-name]/`
- Pages in `frontend/src/pages/[site-name]/`
- Specific configurations and domains

## UI Language

- Use English for all UI text and code
- Adjust based on your project requirements

## Commands

- `bun run dev` - Start development server
- `bun run prod` - Build for production
- `bun run db generate` - Generate Prisma client
- `bun run db migrate` - Run database migrations
- `bun run typecheck` - Run TypeScript type checking