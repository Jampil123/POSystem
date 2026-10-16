# Kuya Tata POS — User Manual

This manual is for the people who use the system every day:

- **Part A — Cashier:** log in, open a shift, make a sale, print a receipt, close the shift.
- **Part B — Owner (admin):** products, stock, reports, users, settings, and approving voids and
  refunds.

The system works on a computer, a tablet, or a phone. Buttons are big so they are easy to tap.

---

## Part A — Cashier

### A1. Log in

1. Open the Kuya Tata POS app (or the website link from the owner).
2. Type your **username** and **password**. The owner gives you these.
3. Tap **Log in**.

If you see **"Wrong username or password"**, check the spelling and try again.
If you see **"This account is turned off"**, ask the owner.

### A2. Open your shift

You must open a shift before you can sell.

1. Count the cash in the drawer.
2. Type the amount in **Starting cash**.
3. Tap **Open shift**.

The top of the screen now says **"Shift open since …"**.

### A3. Make a sale

The sale has three steps on one screen: **1 Add items**, **2 Review cart**, **3 Payment**.

**Step 1 — Add items**

- **Tap** a product to add one. Tap again to add more.
- Or **scan** the barcode with the barcode scanner.
- Or **type** the name in **Search or scan**.
- On a tablet or phone, the **camera** button scans a barcode with the camera.
- Gray products marked **Out** cannot be sold. Products marked **Low** are almost gone.
- Tap **Next: Review cart** when done.

**Step 2 — Review cart**

- Use **−** and **+** to change the number of an item.
- Tap the **trash** icon to remove an item.
- **Discount** (if the owner allows it): tap **₱** for a peso amount or **%** for a percent, then
  type the discount.
- Check the **Total**, then tap **Next: Payment**.

**Step 3 — Payment (cash only)**

1. Type the cash the customer gave in **Cash received**, or tap a quick button
   (₱20, ₱50, ₱100, ₱200, ₱500, ₱1,000, or **Exact amount**).
2. The **Change** shows in green. Give this to the customer.
3. If it says **"Insufficient cash"** in red, the cash is not enough.
4. Tap **Complete sale**.

The bar at the bottom always shows the number of items, the total, and the next button.

**Keyboard shortcuts on a computer:** **F1** = search, **F2** = payment, **F4** = clear the cart.

### A4. Print the receipt

After **Complete sale**, the receipt opens.

1. Check the paper size (**58mm** or **80mm**).
2. Tap **Print receipt** and choose the receipt printer.
3. Tap **Next customer** to start the next sale.

To print a receipt again later: **Transactions** → tap the sale → **Reprint receipt**.
A reprint says **"REPRINT"** at the top.

### A5. Mistakes and returns

You need the owner (or another admin) for these. They type their **username** and **approval PIN**
on your screen; you do not need to log out.

- **Void** — cancel a sale you just made (only while your shift is still open).
  **Transactions** → tap the sale → **Void** → type the reason → the owner types their username and
  PIN → **Continue** → **Void sale**.
- **Refund** — a customer returns a whole sale from an earlier shift.
  Same steps, but tap **Refund**. The money for the refund comes out of your drawer.

The items go back into stock automatically.

### A6. Close your shift

At the end of your shift:

1. Tap **Shifts**.
2. Check **Starting cash**, **Cash sales**, **Refunds**, and **Expected cash**.
3. Count the cash in the drawer and type it in **Actual cash counted**.
4. The **Difference** shows: green **Balanced** or **Over**, or red **Short**.
5. Tap **Close shift**, then **Close shift** again to confirm.

After closing, you cannot sell until you open a new shift.

### A7. Log out

Tap your name at the top right → **Log out**.

---

## Part B — Owner (admin)

The owner sees everything: POS, Products, Inventory, Transactions, Shifts, Reports, Users, and
Settings. On a phone, some of these are under **More** at the bottom.

### B1. Categories and products

**Categories** (for example Beverages, Snacks):

1. **Products** → **Manage categories**.
2. Type a name in **New category** → **Add**.
3. **Rename** or **Remove** a category. A category with products cannot be removed; move its
   products to another category first.

**Add a product:**

1. **Products** → **Add product**.
2. Fill in the **Name**, **Category**, **Barcode** (optional: type it or scan it), **Cost price**,
   **Selling price**, and **Low-stock level**.
