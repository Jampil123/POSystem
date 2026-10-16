# Kuya Tata POS

A web-based point of sale system for a small store.

- Manages products, inventory, cash sales, transactions, shifts, and reports.
- Cash payments only.
- Responsive: works on desktop, iPad or tablet, and mobile phones in both portrait and landscape.
- Two user roles: Admin (owner) and Cashier.

Project documents:

- [CLAUDE.md](CLAUDE.md) — rules for AI coding tasks
- [docs/kuya-tata-pos-development-plan.md](docs/kuya-tata-pos-development-plan.md) — tools, folder structure, database, phases, conventions
- [docs/kuya-tata-pos-ui-guide.md](docs/kuya-tata-pos-ui-guide.md) — colors, layout, screens, responsive design

## Tech stack

### Core

| Purpose                 | Tool                               |
| ----------------------- | ---------------------------------- |
| Language                | TypeScript                         |
| Frontend framework      | React                              |
| Build tool / dev server | Vite                               |
| Routing (pages)         | React Router                       |
| Styling                 | Tailwind CSS                       |
| UI components           | shadcn/ui (with Lucide icons)      |
| Backend and database    | Supabase (PostgreSQL)              |
| Login and roles         | Supabase Auth + Row Level Security |

### Libraries

| Purpose                                | Tool                             |
| -------------------------------------- | -------------------------------- |
| Loading and saving data                | TanStack Query                   |
| Forms                                  | React Hook Form                  |
| Form validation                        | Zod                              |
| Simple app state (cart, current shift) | Zustand                          |
| Charts                                 | Recharts                         |
| Excel export                           | SheetJS (xlsx)                   |
| PDF export                             | jsPDF + jspdf-autotable          |
| Camera barcode scanning                | html5-qrcode                     |
| Date formatting                        | date-fns                         |
| Toast messages                         | Sonner (included with shadcn/ui) |
| Installable app (PWA)                  | vite-plugin-pwa                  |
| Offline sales (optional, later phase)  | Dexie.js                         |

### Development tools

| Purpose                                | Tool                                                   |
| -------------------------------------- | ------------------------------------------------------ |
| Code editor                            | Visual Studio Code                                     |
| Version control                        | Git + GitHub                                           |
| Code checking                          | ESLint                                                 |
| Code formatting                        | Prettier                                               |
| Unit testing                           | Vitest + React Testing Library                         |
| Database migrations and local database | Supabase CLI                                           |
| UI mockups                             | Figma                                                  |
| Diagrams (ERD, flowcharts)             | draw.io                                                |
| Project tasks                          | GitHub Projects (Kanban board)                         |
| Hosting                                | Vercel or Netlify (frontend), Supabase cloud (backend) |

## Environment setup (for new team members)

1. Install Node.js (LTS version), Git, and Visual Studio Code.
2. Clone the repository and run `npm install`.
3. Copy `.env.example` to `.env` and fill in the Supabase URL and publishable key.
4. Run `npm run dev` and open the local link shown in the terminal.
5. To test on a tablet or phone on the same Wi-Fi, run `npm run dev -- --host` and open the network link on the device.

## Database

Migrations are in `supabase/migrations/`, sample data in `supabase/seed.sql`.

```
npx supabase db push --include-seed   # apply new migrations (and sample data) to the linked project
npm run db:types                      # regenerate src/types/database.ts
npm run db:test                       # run the complete_sale SQL tests (nothing is saved)
```

Run `npm run db:types` after every database change.

## First admin and cashier accounts

Users log in with a username. Behind the scenes the username becomes an email
`username@kuyatata.local`, which users never see.

1. In the Supabase dashboard, open **Authentication → Users → Add user → Create new user**.
2. Email: `admin@kuyatata.local` (the part before `@` becomes the username). Enter a password and
   tick **Auto Confirm User**.
3. A profile is created automatically with the role **cashier**. To make this user an admin, open
   **SQL Editor** and run:

   ```sql
   update public.profiles
   set role = 'admin', full_name = 'Store Owner'
   where username = 'admin';
   ```

4. Repeat steps 1–2 for a cashier (for example `juan@kuyatata.local`) and set the name:

   ```sql
   update public.profiles set full_name = 'Juan Dela Cruz' where username = 'juan';
   ```

Usernames may use 3–30 lowercase letters, numbers, dots, dashes, or underscores.

Turn off public sign-ups in **Authentication → Sign In / Providers → Allow new users to sign up**,
so only the owner can create accounts.

## Scripts

| Command                | What it does                            |
| ---------------------- | --------------------------------------- |
| `npm run dev`          | Start the development server            |
| `npm run build`        | Type-check and build for production     |
| `npm run preview`      | Preview the production build            |
| `npm run lint`         | Check the code with ESLint              |
| `npm run format`       | Format all files with Prettier          |
| `npm run format:check` | Check formatting without changing files |
| `npm run test`         | Run the unit tests once                 |
| `npm run test:watch`   | Run the unit tests in watch mode        |

Run `npm run lint`, `npm run build`, and `npm run test` before opening a pull request.
