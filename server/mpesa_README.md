M-Pesa (Daraja) integration notes

Overview

This project uses Safaricom Daraja STK Push to collect payments from customers.

Required environment variables (see `.env.example`):

- `MPESA_CONSUMER_KEY` — Daraja consumer key
- `MPESA_CONSUMER_SECRET` — Daraja consumer secret
- `MPESA_PASSKEY` — Passkey for the shortcode
- `MPESA_SHORTCODE` — Business short code (e.g. 174379 for sandbox Paybill)
- `MPESA_ENV` or `MPESA_ENVIRONMENT` — `sandbox` or `production` (defaults to `sandbox`)
- `MPESA_CALLBACK_URL` — Public callback URL for STK results
- `MPESA_TIMEOUT_URL` — Optional timeout/validation URL

Common reasons STK prompt is not shown

1. Missing or incorrect Daraja credentials (consumer key/secret/passkey/current shortcode).
2. Using a phone number not registered/allowed by the Daraja sandbox. The sandbox often requires test numbers or using the Daraja simulator to inject callbacks.
3. Callback URL not publicly accessible — Safaricom cannot deliver webhook without a public URL (use `ngrok` or similar for local development).
4. Incorrect phone number format — use `2547XXXXXXXX` (the code normalizes inputs like `07...`, `7...`, or `+254...`).
5. The Daraja sandbox may accept the request but not send a prompt to arbitrary numbers — use the Daraja simulator to test and use sandbox test numbers.

Local testing / debug steps

1) Start server with M-Pesa env vars set (or load `.env`):

```bash
# from server/ folder
cp .env.example .env
# edit .env and fill MPESA_* vars, then run
npm run dev
```

2) Expose your local server (so Daraja can reach callbacks). Example with ngrok:

```bash
# Install ngrok and run
ngrok http 4000
# Copy https://... forwarding URL and set MPESA_CALLBACK_URL to https://<your-ngrok>/api/mpesa/callback in your .env
```

3) For sandbox testing, use Daraja's developer portal to create an app and obtain Consumer Key/Secret and passkey for `174379` (or your assigned shortcode). Use the sandbox simulator to trigger responses.

4) Trigger STK push (via frontend checkout) or call the checkout endpoint directly:

```bash
curl -X POST -H "Content-Type: application/json" -b cookies.txt -c cookies.txt \
  -d '{"items":[{"id":1,"quantity":1}],"paymentMethod":"mpesa","phone":"0722XXXXXX"}' \
  http://localhost:4000/api/orders
```

5) If the API returns a `checkoutRequestId` but no prompt appears, simulate a callback locally (development only):

```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"CheckoutRequestID":"<CHECKOUT_ID>","ResultCode":0,"MpesaReceiptNumber":"ABC123"}' \
  http://localhost:4000/api/mpesa/simulate-callback
```

6) Verify the order status changed in the database and the `mpesa_receipt` got recorded.

Notes and troubleshooting

- Ensure `MPESA_CALLBACK_URL` uses HTTPS and is reachable by Safaricom. For production, register callback URL in Daraja if required.
- If using sandbox, follow Daraja sandbox docs — often you have to use the Daraja simulator to emulate customer interactions.
- Enable debug logs: set `DEBUG=*` or ensure `console.debug` output is visible, and check the `[MPESA] STK push request:` and response logs in your server logs.

If you share the exact Daraja JSON response your server received (server logs show it), I can help interpret and adjust the request accordingly.
