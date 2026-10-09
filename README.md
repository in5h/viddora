# viddora · website

Static multi-page frontend for viddora ("Ask anything. Watch it click.").

Pages: Home, How it works, Pricing, Sign in, Sign up, My account (lessons, credit history, plan and billing).
The 3D logo is rendered with three.js (loaded from jsDelivr). Accounts, credits and lessons are a
front-end demo stored in the browser's localStorage; there is no backend yet.

## Deploy
Vercel: import this repo, framework preset "Other", no build command, output directory = root.
`vercel.json` turns on clean URLs (/pricing instead of /pricing.html).

## Run locally
    python3 -m http.server 8080   # then open http://localhost:8080
