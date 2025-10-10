# VibeLegal - AI-Powered Legal Contract Generation

VibeLegal is an AI-powered contract drafting platform that transforms how legal professionals create employment contracts. Built specifically for California employment law, it features conversational AI, advanced customization controls, and comprehensive legal compliance.

## 🎯 Current Status (MVP)
- **Focus**: California Employment Agreements  
- **Status**: Feature-complete MVP with payment infrastructure  
- **Users**: 0 paying customers (ready to monetize)  
- **Recent**: Master Input Brief framework for comprehensive contract intelligence

## 🚀 Core Features

### Legal Intelligence
- **Master Input Brief System**: 50+ parameter extraction patterns for comprehensive legal analysis  
- **California Employment Law Compliance**: 2025-compliant wage, hour, meal/rest period requirements  
- **Strategic Legal AI**: Employment law attorney persona with risk assessment  
- **Employer Protection Focus**: IP assignment, confidentiality, severance, non-compete coverage  

### Conversational Interface
- **Natural Language Processing**: Create contracts through conversation  
- **Resume Capability**: Continue contract creation across sessions  
- **Parameter Extraction**: Automatic identification of legal terms and conditions  
- **Progress Tracking**: Real-time contract building with state management  

### Advanced Customization
- **Risk Tolerance Controls**: Employer-friendly to employee-favorable spectrum  
- **Legal Stance Selection**: Conservative, balanced, or progressive approaches  
- **Clause Library**: 99 professionally crafted legal variations  
- **Contract Templates**: 5 professional variations for different use cases  

### Subscription & Payments
- **Stripe Integration**: Full payment processing with webhook support  
- **Tiered Access**: Basic (5 contracts/month), Pro (unlimited), Enterprise  
- **Feature Gating**: Progressive feature unlocking based on subscription tier  
- **Usage Tracking**: Real-time contract generation monitoring

## 🏗️ Architecture

### Frontend (React + Tailwind CSS)
- **Framework**: React 18 with modern hooks and context  
- **UI Components**: shadcn/ui with Tailwind CSS styling  
- **State Management**: React Context for authentication and app state  
- **Routing**: React Router with protected routes  
- **Icons**: Lucide React for consistent iconography  

### Backend (Node.js + Express)
- **Runtime**: Node.js with Express.js framework  
- **Database**: PostgreSQL with comprehensive subscription schema  
- **Authentication**: JWT tokens with bcryptjs password hashing  
- **AI Integration**: OpenAI/Gemini models with custom legal prompting  
- **Payment Processing**: Stripe integration with webhook handling  
- **Legal Engine**: Master Input Brief composer with 60+ parameter mapping  
- **Security**: CORS, rate limiting, input validation, webhook signature verification

### Database Schema
- **Users**: Account management with Stripe customer integration  
- **User Subscriptions**: Comprehensive subscription management with billing cycles  
- **Contracts**: Generated contracts with search/filter capabilities  
- **Chat Sessions**: Conversation state preservation for resume functionality  
- **Payment History**: Transaction tracking and billing management  
- **Subscription Usage**: Feature usage analytics and tier enforcement

## 📋 Prerequisites

- **Node.js** (v18 or higher)  
- **npm** or **pnpm**  
- **PostgreSQL** (v12 or higher)  
- **OpenAI API Key** (for contract generation)  
- **Stripe Account** (for payment processing)

## 🛠️ Installation & Setup

### 1. Clone and Install

```bash
git clone <repository-url>
cd vibelegal

# Backend setup
cd backend
npm install

# Frontend setup  
cd ../frontend
npm install
```

### 2. Environment Configuration

Create `.env` file in the backend directory:

```env
PORT=5000
DATABASE_URL=postgresql://username:password@localhost:5432/vibelegal
OPENAI_API_KEY=<your_openai_api_key>
JWT_SECRET=<your_jwt_secret>

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_PRO_MONTHLY_PRICE_ID=price_pro_monthly_id
STRIPE_PRO_YEARLY_PRICE_ID=price_pro_yearly_id
FRONTEND_URL=http://localhost:5173
```

