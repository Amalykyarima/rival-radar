# Rival Radar

Competitor-aware pricing and prepaid voucher campaigns for Fresha merchants. Demo merchant: ABC Men's Grooming (synthetic data).

## Run
```
pip install -r requirements.txt
export NEBIUS_API_KEY=... TAVILY_API_KEY=...   # optional: without them the agent runs its fallback pipeline
uvicorn server:app --host 0.0.0.0 --port 8000
```

## Demo
Open **http://localhost:8000/demo.html**: customer booking site on the left, owner side on the right (switch between the price check and campaigns).

| Page | Who | What |
|---|---|---|
| `/` | Owner | Rival Radar price check: Tavily research + Nebius agent via `POST /api/run` |
| `/campaigns.html` | Owner | Approve, revoke and prove delivery of offers; price-gap alerts; segment vouchers from the agent; action log; tests |
| `/shop.html` | Customer | Sign in, book with deposit, "Not now" captures price in mind, inbox, Apply voucher at checkout, wallet |

The two sides share state through the browser (`static/store.js`), so open them in the same browser. All people, competitors and prices in `static/demo-data.js` are synthetic.

Demo order: Reset demo (campaigns) → shop: sign in as George Lee, open Beard trim, Not now, enter £12 → campaigns: Approve → shop: offer appears, Apply voucher, book → campaigns: Run agent → Approve and send segment vouchers → View in shop.
