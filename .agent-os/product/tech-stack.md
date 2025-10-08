# VibeLegal - Technology Stack

## Architecture Overview

**Type:** Monorepo Full-Stack Web Application
**Structure:** Separate frontend and backend with shared root config
**Deployment:** (Not yet deployed - ready for production)

## Frontend Stack

### Core Framework
- **React 18.2.0** - Modern hooks-based architecture
  - *Why:* Industry standard, excellent ecosystem, strong TypeScript support (future)
  - *Usage:* Functional components with hooks, context for state management

- **React Router 6.22.3** - Client-side routing
  - *Why:* Standard routing solution with protected route support
  - *Usage:* Authenticated routes, dashboard navigation, contract flows

### Build System
- **Vite 7.1.4** - Next-gen frontend build tool
  - *Why:* Extremely fast HMR, modern ESM-based, better DX than webpack
  - *Usage:* Dev server, production builds, asset optimization

### UI Framework
- **Tailwind CSS 4.1.11** - Utility-first CSS framework
  - *Why:* Rapid prototyping, consistent design system, small bundle size
  - *Usage:* All component styling, responsive design

- **shadcn/ui (Radix UI)** - Headless component library
  - *Why:* Accessible, customizable, copy-paste components (not npm package)
  - *Components:* Dialog, Dropdown, Tooltip, Accordion, Tabs, etc.
  - *Radix packages:* 20+ components for professional UI primitives

### Key Libraries
- **Lucide React 0.510.0** - Icon library
- **Framer Motion 12.15.0** - Animation library for smooth transitions
- **Recharts 2.15.3** - Data visualization for usage charts
- **date-fns 3.6.0** - Date manipulation and formatting
- **zod 3.24.4** - Runtime type validation for forms
- **react-hook-form 7.56.3** - Form state management with validation
- **sonner 2.0.3** - Toast notification system

### Design System
- **Color Scheme:** Tailwind default with custom legal brand colors
- **Typography:** System fonts with professional legal document styling
- **Components:** 40+ custom React components in `/frontend/src/components/`

## Backend Stack

### Core Framework
- **Node.js 18+** - JavaScript runtime
  - *Why:* JavaScript everywhere, huge ecosystem, async I/O performance
  - *Requirement:* Specified in package.json engines

- **Express 4.19.2** - Web application framework
  - *Why:* Minimal, flexible, middleware-based, industry standard
  - *Usage:* REST API, authentication, webhook handling

### Database
- **PostgreSQL 8.16.3** - Relational database
  - *Why:* ACID compliance, complex queries, JSON support, battle-tested
  - *Schema:* Users, contracts, chat_sessions, user_subscriptions, payment_history
  - *Connection:* pg driver with connection pooling

### Authentication & Security
- **JWT (jsonwebtoken 9.0.2)** - Token-based authentication
  - *Why:* Stateless, scalable, standard for SPAs
  - *Usage:* User authentication, protected API endpoints

- **bcryptjs 2.4.3** - Password hashing
  - *Why:* Industry standard, salt generation, secure by default
  - *Usage:* Password storage, login verification

- **Helmet 8.1.0** - Security headers middleware
  - *Why:* Automatic security best practices (CSP, XSS protection, etc.)

- **CORS 2.8.5** - Cross-origin resource sharing
  - *Usage:* Frontend-backend communication, configurable origins

### AI Integration
- **OpenAI 4.57.0** - Primary AI provider
  - *Why:* Best-in-class legal reasoning, consistent output, reliable API
  - *Usage:* Contract generation, parameter extraction, legal analysis
  - *Models:* GPT-4 for legal intelligence

- **@google/generative-ai 0.24.1** - Backup AI provider (Gemini)
  - *Why:* Cost optimization, redundancy, alternative for specific tasks
  - *Usage:* Secondary option for AI interpretation

### Payment Processing
- **Stripe 18.5.0** - Payment infrastructure
  - *Why:* Industry leader, comprehensive APIs, subscription support
  - *Features:* Checkout, webhooks, subscription management, billing portal
  - *Integration:* Full webhook handling with signature verification

### Logging & Monitoring
- **Winston 3.17.0** - Structured logging
  - *Why:* Flexible transports, log levels, production-ready
  - *Usage:* Application logs, error tracking, audit trails

