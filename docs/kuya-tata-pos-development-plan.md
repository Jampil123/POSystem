# Kuya Tata POS — Development Plan

This document describes the tools, folder structure, database, and step-by-step development process for the Kuya Tata POS. It works together with `kuya-tata-pos-ui-guide.md`, which covers the design.

## 1. Project summary

- A web-based point of sale system for a small store.
- Manages products, inventory, cash sales, transactions, shifts, and reports.
- Cash payments only.
- Responsive: works on desktop, iPad or tablet, and mobile phones in both portrait and landscape.
- Two user roles: Admin (owner) and Cashier.

## 2. Tools and technologies

### Core

| Purpose | Tool |
|---|---|
| Language | TypeScript |
| Frontend framework | React |
| Build tool / dev server | Vite |
| Routing (pages) | React Router |
| Styling | Tailwind CSS |
| UI components | shadcn/ui (with Lucide icons) |
| Backend and database | Supabase (PostgreSQL) |
| Login and roles | Supabase Auth + Row Level Security |

### Libraries

| Purpose | Tool |
|---|---|
| Loading and saving data | TanStack Query |
| Forms | React Hook Form |
| Form validation | Zod |
| Simple app state (cart, current shift) | Zustand |
| Charts | Recharts |
| Excel export | SheetJS (xlsx) |
| PDF export | jsPDF + jspdf-autotable |
| Camera barcode scanning | html5-qrcode |
| Date formatting | date-fns |
| Toast messages | Sonner (included with shadcn/ui) |
| Installable app (PWA) | vite-plugin-pwa |
| Offline sales (optional, later phase) | Dexie.js |

### Development tools

| Purpose | Tool |
|---|---|
| Code editor | Visual Studio Code |
| Version control | Git + GitHub |
| Code checking | ESLint |
| Code formatting | Prettier |
| Unit testing | Vitest + React Testing Library |
| Database migrations and local database | Supabase CLI |
| UI mockups | Figma |
| Diagrams (ERD, flowcharts) | draw.io |
| Project tasks | GitHub Projects (Kanban board) |
| Hosting | Vercel or Netlify (frontend), Supabase cloud (backend) |

### Hardware (optional)

- USB barcode scanner (works like a keyboard, no setup needed)
- 58mm or 80mm thermal receipt printer
- Cash drawer connected to the printer

## 3. Folder structure

