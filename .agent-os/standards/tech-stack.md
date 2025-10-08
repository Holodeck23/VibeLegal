# Tech Stack

## Context

Global tech stack defaults for Agent OS projects, overridable in project-specific `.agent-os/product/tech-stack.md`.

**NOTE:** VibeLegal uses Node.js/React stack (see `.agent-os/product/tech-stack.md` for full details)

## VibeLegal Stack Overview

- **App Framework:** Node.js with Express.js
- **Language:** JavaScript (ES6+)
- **Frontend Framework:** React 18.2+
- **Build Tool:** Vite 7.1+
- **Primary Database:** PostgreSQL 8.16+
- **Database Client:** pg (node-postgres)
- **Package Manager:** npm
- **Node Version:** 18 LTS+
- **CSS Framework:** TailwindCSS 4.1+
- **UI Components:** shadcn/ui (Radix UI primitives)
- **Font Provider:** Google Fonts
- **Icons:** Lucide React components
- **AI Provider:** OpenAI GPT-4 (primary), Google Gemini (backup)
- **Payment Processing:** Stripe 18.5+
- **Authentication:** JWT with bcryptjs
- **Logging:** Winston + Morgan
- **Metrics:** Prometheus (prom-client)

## Hosting & Deployment (Planned)

- **Application Hosting:** Railway/Render/DigitalOcean
- **Frontend Hosting:** Vercel/Netlify
- **Database Hosting:** Managed PostgreSQL (Railway/Render/Supabase)
- **Database Backups:** Daily automated (provider-managed)
- **Asset Storage:** Future: Amazon S3 or Cloudflare R2
- **CDN:** Future: CloudFront or Cloudflare
- **CI/CD Platform:** GitHub Actions (planned)
- **Production Environment:** main branch
- **Staging Environment:** TBD

## Development Environment

- **Backend Dev:** `nodemon` for auto-reload
- **Frontend Dev:** Vite dev server with HMR
- **Database:** Local PostgreSQL instance
- **Environment Variables:** dotenv for configuration

See `.agent-os/product/tech-stack.md` for comprehensive technical details.