- **Morgan 1.10.1** - HTTP request logging
  - *Why:* Standard middleware for request logging
  - *Format:* Combined format for comprehensive request tracking

- **prom-client 15.1.3** - Prometheus metrics
  - *Why:* Industry standard for metrics, Grafana integration ready
  - *Metrics:* HTTP request duration, DB query latency, request counts

### Additional Backend Libraries
- **joi 18.0.0** - Schema validation
  - *Usage:* API input validation, request sanitization

- **compression 1.8.1** - Response compression middleware
  - *Why:* Reduce bandwidth, improve response times

- **dotenv 16.6.1** - Environment variable management
  - *Usage:* Configuration, secrets management

- **on-finished 2.4.1** - HTTP request lifecycle
  - *Usage:* Cleanup, metrics collection

## Development Tools

### Backend Development
- **nodemon 3.1.4** - Auto-reload during development
  - *Usage:* `npm run dev` watches for file changes

### Frontend Development
- **ESLint 8.57.0** - JavaScript linting
  - *Plugins:* react, react-hooks, react-refresh
  - *Usage:* Code quality, style enforcement

### Database Tools
- **psql** - PostgreSQL CLI for migrations and admin
- **setup-database.js** - Initial schema setup script
- **stripe-migration.sql** - Payment infrastructure migration

## Project Structure

```
VibeLegal/
├── backend/
│   ├── src/
│   │   ├── ai-interpreter.js        # AI conversation orchestration
│   │   ├── subscription-service.js  # Stripe integration
│   │   ├── db/pool.js               # Database connection
│   │   ├── ai-providers/            # OpenAI/Gemini clients
│   │   └── middleware/              # Auth, error handling
│   ├── engine/
│   │   ├── composer.js              # Basic contract generation
│   │   └── composer_enhanced.js     # Master Input Brief (60+ params)
│   ├── middleware/
│   │   ├── authenticateToken.js     # JWT validation
│   │   └── errorHandler.js          # Error handling
│   ├── clause_library_enhanced.json # 99 legal clause variations
│   └── server.js                    # Express app entry point
│
├── frontend/
│   ├── src/
│   │   ├── components/              # 40+ React components
│   │   │   ├── ChatInterface.jsx    # Conversational AI UI
│   │   │   ├── ContractEditor.jsx   # Professional editor
│   │   │   ├── Dashboard.jsx        # User dashboard
│   │   │   ├── ClauseSelector.jsx   # Enhanced clause selection
│   │   │   └── ...
│   │   ├── hooks/                   # Custom React hooks
│   │   ├── lib/                     # Utilities
│   │   ├── App.jsx                  # Root component with routing
│   │   └── main.jsx                 # Application entry point
│   └── tailwind.config.js           # Tailwind configuration
│
└── package.json                     # Monorepo root config
```

## Data Flow

1. **User Authentication**
   - Frontend → POST /api/login → JWT token → localStorage
   - Token included in Authorization header for all requests

2. **Contract Generation**
   - User conversation → ChatInterface.jsx
   - Messages → POST /api/ai/interpret → OpenAI GPT-4
   - Parameter extraction → Master Input Brief composer
   - Final contract → POST /api/contracts → PostgreSQL
   - Display → ContractResult.jsx → ContractEditor.jsx

3. **Payment Flow**
   - Upgrade click → POST /api/user/create-checkout-session → Stripe Checkout
   - Payment complete → Stripe webhook → POST /api/user/webhook/stripe
   - Subscription update → user_subscriptions table
   - Frontend checks subscription tier → feature gating

4. **Session Management**
   - Chat history → chat_sessions table
   - Resume capability via session_id lookup
   - Parameters persist across sessions

## Environment Variables

### Required
```env
DATABASE_URL          # PostgreSQL connection string
OPENAI_API_KEY        # OpenAI API access
JWT_SECRET            # Token signing secret
```

### Payment Processing (Optional)
```env
STRIPE_SECRET_KEY              # Stripe API key
STRIPE_WEBHOOK_SECRET          # Webhook signature verification
STRIPE_PRO_MONTHLY_PRICE_ID    # Pro monthly price
STRIPE_PRO_YEARLY_PRICE_ID     # Pro yearly price
FRONTEND_URL                    # For Stripe redirects
```

