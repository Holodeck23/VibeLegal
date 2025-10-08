# VibeLegal - Architectural Decisions

## Core Architectural Decisions

### 1. Monorepo Structure with Separate Frontend/Backend

**Decision:** Keep frontend and backend in the same repository but separate directories

**Context:**
- Started as separate repos, merged into monorepo
- Frontend (React SPA) and backend (Node.js API) are distinct deployments
- Shared configuration at root level

**Rationale:**
✅ **Atomic commits** - Changes to both frontend/backend in single PR
✅ **Simplified development** - Clone once, see full picture
✅ **Shared documentation** - Single source of truth for project
✅ **Version alignment** - API changes and frontend updates stay in sync

**Trade-offs:**
❌ **Deployment complexity** - Need separate deployment pipelines
❌ **Larger repo size** - Two node_modules directories
❌ **Dependency management** - Must manage two package.json files

**Status:** Working well, no plans to change

---

### 2. PostgreSQL for All Data Storage

**Decision:** Use PostgreSQL as single database for all data (users, contracts, sessions, payments)

**Alternatives Considered:**
- MongoDB for document storage
- Redis for session management
- Separate databases for different concerns

**Rationale:**
✅ **ACID compliance** - Critical for payment/subscription data
✅ **Complex queries** - Contract search, analytics, user reports
✅ **JSON support** - Can store contract JSON in JSONB columns
✅ **Mature ecosystem** - Excellent tooling, widespread knowledge
✅ **Cost efficiency** - One database to manage vs multiple services

**Trade-offs:**
❌ **Vertical scaling limits** - Eventually hits performance ceiling
❌ **Schema migrations** - Requires careful planning for changes
❌ **No built-in search** - Would need Elasticsearch for advanced search

**Future Considerations:**
- Add Redis for caching if performance becomes issue (>1000 concurrent users)
- Consider Elasticsearch for full-text contract search (>10k contracts)

**Status:** Appropriate for current scale, revisit at 1000+ users

---

### 3. OpenAI as Primary AI Provider

**Decision:** Use OpenAI GPT-4 for contract generation and legal reasoning

**Alternatives Considered:**
- Anthropic Claude (better at legal reasoning)
- Google Gemini (lower cost)
- Open-source LLMs (Llama, Mistral)
- Fine-tuned smaller models

**Rationale:**
✅ **Best-in-class reasoning** - GPT-4 excels at legal analysis
✅ **Reliable API** - 99.9% uptime, well-documented
✅ **Consistent output** - Predictable response quality
✅ **No infrastructure** - No model hosting required
✅ **Fast iteration** - Can test prompts immediately

**Trade-offs:**
❌ **Cost per request** - $0.03-0.06 per contract (estimated)
❌ **Vendor lock-in** - Dependent on OpenAI pricing/availability
❌ **No fine-tuning control** - Can't optimize model for specific use case
❌ **Data privacy concerns** - Contracts sent to third-party

**Mitigation Strategies:**
- Gemini as backup provider (already implemented)
- Track cost-per-contract metric
- Eventually fine-tune smaller model for common tasks

**Status:** Working well, monitor costs closely post-launch

---

### 4. Conversational UI Over Traditional Forms

**Decision:** Build ChatGPT-style conversational interface for contract creation instead of multi-step form

**Alternatives Considered:**
- Traditional form with 50+ fields
- Multi-step wizard (5-10 steps)
- Hybrid: conversation for basics, form for details

**Rationale:**
✅ **Better UX** - Natural language feels easier than forms
✅ **Progressive disclosure** - Only ask relevant questions
✅ **Differentiation** - Most competitors use forms
✅ **Flexible** - Can handle edge cases conversation can clarify
✅ **Resume capability** - Can pause and continue naturally

**Trade-offs:**
❌ **Slower for power users** - Forms can be faster if you know exactly what you want
❌ **Unpredictable paths** - Hard to estimate time to completion
❌ **AI cost** - Every message costs money
❌ **Harder to test** - Infinite conversation paths

**User Feedback Needed:**
- Do users prefer conversation vs form?
- How long does typical contract take?
- Drop-off rate compared to form-based competitors

**Status:** Core differentiator, but offer "Quick Start Templates" for speed

---

### 5. Master Input Brief Pattern for Parameter Extraction

