# VersaRail AI — Landing & Download Site

Static showcase and multi-platform download website for [**VersaRail AI**](https://github.com/himanshu-dot-dev/versarail-ai), built with pure HTML, CSS, and vanilla JavaScript for zero-config deployment on **Cloudflare Pages**.

## Structure

- `index.html` — Single-page showcase, interactive desktop workspace preview, Open Graph / X social card metadata, and OS-aware download center.
- `styles.css` — Dark VersaRail AI design tokens (`#090a0f`, `#4f46e5`, `#38bdf8`), responsive layout, and contained ambient glow layers (`overflow-x: clip`).
- `script.js` — Client-side OS detection, accessible mobile navigation, interactive preview views (`Chat & Diff`, `AI Providers` 429 failover simulator, `Permissions` TOCTOU guard, `Usage & Quotas`), and clipboard verification copy.
- `assets/` — Vector favicon (`favicon.svg`), `1200×630` social share image (`og-image.png`), app mark (`versarail-mark.png`), and 16 provider SVG icons (`assets/providers/`).
- `_headers` — Cloudflare Pages security and asset caching headers.
- `404.html` & `robots.txt` — Static fallback and crawler directives.

## Deploy to Cloudflare Pages

1. Connect `himanshu-dot-dev/versarail-landing` in **Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to Git**.
2. Use these build settings:
   - **Framework preset:** `None`
   - **Build command:** *(leave empty)*
   - **Build output directory:** `/`
3. If attaching a custom domain later, update `og:url`, `og:image`, `twitter:image`, and `<link rel="canonical">` in `index.html` to match your custom domain.

## Download Links Contract

Download buttons point to permanent GitHub Releases URLs on `himanshu-dot-dev/versarail-ai`:

- `https://github.com/himanshu-dot-dev/versarail-ai/releases/latest/download/VersaRail-AI-Setup-win-x64.exe`
- `https://github.com/himanshu-dot-dev/versarail-ai/releases/latest/download/VersaRail-AI-Portable-win-x64.exe`
- `https://github.com/himanshu-dot-dev/versarail-ai/releases/latest/download/VersaRail-AI-mac-arm64.dmg`
- `https://github.com/himanshu-dot-dev/versarail-ai/releases/latest/download/VersaRail-AI-mac-x64.dmg`
- `https://github.com/himanshu-dot-dev/versarail-ai/releases/latest/download/VersaRail-AI-linux-x86_64.AppImage`
- `https://github.com/himanshu-dot-dev/versarail-ai/releases/latest/download/VersaRail-AI-linux-amd64.deb`
- `https://github.com/himanshu-dot-dev/versarail-ai/releases/latest/download/SHA256SUMS.txt`