### Optional
```env
PORT                  # Backend port (default: 5000)
CORS_ORIGIN          # Frontend URL (default: *)
GEMINI_API_KEY       # Backup AI provider
```

## Database Schema

### Core Tables
- **users** - Authentication, Stripe customer ID, subscription tier
- **contracts** - Generated contracts with metadata and search
- **chat_sessions** - Conversation state for resume functionality
- **user_subscriptions** - Comprehensive subscription management
- **payment_history** - Transaction tracking and billing cycles
- **subscription_usage** - Feature usage analytics

### Key Relationships
- users.id → contracts.user_id (one-to-many)
- users.id → chat_sessions.user_id (one-to-many)
- users.id → user_subscriptions.user_id (one-to-many)
- user_subscriptions.id → payment_history.subscription_id (one-to-many)

## Performance Considerations

### Frontend
- Vite code-splitting for optimal bundle size
- Lazy loading for large components (future optimization)
- React.memo for expensive re-renders (not yet implemented)
- Optimistic UI updates for better perceived performance

### Backend
- PostgreSQL connection pooling (pg driver)
- Prometheus metrics for monitoring bottlenecks
- Compression middleware for response optimization
- DB query duration tracking (histogram metrics)

### AI Performance
- Average response time: 5-10 seconds for contract generation
- Parameter extraction: 2-3 seconds for complex inputs
- No caching yet (future optimization opportunity)

## Testing Strategy

**Current State:** No automated testing (acknowledged technical debt)

**Future Testing Plan:**
- Backend: Jest + Supertest for API integration tests
- Frontend: Vitest + React Testing Library for component tests
- E2E: Playwright for critical user flows
- Legal: Contract output validation suite

## Deployment Architecture (Not Yet Deployed)

**Planned Setup:**
- Frontend: Vercel/Netlify (static SPA deployment)
- Backend: Railway/Render/DigitalOcean (Node.js hosting)
- Database: Managed PostgreSQL (Railway/Render/Supabase)
- Monitoring: Prometheus + Grafana (metrics dashboard)

**Deployment Blockers (From DEPLOYMENT.md):**
- Frontend security vulnerabilities (2 moderate in esbuild/vite)
- Backend environment variable validation (partially complete)

## Technology Decisions & Trade-offs

### Why Monorepo?
✅ Shared configuration, simplified development
✅ Atomic commits across frontend/backend
❌ More complex deployment (need separate deployments)

### Why PostgreSQL Over NoSQL?
✅ ACID compliance for payment/subscription data
✅ Complex queries for contract search/analytics
✅ Mature ecosystem, widespread knowledge
❌ Scaling requires more planning than NoSQL

### Why OpenAI Over Open Source LLMs?
✅ Best legal reasoning capabilities
✅ Reliable API, no infrastructure management
✅ Consistent output quality
❌ Higher cost per request, vendor lock-in

### Why shadcn/ui Over Material-UI?
✅ Full design control, copy-paste components
✅ Smaller bundle size, better customization
✅ Radix UI accessibility primitives
❌ More manual work than batteries-included UI library

## Version Control & Git Workflow

**Branch Strategy:** Feature branches per enhancement
**Pattern:** `feat/feature-name`, `fix/issue-name`
**Workflow:** One branch per feat/fix (user preference)
**Active Branch:** `feat/website-copy-optimization` (ready for merge)

**Commit Style:**
- Detailed messages with legal/technical context
- Example: "feat: Add professional clause selection to Enhanced mode"

## Future Technology Considerations

**When to Scale Up:**
- Add Redis for session/cache management (>1000 active users)
- Implement CDN for static assets (global user base)
- Add Elasticsearch for advanced contract search (>10k contracts)
- Consider microservices (if backend becomes monolithic)

**AI Optimization:**
- Implement response caching for common queries
- Fine-tune smaller models for parameter extraction
- Consider vector database (Pinecone/Weaviate) for clause similarity

**Monitoring Enhancements:**
- Add Sentry for error tracking
- Implement user analytics (PostHog/Mixpanel)
- Set up performance monitoring (New Relic/DataDog)
