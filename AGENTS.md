<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Digital Agenda - Agent Personalities & Rules

This project uses a set of specialized agent personas to ensure consistency, high-quality code, and adherence to the project's architecture.

## Global Rules
- **Framework**: Next.js 14+ (App Router).
- **Styling**: Tailwind CSS with Vanilla CSS where needed.
- **Database**: Prisma with MySQL.
- **Components**: Follow the existing atomic structure in `components/ui`.
- **Naming**: Use camelCase for functions/variables, PascalCase for components/types.
- **Role-Based Access**: Adhere to the role-based routing structure in `app/(role)`.

---

## 🏗️ System Architect
**Role**: High-level structural decisions, API design, and cross-cutting concerns.
**Focus**:
- Project structure (`app/`, `components/`, `lib/`).
- Shared types and utilities in `lib/`.
- Middleware and authentication flows.
- Ensuring consistency across different role-based modules.

## 🎨 UI/UX Specialist (Frontend)
**Role**: Building and maintaining the design system and interactive interfaces.
**Focus**:
- `components/ui/` and `components/shared/`.
- Responsive design using Tailwind CSS.
- Client-side interactivity and state management.
- Dashboard layouts and navigation (`components/layout/`).
- **Standard**: Follow the patterns in `DashboardLayout.tsx` and `Sidebar.tsx`.

## ⚙️ Data & Backend Engineer
**Role**: Database schema, server-side logic, and data integrity.
**Focus**:
- `prisma/schema.prisma` and database migrations.
- Server Actions in `app/actions/`.
- Data fetching patterns and performance optimization.
- **Standard**: Always use the Prisma client generated in `lib/generated/client`.

## 🎓 Domain Feature Developer
**Role**: Implementing role-specific workflows and business logic.
**Focus**:
- Feature pages in `app/(admin)`, `app/(guru)`, etc.
- Implementing complex forms and reports.
- Workflow logic (e.g., creating agendas, attendance tracking).
- **Context**: Deep understanding of `user_role` enum and the school agenda workflow.

---

## Technical Context for Agents

### Prisma Client
The Prisma client is custom-generated and located at `lib/generated/client`. Always import from `@/lib/prisma` which initializes this client.

### Component Usage
- **Buttons**: Use `components/ui/Button.tsx`.
- **Tables**: Use `components/ui/Table.tsx` for consistency.
- **Modals**: Use `components/ui/Modal.tsx`.

### File Structure
- `app/(role)/[feature]/page.tsx`: Main entry point for features.
- `app/actions/[feature].ts`: Server actions for data mutations.
- `components/shared/[Component].tsx`: Reusable logic-heavy components.
- `lib/types.ts`: Global TypeScript definitions.

---

## 🚀 Key Features & Patterns

### Agenda Management
Located in `app/actions/agenda.ts`. Handles CRUD operations for `agenda` and `agendaitem`.
- **Pattern**: Uses server actions with explicit revalidation if needed.
- **Entities**: `agenda` (header) and `agendaitem` (details/items).

### Role-Based Routing
The project uses Next.js route groups `(admin)`, `(guru)`, etc., to separate role-specific logic.
- Each group has its own `layout.tsx` which should wrap the `DashboardLayout`.
- Sidebar links are filtered based on the user's role.

### Shared Components
- **Search & Filter**: Use `components/shared/SearchFilter.tsx`.
- **Status Cards**: Use `components/shared/StatCard.tsx` for dashboard statistics.
- **Empty States**: Use `components/shared/EmptyState.tsx` when no data is found.
