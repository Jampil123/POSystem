# Kuya Tata POS — Test Results (v1.0.0)

Tested on 16 October 2026 on the production build (`npm run build`, served with `vite preview`)
against the project's Supabase database.

## 1. Summary

| Area | Result |
|---|---|
| Unit tests (Vitest) | **178 / 178 passed** (17 files) |
| SQL tests, `supabase/tests/complete_sale.test.sql` | **19 / 19 passed** |
| SQL tests, `supabase/tests/daily_flow.test.sql` | **29 / 29 passed** |
| Full daily flow in the browser (34 steps, admin + cashier) | **34 / 34 passed** |
| Screens on 5 device sizes (60 screens) | **60 / 60** with no sideways scrolling or small touch targets |
| Migrations from an empty database | **Passed** (all 10 migrations, then all 48 SQL checks) |
| Security review | **Passed**, with one manual step (turn off public sign-ups) |
| Lighthouse accessibility / best practices | **100 / 100** on every page tested |
| Console errors in the production build | **None** from the app (see section 6) |
| Bugs found and fixed | **5** (section 8) |

## 2. Testing checklist (development plan, section 8)

| # | Item | Result | How it was tested |
|---|---|---|---|
| POS 1 | Add items by tap, search, USB scanner, and camera | **Pass** (tap, search, USB scanner) · **Not tested** (camera) | Browser: tapped product cards, searched by name, typed a barcode + Enter like a USB scanner. Camera scanning needs a real phone or tablet camera and HTTPS; check it on the store device after deployment. |
| POS 2 | Out-of-stock items cannot be added | **Pass** | Browser: out-of-stock cards (Biscuits Pack, Bread Loaf) are disabled with an "Out" badge. SQL: `complete_sale` rejects out-of-stock and short-stock items. Unit: the cart refuses them. |
| POS 3 | Quantity changes update the total right away | **Pass** | Browser: − and + changed the total from ₱60.00 to ₱40.00 and back at once. |
| POS 4 | Short cash disables "Complete sale" | **Pass** | Browser: cash ₱50 for a ₱60 total shows "Insufficient cash" and the button is disabled. SQL: `complete_sale` rejects short cash. |
| POS 5 | Correct change for exact, over, and quick cash amounts | **Pass** | Browser: exact amount → ₱0.00; quick ₱100 for ₱36.00 → ₱64.00; ₱1,000 for ₱20.00 → ₱980.00. SQL: the saved sales have the same change. Unit: `computeChange` tests. |
| POS 6 | Stock decreases after a completed sale | **Pass** | Browser: stock 29 → 26 after selling 3. SQL: stock and stock movements checked. |
| POS 7 | Cart, cash, and open step stay after rotating | **Pass** | Browser: in the middle of a payment (₱1,000 entered), rotated iPad landscape → iPad portrait → phone portrait → phone landscape → iPad landscape; the cart, cash, change, and open step stayed the same each time. |
| INV 1 | Stock in increases stock and appears in history | **Pass** | Browser: stock in of 30 with a supplier; the supplier shows in Movement history. SQL: stock and movement checked. |
| INV 2 | Adjustments require a reason | **Pass** | Browser: saving without a reason shows "Choose a reason." SQL: `adjust_stock` rejects an empty reason and negative stock. |
| INV 3 | Low-stock badge appears at the set level | **Pass** | Unit: stock status tests (at the level = Low). Screens show "Low" and "Out" badges with words. |
| TX 1 | Void and refund return stock and need admin approval | **Pass** | Browser: a wrong PIN is refused; the admin PIN works for a void (same shift) and a refund (later shift). SQL: stock returned, cashier PINs refused, 5 wrong PINs lock the PIN, void refused after the shift is closed. |
| TX 2 | Closing a shift shows the correct expected cash and difference | **Pass** | Browser: shift 1 expected ₱580.00 (voided sale not counted), shift 2 expected ₱240.00 (refund taken out). SQL: expected cash and differences checked, including a ₱10.00 short. |
| ACC 1 | Cashier cannot open admin pages, even by typing the URL | **Pass** | Browser: `/products`, `/inventory`, `/reports`, `/users`, `/settings` all send a cashier to `/pos`; the menu shows only POS, Transactions, Shifts. SQL: a cashier cannot call admin functions or write admin tables (12 checks). |
| DEV 1 | Desktop, iPad portrait and landscape, phone portrait and landscape | **Pass** in device emulation · **Real devices still to check** | Chrome device emulation (touch on for tablets and phones), every screen on all 5 sizes, screenshots reviewed. A short check on the store's real tablet and phone is still needed (section 7). |

