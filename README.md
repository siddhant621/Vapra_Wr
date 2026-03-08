# Vapra Workshop

A garage service platform for booking automotive repairs, managing mechanics, and tracking appointments.

## 🚀 Getting Started

1. Install dependencies:

```bash
npm install
```

2. Configure your environment variables (see `.env.example` or `.env`)

3. Generate Prisma client and run migrations:

```bash
npm run prisma generate
npm run prisma migrate dev
```

4. Start the development server:

```bash
npm run dev
```

Then open http://localhost:3000 in your browser.

## 🧩 Project Structure

- `app/` - Next.js App Router pages
- `components/` - Shared UI components
- `lib/` - Utilities, data, and Prisma client
- `actions/` - Server actions (API-like functions)
- `prisma/` - Database schema and migrations

## ✅ Key Features

- Online booking system for repairs and maintenance
- Mechanic profiles and service listings
- Credit-based payments and payouts
- Video consultations (Vonage)
- Clerk authentication

## 🛠️ Notes

- Make sure `DATABASE_URL` is configured in your `.env` file.
- Update `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` with your Clerk credentials.

---

Happy building! 🚗