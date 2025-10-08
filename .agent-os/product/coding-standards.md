# VibeLegal - Coding Standards

## Git Workflow

### Branch Naming
**Pattern:** `<type>/<descriptive-name>`

**Types:**
- `feat/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring without behavior change

**Examples:**
- `feat/advanced-conversation-intelligence`
- `fix/california-employment-law-compliance`
- `feat/stripe-payment-integration`
- `fix/dashboard-contract-counters`

**Rules:**
- One branch per feature or fix (user preference)
- Keep branches focused on single concern
- Delete branches after merging

### Commit Messages
**Format:** `<type>: <description>`

**Examples:**
```
feat: Add professional clause selection to Enhanced mode
fix: Fix inaccurate total contracts counter
docs: Update CLAUDE.md with beta-ready UX overhaul completion notes
refactor: Simplify authentication token validation
```

**Guidelines:**
- Clear, descriptive messages
- Include legal context when relevant
- Reference file changes for major updates
- Explain "why" for complex changes

### Pull Request Process
- Create detailed PR descriptions
- Include implementation notes
- Reference related issues/context
- Wait for review before merging (when team grows)

---

## File Organization

### Backend Structure
```
backend/
├── src/                          # Core application code
│   ├── ai-interpreter.js         # AI conversation orchestration
│   ├── subscription-service.js   # Payment/subscription logic
│   ├── db/pool.js                # Database connection
│   ├── ai-providers/             # OpenAI/Gemini clients
│   ├── middleware/               # Auth, error handling
│   └── utils/                    # Shared utilities
├── engine/                       # Contract generation
│   ├── composer.js               # Basic generation
│   └── composer_enhanced.js      # Master Input Brief
├── middleware/                   # Express middleware
│   ├── authenticateToken.js      # JWT validation
│   └── errorHandler.js           # Error handling
├── clause_library_enhanced.json  # Legal clause library
└── server.js                     # Express app entry
```

### Frontend Structure
```
frontend/src/
├── components/                   # React components (40+)
│   ├── ChatInterface.jsx         # Conversational UI
│   ├── ContractEditor.jsx        # Professional editor
│   ├── Dashboard.jsx             # User dashboard
│   ├── ClauseSelector.jsx        # Clause selection
│   └── ...
├── hooks/                        # Custom React hooks
├── lib/                          # Utilities
├── App.jsx                       # Root component with routing
└── main.jsx                      # Application entry point
```

**Naming Conventions:**
- React components: `PascalCase.jsx` (e.g., `ChatInterface.jsx`)
- Utilities/services: `camelCase.js` (e.g., `ai-interpreter.js`)
- CSS files: Match component name (e.g., `App.css`)

---

## React/Frontend Standards

### Component Structure

**Functional Components with Hooks (Required):**
```jsx
import React, { useState, useEffect } from 'react';

function ComponentName({ prop1, prop2 }) {
  const [state, setState] = useState(initialValue);

  useEffect(() => {
    // Side effects
  }, [dependencies]);

  return (
    <div className="...">
      {/* JSX */}
    </div>
  );
}

export default ComponentName;
```

**No Class Components:** Use functional components only

### State Management

**Local State:** `useState` for component-specific state
```jsx
const [isOpen, setIsOpen] = useState(false);
const [formData, setFormData] = useState({});
```

**Global State:** React Context for app-wide state
```jsx
// AuthContext for authentication
// AppContext for app-wide settings
```

**When to Use Context:**
- Authentication state
- User subscription tier
- Theme/UI preferences
- Data shared across multiple routes

**When to Use Local State:**
- Form inputs
- UI toggle states
- Component-specific data

### Props Destructuring

**Preferred:**
```jsx
function Component({ title, onClose, isVisible }) {
  // ...
}
```

**Avoid:**
```jsx
function Component(props) {
  const title = props.title; // Don't do this
}
```

### Event Handlers

**Naming:** Prefix with `handle`
```jsx
const handleSubmit = (e) => {
  e.preventDefault();
  // ...
};

const handleInputChange = (e) => {
  // ...
};
```

### Conditional Rendering

**Short conditions:**
```jsx
{isLoading && <Spinner />}
{error && <ErrorMessage>{error}</ErrorMessage>}
```

**Complex conditions:**
```jsx
{status === 'loading' ? (
  <Spinner />
) : status === 'error' ? (
  <ErrorMessage />
) : (
  <Content />
)}
```

### Styling with Tailwind

**Use utility classes directly in JSX:**
```jsx
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow">
  <h2 className="text-xl font-semibold">Title</h2>
</div>
```

**Complex/repeated styles:** Extract to component
```jsx
// Instead of repeating same classes everywhere
function Card({ children }) {
  return (
    <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200">
      {children}
    </div>
  );
}
```

---

## Backend/Node.js Standards

### Module Exports

**CommonJS (Current):**
```javascript
const express = require('express');
const { authenticateToken } = require('./middleware/authenticateToken.js');

