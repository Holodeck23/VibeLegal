# VibeLegal Agent OS Documentation

## Documentation Structure

Agent OS documentation is organized into two complementary directories:

### 📁 `.agent-os/standards/` - Global Standards
General coding standards and guidelines that apply across all Agent OS projects.

**Files:**
- `tech-stack.md` - Quick reference tech stack (points to product/ for details)
- `best-practices.md` - Universal development principles (DRY, KISS, etc.)
- `code-style.md` - General formatting and naming conventions
- `code-style/javascript-style.md` - JavaScript/React/Node.js specific patterns
- `code-style/html-style.md` - HTML structure and attribute formatting
- `code-style/css-style.md` - TailwindCSS multi-line formatting conventions

**Purpose:** Reusable standards that work for any project. When Agent OS is used on future projects, these standards come along.

---

### 📁 `.agent-os/product/` - VibeLegal-Specific Documentation
Comprehensive documentation specific to the VibeLegal product.

**Files:**
1. **`overview.md`** (128 lines) - Product vision, problem/solution, target users, strategy
2. **`tech-stack.md`** (334 lines) - Complete architecture, all dependencies, data flow, deployment
3. **`roadmap.md`** (583 lines) - Phase 0 completed features, Phases 1-4 future plans
4. **`decisions.md`** (516 lines) - 12 architectural decisions with rationale and trade-offs
5. **`coding-standards.md`** (756 lines) - VibeLegal-specific patterns, Git workflow, conventions
6. **`features.md`** (1,164 lines) - All 50+ features documented with implementation details

**Total:** 3,481 lines of VibeLegal-specific product knowledge

**Purpose:** Deep product context for AI agents working on VibeLegal. Captures current state, architectural decisions, and future direction.

---

## How They Work Together

```
Agent OS Instructions
        ↓
Read: .agent-os/standards/      (General coding guidelines)
        ↓
Read: .agent-os/product/        (VibeLegal-specific context)
        ↓
Execute Task with Full Context
```

**Example Flow:**
1. Agent starts working on new feature for VibeLegal
2. Reads `standards/javascript-style.md` → Knows to use camelCase, async/await, etc.
3. Reads `product/tech-stack.md` → Knows VibeLegal uses React/Node, not Rails
4. Reads `product/decisions.md` → Understands why OpenAI over Claude, why California-only
5. Reads `product/coding-standards.md` → Knows VibeLegal's Git workflow (feat/fix branches)
6. Implements feature following all standards and context

---

## Quick Reference

### For General Coding Questions
→ See `.agent-os/standards/`

### For VibeLegal-Specific Questions
→ See `.agent-os/product/`

### When Working on Features
1. Read relevant standards (JavaScript, HTML, CSS as needed)
2. Read product context (tech-stack, decisions, roadmap)
3. Follow VibeLegal coding standards (Git workflow, naming)
4. Reference feature docs for existing patterns

---

## Documentation Maintenance

### When to Update Standards
- New coding conventions adopted across all projects
- Better practices discovered
- Style guide improvements

### When to Update Product Docs
- New features completed → Update `features.md` and `roadmap.md`
- Architectural decisions made → Add to `decisions.md`
- Tech stack changes → Update `tech-stack.md`
- Coding patterns change → Update `coding-standards.md`
- Product strategy shifts → Update `overview.md`

---

## Agent OS Commands

VibeLegal has the following Agent OS commands available:

- `/analyze-product` - Analyze codebase and install/update Agent OS (already done)
- `/plan-product` - Plan new product from scratch
- `/create-spec` - Create detailed feature specification
- `/create-tasks` - Generate task list from approved spec
- `/execute-tasks` - Execute tasks following TDD workflow

**Usage Example:**
```
@.agent-os/instructions/core/create-spec.md

Feature: Add email notifications for contract completion
```

---

## Current Project State

**Phase:** Pre-launch MVP (beta-ready)
**Last Active Development:** August 2025 (1 month hiatus)
**Codebase Status:** 50+ features complete, payment infrastructure ready
**Next Step:** Deploy and validate market demand

**Immediate Priorities:**
1. Merge `feat/website-copy-optimization` branch
2. Fix frontend security vulnerabilities
3. Deploy to production
4. Acquire first 10-20 beta users

See `product/roadmap.md` Phase 1 for detailed launch plan.

---

## Documentation Stats

**Standards:** 1,900+ lines of general guidelines
**Product Docs:** 3,481 lines of VibeLegal-specific knowledge
**Total:** 5,400+ lines of comprehensive AI agent context

This documentation enables AI agents to:
- Understand VibeLegal's current state completely
- Make architectural decisions consistent with past choices
- Write code following established patterns
- Plan features aligned with product roadmap
- Navigate codebase efficiently

---

## For New Contributors

Start here:
1. `product/overview.md` - Understand what VibeLegal is
2. `product/tech-stack.md` - Learn the technology stack
3. `product/coding-standards.md` - Git workflow and conventions
4. `standards/javascript-style.md` - JavaScript/React patterns

Then dive into:
- `product/features.md` - See what's already built
- `product/decisions.md` - Understand why things are built this way
- `product/roadmap.md` - See what's coming next

---

## External Resources

**Agent OS:** https://github.com/buildermethods/agent-os
**VibeLegal Repo:** (Current repository)
**Tech Docs:** See individual dependency documentation in `product/tech-stack.md`
