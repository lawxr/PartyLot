# Contributing to PartyLot

Thank you for your interest in PartyLot! 

PartyLot is currently being built and maintained for the **Monad Metropolis Hackathon** by the core team: **Law & Gabriela**.

---

## Team & Development Scope

During the active hackathon submission and evaluation window:
- Core development, architecture, and feature commits are authored by **Law & Gabriela**.
- Community feedback, issue reporting, and suggestions are welcomed via [GitHub Issues](https://github.com/lawxr/PartyLot/issues).

---

## Local Development Setup

### Prerequisites
- **Node.js**: v22.13 or higher
- **pnpm**: v11.15.0 (declared package manager)

### Installation
```bash
# 1. Clone repository
git clone https://github.com/lawxr/PartyLot.git
cd PartyLot

# 2. Install dependencies
pnpm install

# 3. Configure environment
cp .env.example .env.local

# 4. Start local development server
pnpm dev
```

---

## Quality Gates & Verification

Before opening a pull request or submitting changes, all four checks must pass:

```bash
# 1. TypeScript type checking
pnpm typecheck

# 2. ESLint
pnpm lint

# 3. Vitest test suite
pnpm test

# 4. Production build
pnpm build
```

Alternatively, run the unified verification script:
```bash
pnpm release:check
```

---

## Commit Guidelines

We strictly adhere to [Conventional Commits](https://www.conventionalcommits.org/):
- `feat(...)`: New user-facing feature or enhancement.
- `fix(...)`: Bug fix or patch.
- `docs(...)`: Documentation updates.
- `test(...)`: Adding or updating test suites.
- `refactor(...)`: Code refactoring without behavioral changes.
- `chore(...)`: Maintenance, dependency, or config updates.

---

## Code of Conduct

All contributors and community participants are expected to follow our [Code of Conduct](CODE_OF_CONDUCT.md).
