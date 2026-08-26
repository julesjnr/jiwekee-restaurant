# Jiwekee Restaurant — React + Express + PostgreSQL

Rewrite of the original PHP/MySQL app (`MyRestaurant`) as a React SPA backed by an
Express API and PostgreSQL. Functionality carried over: menu browsing, cart,
login/signup, wallet-balance payment, M-Pesa STK push checkout, and an order
history dashboard.

## What changed from the PHP version

| PHP version | React version |
|---|---|
| `$_SESSION['cart']` | `CartContext` + `localStorage` on the client |
| `$_SESSION['user_id']` | JWT in an httpOnly cookie, verified by `requireAuth` middleware |
| MySQL (`mysqli`) | PostgreSQL (`pg`) |
| Cart total trusted from a hidden form field | Total is always recomputed server-side from `menu_items` on checkout |
| `password_hash()` / manual SQL escaping | `bcryptjs` + parameterized queries throughout |
| One `.php` file per page | React Router pages under `client/src/pages` |

## Project layout

```
server/   Express API, PostgreSQL schema + migration script
client/   React (Vite, plain JS) SPA
```

## Setup

### 1. Database
Create a Postgres database, then:
```bash
cd server
cp .env.example .env      # fill in DATABASE_URL, JWT_SECRET
npm install
npm run db:migrate        # creates tables + seeds the menu
npm run dev                # starts the API on :4000
```

### 2. Client
```bash
cd client
cp .env.example .env      # VITE_API_BASE=http://localhost:4000/api
npm install
npm run dev                # starts Vite on :5173
```

### 3. M-Pesa
The checkout route runs in **mock mode** (logs to the server console, no real
STK push) until you set `MPESA_CONSUMER_KEY`, `MPESA_CONSUMER_SECRET`, and
`MPESA_PASSKEY` in `server/.env` with real Safaricom Daraja sandbox/production
credentials, and point `MPESA_CALLBACK_URL` at a publicly reachable URL
(e.g. an ngrok tunnel during development — there's an `ngrok.zip` in the old
repo that suggests that's what you were already using).

## Notes / things you'll likely want to adjust
- Wallet top-ups aren't implemented yet (the old app didn't expose a wallet-pay
  entry point either, just checked balance) — add a `/api/wallet/topup` route
  when you're ready to wire that up.
- `order_items` is new — the old schema didn't persist line items per order,
  only the total. Useful for a future "reorder" feature or receipts.
- CORS is locked to `CLIENT_ORIGIN` in `server/.env` — update it for production.