**Decision:** Extract comprehensive parameters from conversation into structured "Master Input Brief" before contract generation

**Alternatives Considered:**
- Generate contract directly from conversation
- Ask user to confirm every parameter explicitly
- Use conversation history directly in contract prompt

**Rationale:**
✅ **Separation of concerns** - Extraction vs generation are different problems
✅ **Debuggability** - Can inspect what AI extracted
✅ **Consistency** - Same parameters → same contract
✅ **Resume capability** - Can save/load extracted parameters
✅ **Quality control** - Can validate parameters before generation

**Architecture:**
```
User conversation → AI extraction (50+ patterns) → Master Input Brief (JSON) → Contract generation → Final contract
```

**Implementation:**
- `backend/src/ai-interpreter.js` - Conversation orchestration
- `backend/engine/composer_enhanced.js` - Parameter mapping (60+ fields)
- Pattern-based extraction with strategic legal analysis

**Trade-offs:**
❌ **Extra AI call** - Costs ~$0.01 more per contract
❌ **Complexity** - Two-stage process vs single prompt
❌ **Maintenance** - Need to keep patterns updated

**Status:** Proven pattern, significant improvement over basic approach

---

### 6. Subscription-Based Revenue Model

**Decision:** Subscription tiers (Basic/Pro/Enterprise) vs one-time purchases or usage-based pricing

**Alternatives Considered:**
- Pay-per-contract ($20-50 per contract)
- One-time purchase ($499 lifetime access)
- Usage-based (credits system)
- Freemium with ad-supported free tier

**Rationale:**
✅ **Predictable revenue** - MRR easier to forecast than one-time
✅ **Higher LTV** - $99/month × 12 months = $1,188/year
✅ **Customer retention** - Subscription creates habit
✅ **Easier to sell** - Lower initial commitment than $500 upfront
✅ **SaaS standard** - Investors/buyers understand model

**Pricing Strategy:**
- **Basic (Free):** 5 contracts/month - Test platform, see value
- **Pro ($99/month):** Unlimited - Target serious users
- **Enterprise (Custom):** Team features, API access

**Trade-offs:**
❌ **Churn risk** - Users can cancel anytime
❌ **Acquisition cost** - Need LTV > 3× CAC to be sustainable
❌ **Feature gating complexity** - Must enforce limits

**Pricing Validation Needed:**
- Is $99/month right price point?
- Should there be annual discount?
- What percentage convert from free to paid?

**Status:** Standard SaaS model, validate with real users

---

### 7. JWT Authentication with localStorage

**Decision:** Use JWT tokens stored in browser localStorage for authentication

**Alternatives Considered:**
- Session cookies with Redis
- OAuth only (Google, Microsoft)
- Magic link email authentication
- HTTP-only cookies with CSRF tokens

**Rationale:**
✅ **Stateless backend** - No session storage required
✅ **SPA-friendly** - Works with React Router
✅ **Simple implementation** - Standard JWT library
✅ **Cross-domain ready** - Can separate frontend/backend domains
✅ **Mobile-ready** - Same tokens work in future mobile apps

**Trade-offs:**
❌ **XSS vulnerability** - localStorage accessible to JavaScript
❌ **No automatic refresh** - Need separate refresh token logic
❌ **Manual token management** - Frontend must handle expiration

**Security Mitigations:**
- Short token expiration (24 hours)
- HTTPS only in production
- No sensitive data in JWT payload
- Consider HTTP-only cookies in future

**Status:** Standard approach for SPA, acceptable risk for MVP

---

### 8. Stripe for Payment Processing

**Decision:** Use Stripe for all payment and subscription management

**Alternatives Considered:**
- PayPal
- Square
- Paddle (merchant of record)
- Build custom payment processing

**Rationale:**
✅ **Best developer experience** - Excellent APIs and documentation
✅ **Subscription support** - Built-in subscription lifecycle management
✅ **Billing portal** - Users can manage subscriptions themselves
✅ **Webhook reliability** - Robust retry logic
✅ **Global coverage** - Supports international expansion
✅ **Startup ecosystem standard** - Expected by users

**Trade-offs:**
❌ **2.9% + $0.30 per transaction** - Significant cost at scale
❌ **Complexity** - Webhook handling, idempotency, testing
❌ **Vendor lock-in** - Hard to migrate away from

