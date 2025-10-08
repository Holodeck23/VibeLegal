# JavaScript Style Guide

## General JavaScript

### Naming Conventions
- **Variables and Functions**: Use camelCase (e.g., `userData`, `calculateTotal`)
- **Classes and Components**: Use PascalCase (e.g., `UserProfile`, `ContractEditor`)
- **Constants**: Use UPPER_SNAKE_CASE (e.g., `MAX_RETRY_COUNT`, `API_ENDPOINT`)
- **Private Functions**: Prefix with underscore `_privateMethod` (convention only)

### String Formatting
- Use single quotes for strings: `'Hello World'`
- Use template literals for string interpolation: `` `Hello ${name}` ``
- Use template literals for multi-line strings

### Functions
- Prefer arrow functions for callbacks and short functions
- Use named functions for better stack traces in errors
- Keep functions small and focused (single responsibility)

### Async/Await
- Always use async/await over raw promises
- Always use try-catch for error handling
- Never use `.then()` chains (use async/await instead)

**Example:**
```javascript
// ✅ Good
async function fetchData() {
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

// ❌ Bad
function fetchData() {
  return fetch(url)
    .then(response => response.json())
    .catch(error => console.error(error));
}
```

## React/JSX Specific

### Component Structure
- Use functional components with hooks (NO class components)
- Order: imports, constants, component definition, exports
- Destructure props in function parameters
- Use named exports for utilities, default export for main component

**Example:**
```javascript
import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';

const DEFAULT_TIMEOUT = 3000;

function ComponentName({ title, onClose, isVisible = false }) {
  const [state, setState] = useState(initialValue);

  useEffect(() => {
    // Side effects
  }, [dependencies]);

  const handleAction = () => {
    // Handler logic
  };

  return (
    <div className="...">
      {/* JSX */}
    </div>
  );
}

export default ComponentName;
```

### Hooks Guidelines
- Call hooks at the top level (never in conditions/loops)
- Always include all dependencies in useEffect dependency arrays
- Extract complex logic into custom hooks
- Name custom hooks with `use` prefix (e.g., `useAuth`, `useContract`)

### Event Handlers
- Prefix with `handle`: `handleClick`, `handleSubmit`, `handleInputChange`
- Define handlers inside component (not inline unless trivial)
- Use arrow functions to avoid binding issues

### Conditional Rendering
- Use logical AND (`&&`) for simple conditionals
- Use ternary for if-else conditionals
- Extract complex conditionals to variables

**Example:**
```javascript
// Simple conditional
{isLoading && <Spinner />}

// If-else
{status === 'loading' ? <Spinner /> : <Content />}

// Complex conditional (extract to variable)
const showUpgradePrompt = !isPro && contractCount >= 5;
{showUpgradePrompt && <UpgradePrompt />}
```

### State Management
- Use `useState` for component-specific state
- Use React Context for app-wide state
- Keep state as close to where it's used as possible
- Batch related state into objects when appropriate

### Props
- Always destructure props in function parameters
- Provide default values for optional props
- Use prop spreading sparingly (prefer explicit props)

## Backend/Node.js Specific

### Module Structure
- Require dependencies at top of file
- Group requires by category (node built-ins, npm packages, local files)
- Use destructuring for imports: `const { pool } = require('./db/pool')`

### Error Handling
- Always use try-catch for async operations
- Create custom error classes when appropriate
- Log errors with context (user ID, operation, etc.)
- Never swallow errors silently

### Database Queries
- ALWAYS use parameterized queries (never string concatenation)
- Use connection pooling
- Handle query errors explicitly
- Log slow queries for optimization

**Example:**
```javascript
// ✅ Good - Parameterized query
const result = await pool.query(
  'SELECT * FROM users WHERE email = $1',
  [email]
);

// ❌ Bad - SQL injection vulnerability
const result = await pool.query(
  `SELECT * FROM users WHERE email = '${email}'`
);
```

### API Responses
- Use consistent response format (success/error)
- Always return appropriate HTTP status codes
- Include error messages for client debugging
- Never expose sensitive data in error messages

**Example:**
```javascript
// Success
res.json({
  success: true,
  data: { ... }
});

// Error
res.status(400).json({
  success: false,
  error: 'Validation failed'
});
```

## Comments
- Add comments for complex business logic
- Explain "why" not "what"
- Document legal compliance reasons
- Keep comments up-to-date with code changes
- Remove commented-out code (use git history instead)

## File Organization
- One component per file
- Name file after main export (e.g., `UserProfile.jsx`)
- Group related files in directories
- Keep utilities separate from components

## Best Practices
- Keep functions short (< 50 lines when possible)
- Avoid deep nesting (max 3-4 levels)
- Use early returns to reduce nesting
- Extract repeated logic to helper functions
- Prefer explicit code over clever code

See `.agent-os/product/coding-standards.md` for VibeLegal-specific patterns and conventions.
