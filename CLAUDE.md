# Kuya Tata POS — AI Development Rules

These rules apply to every AI coding task in this project. Read this file before starting any prompt, and follow it for the whole task.

## 1. Read the project documents first

Before writing any code, read:

- `AI_RULES.md` (this file)
- `docs/kuya-tata-pos-development-plan.md` — tools, folder structure, database, phases, conventions
- `docs/kuya-tata-pos-ui-guide.md` — colors, layout, screens, responsive design

These documents are the source of truth. If a prompt and a document disagree, stop and ask before continuing.

## 2. Stay within the task

- Only do what the current prompt asks. Do not build features from later phases.
- Do not redesign, rename, or move existing files unless the prompt asks for it.
- Do not edit the files in `docs/` or this file unless the prompt asks for it.
- If something needed for the task is missing or unclear, ask instead of guessing.
- If you notice a problem outside the task, mention it in your summary instead of fixing it.

## 3. Tools and dependencies

- Use only the tools and libraries listed in section 2 of the development plan.
- Do not install a new package without asking first and explaining why it is needed.
- Use the latest stable versions and follow each tool's current official setup instructions.
- Use npm as the package manager.

## 4. Folder structure and file placement

- Follow section 3 of the development plan exactly.
- Each module lives in `src/features/<module>/` with its own `components/`, `hooks/`, `api.ts`, and `schema.ts`.
- Shared UI goes in `src/components/common/`; shadcn/ui components stay in `src/components/ui/`.
- Never place Supabase calls inside components. All database calls go in the module's `api.ts` and are used through hooks.

## 5. Code style

- TypeScript in strict mode. Do not use `any`; create proper types instead.
- Use the database types generated in `src/types/database.ts`.
- Use the `@/` import alias.
- Naming:
  - Components: PascalCase (`CartList.tsx`)
  - Hooks: start with `use` (`useProducts.ts`)
  - Helpers: camelCase (`computeChange.ts`)
  - Database tables and columns: snake_case (`sale_items`)
- Keep components small and readable. Split a component when it gets too long.
- Add short comments only where the logic is not obvious.
- Write code a student team can read and maintain. Prefer simple and clear over clever.

## 6. Forms and validation

- Every form uses React Hook Form with a Zod schema from the module's `schema.ts`.
- Show error messages under the related field, as described in the UI guide.
- Validate on the database side too (constraints and functions), not only in the app.

## 7. Money and computations

- Cash payments only. Do not add other payment methods.
- Store money in the database as `numeric(10,2)`.
- All totals, VAT, and change computations use the shared helpers in `src/features/pos/utils/`. Do not repeat this logic elsewhere.
- Round to 2 decimal places in one place only (the shared helper).
- Format money with `src/lib/currency.ts` (₱1,250.00).

## 8. Database and Supabase

- Every database change (tables, functions, security rules) is a new file in `supabase/migrations/`. Never change the database only through the Supabase dashboard.
- Never edit an old migration that has already been applied; create a new one.
- Actions that change several tables at once (completing a sale, stock in, void, refund, closing a shift) must use the database functions listed in section 4 of the development plan so they are all-or-nothing.
- Row Level Security must be enabled on every table.
- Completed sales are never edited or deleted directly; only void or refund.
- Regenerate `src/types/database.ts` after every database change.

## 9. Security

- Never write real keys, passwords, or URLs into the code. Use `.env` values only.
- Never commit `.env`. Keep `.env.example` updated with variable names only.
- Check the user's role for admin-only pages in both the routes and the database security rules.

## 10. UI and design

- Follow the yellow theme, components, and screen layouts in the UI guide.
- Use the theme colors from the CSS variables or the Tailwind classes in the UI guide. Do not add new colors.
- Text on yellow is always dark (`#1C1917`). Never white text on yellow.
- Only one yellow (primary) button per area.
- Use shadcn/ui components before creating custom ones.
- Every list or table needs loading, empty, and error states.
- Destructive actions (clear cart, void, refund, delete, close shift) need a confirmation dialog.

## 11. Responsive design

- Every screen must work on desktop, tablet, and phone, in both portrait and landscape.
- Follow the breakpoints and device layouts in section 5 of the UI guide.
- Design mobile-first, then add larger layouts with `md:` and `lg:` prefixes.
- Touch targets are at least 48px tall. Do not rely on hover.
- Rotating the device must never reset data on the screen (cart, forms, open step).
- Never lock screen orientation.

## 12. Accessibility

- Every input has a visible label.
- Status is never shown by color alone; badges include a word (Low, Out, Void).
- All actions work with a keyboard, with visible focus outlines.

## 13. Testing

- Write unit tests with Vitest for all computation helpers (totals, VAT, change).
- Add tests for any new helper or important logic you create.
- Do not delete or weaken existing tests to make them pass.

## 14. Before finishing any task

Run these and make sure they all pass with no errors:

```
npm run lint
npm run build
npm run test
```

If something fails and cannot be fixed within the task, explain why in the summary.

## 15. Summary at the end of every task

End every task with a short summary:

- What was done
- Files created or changed
- Packages installed (if any)
- Anything the team must do manually (for example, filling in `.env` or running a migration)
- Problems found or questions to answer before the next prompt

## 16. Git

- Work on a feature branch named by module, e.g. `feature/pos-payment` or `fix/cart-total`.
- Commit messages follow this format: `feat: ...`, `fix: ...`, `docs: ...`, `chore: ...`, `test: ...`.
- Keep commits small and focused on one change.
