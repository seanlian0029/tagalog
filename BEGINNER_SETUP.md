# SJ Collection Hub — Beginner Setup

Your public website design is preserved. The database source is now Excel instead of Google Sheets.

## What is already prepared

- `DATABASE_SERVER_POLISHED.xlsx` — your beautiful master Excel database, supplied separately.
- `admin.html` — phone-friendly Admin dashboard.
- `scripts/sync-excel-data.mjs` — checks Excel and creates the website JSON.
- `.github/workflows/publish-excel.yml` — automatically runs when the Excel file changes.
- `analytics.js` — privacy-safe event helper. It does not record PIN values, passwords, tokens, or video links.

## Important: where is the Admin username/password?

It is **not saved in Excel** and must never be placed in `admin.html`, `admin.js`, or `admin-config.js`.

During the one-time live connection, the username/password and GitHub publishing token are saved as protected secrets in the secure admin service. Normal visitors cannot download them.

## One-time connection still required

The Admin interface is complete, but these live actions stay locked until a secure service is connected:

- Admin login
- Downloading the private current Excel file
- Adding a PIN directly to Excel
- Uploading/publishing Excel to GitHub
- Backups and restore
- Live analytics numbers

This is intentional. A public GitHub Pages website cannot safely hold your password or publishing token.

Recommended live arrangement:

1. Public website remains on GitHub Pages.
2. Private `DATABASE_SERVER.xlsx` remains in a private repository or protected storage.
3. A small secure service handles Admin login and GitHub publishing.
4. PostHog (or another analytics provider) stores anonymous reports.

## Updating through GitHub before the secure connection

You can already use the Excel updater manually:

1. Copy `DATABASE_SERVER_POLISHED.xlsx` into the website repository.
2. Rename the copy to exactly `DATABASE_SERVER.xlsx`.
3. Upload `package.json`, `package-lock.json`, `scripts/sync-excel-data.mjs`, and `.github/workflows/publish-excel.yml` once.
4. Later, replace `DATABASE_SERVER.xlsx` with your updated copy.
5. Open the repository's **Actions** page and wait for **Publish Excel database** to show a green check.
6. Refresh the website after deployment finishes.

Do not delete the old Excel first. Upload the new file with the same name so version history remains available.

## Normal future Admin process

After the one-time secure connection:

1. Open `https://your-site/admin.html`.
2. Log in.
3. Press **Download Current Excel**.
4. Edit and save it.
5. Upload it in Admin → Database.
6. Read the added/changed/deleted preview.
7. Press **Publish Website Update**.
8. Wait for the green success message.

## Simple PIN behavior

- PIN is exactly 4 digits.
- `FULL` opens all categories.
- Category PIN opens only the selected category.
- Duplicate PIN values are allowed.
- No expiration date, active/disabled status, or customer account is added.

Example:

| CATEGORIES | PIN |
|---|---|
| FULL | 1111 |
| ANIME | 2222 |
| MOVIES | 2222 |

Here, `1111` opens everything and `2222` opens Anime and Movies.

## Analytics privacy

Safe events include page views, category clicks, title opens, searches, Play clicks, device type, and poster errors. Never record the actual PIN, Admin password, GitHub token, or full video URL.

## Files that remain private

- Master Excel workbook
- Admin username/password
- GitHub publishing token
- Customer notes
- Private backups

Generated JSON used by the public site—including simple PIN data—remains publicly inspectable, as discussed.
