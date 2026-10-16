# Kuya Tata POS — UI Design Guide

This guide defines the look and layout of the Kuya Tata POS so every screen feels consistent. It is written for the development team using React, Tailwind CSS, and shadcn/ui.

## 1. Design direction

- Theme: warm yellow accent on a clean, light background.
- Style: simple, flat, and minimal. No gradients, heavy shadows, or decorative graphics.
- Priority: speed at the counter. Big buttons, clear totals, few clicks per sale.
- Yellow is used for actions and highlights only. Most of the screen stays white and neutral so the yellow stands out.

## 2. Color palette

| Role | Hex | Usage |
|---|---|---|
| Primary | `#FACC15` | Main buttons, active menu item, selected items |
| Primary hover | `#EAB308` | Hover and pressed state of primary buttons |
| Primary strong | `#A16207` | Icons and links on white backgrounds |
| Primary tint | `#FEF9C3` | Highlighted rows, selected cards, info banners |
| Text on primary | `#1C1917` | Text on any yellow background (never white) |
| Background | `#FAFAF9` | Page background |
| Surface | `#FFFFFF` | Cards, tables, dialogs |
| Border | `#E7E5E4` | Card borders, table lines, inputs |
| Text primary | `#1C1917` | Headings and body text |
| Text secondary | `#78716C` | Labels, hints, timestamps |
| Success | `#16A34A` | Sale completed, stock in, enough cash |
| Warning | `#D97706` | Low stock |
| Danger | `#DC2626` | Out of stock, void, short cash, delete |

Contrast rule: yellow is a light color, so text on yellow must always be dark (`#1C1917`). Never put white text on yellow, and never use yellow for small text on white.

### CSS variables (shadcn/ui format)

Place in `src/index.css`:

```css
:root {
  --background: 60 9% 98%;
  --foreground: 24 10% 10%;
  --card: 0 0% 100%;
  --card-foreground: 24 10% 10%;
  --primary: 48 96% 53%;
  --primary-foreground: 24 10% 10%;
  --secondary: 55 97% 88%;
  --secondary-foreground: 32 81% 29%;
  --muted: 60 5% 96%;
  --muted-foreground: 25 5% 45%;
  --accent: 55 97% 88%;
  --accent-foreground: 24 10% 10%;
  --destructive: 0 72% 51%;
  --destructive-foreground: 0 0% 100%;
  --border: 20 6% 90%;
  --input: 20 6% 90%;
  --ring: 45 93% 47%;
  --radius: 0.5rem;
}
```

## 3. Typography

- Font: Inter (or the system sans-serif font as fallback).
- Sizes:
  - Page title: 24px, semibold
  - Section title: 18px, semibold
  - Body and table text: 14–16px, regular
  - Labels and hints: 12–13px, regular, secondary color
  - Cart total on the POS screen: 36–40px, bold
- Numbers (prices, quantities, totals) use tabular figures (`font-variant-numeric: tabular-nums`) so columns line up.
- Currency format: `₱1,250.00` (peso sign, comma separators, two decimals).

## 4. Spacing, shape, and sizing

- Spacing scale: 4, 8, 12, 16, 24, 32px.
- Corner radius: 8px for buttons, inputs, and cards; 12px for dialogs.
- Borders: 1px using the border color. Avoid shadows except a light one on dialogs.
- Touch targets: at least 44px tall. Buttons on the POS screen should be 48–56px tall.
- Icons: Lucide icons (included with shadcn/ui), 18–20px, outline style.

## 5. Layout

### App shell

```
+-----------+--------------------------------------------+
|           |  Top bar: page title | shift status | user |
|  Sidebar  +--------------------------------------------+
|           |                                            |
|  menu     |  Page content                              |
|           |                                            |
+-----------+--------------------------------------------+
```

- Sidebar (white, 240px wide, collapsible to icons only):
  - POS
  - Products
  - Inventory
  - Transactions
  - Shifts
  - Reports
  - Users (admin only)
  - Settings (admin only)
