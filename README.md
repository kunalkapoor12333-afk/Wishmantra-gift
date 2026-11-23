# WishMantra Gift Gallery Website

Full-stack e-commerce storefront, live billing & GST invoice system, and admin console for **WishMantra** (Stationery · Gaming · Gifts — Sadar Bazaar, Ambala Cantt).

## Tech Stack
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons
- **Backend**: Node.js 22+, Express, native SQLite (`node:sqlite`)

## Running Locally

```bash
# 1. Install dependencies
npm install

# 2. Start development server (frontend + API on port 3000)
npm run dev
```

Open `http://localhost:3000` in your browser.

## Production Build

```bash
npm run build
NODE_ENV=production npm start
```

## Admin Console
- Visit `/admin` (or click **Admin Login** inside the mobile hamburger menu or footer).
- Default studio passcode: `wishmantra2026` (override via `ADMIN_PASSCODE` environment variable).