module.exports = { functionName };
```

**Future:** Consider migrating to ES6 modules
```javascript
import express from 'express';
export { functionName };
```

### Error Handling

**Use async/await with try-catch:**
```javascript
app.post('/api/endpoint', authenticateToken, async (req, res) => {
  try {
    const result = await someAsyncOperation();
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

**Use custom error handler middleware:**
```javascript
const { errorHandler, AppError, asyncHandler } = require('./middleware/errorHandler.js');

app.use(errorHandler);
```

### Database Queries

**Use parameterized queries (ALWAYS):**
```javascript
// ✅ CORRECT - Prevents SQL injection
const result = await pool.query(
  'SELECT * FROM users WHERE email = $1',
  [email]
);

// ❌ WRONG - SQL injection vulnerability
const result = await pool.query(
  `SELECT * FROM users WHERE email = '${email}'`
);
```

**Use connection pool:**
```javascript
const { pool } = require('./src/db/pool');
const result = await pool.query(query, params);
```

### API Response Format

**Success:**
```javascript
res.json({
  success: true,
  data: { ... }
});
```

**Error:**
```javascript
res.status(400).json({
  success: false,
  error: 'Error message'
});
```

**Paginated results:**
```javascript
res.json({
  success: true,
  data: items,
  pagination: {
    page: 1,
    limit: 20,
    total: 100
  }
});
```

### Environment Variables

**Load at app start:**
```javascript
require('dotenv').config();
```

**Validate required variables:**
```javascript
const requiredEnvVars = ['DATABASE_URL', 'OPENAI_API_KEY', 'JWT_SECRET'];

const missingRequired = requiredEnvVars.filter(envVar => !process.env[envVar]);
if (missingRequired.length > 0) {
  console.error('❌ Missing required environment variables:', missingRequired);
  process.exit(1);
}
```

**Access variables:**
```javascript
const apiKey = process.env.OPENAI_API_KEY;
const port = process.env.PORT || 5000;
```

### Logging

**Use appropriate log levels:**
```javascript
console.log('ℹ️ Info message');     // General information
console.warn('⚠️ Warning message'); // Potential issues
console.error('❌ Error message');  // Errors
```

**For production:** Use Winston structured logging
```javascript
const winston = require('winston');
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

logger.info('User logged in', { userId: user.id });
logger.error('Database error', { error: err.message });
```

---

## AI Integration Standards

### OpenAI API Calls

**Structure:**
```javascript
const response = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage }
  ],
  temperature: 0.7,
  max_tokens: 2000
});

const result = response.choices[0].message.content;
```

**Error handling:**
```javascript
try {
  const response = await openai.chat.completions.create({...});
} catch (error) {
  if (error.response?.status === 429) {
    // Rate limit - retry with backoff
  } else if (error.response?.status === 500) {
    // OpenAI server error - use backup provider
  } else {
    // Other error
  }
}
```

### Prompt Engineering

**System prompts:**
- Clear role definition
- Specific instructions
- Output format specification
- Legal compliance requirements

**Example:**
```javascript
const systemPrompt = `You are a California employment law attorney assistant.

Your role:
1. Extract employment contract parameters from user conversation
2. Focus on employer protections and legal compliance
3. Always consider CA-specific requirements

Output format: JSON with extracted parameters`;
```

**User prompts:**
- Include relevant context
- Specify desired output
- Reference previous conversation if needed

### Master Input Brief Pattern

**Two-stage process:**
1. **Extraction:** Conversation → Parameters (JSON)
2. **Generation:** Parameters → Contract (Markdown/HTML)

**Implementation:**
```javascript
// Stage 1: Extract parameters
const parameters = await extractParameters(conversation);

// Stage 2: Generate contract
const contract = await generateContract(parameters);
```

---

## Security Standards

### Authentication

**JWT Token Usage:**
```javascript
// Generate token
const token = jwt.sign(
  { userId: user.id },
  process.env.JWT_SECRET,
  { expiresIn: '24h' }
);

// Verify token (middleware)
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};
```

### Password Hashing

**Use bcryptjs:**
```javascript
const bcrypt = require('bcryptjs');

// Hash password (registration)
const saltRounds = 10;
const hashedPassword = await bcrypt.hash(password, saltRounds);

// Verify password (login)
const isValid = await bcrypt.compare(password, hashedPassword);
```

### Input Validation

**Validate all user inputs:**
```javascript
const joi = require('joi');

const schema = joi.object({
  email: joi.string().email().required(),
  password: joi.string().min(8).required()
});

const { error, value } = schema.validate(req.body);
if (error) {
  return res.status(400).json({ error: error.details[0].message });
}
```

### Stripe Webhook Verification

**Always verify webhook signatures:**
```javascript
const sig = req.headers['stripe-signature'];
let event;

try {
  event = stripe.webhooks.constructEvent(
    req.body,
    sig,
    process.env.STRIPE_WEBHOOK_SECRET
  );
} catch (err) {
  console.error('Webhook signature verification failed:', err.message);
  return res.status(400).send(`Webhook Error: ${err.message}`);
}
```

---

## Database Standards

### Table Naming
- Lowercase with underscores: `user_subscriptions`, `chat_sessions`
- Plural for data tables: `users`, `contracts`
- Descriptive names: `payment_history` not `payments`

### Column Naming
- Lowercase with underscores: `user_id`, `created_at`
- Foreign keys: `<table>_id` (e.g., `user_id`, `subscription_id`)
- Timestamps: `created_at`, `updated_at`
- Boolean fields: `is_active`, `has_paid`

### Schema Conventions

**Every table should have:**
```sql
id SERIAL PRIMARY KEY,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

**Foreign key constraints:**
```sql
user_id INTEGER REFERENCES users(id) ON DELETE CASCADE
```

**Indexes for common queries:**
```sql
CREATE INDEX idx_contracts_user_id ON contracts(user_id);
CREATE INDEX idx_contracts_created_at ON contracts(created_at);
```

### Migrations

**Pattern:** SQL files with descriptive names
- `database.sql` - Initial schema
- `stripe-migration.sql` - Add payment tables
- `feature-name-migration.sql` - Future migrations

**Apply migrations:**
```bash
psql -d vibelegal -f migration-file.sql
```

---

## Testing Standards (Future)

### Backend Testing

**API Integration Tests (Jest + Supertest):**
```javascript
describe('POST /api/login', () => {
  it('should return token for valid credentials', async () => {
    const response = await request(app)
      .post('/api/login')
      .send({ email: 'test@example.com', password: 'password' });

    expect(response.status).toBe(200);
    expect(response.body.token).toBeDefined();
  });
});
```

### Frontend Testing

**Component Tests (Vitest + React Testing Library):**
```javascript
import { render, screen } from '@testing-library/react';
import Component from './Component';

test('renders button', () => {
  render(<Component />);
  expect(screen.getByRole('button')).toBeInTheDocument();
});
```

### E2E Testing

**Critical User Flows (Playwright):**
- Signup → first contract → download
- Login → dashboard → view contract
- Upgrade to Pro → generate unlimited contracts

---

## Documentation Standards

### Code Comments

**When to comment:**
- Complex business logic
- Non-obvious workarounds
- Legal compliance reasons
- AI prompt engineering rationale

**Example:**
```javascript
// California law requires meal breaks after 5 hours
// This check ensures compliance with Labor Code Section 512
if (hoursPerDay > 5 && !hasMealBreakClause) {
  contract.addMealBreakClause();
}
```

### README Files

**Required sections:**
- Project overview
- Installation instructions
- Environment variables
- Running the application
- Project structure

### API Documentation (Future)

**When adding endpoints:**
- Document request/response format
- Include authentication requirements
- Provide example requests
- Note error responses

---

## Performance Standards

### Frontend Performance

**Lazy load heavy components:**
```javascript
const ContractEditor = React.lazy(() => import('./components/ContractEditor'));
```

**Memoize expensive computations:**
```javascript
const processedData = useMemo(() => {
  return expensiveComputation(data);
}, [data]);
```

**Debounce user input:**
```javascript
const debouncedSearch = useMemo(
  () => debounce(handleSearch, 300),
  []
);
```

### Backend Performance

**Use connection pooling:**
```javascript
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20 // Connection pool size
});
```

**Add indexes for common queries:**
```sql
CREATE INDEX idx_contracts_user_search ON contracts(user_id, created_at DESC);
```

**Monitor slow queries:**
```javascript
const start = Date.now();
const result = await pool.query(query);
const duration = Date.now() - start;

if (duration > 1000) {
  logger.warn('Slow query', { query, duration });
}
```

---

## Code Review Checklist

Before merging branches:

**Functionality:**
- [ ] Feature works as intended
- [ ] No console errors in browser/terminal
- [ ] Handles edge cases appropriately

**Security:**
- [ ] Input validation on all user inputs
- [ ] Parameterized database queries
- [ ] Authentication required for protected routes
- [ ] No sensitive data in logs

**Code Quality:**
- [ ] Follows naming conventions
- [ ] Clear variable/function names
- [ ] No commented-out code (delete it)
- [ ] Complex logic has comments

**Git:**
- [ ] Descriptive commit messages
- [ ] Branch follows naming convention
- [ ] No merge conflicts
- [ ] Ready to delete branch after merge

**Documentation:**
- [ ] Update CLAUDE.md with progress
- [ ] Add to PROGRESS.md if significant feature
- [ ] Environment variables documented

---

## Deprecation Policy

**Before removing code:**
1. Comment why it's being removed
2. Check if any other code depends on it
3. Remove references in documentation
4. Delete in separate commit for easy reversal

**Example:**
```javascript
// REMOVED: Old composer.js pattern, replaced by composer_enhanced.js
// Keeping file for reference until Master Input Brief is validated
// DELETE AFTER: 2025-09-30 if no issues
```

---

## Principles

1. **Consistency Over Cleverness** - Readable code beats clever code
2. **Explicit Over Implicit** - Clear intentions over magic
3. **Fail Fast** - Validate early, error clearly
4. **Security First** - Always validate, always sanitize
5. **Performance Last** - Optimize after measuring, not before
6. **Comments for Why, Not What** - Code explains what, comments explain why
