## NUMCALC

NUMCALC is a Next.js application configured for container deployment on Coolify.

## Local development

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Production build check

```bash
npm run build
npm run start
```

## Deploy to Coolify

This repository now includes a production Dockerfile optimized for Next.js standalone output.

Use these values in Coolify:

- Build Pack: Dockerfile
- Dockerfile Location: ./Dockerfile
- Exposed Port: 3000
- Healthcheck Path: /

Recommended environment variables:

- NODE_ENV=production
- NEXT_TELEMETRY_DISABLED=1

If your app later requires runtime secrets, add them in Coolify Environment Variables.

## Notes

- The app is configured with next.config.ts output=standalone for smaller runtime images.
- Legacy GitHub Pages deployment workflow has been removed to avoid dual deployment paths.
