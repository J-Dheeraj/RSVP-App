# RSVP App

Wedding & event RSVP with QR-code invitations, zone-based table allocation, and an admin dashboard.

## Quick Start

### 1. Install Node.js
Download from https://nodejs.org (LTS version). Tick "Add to PATH" during install.

### 2. Install dependencies & set up database

Open a terminal in this folder and run:

```bash
npm install
npx prisma db push
npx tsx prisma/seed.ts
```

### 3. Start the app

```bash
npm run dev
```

Open http://localhost:3000

---

## Admin login (after seeding)

| Field    | Value             |
|----------|-------------------|
| Email    | admin@royaltaj.sg |
| Password | admin123          |

**Change this password before going live.**

---

## How it works

1. **Create an event** in the admin dashboard (`/admin/events/new`)
2. **Set up zones** (Family, Friends, Colleagues, etc.) under the Tables tab
3. **Add tables** and assign them to zones
4. **Get the QR code** from the QR Code tab — print it on invitations
5. Guests scan → fill in the RSVP form → table is auto-assigned by zone
6. **Admin can manually reassign** tables from the RSVPs tab

---

## Security notes

- `.env` is in `.gitignore` — never commit your secrets
- Change `NEXTAUTH_SECRET` in `.env` to a random string before deploying:
  `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- Change the default admin password after first login
- Set `NEXTAUTH_URL` to your production domain when deploying

---

## Deploy to Vercel

1. Push this repo to GitHub
2. Import it on vercel.com
3. Set environment variables: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
4. For production, switch `DATABASE_URL` to a PostgreSQL URL (change `provider = "sqlite"` to `provider = "postgresql"` in `prisma/schema.prisma`)
