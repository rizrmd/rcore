# RCore Template

A modern full-stack web application template built with Bun, React, TypeScript, and Prisma.

## Features

- **Runtime**: Bun (fast, modern JavaScript runtime)
- **Frontend**: React 19 + TypeScript
- **Styling**: Tailwind CSS + Shadcn UI components
- **State Management**: Valtio + custom useLocal hook
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Better Auth (ready to implement)
- **Multi-site Support**: Single codebase, multiple sites
- **File-based Routing**: Custom router library

## Project Structure

```
rcore-template/
├── backend/          # Backend API and server logic
│   ├── src/
│   │   ├── api/     # API endpoints
│   │   ├── lib/     # Shared backend utilities
│   │   └── index.tsx
├── frontend/         # React frontend application
│   ├── src/
│   │   ├── components/
│   │   ├── lib/
│   │   ├── pages/
│   │   └── entry/
├── shared/          # Shared code between frontend and backend
│   ├── prisma/      # Database schema
│   └── types/       # TypeScript type definitions
└── scripts/         # Build and deployment scripts
```

## Getting Started

### Prerequisites

- Bun (latest version)
- PostgreSQL database
- Node.js (for some tooling compatibility)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd rcore-template
```

2. Install dependencies:
```bash
bun install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

4. Generate Prisma client:
```bash
cd shared && bun prisma generate && cd ..
```

5. Initialize the database:
```bash
cd shared && bun prisma migrate dev --name init && cd ..
```

### Development

Run the development server:

```bash
bun run dev
```

The application will be available at:
- Main site: http://localhost:7000

### Building for Production

```bash
bun run prod
```

## Configuration

### Site Configuration

Edit `config.json` to configure your sites:

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

### Database Schema

The template includes a basic schema with:
- User management
- Session handling
- Posts/Comments system
- Tags
- Settings

Modify `shared/prisma/schema.prisma` to fit your needs.

## Development Guidelines

### State Management

Use `useLocal` for component-specific state:

```typescript
import { useLocal } from "@/lib/hooks/use-local";

const local = useLocal({data: []}, async () => {
    // async init function
    local.data = ['loaded'];
    local.render();
});
```

Use Valtio for shared state between components:

```typescript
// Create state file
import { proxy } from "valtio";
export const state = {
  write: proxy({ data: "hello" }),
  reset() { this.write.data = "hello"; }
}

// Use in component
import { useSnapshot } from "valtio";
const read = useSnapshot(state.write);
```

### API Development

Create API endpoints using `defineAPI`:

```typescript
import { defineAPI } from "rlib/server";

export default defineAPI({
  name: "example",
  url: "/api/example",
  async handler(args: { param: string }) {
    // Your API logic here
    return { success: true };
  },
});
```

## Deployment

### Using Fly.io

1. Install Fly CLI
2. Update `fly.toml` with your app name
3. Deploy:

```bash
bun run fly
```

## License

MIT