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
- **Password**: password  
- **Status**: 21 total contracts, 1 this month

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