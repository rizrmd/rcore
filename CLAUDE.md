# CLAUDE.md Structure

## 1. File Naming Convention
- All files should be in kebab-case
- Uses bun latest version

## 2. Frontend State Management

### Local State (useLocal)
- Use `useLocal` instead of `useState` for component-specific state
- Can only be used in one component
- Includes async initialization support

```
import { useLocal } from "@/lib/hooks/use-local";
const local = useLocal({data: []}, async () => {
    // async init function.
    local.data = ['loaded'];
    local.render();
})
```

### Shared State (Valtio)
- Use Valtio for state shared between components
- Naming convention: two words (e.g., `bookWrite`, `bookRead`)
- Store all Valtio states in `frontend/src/lib/states`
- Rules:
  - Don't pass Valtio snapshot-derived variables as props
  - Use `useSnapshot` inside the component itself
  - Only pass primitive values as selectors

Create Valtio state file:
```
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

Use in component:
```
import { state } from './your-state'
import { useSnapshot } from "valtio";

export default () => {
  const read = useSnapshot(state.write);

  return <input type="text" value={read.data} onChange={(e) => {
    write.data = e.currentTarget.value;
  }}>
}
```

## 3. Frontend Stack
- Shadcn UI components
- Tailwind CSS
- Custom router library

## 4. Localization
- Use Bahasa Indonesia for all UI text shown to users
- Use English for code

## 5. Backend Database Access
- Prisma client is globally available as `db` variable
- No need to initialize

## 6. API Architecture
- CRUD operations handled via APIs in `backend/src/api`
- Uses Prisma under the hood
- Frontend should use generated API client, not fetch
- Import from `@/lib/gen/[domain]`

Example API definition:
```
import { defineAPI } from "rlib/server";
export default defineAPI({
  name: "auth_user",
  url: "/api/auth/user",
  async handler(arg: { username: string }) {
    const res = await db.auth_user.findFirst({
      where: {
        OR: [
          {email: arg.username},
          {username: arg.username,}
        ],
      },
    });
    return res;
  },
});
```

Frontend usage:
```
import { api } from "@/lib/gen/auth.esensi";
const res = await api.auth_user({ username: username! });
```

## 7. TypeScript Import Rules
- Use type-only imports when importing types (due to `verbatimModuleSyntax`)

Wrong:
```
import { User } from "better-auth/types";
```

Correct:
```
import type { User } from "better-auth/types";
```

## 8. Development Environment
- Never run `bun dev`

## 9. Code Safety
- Always check for null/undefined before accessing nested objects
- Use IDE getDiagnostics integration for error checking
- Don't assume frontend page props are always available (can be empty or null during navigation)

## 10. URL Routing
- Exclude domain prefix from URLs
- Example: `/chapter.esensi/title/buku-chapter-10` → `/title/buku-chapter-10`

## 11. Authentication Pattern
- Uses better-auth library for authentication
- Multi-domain authentication with cross-domain session sync
- Supports multiple user types: customer, author, affiliate, internal, publisher
- Each user type links to different tables via id_[type] fields
- Frontend authentication client:
```
import { betterAuth } from "@/lib/better-auth";
const { data, error } = await betterAuth.signIn({ username, password });
const session = await betterAuth.getSession();
```
- Backend session retrieval includes related entities:
```
const session = await utils.getSession(headers);
// session.user includes customer, author, affiliate, etc. data
```

## 12. WebSocket/Notification Pattern
- Real-time notifications via WebSocket
- Frontend notification client:
```
import { notif } from "@/lib/notif";
notif.init(user_id); // Initialize WebSocket connection
// notif.list is a reactive proxy array of notifications
```
- Backend notification sending:
```
import { sendNotif, NotifType, WSMessageAction } from "@/lib/notif";
await sendNotif(uid, {
  action: WSMessageAction.NEW_NOTIF,
  notif: { type: NotifType.INFO, message: "Your message", status: NotifStatus.UNREAD }
});
```

## 13. CRUD Pattern
- Standardized CRUD operations with soft delete support
- Frontend CRUD hook:
```
import { useCrud } from "@/lib/crud-hook";
const crudHandlers = useCrud(apiFunction, {
  primaryKey: "id", // optional, defaults to "id"
  breadcrumbConfig: { basePath, entityNameField }
});
```
- Backend CRUD handler:
```
import { crudHandler } from "@/lib/crud-handler";
export default defineAPI({
  handler: crudHandler("ModelName", {
    primaryKey: "id",
    softDelete: { enabled: true, field: "deleted_at", method: "null_is_available" },
    list: { prisma: { include: { relation: true } } },
    nested: { // For nested CRUD operations
      addresses: { parentField: "id_customer", model: "CustomerAddress" }
    }
  })
});
```
- CRUD actions: list, get, create, update, delete, bulkDelete, restore, bulkRestore
- Supports nested CRUD for related entities
- State persistence for complex forms via hash-based storage

## 14. API Response Pattern
- All APIs return standardized response:
```
{ success: boolean, data?: any, message?: string, status?: number }
```
- Always handle errors gracefully with user-friendly messages in Bahasa Indonesia

## 15. File Organization Pattern
- API files organized by domain: backend/src/api/[domain]/[feature].ts
- States organized by feature: frontend/src/lib/states/[feature]-state.ts
- Generated API clients: frontend/src/lib/gen/[domain].ts

## 16. Multi-Domain Support
- Project supports multiple domains (main, chapter, publish, internal, auth)
- Each domain can have its own API endpoints and pages
- Cross-domain authentication handled via iframe and postMessage

## 17. JSON Field Handling
- JSON fields (info, cfg) are automatically serialized/deserialized
- File fields (cover, product_file) stored as JSON arrays of paths
- Special handling for comma-separated fields like story_tags