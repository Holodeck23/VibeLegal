# VibeLegal Deployment Checklist

## 🚀 Pre-Deployment Preparation

### ❌ **Critical Issues to Fix**
- [ ] **Fix frontend security vulnerabilities** (2 moderate severity in esbuild/vite)
  ```bash
  cd frontend && npm audit fix --force
  ```
- [ ] **Add environment variable validation** to backend startup
- [ ] **Commit and merge Stripe integration** changes to main branch
- [ ] **Apply Stripe database migration** to production schema

### ⚠️ **Required Before Deploy**
- [ ] **Environment Variables Setup**
  - [ ] Create production `.env` file with all required keys
  - [ ] Stripe API keys (live keys for production)
  - [ ] OpenAI API key with sufficient credits
  - [ ] JWT secret (generate secure random string)
  - [ ] Database connection string
  - [ ] Frontend URL for redirects

- [ ] **Database Preparation**
  - [ ] Create production PostgreSQL database
  - [ ] Run base schema: `psql -d vibelegal -f database.sql`
  - [ ] Run Stripe migration: `psql -d vibelegal -f stripe-migration.sql`
  - [ ] Verify all tables created successfully

- [ ] **Stripe Account Setup**
  - [ ] Complete Stripe account verification
  - [ ] Create products and prices: `node setup-stripe.js`
  - [ ] Set up webhook endpoint: `/api/user/webhook/stripe`
  - [ ] Test payment flow in Stripe test mode
  - [ ] Configure live payment methods

## 🏗️ Infrastructure Setup

### Backend Deployment
- [ ] **Choose hosting platform** (Railway, Render, DigitalOcean, AWS)
- [ ] **Set up production database** (managed PostgreSQL)
- [ ] **Configure environment variables** on hosting platform
- [ ] **Set up SSL/TLS certificates** (usually automatic on modern platforms)
- [ ] **Configure domain** (e.g., api.vibelegal.com)

### Frontend Deployment  
- [ ] **Build production version**
  ```bash
  cd frontend && npm run build
  ```
- [ ] **Choose static hosting** (Vercel, Netlify, Cloudflare Pages)
- [ ] **Configure API endpoints** to point to production backend
- [ ] **Set up custom domain** (e.g., vibelegal.com)
- [ ] **Configure redirects** for SPA routing

### DNS Configuration
- [ ] **Set up domain records**
  - A record: vibelegal.com → static hosting IP
  - CNAME: api.vibelegal.com → backend hosting URL
  - CNAME: www.vibelegal.com → vibelegal.com

## 🧪 Testing Checklist

### Core Functionality
- [ ] **User Registration & Login**
  - [ ] Create new account
  - [ ] Email validation (if implemented)
  - [ ] Password requirements
  - [ ] JWT token handling

- [ ] **Contract Generation**
  - [ ] Conversational AI flow
  - [ ] California employment contract generation
  - [ ] Parameter extraction working
  - [ ] Contract customization controls
  - [ ] Template variations

- [ ] **Subscription System**
  - [ ] Basic tier limitations (5 contracts/month)
  - [ ] Pro upgrade flow
  - [ ] Stripe checkout process
  - [ ] Webhook handling
  - [ ] Feature gating

- [ ] **Dashboard Functionality**
  - [ ] Contract listing
  - [ ] Search and filter
  - [ ] Contract deletion
  - [ ] Usage statistics

### Payment Testing
- [ ] **Stripe Test Mode**
  - [ ] Test card: 4242424242424242
  - [ ] Successful payment flow
  - [ ] Failed payment handling
  - [ ] Webhook delivery
  - [ ] Subscription activation

- [ ] **Production Payment Testing** (when ready)
  - [ ] Small amount test transaction
  - [ ] Refund process
  - [ ] Subscription cancellation
  - [ ] Billing cycle handling

## 🚨 Security Checklist

### Application Security
- [ ] **Environment Variables**
  - [ ] No secrets in source code
  - [ ] All API keys in environment variables
  - [ ] Secure JWT secret generation
  
- [ ] **Input Validation**
  - [ ] SQL injection prevention (using parameterized queries)
  - [ ] XSS prevention (React built-in protection)
  - [ ] CSRF protection (SameSite cookies)
  
- [ ] **Authentication**
  - [ ] JWT token validation
  - [ ] Token expiration handling
  - [ ] Secure password hashing (bcrypt)