```
kuya-tata-pos/
├── public/
│   ├── icons/                  # App icons for PWA install
│   └── manifest.webmanifest
├── src/
│   ├── app/
│   │   ├── App.tsx             # Root component
│   │   ├── router.tsx          # All routes and role-based access
│   │   └── providers.tsx       # Query client, auth, toast providers
│   │
│   ├── components/
│   │   ├── ui/                 # shadcn/ui components (button, dialog, accordion...)
│   │   ├── layout/             # AppShell, Sidebar, BottomNav, TopBar
│   │   └── common/             # Shared pieces: DataTable, EmptyState, ConfirmDialog,
│   │                           # StatusBadge, CurrencyText, PageHeader
│   │
│   ├── features/               # One folder per module
│   │   ├── auth/
│   │   │   ├── components/     # LoginForm
│   │   │   ├── hooks/          # useAuth, useRole
│   │   │   ├── api.ts          # Supabase calls
│   │   │   └── LoginPage.tsx
│   │   │
│   │   ├── pos/
│   │   │   ├── components/     # StepAccordion, ProductPicker, CartList,
│   │   │   │                   # PaymentPanel, QuickCashButtons, SummaryBar,
│   │   │   │                   # BarcodeScanner
│   │   │   ├── store/          # cartStore.ts (Zustand)
│   │   │   ├── hooks/          # useCompleteSale
│   │   │   ├── utils/          # computeTotals.ts, computeChange.ts
│   │   │   ├── api.ts
│   │   │   └── PosPage.tsx
│   │   │
│   │   ├── products/
│   │   │   ├── components/     # ProductTable, ProductForm, CategoryFilter
│   │   │   ├── hooks/          # useProducts, useSaveProduct
│   │   │   ├── schema.ts       # Zod validation for product form
│   │   │   ├── api.ts
│   │   │   └── ProductsPage.tsx
│   │   │
│   │   ├── inventory/
│   │   │   ├── components/     # StockTable, StockInForm, AdjustmentForm,
│   │   │   │                   # MovementHistory
│   │   │   ├── hooks/
│   │   │   ├── schema.ts
│   │   │   ├── api.ts
│   │   │   └── InventoryPage.tsx
│   │   │
│   │   ├── transactions/
│   │   │   ├── components/     # TransactionTable, TransactionDetails,
│   │   │   │                   # VoidRefundDialog
│   │   │   ├── hooks/
│   │   │   ├── api.ts
│   │   │   └── TransactionsPage.tsx
│   │   │
│   │   ├── shifts/
│   │   │   ├── components/     # OpenShiftForm, CloseShiftForm, ShiftTable
│   │   │   ├── store/          # shiftStore.ts
│   │   │   ├── hooks/
│   │   │   ├── api.ts
│   │   │   └── ShiftsPage.tsx
│   │   │
│   │   ├── reports/
│   │   │   ├── components/     # SummaryCards, SalesChart, BestSellers,
│   │   │   │                   # LowStockList, ExportButtons
│   │   │   ├── utils/          # exportExcel.ts, exportPdf.ts
│   │   │   ├── api.ts
│   │   │   └── ReportsPage.tsx
│   │   │
│   │   ├── users/              # Admin only
│   │   └── settings/           # Admin only: store info, VAT, receipt footer
│   │
│   ├── receipt/
│   │   ├── ReceiptView.tsx     # Printable receipt layout
│   │   └── receipt.css         # Print-only styles (58mm / 80mm)
│   │
│   ├── lib/
│   │   ├── supabase.ts         # Supabase client setup
│   │   ├── queryClient.ts
│   │   ├── currency.ts         # Format ₱1,250.00
│   │   └── utils.ts            # shadcn helper (cn)
│   │
│   ├── hooks/                  # Shared hooks: useMediaQuery, useOrientation,
│   │                           # useKeyboardShortcuts
│   ├── types/
│   │   └── database.ts         # Types generated from Supabase
│   ├── styles/
│   │   └── index.css           # Tailwind + yellow theme variables
│   └── main.tsx                # App entry point
│
├── supabase/
│   ├── migrations/             # Database tables, functions, and security rules
│   └── seed.sql                # Sample categories, products, and users
│
├── tests/                      # Extra tests (unit tests can also sit beside files)
├── docs/
│   ├── kuya-tata-pos-ui-guide.md
│   ├── kuya-tata-pos-development-plan.md
│   ├── erd.drawio
│   └── flowcharts.drawio
│
├── .env.example                # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
├── .eslintrc.cjs
├── .prettierrc
├── components.json             # shadcn/ui config
├── tailwind.config.ts
├── tsconfig.json
├── vite.config.ts
├── package.json
└── README.md
```

Why this structure: each module (POS, products, inventory, and so on) keeps its own components, data calls, and validation in one folder. Team members can work on separate modules without editing the same files.

## 4. Database plan

### Tables

| Table | Main fields |
|---|---|
| `profiles` | id (linked to login), full_name, username, role (admin / cashier), is_active |
| `categories` | id, name |
| `products` | id, category_id, name, barcode, cost_price, selling_price, stock_qty, low_stock_level, is_active |
| `stock_ins` | id, supplier_name, received_at, received_by, notes |
| `stock_in_items` | id, stock_in_id, product_id, quantity, unit_cost |
| `stock_adjustments` | id, product_id, quantity_change (+/−), reason, adjusted_by, created_at |
| `stock_movements` | id, product_id, type (stock_in / sale / adjustment / void / refund), quantity_change, reference_id, created_by, created_at |
| `shifts` | id, cashier_id, opened_at, starting_cash, closed_at, expected_cash, actual_cash, difference |
| `sales` | id, receipt_no, shift_id, cashier_id, subtotal, discount, vat_amount, total, cash_received, change, status (completed / voided / refunded), created_at |
| `sale_items` | id, sale_id, product_id, product_name, unit_price, quantity, line_total |
| `sale_voids` | id, sale_id, type (void / refund), reason, approved_by, created_at |
| `store_settings` | store_name, address, contact_no, vat_enabled, vat_rate, receipt_footer |

Notes:

- `sale_items` saves the product name and price at the time of sale, so old receipts stay correct even if prices change later.
- `stock_movements` is the full history of every stock change, used for the inventory history screen.

### Database functions (Supabase RPC)

These run inside the database so each action is all-or-nothing:

- `complete_sale` — checks stock, saves the sale and its items, deducts stock, records stock movements, and returns the receipt number. If any part fails, nothing is saved.
- `record_stock_in` — saves the delivery and adds stock.
- `adjust_stock` — saves an adjustment with a reason.
- `void_sale` / `refund_sale` — marks the sale, returns the stock, and records who approved it.
- `close_shift` — computes expected cash and the difference.

### Security (Row Level Security)