3. If the selling price is lower than the cost, a warning appears. You can still save.
4. Tap **Add product**.

**Edit:** tap **Edit** on the product. **Stop selling a product:** tap **Deactivate**. Products are
never deleted, so old receipts stay correct. Tap **Activate** to sell it again.

Stock is not changed here. Use **Inventory** (below).

### B2. Stock in (deliveries)

1. **Inventory** → **Stock in** tab.
2. Type the **Supplier name** (optional) and the **Date received**.
3. In **Add item**, search or scan each product, then type the **Quantity** and **Unit cost**.
4. Tap **Save stock in**.

### B3. Adjustments (damaged, expired, counting)

1. **Inventory** → **Adjustments** tab.
2. Choose the **Product**.
3. Tap **Remove stock** or **Add stock**, and type the **Quantity**.
4. Choose a **Reason** (Damaged, Expired, Count correction, or Other with details).
5. Tap **Save adjustment**.

You cannot remove more than the stock on hand.

**Stock on hand** shows every product with **In stock**, **Low**, or **Out**.
**Movement history** shows every stock change: date, type, quantity, user, and reference.

### B4. Approve voids and refunds

First set your **approval PIN**: tap your name at the top → **Set approval PIN** → type 4 to 6
digits twice → **Save PIN**. Keep it private.

When a cashier needs a void or refund, type your **username** and **PIN** on their screen.
After 5 wrong PINs, the PIN is locked for 5 minutes.

### B5. Transactions

**Transactions** lists every sale. Filter by **receipt number**, **date**, **cashier**, or
**status** (Completed, Voided, Refunded). Tap a sale to see the items, the totals, who approved a
void or refund, and to reprint the receipt.

### B6. Shifts

**Shifts** lists every shift with the expected cash, actual cash, and difference.

### B7. Reports

1. **Reports** → choose **Today**, **Yesterday**, **This week**, **This month**, or **Custom**.
2. See **Total sales**, **Transactions**, **Items sold**, **Average sale**, **Low-stock items**,
   and **Gross profit**.
3. The chart shows sales per day (**Show as table** lists the numbers).
4. See **Best sellers**, **Low stock**, and the **Shift summary**.
5. Tap **Export to Excel** or **Export to PDF** to save the report.

Voided sales are not counted. Refunds are taken away on the day they happen. Dates use Philippine
time.

### B8. Users

1. **Users** → **Add user**.
2. Type the **Full name**, a **Username**, a **Password** (at least 8 characters, twice), and choose
   the **Role** (**Cashier** or **Admin**).
3. Tap **Add user**. Give the username and password to the person.

Other actions:

- **Edit** — change the name or role.
- **Password** — set a new password when someone forgets theirs.
- **PIN** — remove an admin's approval PIN (they set a new one from their menu).
- **Deactivate** — turn off someone who no longer works at the store. They are logged out and cannot
  log in. Their past sales are kept. **Activate** turns them back on.

You cannot turn off or demote your own account, and the last admin cannot be removed.

### B9. Settings

**Settings** has the store name, address, contact number, VAT, receipt footer message, receipt paper
width, and the default low-stock level for new products. Tap **Save settings**.

VAT changes apply to new sales only. Past sales keep the VAT they were saved with.

### B10. Install the app on a tablet or phone

- **Android (Chrome):** open the app link → menu → **Install app** / **Add to Home screen**.
- **iPhone or iPad (Safari):** open the app link → **Share** → **Add to Home Screen**.

If the internet is off, the app shows **"No internet connection"**. Sales cannot be saved without
internet; the cart is kept until the connection is back.

When a new version is ready, **"Update available"** appears. Tap **Reload** when you are not in the
middle of a sale.

---

## Quick help

| Problem | What to do |
|---|---|
| "Wrong username or password" | Check the spelling. The owner can set a new password on the **Users** page. |
| "This account is turned off" | Ask the owner to **Activate** the account. |
| "Your session has ended" | Log in again. |
| The POS says it is locked | Open a shift first (**Starting cash** → **Open shift**). |
| A product cannot be tapped | It is out of stock. Do a **Stock in** (owner). |
| "Insufficient cash" | The cash received is less than the total. |
| Void button is missing | The shift is closed; use **Refund** instead. |
| "No internet connection" | Check the Wi-Fi or mobile data. The app continues when it is back. |