### Infrastructure Security
- [ ] **HTTPS Enforcement**
  - [ ] All traffic encrypted
  - [ ] Secure headers configured
  - [ ] HSTS enabled

- [ ] **Database Security**
  - [ ] Connection encryption
  - [ ] Limited database user permissions
  - [ ] Regular backups configured

### Compliance
- [ ] **Legal Disclaimers**
  - [ ] All contracts include proper disclaimers
  - [ ] Terms of service and privacy policy
  - [ ] GDPR compliance (if targeting EU users)

## 📊 Monitoring & Analytics

### Application Monitoring
- [ ] **Error Tracking**
  - [ ] Set up error logging service (Sentry, LogRocket)
  - [ ] Monitor API errors
  - [ ] Track user experience issues

- [ ] **Performance Monitoring**
  - [ ] API response times
  - [ ] Database query performance
  - [ ] Frontend loading times

### Business Metrics
- [ ] **User Analytics**
  - [ ] User registration tracking
  - [ ] Contract generation metrics
  - [ ] Subscription conversion rates
  - [ ] Feature usage statistics

- [ ] **Payment Monitoring**
  - [ ] Stripe dashboard monitoring
  - [ ] Failed payment alerts
  - [ ] Revenue tracking

## 🔄 Post-Deployment Tasks

### Immediate (First 24 hours)
- [ ] **Verify all systems operational**
- [ ] **Test user registration flow**
- [ ] **Generate test contract**
- [ ] **Monitor error logs**
- [ ] **Check payment webhooks**

### First Week
- [ ] **Monitor user feedback**
- [ ] **Track conversion metrics**
- [ ] **Optimize based on real usage**
- [ ] **Set up regular database backups**

### Ongoing
- [ ] **Regular security updates**
- [ ] **Monitor dependencies for vulnerabilities**
- [ ] **Scale infrastructure based on usage**
- [ ] **Implement user feedback**

## 🎯 Go-Live Checklist

### Final Verification
- [ ] All critical issues resolved ✅
- [ ] Security vulnerabilities patched ✅
- [ ] Database migrations applied ✅
- [ ] Environment variables configured ✅
- [ ] Payment processing tested ✅
- [ ] Domain and SSL configured ✅
- [ ] Monitoring systems active ✅

### Launch Preparation
- [ ] **Marketing materials ready**
- [ ] **Support documentation complete**
- [ ] **User onboarding flow tested**
- [ ] **Backup and rollback plan prepared**

### 🚀 **GO LIVE!**

---

## 📋 Quick Deployment Commands

### Frontend Security Fix
```bash
cd frontend
npm audit fix --force
npm run build
```

### Backend Environment Validation
```bash
cd backend
# Add to server.js startup:
const requiredEnvVars = ['DATABASE_URL', 'OPENAI_API_KEY', 'JWT_SECRET', 'STRIPE_SECRET_KEY'];
requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    console.error(`❌ Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
});
```

### Database Setup
```bash
# Apply migrations
psql -d vibelegal -f database.sql
psql -d vibelegal -f stripe-migration.sql

# Setup Stripe products (optional)
node setup-stripe.js
```

### Production Build Test
```bash
# Backend
cd backend && npm start

# Frontend  
cd frontend && npm run build && npm run preview
```

## 🌐 Recommended Hosting Options

### **Option 1: Simple & Fast (Recommended for MVP)**
- **Frontend**: Vercel (free tier)
- **Backend**: Railway ($5/month)  
- **Database**: Railway PostgreSQL ($10/month)
- **Total**: ~$15/month

### **Option 2: AWS Professional**
- **Frontend**: S3 + CloudFront
- **Backend**: ECS or Elastic Beanstalk
- **Database**: RDS PostgreSQL
- **Total**: ~$50-100/month

### **Option 3: Self-Hosted**
- **Server**: DigitalOcean Droplet ($10/month)
- **Database**: Managed PostgreSQL ($15/month)
- **CDN**: Cloudflare (free)
- **Total**: ~$25/month

## Emergency Contacts & Resources

- **Stripe Dashboard**: https://dashboard.stripe.com/
- **OpenAI Usage**: https://platform.openai.com/usage
- **Database Management**: [Your hosting provider dashboard]
- **Domain Management**: [Your domain registrar]

**Remember**: Start with staging environment first, then production deployment!