### 3. Database Setup

```bash
cd backend

# Create database
createdb vibelegal

# Run base schema
psql -d vibelegal -f database.sql

# Run Stripe integration migration
psql -d vibelegal -f stripe-migration.sql
```

### 4. Stripe Setup (Optional)

```bash
# Auto-create Stripe products and prices
node setup-stripe.js

# Copy generated price IDs to .env file
# Set up webhook endpoint: /api/user/webhook/stripe in Stripe Dashboard
```

### 5. Start Development Servers

```bash
# Backend (Terminal 1)
cd backend
npm run dev

# Frontend (Terminal 2)  
cd frontend
npm run dev
```

Access the application at `http://localhost:5173`

## 💰 Subscription Tiers

### Basic (Free)
- **Contracts**: 5 per month  
- **Features**: Basic contract generation  
- **Target**: Individual lawyers testing the platform  

### Pro ($29/month, $290/year)
- **Contracts**: Unlimited  
- **Features**: Conversational AI, advanced customization, risk controls  
- **Target**: Solo practitioners and small firms  
- **Savings**: 17% with annual billing  

### Enterprise ($99/month, $990/year)
- **Contracts**: Unlimited  
- **Features**: Everything in Pro plus team collaboration, analytics  
- **Target**: Law firms and legal departments  
- **Savings**: 17% with annual billing

## 🎯 Deployment Ready

### Payment Infrastructure ✅
- Stripe integration with webhook support  
- Subscription management and billing  
- Feature gating and usage enforcement  
- Payment success/failure handling  

### Legal Compliance ✅
- California employment law compliance  
- 2025 wage and hour requirements  
- Meal/rest period regulations  
- Fair Chance Act compliance  

### User Experience ✅
- Conversational contract creation  
- Advanced customization controls  
- Contract search and management  
- Mobile-responsive design  

### Technical Infrastructure ✅
- Scalable backend architecture
- Comprehensive database schema
- Authentication and authorization
- Error handling and logging

## 🛡️ Admin Dashboard

The admin dashboard provides comprehensive platform management capabilities for administrators.

### Features

#### User Management
- **User Listing**: Search, filter, and paginate through all platform users
- **User Profiles**: Detailed view of user accounts, subscriptions, and contracts
- **Subscription Management**: Manually adjust user subscription tiers
- **User Impersonation**: Generate temporary tokens to view platform as any user for debugging
- **Search & Filters**: Find users by email/name, filter by subscription tier
- **Audit Logging**: All admin actions are tracked with timestamps and details

#### System Monitoring
- **Dashboard Metrics**: Real-time statistics on users, contracts, and subscriptions
- **Recent Activity**: Monitor recent contracts, signups, and payments
- **Subscription Breakdown**: Visual representation of tier distribution
- **Active Users**: Track platform engagement and usage patterns

### Access

The admin dashboard is accessible at `/admin` and requires admin privileges:

```
URL: http://localhost:5173/admin
Access: Requires is_admin=true in users table
```

### Setup

1. **Grant Admin Access** to a user:
```sql
UPDATE users SET is_admin = true WHERE email = 'admin@example.com';
```

2. **Access the Dashboard**:
- Log in with admin credentials
- Navigate to `/admin`
- Dashboard automatically verifies admin status

### Admin API Endpoints

All endpoints require authentication and admin privileges:

- `GET /api/admin/metrics/overview` - System-wide metrics
- `GET /api/admin/metrics/recent-activity` - Recent platform activity
- `GET /api/admin/users` - List all users with search/filter
- `GET /api/admin/users/:userId` - Detailed user profile
- `POST /api/admin/users/:userId/subscription` - Update subscription tier
- `POST /api/admin/users/:userId/impersonate` - Generate impersonation token
- `GET /api/admin/audit-log` - View admin action history

