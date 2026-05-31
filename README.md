# Royal Taj — RSVP System

Multi-venue RSVP management for Royal Taj restaurants. Guests scan a QR code printed on their invitation, fill in their details, and are automatically assigned a table. Staff manage events, venues, tables, and guest lists from an admin dashboard.

---

## Features

- **QR code invitations** — one QR code per event, print on physical invitations
- **Guest RSVP form** — name, contact, guest count, relationship, transport needs, dietary requirements
- **Automatic table allocation** — zone-based (Family / Friends / Colleagues) or auto-fill by availability
- **Multi-venue** — manage Royal Taj Sentosa, Orchard, and any future locations from one system
- **Admin dashboard** — view RSVPs, assign/reassign tables, toggle events active/inactive
- **Secure** — JWT sessions, bcrypt passwords, Zod input validation, IP rate limiting

---

## Getting Started

### Prerequisites

- [Node.js LTS](https://nodejs.org) — download and install, tick **"Add to PATH"**

### 1. Install dependencies

Open a terminal in this folder:

```bash
npm install
```

### 2. Set up the database

```bash
npx prisma db push
npx tsx prisma/seed.ts
```

This creates a local SQLite database and seeds it with:
- Two Royal Taj venues (Sentosa, Orchard)
- A sample Gala Dinner event
- Default admin account

### 3. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

Or use the one-shot setup script:

```powershell
.\setup.ps1
```

---

## Admin Login

| Field    | Value             |
|----------|-------------------|
| URL      | /admin/login      |
| Email    | admin@royaltaj.sg |
| Password | admin123          |

**Change this password before going live.**

---

## Workflow

### Setting up a new event

1. Go to **Venues** — confirm your venue exists, or add a new one
2. Go to **Events → New Event** — fill in name, date, venue, allocation mode
3. Open the event → **Tables tab**
   - For weddings/zone events: click **Add default zones**, then add tables per zone
   - For banquets/auto events: add numbered tables with capacity
4. Go to the **QR Code tab** — right-click the QR code to save as image, print on invitations

### On the day

- Guests scan the QR code → complete the RSVP form → receive their table assignment instantly
- Open the **RSVPs tab** to see all guests, transport requests, dietary needs
- Use the table dropdown next to any guest to manually reassign them

### Allocation modes

| Mode | Best for |
|---|---|
| **Zone-based** | Weddings — guests select their relationship (Family, Friends, Colleagues) and are seated in the matching zone |
| **Auto** | Banquets — tables fill in order, oldest tables filled first before opening new ones |
| **Manual** | Admin assigns every guest individually |

---

## Environment Variables

Copy `.env.example` to `.env` and fill in:

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"
```

Generate a secure secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Deploying to Production

### Vercel (recommended)

1. Push this repo to GitHub
2. Import at [vercel.com](https://vercel.com)
3. Set environment variables: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`

### Database for production

SQLite works for a single server. For multi-region or higher traffic, switch to PostgreSQL:

1. Change `provider = "sqlite"` to `provider = "postgresql"` in `prisma/schema.prisma`
2. Update `DATABASE_URL` to your PostgreSQL connection string
3. Run `npx prisma db push`

---

## Project Structure

```
app/
  admin/          # Admin dashboard (events, venues, login)
  api/admin/      # Protected API routes (events, venues, tables, zones, RSVPs)
  api/rsvp/       # Public RSVP submission endpoint
  rsvp/           # Guest-facing RSVP form and success page
components/       # AdminNav, EventDetailClient, QRCode, SessionProvider
lib/
  allocation.ts   # Table seating logic (zone / auto / manual)
  auth.ts         # NextAuth config
  prisma.ts       # Prisma client singleton
  validations.ts  # Zod schemas
prisma/
  schema.prisma   # Database schema
  seed.ts         # Seed data (Royal Taj venues + sample event)
```

---

## Security Notes

- `.env` is in `.gitignore` — never commit it
- All admin API routes verify the session before responding
- Guest RSVP endpoint is rate-limited to 5 submissions per IP per 10 minutes
- Set `NEXTAUTH_URL` to your exact production domain (required by NextAuth CSRF protection)