**Implementation:**
- Stripe Checkout for payment UI (don't build payment forms)
- Webhook handling for subscription updates
- Billing portal for user self-service
- Test mode during beta, live mode for launch

**Status:** Industry standard, working well

---

### 9. California-Only Employment Contracts (MVP Scope)

**Decision:** Focus exclusively on California employment contracts before expanding

**Alternatives Considered:**
- Multi-state support from day one
- Multiple contract types (NDA, service agreements) in California
- International markets (UK, Canada)

**Rationale:**
✅ **Reduce complexity** - One set of laws to master
✅ **Faster to market** - Less legal research required
✅ **Better quality** - Deep expertise vs shallow coverage
✅ **Easier testing** - Single compliance framework
✅ **Clear positioning** - "The CA employment contract expert"
✅ **Validate demand** - Test willingness to pay before expansion

**California-Specific Advantages:**
- Largest economy in US ($3.9T GDP)
- Complex employment laws (more need for help)
- Tech startup hub (target market)
- Most employees in US (39M population)

**Trade-offs:**
❌ **Limited market** - Can't sell to 49 other states
❌ **Competitive vulnerability** - Competitors can be multi-state
❌ **Revenue ceiling** - Max addressable market capped

**Expansion Trigger:**
- Achieve $5k+ MRR in California
- <10% churn rate
- Clear user demand for other states
- Validate unit economics work

**Status:** Strategic decision to validate before scaling

---

### 10. React with Tailwind CSS (No Component Library)

**Decision:** Use React with Tailwind CSS and shadcn/ui (copy-paste components) instead of Material-UI or Bootstrap

**Alternatives Considered:**
- Material-UI (comprehensive component library)
- Chakra UI (opinionated design system)
- Ant Design (enterprise focus)
- Plain CSS or CSS Modules

**Rationale:**
✅ **Full design control** - Not locked into Material Design aesthetic
✅ **Smaller bundle size** - Only include components we use
✅ **Modern development** - Utility-first approach is fast
✅ **shadcn/ui quality** - Radix UI primitives are accessible
✅ **Easy customization** - Tailwind config controls everything

**Trade-offs:**
❌ **More manual work** - Must build/copy every component
❌ **Inconsistency risk** - Need design system discipline
❌ **Steeper learning curve** - Tailwind utility classes take time

**Component Strategy:**
- Copy shadcn/ui components as starting point
- Customize for legal/professional aesthetic
- Build custom components for legal-specific UI (contract editor, clause selector)

**Status:** Working well, professional aesthetic achieved

---

### 11. No Automated Testing (MVP Technical Debt)

**Decision:** Ship MVP without comprehensive test coverage

**Rationale:**
✅ **Speed to market** - Testing adds 30-50% dev time
✅ **Uncertain requirements** - Premature to test features that might change
✅ **Manual testing sufficient** - Small codebase, single developer

**Trade-offs:**
❌ **Regression risk** - Changes can break existing features
❌ **Refactoring fear** - Harder to refactor without test safety net
❌ **Scaling difficulty** - Will slow down development eventually

**Testing Plan (Post-Launch):**
1. **First priority:** E2E tests for critical path (signup → contract → download)
2. **Second priority:** Backend API integration tests
3. **Third priority:** Frontend component tests
4. **Long-term:** >70% test coverage

**Acceptance Criteria for Testing:**
- After 10+ paying customers (proven demand)
- Before hiring second developer (onboarding safety)
- Before major refactoring (safety net)

**Status:** Intentional technical debt, address in Phase 2

---

### 12. Single-Tenant Architecture (No Multi-Tenancy Yet)

**Decision:** Each user has their own data, no "team accounts" or shared workspaces in MVP

**Rationale:**
✅ **Simpler data model** - No tenant_id on every table
✅ **Easier security** - No cross-tenant data leakage risk
✅ **Faster development** - Fewer edge cases
✅ **Validate solo user demand first** - Teams can come later

**Trade-offs:**
❌ **Can't sell to law firms** - Need team features eventually
❌ **Lower ARPU potential** - Teams pay more than individuals
❌ **Migration complexity** - Adding multi-tenancy later is hard

**Enterprise Features (Future):**
- Team accounts with role-based permissions
- Shared template libraries
- Approval workflows
- Team analytics

**When to Add:**
- After 20+ Enterprise inquiries
- When solo user growth plateaus
- Before Series A fundraising (higher valuation with enterprise)

**Status:** Correct decision for MVP, revisit in Phase 3

---

## Technology Trade-off Decisions

### Frontend Build Tool: Vite vs Webpack

**Decision:** Use Vite for frontend build system

**Why Vite:**
- 10-100× faster hot module replacement
- Native ESM in development
- Simpler configuration than Webpack
- Better developer experience

**Trade-off:** Newer ecosystem, fewer Stack Overflow answers

**Status:** Excellent choice, no regrets

---

### State Management: React Context vs Redux

**Decision:** Use React Context for global state instead of Redux

**Why Context:**
- Simpler for small app (few global states)
- No additional dependencies
- React built-in solution
- AuthContext is main use case

**When to Add Redux/Zustand:**
- Complex state interactions across many components
- Need time-travel debugging
- Performance issues with excessive re-renders

**Status:** Context is sufficient for now

---

### Styling: Tailwind vs CSS-in-JS (Styled Components)

**Decision:** Use Tailwind CSS instead of Styled Components or Emotion

**Why Tailwind:**
- Faster development with utility classes
- Smaller bundle size (purged unused styles)
- No runtime style generation
- Easier for AI code generation

**Trade-off:** More verbose JSX with many class names

**Status:** Good choice, enables rapid prototyping

---

## Future Architectural Decisions Needed

### 1. Caching Strategy
**When:** >500 active users with repeated queries
**Options:**
- Redis for session and AI response caching
- Service worker caching for frontend assets
- CloudFlare CDN for static content

### 2. Search Implementation
**When:** >1000 contracts, users complain about search
**Options:**
- PostgreSQL full-text search (good enough for 10k contracts)
- Elasticsearch (better for 100k+ contracts, faceted search)
- Algolia (fastest implementation, highest cost)

### 3. File Storage
**When:** Add contract attachments, company logos
**Options:**
- PostgreSQL bytea (simple, limited scale)
- AWS S3 (standard, scalable, cheap)
- Cloudflare R2 (cheaper, no egress fees)

### 4. Background Jobs
**When:** Need email notifications, scheduled tasks
**Options:**
- Bull/BullMQ with Redis (most popular)
- PostgreSQL-based queue (pg-boss)
- Separate job service (Inngest, Trigger.dev)

### 5. Monitoring & Observability
**When:** Production launch
**Options:**
- Sentry (error tracking)
- PostHog (product analytics)
- Prometheus + Grafana (already have metrics endpoint)
- DataDog/New Relic (comprehensive, expensive)

---

## Decision-Making Framework

When making future architectural decisions, consider:

1. **Validate demand first** - Don't build for imaginary scale
2. **Optimize for iteration speed** - Choose tools that enable fast changes
3. **Minimize operational complexity** - Fewer services = easier to manage
4. **Standard over clever** - Boring technology is good technology
5. **Cost at scale** - $100/month vs $1000/month at 1000 users
6. **Reversibility** - How hard to change later? (low = do it, high = think carefully)

**Risk Assessment:**
- **Low risk:** Can change in 1-2 days → Experiment freely
- **Medium risk:** Can change in 1 week → Validate with users first
- **High risk:** Can change in 1+ months → Prototype before committing

---

## Lessons Learned

### What Worked Well
✅ Master Input Brief pattern - Huge quality improvement
✅ Conversational UI - Differentiated from competitors
✅ Stripe integration - Faster than expected
✅ Monorepo - Easier to track changes
✅ California-only focus - Allows deep expertise

### What We'd Do Differently
❌ Add tests earlier - Regression bugs are annoying
❌ Simpler first version - MVP grew too much before launch
❌ User validation earlier - Building for 1 month without user feedback is risky
❌ Performance monitoring from day 1 - Useful to track from start
❌ Analytics from day 1 - Guessing user behavior vs knowing

### Open Questions
- Is conversational UI actually better for users? (Need feedback)
- Is $99/month right price? (Need market data)
- Should we have built forms instead? (A/B test opportunity)
- Are we solving real pain point? (Need paying customers to validate)