## 3. Full daily flow

Run in the browser on the production build, in this order:

1. Owner logs in, adds a test admin and a test cashier on the **Users** page (through the
   `admin-users` Edge Function). The owner's own **Deactivate** button is disabled.
2. Owner adds a product (the below-cost warning appears, then a normal price is saved), does a
   **stock in** of 30, and an **adjustment** of −1 (a reason is required).
3. Test admin logs in and sets an approval PIN.
4. Cashier logs in: the POS is locked until a shift is open; admin pages are blocked.
5. Cashier opens a shift (₱500.00) and makes three sales:
   - exact cash (₱60.00, change ₱0.00), receipt opens and shows "not an official receipt";
   - 10% discount (₱36.00), quick cash ₱100 (change ₱64.00);
   - overpayment on a phone screen (₱20.00, cash ₱1,000.00, change ₱980.00).
6. The discounted sale is **voided** (wrong PIN refused, then approved with the admin PIN).
7. Shift 1 is closed: expected ₱580.00, counted ₱580.00, "Balanced".
8. Shift 2 is opened (₱300.00); sale 1 is **refunded** in this later shift; a reprint shows "REPRINT".
9. Shift 2 is closed: expected ₱240.00 (₱300.00 − ₱60.00 refund), "Balanced".
10. The cashier's Transactions page lists only their own 3 sales.
11. Owner checks **Reports** (Today) and exports Excel and PDF. Files saved as
    `sales-report_2026-10-16_to_2026-10-16.xlsx` and `.pdf`; the PDF has clean black-and-white
    tables with the store name and date range at the top.
12. Owner turns off the test cashier, who then cannot log in ("This account is turned off").

The same day is also tested inside the database (`daily_flow.test.sql`, 29 checks) with the real
security rules on, including report totals: +₱150.00 sales, +2 transactions, +3 items, +₱100.00
refunds (voided sale not counted, refund subtracted).

## 4. Database and security review

- **Row Level Security** is on for all 12 tables. The rules match section 4 of the development plan:
  cashiers read products and settings, open their own shifts, and see only their own sales; admins
  can do everything; nobody edits or deletes a completed sale (only void or refund, through the
  database functions).
- **Cashier limits** checked as a real cashier login (SQL, `daily_flow.test.sql`): cannot add
  products, change prices or stock, call `record_stock_in`, `adjust_stock`, `report_*`,
  `set_approval_pin`, or the internal `reverse_sale`, read stock history, change settings, make
  themselves admin, or write sales directly.
- **Edge Function** (`admin-users`), checked live: no login → 401, fake token → 401, public key only →
  401, admin demoting themselves → 400. Unit tests: a cashier or turned-off admin → 403.
- **Secret keys**: none in the repository or the production build. The only matches are the name
  `SUPABASE_SERVICE_ROLE_KEY` read inside the Edge Function (filled in by Supabase) and the Supabase
  library's own check for key prefixes. The build contains only the publishable key, which is meant
  to be public.
- **`.env`** is not tracked by Git; `.env.example` has the variable names only.
- **Approval PIN** is stored as a bcrypt hash and cannot be read from the app.
- **Public sign-ups are still ON** in Supabase Auth. This must be turned off by hand
  (`docs/deployment-guide.md`, section 2).
