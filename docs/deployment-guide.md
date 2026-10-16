# Kuya Tata POS — Deployment Guide

This guide puts Kuya Tata POS online: the app on **Vercel**, the database, login, and the
`admin-users` function on **Supabase**. Steps marked **(manual)** must be done by a team member
in a browser or terminal; everything else is already prepared in the repository.

The project uses **one Supabase project** for both testing and the live store. Because of that, the
test and sample data must be removed once, just before the store starts (step 6).

---

## 1. What is already prepared

| Item | Where |
|---|---|
| Database migrations (tables, functions, security rules) | `supabase/migrations/` — all applied to the Supabase project |
| `admin-users` Edge Function (add users, reset passwords and PINs) | `supabase/functions/admin-users/` — deployed and active |
| Vercel settings (build command, page links, caching) | `vercel.json` |
| One-time go-live reset script | `supabase/scripts/reset_for_go_live.sql` |
| App icons and install settings (PWA) | `public/icons/`, `public/manifest.webmanifest`, `vite.config.ts` |

All migrations were also checked to apply cleanly from an empty database (see
`docs/test-results.md`, section 4).

---

## 2. Turn off public sign-ups (manual, required)

Right now anyone with the app's public key could create an account. Only the owner should add users
(on the **Users** page).

1. Open the Supabase dashboard → your project → **Authentication** → **Sign In / Providers**.
2. Turn **off** "Allow new users to sign up".
3. Leave the **Email** provider turned on (the app logs in with it behind the scenes).
4. Save.

The Users page keeps working: it creates accounts through the `admin-users` function, which is not
affected by this setting.

---

## 3. Deploy the frontend on Vercel (manual)

1. Sign in at <https://vercel.com> with the team's GitHub account.
2. **Add New → Project** → import the `POSystem` repository.
3. Framework: **Vite** (detected from `vercel.json`). Build command `npm run build`, output `dist`.
4. **Environment Variables** — add these two (names only here; copy the values from the Supabase
   dashboard → **Project Settings → API Keys**, or from your local `.env`):

   | Name | Value from |
   |---|---|
   | `VITE_SUPABASE_URL` | Supabase → Project Settings → Data API → Project URL |
   | `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase → Project Settings → API Keys → **Publishable** key (`sb_publishable_…`) |

   Never add a **secret** key (`sb_secret_…`) or the service role key to Vercel. The app does not
   need them.
5. Set the **Production Branch** to `main`.
6. Click **Deploy**. Vercel gives an address such as `https://kuya-tata-pos.vercel.app`.
7. Open the address, log in, and refresh on any page (for example `/reports`): it must load, not show
   a 404. `vercel.json` sends every page link to `index.html`, which makes this work.

Every push to `main` deploys a new version. Installed apps show **"Update available"** and load the
new version when **Reload** is tapped.

---

## 4. Set the Supabase Auth site URL (manual)

1. Supabase dashboard → **Authentication** → **URL Configuration**.
2. **Site URL**: the Vercel address, for example `https://kuya-tata-pos.vercel.app`.
3. **Redirect URLs**: add the same address and `https://kuya-tata-pos.vercel.app/**`.
   If the team also tests locally, keep `http://localhost:5173/**` in the list.
4. Save.

The app logs in with a username and password only (no email links), so these settings are a safety
default; they do not change how logging in works.

---

## 5. Check the Edge Function (manual check)

The `admin-users` function is already deployed. To check it in the dashboard: **Edge Functions** →
`admin-users` → status **Active**.

Deploy it again after any change in `supabase/functions/`:

```
npx supabase functions deploy admin-users --use-api
```

`--use-api` builds it on Supabase's servers, so Docker is not needed. The function gets
`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from Supabase automatically; nothing is added to
`.env` or Vercel.

---

## 6. Remove the test data before the first real sale (manual, one time)

The project still has the sample products from `seed.sql` and the sales, shifts, and users made
during testing.

1. Make a backup first (section 8).
2. Supabase dashboard → **SQL Editor** → paste `supabase/scripts/reset_for_go_live.sql` → **Run**.
   It empties sales, shifts, stock history, products, and categories, restarts receipt numbers at
   `000001`, and resets the store settings to their defaults. User accounts are kept.
3. Remove the test accounts: **Authentication → Users** → delete the users whose names start with
   `e2e_` and `zz_` (if any remain). Alternatively turn them off on the app's **Users** page.
4. Never run `npx supabase db push --include-seed` again: that would load the sample data.

After the reset, **do not run the SQL test scripts (`npm run db:test`) on this project.** Their
changes are undone, but they use up receipt numbers, which would leave gaps in the receipts.

---

## 7. Create the first admin account in production

The development admin account (`admin`) already exists.

1. Log in to the live app as `admin` / `admin1234`.
2. **Users** → **Password** on your own row → set a strong new password (at least 8 characters).
   Or add a new admin account for the owner and turn off `admin` afterwards.
3. Top bar menu → **Set approval PIN** → choose 4 to 6 digits. Voids and refunds need it.
4. **Settings** → fill in the real store name, address, contact number, VAT, receipt footer, and
   paper width.
5. **Users** → **Add user** for each cashier.
6. **Products** → add the categories and products; **Inventory → Stock in** for the opening stock.

If no admin account exists at all (for example in a brand-new project), create one in the Supabase
dashboard: **Authentication → Users → Add user → Create new user** with email
`username@kuyatata.local`, a password, and **Auto Confirm User** ticked. Then in **SQL Editor**:

```sql
update public.profiles set role = 'admin', full_name = 'Store Owner' where username = 'username';
```

---

## 8. Backups

### Automatic backups

Supabase makes daily backups on paid plans (**Database → Backups**). The free plan does not keep
backups you can restore yourself, so make a manual backup at least once a week and before any big
change.

### Manual backup (CLI, recommended weekly)

From the project folder:

```
npx supabase db dump --linked --data-only -f backups/data-YYYY-MM-DD.sql
npx supabase db dump --linked -f backups/schema-YYYY-MM-DD.sql
```

- The first file has all the data (products, sales, shifts, users' profiles).
- The second file has the database structure (it can also be rebuilt from `supabase/migrations/`).
- Keep the files somewhere safe outside the computer (for example a private Google Drive folder).
  Do **not** commit them to GitHub: they contain store data.

### Restore

Restoring replaces data, so do it only when needed and after a fresh backup.

1. Restore into a **new, empty** Supabase project first if possible, to check the backup.
2. Apply the structure: `npx supabase db push` (from `supabase/migrations/`) in the new project.
3. Load the data: Supabase dashboard → **SQL Editor** → paste the data backup file → **Run**, or use
   `psql` with the database connection string from **Project Settings → Database**.
4. Deploy the `admin-users` function to the new project and point Vercel's environment variables to
   it if the store moves to that project.

Login accounts (Supabase Auth users) are included in the data dump (`auth` schema) only when the
dump includes it; the safest way to keep them is to restore within the same project or re-create
the users on the Users page.

---

## 9. Release checklist

- [ ] Public sign-ups turned off (section 2)
- [ ] Vercel project with both environment variables, deployed from `main` (section 3)
- [ ] Site URL and redirect URLs set (section 4)
- [ ] `admin-users` function active (section 5)
- [ ] Backup made, then test data removed (sections 8 and 6)
- [ ] `admin` password changed, approval PIN set, store settings filled in (section 7)
- [ ] Cashier accounts added; one test sale and one shift close done on the store's tablet
- [ ] App installed on the tablet or phone (Share → Add to Home Screen / Install app)
