# Project Agenda (agend.md)

> This document is the **Supreme Law** for this project. All AI Agents and Developers must strictly adhere to these rules. Any code or UI generation must align with this document.

## 1. Project Vision & Positioning
- **Type**: Enterprise B-Side Admin Management System.
- **Goal**: Build a highly performant, accessible, and consistent admin dashboard using the latest React ecosystem tools.
- **Core Values**:
  - **Consistency**: UI and Logic must follow the Design System strictly.
  - **Performance**: Minimize re-renders, optimize bundle size, use optimistic updates.
  - **Maintainability**: Strict typing, component modularity, and clean code architecture.
- **Collaboration**: Multiple Agents will work in parallel on different routes/modules. Standardization is key to avoiding conflicts.

## 2. Tech Stack & Engineering Constraints
### Core Framework
- **Runtime**: `vite` (Strictly ESM).
- **Framework**: `React` 19 (Hooks-first, Server Actions concept where applicable, though Client-side focused here).
- **Language**: `TypeScript` (Strict mode enabled, no `any`).
- **Routing**: `@tanstack/react-router` (File-based routing, type-safe routes).

### State & Data
- **Server State**: `@tanstack/react-query` v5.
  - MUST use `queryKey` factories.
  - MUST handle `isLoading`, `isError` states explicitly.
- **Global Client State**: `zustand` (Use sparingly, prefer URL/Server state).
- **Local State**: `useState` / `useReducer`.
- **Form Handling**: `react-hook-form` + `zod` validation.
  - MUST use `<Form>` components from `shadcn/ui`.

### UI Architecture
- **UI Library**: `shadcn/ui` (Radix UI primitives + Tailwind CSS).
  - DO NOT install other UI libraries (e.g., AntD, MUI) without explicit permission.
- **Styling**: `Tailwind CSS` v4.
  - Use utility classes primarily.
  - Use `clsx` and `tailwind-merge` (`cn` utility) for dynamic classes.
  - NO custom `.css` files unless absolutely necessary for complex animations.
- **Icons**: `lucide-react`.

## 3. Design System & UI Specifications
### Visual Style
- **Keywords**: Clean, Minimalist, "Vercel-like", Professional, Accessible.
- **Radius**: Default `0.5rem` (rounded-md) for cards and inputs.
- **Typography**: Inter (or system default sans-serif).

### Color Palette (Tailwind Semantic Colors)
- **Primary**: `bg-primary` / `text-primary-foreground` (Usually Black/Dark Zinc in light mode).
- **Secondary**: `bg-secondary` / `text-secondary-foreground`.
- **Destructive**: `bg-destructive` / `text-destructive-foreground` (Red).
- **Muted**: `bg-muted` / `text-muted-foreground` (For tertiary text/backgrounds).
- **Border**: `border-border` (Subtle grays).
- **Background**: `bg-background` (White/Dark Gray), `bg-card` (Cards).

### Constraints (Prohibited)
- ❌ **DO NOT** use hardcoded hex colors (e.g., `#ff0000`). ALWAYS use Tailwind variables (e.g., `text-red-500` or `text-destructive`).
- ❌ **DO NOT** use inline styles `style={{ ... }}`.
- ❌ **DO NOT** create inconsistent button sizes. Use `size="default" | "sm" | "lg" | "icon"`.

## 4. Common Page & Interaction Patterns
### Data Tables
- **Library**: `@tanstack/react-table`.
- **Features**: Pagination, Sorting, Filtering must be server-side driven via URL params.
- **Layout**:
  - Top: Search Bar + Filters + Action Buttons (Right aligned).
  - Middle: Table Content (Sticky header preferred).
  - Bottom: Pagination controls.
  - Search toolbar and table content MUST NOT be wrapped by the same outer `border/rounded` container. Keep toolbar outside; only table area may use `rounded-md border`.
- **Selection Toolbar (Required)**:
  - When one or more rows are selected, MUST show a fixed bottom bulk-action toolbar.
  - Toolbar text format MUST be: `已选择 {n} 项{实体名}` (example: `已选择 3 项角色`).
  - Toolbar MUST include clear-selection action and common bulk actions (Enable, Disable, Delete) when those actions are supported by the module.
  - Action icons MUST provide hover tooltip labels (e.g., `启用所选{实体名}` / `停用所选{实体名}` / `删除所选{实体名}`).
  - After successful bulk action, selection state SHOULD be cleared and table data MUST refresh (query invalidation/refetch).
- **Empty State**: Must show a dedicated "No results found" component, not just an empty row.

### Forms
- **Layout**: Vertical stack for mobile, Grid for desktop.
- **Validation**: Real-time validation via `zod`.
- **Submission**: Disable button + Loading spinner during `isSubmitting`.
- **Feedback**: `sonner` toast for success/error.