### Features by Component

#### UserList.jsx
- Paginated user listing (50 users per page)
- Real-time search by email or name
- Filter by subscription tier (basic/pro/enterprise)
- Sort by date, email (ascending/descending)
- Click any row to view user details

#### UserDetail.jsx
- Complete user profile with subscription details
- Tabbed interface for contracts, payments, and admin actions
- Edit subscription tier with audit logging
- Generate impersonation tokens for debugging
- View payment history and contract list

#### SubscriptionEditor.jsx
- Change user subscription tiers (basic/pro/enterprise)
- Optional reason field for audit trail
- Stripe sync option for payment integration
- Confirmation dialogs for destructive actions

#### UserImpersonation.jsx
- Generate 1-hour temporary access tokens
- Automatic admin token preservation
- Security warnings and audit logging
- Cannot impersonate other admin users

### Security Features

- **Admin-Only Routes**: All admin endpoints protected by middleware
- **Audit Logging**: Every admin action logged to `admin_actions` table
- **Confirmation Dialogs**: Required for destructive actions
- **Impersonation Limits**: Cannot impersonate admin users, 1-hour token expiry
- **Access Control**: Frontend automatically redirects non-admins

### Testing

Run the admin integration tests:

```bash
cd backend
node tests/admin-integration-test.js
```

This tests all admin workflows including authentication, user management, subscription changes, impersonation, and audit logging.

## 📊 Growth Roadmap

### Phase 1: Market Validation (Current)
- **Goal**: Find paying customers  
- **Focus**: California employment contracts  
- **Metrics**: User acquisition, conversion rates  

### Phase 2: Contract Type Expansion
- **NDAs**: Non-disclosure agreements  
- **Service Agreements**: Independent contractor agreements  
- **Purchase Agreements**: Basic commercial contracts  

### Phase 3: Geographic Expansion
- **New York**: Employment law compliance  
- **Texas**: State-specific regulations  
- **Florida**: Regional legal requirements  

### Phase 4: International Markets
- **United Kingdom**: UK employment law  
- **Canada**: Provincial regulations  
- **European Union**: GDPR compliance  
- **Australia**: Fair Work Act compliance

## 🧪 Testing

### Test Account
- **Email**: test2@vibelegal.com
- **Password**: DemoPassword123!
- **Status**: 28 total contracts (Pro tier)

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (!@#$%^&*...)

### Manual Testing Checklist
- [ ] User registration and authentication  
- [ ] Contract generation through conversational AI  
- [ ] Advanced customization controls  
- [ ] Subscription upgrade flow  
- [ ] Contract search and management  
- [ ] Payment processing (test mode)  
- [ ] Mobile responsive design

## 🔧 Development Commands

```bash
# Backend
cd backend
npm start          # Production mode
npm run dev        # Development with nodemon
npm run setup-db   # Initialize database
node setup-stripe.js  # Setup Stripe products

# Frontend  
cd frontend
npm run dev        # Development server
npm run build      # Production build
npm run preview    # Preview production build
```

## 📞 Support & Development

### Getting Help
- **Documentation**: Comprehensive setup and API documentation  
- **Code Comments**: Detailed implementation explanations  
- **Error Handling**: Clear error messages and logging  

### Contributing
- **Code Style**: Follow existing patterns and conventions  
- **Testing**: Manual testing checklist provided  
- **Documentation**: Update docs for new features  

## 🔒 Security & Legal

### Security Features
- JWT authentication with secure token handling  
- Stripe webhook signature verification  
- Input validation and sanitization  
- Rate limiting and abuse prevention  

### Legal Disclaimers
All generated contracts include appropriate legal disclaimers and should be reviewed by qualified attorneys before use.

---

**VibeLegal** - AI-powered legal contract generation for the modern legal practice.