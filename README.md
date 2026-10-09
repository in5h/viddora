# viddora · website

Static multi-page frontend for viddora ("Ask anything. Watch it click.").

Pages: Home, How it works, Pricing, Sign in, Sign up, My account (lessons, credit history, plan and billing).
The 3D logo is rendered with three.js (loaded from jsDelivr). Accounts, credits and lessons are a
front-end demo stored in the browser's localStorage; there is no backend yet.
Light and dark mode follow the system setting until the visitor picks one with the nav toggle (saved as `viddora-theme`).

## Deploy
Vercel: import this repo, framework preset "Other", no build command, output directory = root.
`vercel.json` turns on clean URLs (/pricing instead of /pricing.html).

## Run locally
    python3 -m http.server 8080   # then open http://localhost:8080

## Brand
Follows viddora brand guidelines v1.0 (October 2026): Midnight #24124F, Violet #6A45E0, Mint #3CC17E,
Lavender #ECE8FB, Mist #F6F4FD, White; violet gradient #7D5CEB → #4B2BB8 and mint gradient #52D392 → #22936A;
Quicksand Bold headlines, Quicksand SemiBold spaced-capital labels, Nunito body. Logos and favicons in `assets/`
come straight from the brand kit (`viddora-logo.png` on light, `viddora-logo-white.png` on midnight).
Always write viddora in lowercase.