- Active menu item: yellow tint background with dark text and a yellow left marker.
- Top bar shows the current shift status ("Shift open since 8:00 AM") and the logged-in user with a logout option.
- The cashier role only sees POS, Transactions (own), and Shifts.

### Responsive design

The whole system is responsive and works on desktop, iPad or other tablets, and mobile phones.

| Device | Width | Navigation | Layout |
|---|---|---|---|
| Phone | below 768px | Bottom navigation bar (POS, Products, Inventory, Transactions, More) | Single column |
| Tablet portrait | 768–1023px | Sidebar collapsed to icons | Single column, wider cards |
| Tablet landscape / laptop | 1024–1279px | Sidebar collapsed to icons | Two columns where useful |
| Desktop | 1280px and up | Full sidebar | Two columns where useful |

Orientation (portrait and landscape):

- Tablets and phones both support portrait and landscape. The app never locks the screen orientation.
- The layout follows the screen width after rotation, so the same breakpoints above apply:
  - iPad / tablet portrait: single column accordion
  - iPad / tablet landscape: two columns (products left, cart and payment right)
  - Phone portrait: single column accordion, product list
  - Phone landscape: single column accordion with a 2–3 card product grid; the header and sticky summary bar become slimmer to save vertical space
- Rotating the device never clears the cart, the entered cash, or the open step. Only the layout changes.
- Test every screen in both orientations on a phone and a tablet before release.

Touch rules for tablets and phones:

- All buttons and tappable rows are at least 48px tall.
- Nothing depends on hover; every action has a visible button.
- Number fields use `inputMode="decimal"` so the numeric keypad opens.
- Tables become stacked cards on phones (one card per row, key fields only).
- Dialogs become full-screen sheets on phones.

## 6. Screens

### 6.1 Login

- One white card on the light background, split in two:
  - **Brand panel** (flat primary yellow, dark text, no gradient): the round Kuya Tata Sari-Sari Store
    logo (`public/brand/kuya-tata-logo.png`), "Welcome back!", one line about starting the shift, and
    three small step tiles: Log in → Open your shift → Start selling (the first tile white, the others
    white at 50%).
  - **Form panel** (white): "Log in" title, a short hint, username and password fields (the password
    has a show/hide button), one full-width yellow "Log in" button, and "For Kuya Tata staff only"
    under it. No sign-up: the owner adds users on the Users page.
- Tablets and desktops: the two panels side by side. Phones: the brand panel on top (logo and
  welcome only), the form below. Short screens (phones in landscape): smaller logo, no step tiles.
- Error message in red below the form for wrong credentials.
- The same round logo is used everywhere the store mark appears: the sidebar, the phone top bar, the
  browser tab icon, and the home-screen app icons (on a yellow square; the Android maskable icon keeps
  the logo inside the safe zone). Small places use `public/brand/kuya-tata-logo-96.png`.

### 6.2 Open shift

- Shown after a cashier logs in if no shift is open.
- One input: "Starting cash" in pesos, with a yellow "Open shift" button.
- The POS screen is locked until a shift is open.

### 6.3 POS (transaction) screen — single-page collapsible flow

The whole sale happens on one screen instead of separate pages. The process is split into three collapsible steps (an accordion), so the cashier can always see where they are and what is already done:

1. Add items
2. Review cart
3. Payment

#### How the collapsible steps work

- Each step has a header with a step number, a title, and a short summary.
- When a step is collapsed, its header shows the summary so the whole sale can be overviewed at a glance:
  - Add items: "3 items added"
  - Review cart: "3 items · ₱105.00"
  - Payment: "Cash ₱200.00 · Change ₱95.00"
- Finishing a step collapses it and opens the next one automatically.
- Tapping any collapsed header reopens it (for example, going back to add one more item). The others stay collapsed but still show their summaries.
- If the cart changes after cash was entered, the change is recalculated right away.
- Step status in the header:
  - Active: yellow number circle with dark text
  - Done: green circle with a check mark
  - Not yet reached: gray circle