- **Migrations from an empty database**: in a transaction that was rolled back, the `public` schema
  was removed and recreated like a new Supabase project, all 10 migrations were applied, and both SQL
  test scripts were run: 12 tables, Row Level Security on all 12, and 48 / 48 checks passed.

## 5. Performance (Lighthouse 12, production build)

| Page | Mobile | Desktop | Accessibility | Best practices |
|---|---|---|---|---|
| Login | 78 | 99 | 100 | 100 |
| POS | 61 | 82 | 100 | 100 |
| Reports | 71 | 92 | 100 | 100 |

- Fixed: a layout shift on the POS on phones (CLS 0.157 → 0), and the product buttons' spoken
  names (accessibility).
- Improved: the admin-only "Set approval PIN" dialog loads only when opened, and the app connects to
  Supabase early (`preconnect`).
- Lazy-loaded pages (Phase 6) brought the main script from 1,434 kB to 368 kB.
- **Known limitation:** mobile scores are held back by script start-up time under Lighthouse's
  4× slower CPU (total blocking time 1.0–1.8 s), mostly React and the Supabase client starting. On
  the store's tablet this means the first screen appears about a second later than on a desktop.
  The local test server does not compress files; Vercel does, so load times online will be shorter.

## 6. Console errors

During the full flow, the device screens, and Lighthouse, the app logged **no errors or warnings**.
The only browser console entry was a `400` network response when the turned-off cashier tried to log
in: that is Supabase refusing the login on purpose, and the app shows the "turned off" message.

## 7. Devices and orientations tested

| Device size | Screen | Touch | Result |
|---|---|---|---|
| Desktop | 1366 × 900 | no | Pass |
| iPad portrait | 820 × 1180 | yes | Pass |
| iPad landscape | 1180 × 820 | yes | Pass |
| Phone portrait | 390 × 844 | yes | Pass |
| Phone landscape | 844 × 390 | yes | Pass (after bug 3 was fixed) |

All screens were checked on every size: login, POS, Products, Inventory (stock on hand, stock in,
movement history), Transactions, Shifts, Reports, Users, Settings, and "Page not found".

These were tested with Chrome's device emulation, not on real hardware. **Still to check on the
store's real devices** (a 10-minute check after deployment):

- camera barcode scanning (needs HTTPS, so only on the deployed app);
- printing a receipt on the 58 mm or 80 mm thermal printer;
- installing the app (Add to Home Screen) and the "Update available" message;
- the iPhone notch and home bar spacing, and the on-screen keyboard on a real phone.

## 8. Bugs found and fixed

| # | Bug | Fix |
|---|---|---|
| 1 | After closing a shift, the "Shift closed" message did not appear (the shift was saved correctly). | The open/close shift hooks no longer wait for the reload before the form's own success message runs (`src/features/shifts/hooks/useShifts.ts`). |
| 2 | A turned-off user who tried to log in saw "Check the internet connection" instead of "This account is turned off". | The login now recognizes Supabase's `user_banned` answer (`src/features/auth/api.ts`). |
| 3 | On phones in landscape, the header and POS summary bar were full height, leaving little room (the UI guide asks for slimmer bars). | New `short:` style for screens under 500 px tall: slimmer top bar, summary bar, product cards, and spacing. |
| 4 | On phones, the POS steps jumped down when the product list appeared (layout shift 0.157). | Taller loading placeholder on the POS (`PosCheckout.tsx`). |
| 5 | Product buttons' spoken names ("Add …") did not include their visible text (Lighthouse accessibility). | The name now comes from the visible text with a hidden "Add" in front (`ProductPicker.tsx`). |

Other findings:

- The SQL test scripts use up receipt numbers even though their changes are undone (database counters
  never go back). Documented: do not run them on the live project after the go-live reset.
- Testing created 20 test accounts (`e2e_…`) with a known password. All were **turned off and
  blocked from logging in** during testing; delete them in the Supabase dashboard (deployment guide,
  section 6).
- No tests were weakened or removed in this phase.
