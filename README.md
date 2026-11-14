## NUMCALC

Numerology calculator and calendar. Next.js 16, static export, hosted on Cloudflare Pages at calc.flowcreators.org.

## Local development

```bash
npm install
npm run dev
```

Open http://localhost:3000. Use npm, not bun.

## Build

```bash
npm run build
```

Static output goes to `dist/` (`output: "export"`).

## Deploy (Cloudflare Pages, auto-deploy from GitHub)

- Production branch: `main`
- Build command: `npm run build`
- Build output directory: `dist`
- Custom domain: calc.flowcreators.org