- After "Complete sale", all steps reset and Step 1 opens for the next customer.
- Built with the shadcn/ui `Accordion` component (`type="single"` with `collapsible`).

#### Step 1 — Add items

- Search / scan bar at the top, always focused on desktop so a USB barcode scanner works right away.
- Camera scan button beside the search bar on tablets and phones.
- Category chips: neutral by default, yellow when selected. Scrolls sideways on small screens.
- Product cards: name, price, and stock count. Out-of-stock cards are grayed out and cannot be tapped. Low-stock cards show an amber "Low" badge.
- Tapping a product adds one to the cart and briefly highlights it in yellow tint.
- "Next: Review cart" button at the bottom of the step.

#### Step 2 — Review cart

- Cart rows: item name, minus and plus buttons for quantity, line total, and a remove icon.
- Subtotal, discount, VAT (if enabled), and the total in large text.
- "Clear cart" (secondary, with confirmation) and "Next: Payment" (yellow).

#### Step 3 — Payment (cash only)

- Total shown in large text.
- "Cash received" input with quick amount buttons (₱20, ₱50, ₱100, ₱200, ₱500, ₱1,000, Exact amount).
- Change is shown live in green. If cash is short, the change area turns red and reads "Insufficient cash", and "Complete sale" is disabled.
- "Complete sale" saves the transaction, shows a success message, and opens the receipt print view.

#### Sticky summary bar

A bar fixed to the bottom of the POS screen on tablets and phones (and at the bottom of the right column on desktop) always shows:

- Item count and total (e.g. "3 items · ₱105.00")
- The next main action as a yellow button: "Review cart", "Payment", or "Complete sale" depending on the open step

This lets the cashier move forward from anywhere without scrolling.

#### Layout per device

Desktop and tablet landscape (1024px and up): two columns. Step 1 fills the left; Steps 2 and 3 stack as collapsible panels on the right, so adding items and paying are visible together.

```
+-------------------------------+--------------------------+
| (1) Add items                 | (2) Review cart      [v] |
|  Search / scan bar            |   Bread       2   40.00  |
|  Category chips               |   Softdrinks  1   65.00  |
|  +------+ +------+ +------+   |   TOTAL         ₱105.00  |
|  | item | | item | | item |   +--------------------------+
|  +------+ +------+ +------+   | (3) Payment          [>] |
|  +------+ +------+ +------+   |   collapsed: not started |
|  | item | | item | | item |   +--------------------------+
|  +------+ +------+ +------+   | 3 items · ₱105.00 [Pay]  |
+-------------------------------+--------------------------+
```

Tablet portrait (768–1023px): single column, all three steps stacked as an accordion. Product grid with 3 cards per row. Sticky summary bar at the bottom.

Phone (below 768px): single column accordion. Products show as a list (one row per item with an add button) instead of a grid. Quick cash buttons wrap 3 per row. Sticky summary bar at the bottom.

```
+---------------------------+
| (✓) Add items     3 items |
+---------------------------+
| (2) Review cart       [v] |
|   Bread      - 2 +  40.00 |
|   Softdrinks - 1 +  65.00 |
|   TOTAL          ₱105.00  |
+---------------------------+
| (3) Payment           [>] |
+---------------------------+
|                           |
+---------------------------+
| 3 items · ₱105.00         |
| [      Payment       ]    |
+---------------------------+
```

Keyboard shortcuts:

| Key | Action |
|---|---|
| F1 | Focus search / scan bar |
| F2 | Open payment |
| F4 | Clear cart (with confirmation) |
| Enter | Confirm in dialogs |
| Esc | Close dialog |

### 6.4 Products

- Table with columns: Image (optional), Name, Category, Barcode, Cost, Price, Stock, Status, Actions.
- Search bar and category filter above the table.
- Yellow "Add product" button at the top right.
- Add/edit form in a side panel: name, category, barcode, cost price, selling price, low-stock level, active toggle.

### 6.5 Inventory