### Dialogs / Modals
- **Usage**: Use for quick actions (Create/Edit) or confirmations.
- **Sheet**: Use `Sheet` (Slide-over) for complex forms or detailed views.
- **Dialog**: Use `Dialog` (Modal) for simple forms or alerts.
- **Prevention**: Click outside should NOT close the modal if form data is dirty (needs implementation).

### Feedback States
- **Loading**: Use Skeleton loaders (`<Skeleton />`), not full-screen spinners, for initial loads.
- **Error**: Show user-friendly error messages + "Retry" button.
- **Success**: Toast notification (Top-right).

### Authorization Guardrails (Mandatory)
- Any management-page action button/menu item (Create/Edit/Delete/Enable/Disable/Reset Password/Export/Bulk Actions) MUST be gated by permission checks in UI.
- UI permission checks are only for UX. Backend API permission checks are still REQUIRED and are the final authority.
- For every new write endpoint (`POST/PUT/PATCH/DELETE`), update backend permission resolver (or equivalent security mapping) in the same change.
- For every permission mapping change, add/update automated tests to prevent regression.
- Permission codes MUST be consistent across:
  - menu button code
  - frontend `can(...)` checks
  - backend permission resolver
- Do not reuse one permission for multiple distinct actions:
  - `create` / `edit` / `delete` / `run` / `assign-*` / `force-logout` / `clear` MUST be mapped 1:1 to UI buttons.
  - Example: "Add child" is a create action and MUST check `*:create`, not `*:edit`.
- For every management page, maintain an explicit permission matrix (page-level checklist):
  - list each actionable UI entry point (primary buttons, row actions, bulk actions, dialogs),
  - list required permission code per action,
  - verify corresponding backend endpoint mapping and automated test coverage.
- If historical aliases exist (example: `:add` vs `:create`), document migration strategy and keep temporary compatibility checks until data is fully migrated.
- Privileged graph fields MUST NOT be accepted in generic create/update DTOs:
  - User base profile DTO must not contain `roleIds`.
  - Role base profile DTO must not contain `menuIds` / `dataScope`.
  - These must be handled by dedicated endpoints with dedicated permissions (example: `assign-roles`, `assign-perms`, `assign-data-scope`).
- Every tree-like module (menus/departments/categories) MUST enforce anti-cycle rules on write:
  - parent must exist (except root),
  - node cannot set itself as parent,
  - node cannot set any descendant as parent,
  - tree builder must detect and reject cyclic data to avoid recursive logic corruption.
- Security regression tests are mandatory for both categories:
  - vertical privilege escalation by mixed DTO authority,
  - recursive tree corruption by cyclic parent updates.
- PR self-checklist before merge:
  - Does unauthorized user see no action entry points?
  - Does backend return `403` on direct unauthorized API call?
  - Is there at least one automated test covering the permission mapping?

## 5. Data & Field Conventions
### Standard Fields
- **ID**: `id` (string, UUID preferred) or `key`.
- **Timestamps**:
  - `created_at` (ISO 8601 string).
  - `updated_at` (ISO 8601 string).
  - Display format: `yyyy-MM-dd HH:mm` (Use `date-fns`).
- **Status**: Use String Enums (e.g., `'active' | 'inactive' | 'pending'`).
  - Map to UI badges: `active` -> Green/Default, `inactive` -> Secondary/Gray, `error` -> Destructive.

### Boolean
- Boolean fields should be prefixed with `is_` or `has_` in DB types, but may be mapped to `is...` in frontend interfaces.

## 6. AI Agent Collaboration Rules
### How to Read & Observe
1. **First Step**: READ this `agend.md` before writing code.
2. **Context**: Understand the folder structure (`src/features`, `src/components`, `src/routes`).
3. **Consistency**: Check existing files (e.g., `users/components/...`) to match coding style.

### Forbidden Actions for Agents
- 🚫 **NO** changing the global tooling configuration (Vite, TSConfig, Tailwind) unless explicitly requested.
- 🚫 **NO** introducing new npm packages without checking `package.json` for existing alternatives.
- 🚫 **NO** leaving `console.log` in production code.
- 🚫 **NO** writing long, monolithic components. Break them down (> 200 lines is a warning).

## 7. Global Constraints & Priorities
1.  **Type Safety** > **Speed**: If types are broken, the build fails. Fix types first.
2.  **UX** > **UI**: The app must work smoothly before it looks perfect (but it strictly must look good too).
3.  **Mobile First**: Ensure all layouts work on mobile (hidden sidebars, responsive grids).
4.  **Accessibility**: Ensure keyboard navigation and screen reader support (Radix UI handles most, but don't break it).

---
*Last Updated: 2026-02-25*