- Cashiers can read products, create sales in their own open shift, and view their own transactions.
- Admins can do everything, including managing products, stock, users, and settings.
- No one can edit or delete a completed sale directly; changes go through void or refund only.

## 5. Development phases

### Phase 1 — Setup (Week 1)

- Create the GitHub repository and project board.
- Create the Vite + React + TypeScript project.
- Install Tailwind, shadcn/ui, and the yellow theme from the UI guide.
- Set up ESLint, Prettier, and Vitest.
- Create the Supabase project and connect it with `.env` values.
- Build the app shell: sidebar, bottom navigation for phones, top bar, and routes.

### Phase 2 — Database and login (Week 2)

- Write migrations for all tables, functions, and security rules.
- Add seed data (sample categories, products, admin and cashier accounts).
- Generate TypeScript types from the database.
- Build the login page and role-based route protection.

### Phase 3 — Products and inventory (Weeks 3–4)

- Categories and products: list, search, add, edit, deactivate.
- Stock in, stock adjustments, and movement history.
- Low-stock and out-of-stock badges.

### Phase 4 — Shifts and POS (Weeks 5–6)

- Open shift and close shift with cash count.
- POS screen with the three collapsible steps: Add items, Review cart, Payment.
- Cart logic, totals, VAT, quick cash buttons, and change computation.
- USB barcode and camera scanning.
- `complete_sale` connection and success flow.
- Receipt print view.

### Phase 5 — Transactions and reports (Week 7)

- Transaction list, filters, details, and reprint.
- Void and refund with admin approval.
- Dashboard cards, sales chart, best sellers, low-stock list.
- Excel and PDF export.

### Phase 6 — Users, settings, and responsive polish (Week 8)

- User management and store settings.
- Test all screens on desktop, tablet, and phone in portrait and landscape.
- Keyboard shortcuts for desktop.
- PWA setup so the app can be installed on a tablet or phone.

### Phase 7 — Testing and deployment (Weeks 9–10)

- Unit tests for totals, change, and VAT computation.
- Manual test cases for every flow (see section 8).
- Fix bugs found during testing.
- Deploy the frontend and connect it to the production Supabase project.
- User acceptance testing with the store owner and cashier.

### Phase 8 (optional) — Offline sales

- Save sales locally with Dexie.js when there is no internet, then sync when the connection returns.

## 6. Git workflow

- `main` — stable, deployed version only.
- `develop` — combined work in progress.
- Feature branches from `develop`, named by module: `feature/pos-payment`, `feature/inventory-stock-in`, `fix/cart-total`.
- Open a pull request into `develop`; at least one teammate reviews before merging.
- Commit message format: `feat: add quick cash buttons`, `fix: correct change computation`, `docs: update ERD`.

## 7. Coding conventions

- Components: PascalCase file names (`CartList.tsx`).
- Hooks: start with `use` (`useProducts.ts`).
- Helper files: camelCase (`computeChange.ts`).
- Database tables and columns: snake_case (`sale_items`, `cash_received`).
- All money values stored in the database as `numeric(10,2)`; never use floating-point math for totals in the app (round to 2 decimals in one shared helper).
- Every form uses a Zod schema for validation.
- Every Supabase call lives in the module's `api.ts`, not inside components.
- Use Tailwind's responsive prefixes (`sm:`, `md:`, `lg:`) following the breakpoints in the UI guide.

## 8. Testing checklist

POS:

- Add items by tap, search, USB scanner, and camera.
- Out-of-stock items cannot be added.
- Quantity changes update the total right away.
- Short cash disables "Complete sale".
- Correct change for exact, over, and quick cash amounts.
- Stock decreases after a completed sale.
- Cart, cash, and open step stay after rotating the device.

Inventory:

- Stock in increases stock and appears in history.
- Adjustments require a reason.
- Low-stock badge appears at the set level.

Transactions and shifts:

- Void and refund return stock and need admin approval.
- Closing a shift shows the correct expected cash and difference.

Access:

- Cashier cannot open admin pages, even by typing the URL.

Devices:

- Desktop, iPad portrait and landscape, phone portrait and landscape.

## 9. Environment setup (for new team members)

1. Install Node.js (LTS version), Git, and Visual Studio Code.
2. Clone the repository and run `npm install`.
3. Copy `.env.example` to `.env` and fill in the Supabase URL and anon key.
4. Run `npm run dev` and open the local link shown in the terminal.
5. To test on a tablet or phone on the same Wi-Fi, run `npm run dev -- --host` and open the network link on the device.

## 10. Deliverables

- Working POS system deployed online.
- Source code on GitHub.
- Database ERD and flowcharts.
- UI design guide and this development plan.
- User manual for the owner and cashier.
- Test results.