- Tabs: Stock on hand, Stock in, Adjustments, Movement history.
- Stock on hand: table with status badges (In stock = green, Low = amber, Out = red).
- Stock in form: supplier name (optional), date, list of items with quantity and cost.
- Adjustment form: item, quantity (+ or −), and a required reason (damaged, expired, count correction).
- Movement history: every stock change with date, type, quantity, user, and reference.

### 6.6 Transactions

- Table: Receipt number, Date and time, Cashier, Items, Total, Status.
- Filters: date range, cashier, status (Completed, Voided, Refunded).
- Clicking a row opens the transaction details with the items and a "Reprint receipt" button.
- "Void" and "Refund" buttons are red outline buttons, require the owner's approval, and ask for a reason.

### 6.7 Shifts

- Close shift screen shows: starting cash, cash sales, refunds, expected cash, and an input for actual cash counted.
- Difference is shown in green (balanced or over) or red (short).
- Past shifts listed in a table with their difference.

### 6.8 Reports and dashboard

- Summary cards at the top: Today's sales, Number of transactions, Items sold, Low-stock items.
- Bar chart: sales per day for the selected range (bars in yellow `#FACC15`, with dark labels).
- Tables: best-selling products, low-stock list.
- Export buttons: "Export to Excel" and "Export to PDF" (outline style).

### 6.9 Users and settings (admin only)

- Users: table with name, username, role (Admin or Cashier), status, and actions.
- Settings: store name, address, contact number, VAT on/off and rate, receipt footer message.

## 7. Components

| Component | Style |
|---|---|
| Primary button | Yellow background, dark text, 8px radius |
| Secondary button | White background, border, dark text |
| Danger button | Red background or red outline, white or red text |
| Input | White, 1px border, yellow focus ring |
| Badge | Small pill: green (in stock), amber (low), red (out/void), gray (inactive) |
| Table | White surface, light row borders, hovered row in light gray, selected row in yellow tint |
| Dialog | White card, 12px radius, light shadow, dark overlay behind |
| Toast message | Bottom right; green for success, red for errors |
| Empty state | Centered gray icon and one line of text, e.g. "No products yet" with an add button |

Only one primary (yellow) button per area. Other actions use secondary or outline buttons so the main action is always clear.

## 8. States and feedback

- Loading: skeleton rows in tables, spinner inside buttons while saving.
- Success: green toast ("Sale completed", "Stock added").
- Errors: red text under the related field, plus a red toast for server errors.
- Confirmation dialogs for: clearing the cart, voiding, refunding, deleting products, closing a shift.
- Disabled buttons: lighter color with a not-allowed cursor.

## 9. Receipt layout (58mm / 80mm thermal printer)

```
        KUYA TATA STORE
     Store address line
       Contact number
--------------------------------
Receipt #: 000123
Date: 10/16/2026  08:15 AM
Cashier: Juan
--------------------------------
Item              Qty   Amount
Bread              2     40.00
Softdrinks 1L      1     65.00
--------------------------------
Subtotal                105.00
TOTAL                   105.00
Cash                    200.00
Change                   95.00
--------------------------------
   This is not an official
          receipt.
   Thank you, come again!
```

- Black text only, monospace font, no colors or images.
- Printed using a print-only CSS layout set to the printer's paper width.

## 10. Accessibility

- Text contrast of at least 4.5:1 (dark text on yellow passes; white on yellow does not).
- Status is never shown by color alone: badges always include a word (Low, Out, Void).
- All actions can be done with the keyboard; focus outlines are visible (yellow ring).
- Form fields always have visible labels, not just placeholders.

## 11. Tailwind quick reference

| Purpose | Class |
|---|---|
| Primary button | `bg-yellow-400 hover:bg-yellow-500 text-stone-900` |
| Highlight row / active menu | `bg-yellow-100 text-stone-900` |
| Icon or link accent | `text-yellow-700` |
| Page background | `bg-stone-50` |
| Card | `bg-white border border-stone-200 rounded-lg` |
| Secondary text | `text-stone-500` |
| Focus ring | `focus-visible:ring-2 ring-yellow-500` |
