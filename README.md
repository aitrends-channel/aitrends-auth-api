# auth-api

This repo is a small Next.js API backend for a SaaS subscription service using Supabase authentication and Paystack webhooks.

## What it does

- Provides public user signup via email and password setup
- Verifies Supabase auth sessions
- Tracks subscription status using Paystack webhook events
- Stores paid/subscription state in Supabase user metadata

## Routes

### `POST /api/auth/signup`
- Public signup endpoint
- Request body: `{ "email": "user@example.com" }`
- Creates or invites the user in Supabase using `inviteUserByEmail`
- Sends a password setup link to the user
- Marks the user as `paid: false` and records `signed_up_at`

### `GET /api/auth/verify`
- Verifies the Supabase JWT from `Authorization: Bearer <token>`
- Returns whether the user is currently paid
- Response includes:
  - `paid`
  - `email`
  - `user_id`
  - `paid_at`

### `GET /api/subscription/status`
- Verifies the Supabase JWT
- Returns subscription metadata and Paystack details
- Response includes:
  - `paid`
  - `paid_at`
  - `plan`
  - `subscription_code`
  - `status`
  - `paystack`

### `POST /api/webhooks/paystack`
- Paystack webhook endpoint
- Must include `x-paystack-signature`
- Validates the request using `PAYSTACK_WEBHOOK_SECRET`
- Handles active subscription/payment events to mark users paid
- Handles cancellation/failure events to mark users unpaid
- If a Paystack event arrives for a user who does not exist yet, it invites that user and sets them paid

## Environment variables

Create a `.env` file with:

```env
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
PAYSTACK_SECRET_KEY=
PAYSTACK_WEBHOOK_SECRET=
APP_URL=
ALLOWED_ORIGIN=
```

### Notes

- `APP_URL` is used for the password setup redirect URL
- `ALLOWED_ORIGIN` controls CORS for `/api/*`
- `PAYSTACK_SECRET_KEY` is the server key used for any Paystack API calls if you add them later
- `PAYSTACK_WEBHOOK_SECRET` is used to verify incoming webhook signatures

## Running locally

```bash
npm install
npm run dev
```

The app runs on port `3001` by default.

## Important behavior

- Signup is public; users can self-register
- Payment is handled separately through Paystack
- The backend updates `app_metadata.paid` only after receiving Paystack webhook events
- There is no Gumroad or license key flow in the current API

## Project structure

- `app/api/auth/signup/route.ts`
- `app/api/auth/verify/route.ts`
- `app/api/subscription/status/route.ts`
- `app/api/webhooks/paystack/route.ts`
- `lib/supabase.ts`

