# Developer Setup Guide

> **Navigation:** [Home](../../README.md) | [Contributing](../../CONTRIBUTING.md) | [Testing](TESTING.md) | [Architecture](ARCHITECTURE.md) | [Style Guide](../../STYLE_GUIDE.md)

Complete setup guide for developers working on freebusy-site.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start (Dev Container)](#quick-start-dev-container)
- [Manual Setup](#manual-setup)
- [Verifying Installation](#verifying-installation)
- [Running the Application](#running-the-application)
- [Development Workflow](#development-workflow)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Required tools for development.

### Required

- **Node.js 20+** (check: `node --version`)
- **npm** (check: `npm --version`)
- **Git** (check: `git --version`)

### Optional but Recommended

- **VS Code** with Dev Containers extension
- **Docker** (for Dev Container)

## Quick Start (Dev Container)

Recommended approach for consistent development environment.

### What is a Dev Container?

Instead of installing all dependencies on your workstation, VS Code opens this project in a Docker container with everything pre-configured. Your code stays on your machine, but executes in the container.

### Setup Steps

1. **Install prerequisites:**
   - [VS Code](https://code.visualstudio.com/)
   - [Docker Desktop](https://www.docker.com/products/docker-desktop/)
   - [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)

2. **Clone the repository:**

   ```bash
   git clone https://github.com/robertsinfosec/freebusy-site.git
   cd freebusy-site
   ```

3. **Open in VS Code:**

   ```bash
   code .
   ```

4. **Reopen in Container:**
   - VS Code will detect `.devcontainer/devcontainer.json`
   - Click **Reopen in Container** when prompted
   - Or: Command Palette (Ctrl+Shift+P) → **Dev Containers: Reopen in Container**

5. **Wait for setup:**
   - First time takes 2-5 minutes (downloads base image, installs dependencies)
   - Subsequent opens are much faster

6. **Verify:**

   ```bash
   # Inside the container terminal
   node --version       # Should show 20+
   npm --version
   cd src
   npm run dev          # Should start Vite dev server
   ```

### Dev Container Features

- ✅ Node.js 20+ pre-installed
- ✅ All npm dependencies installed
- ✅ Git configured
- ✅ VS Code extensions pre-installed (ESLint, TypeScript, etc.)
- ✅ Isolated from your host system
- ✅ Consistent across all developers

## Manual Setup

If you prefer not to use Dev Containers.

### 1. Clone Repository

```bash
git clone https://github.com/robertsinfosec/freebusy-site.git
cd freebusy-site
```

### 2. Install Dependencies

```bash
# Navigate to src directory (package root)
cd src

# Install all dependencies
npm install
```

### 3. Configure Environment

```bash
# Copy example environment file
cp .env.example .env.local

# Edit .env.local with your settings
# VITE_FREEBUSY_API=http://localhost:8787/freebusy
```

### 4. Start Development Server

```bash
npm run dev
```

Server runs on `http://localhost:5000` (strict mode).

## Verifying Installation

Confirm everything is set up correctly.

### Check Node/npm Versions

```bash
node --version   # Should be 20+
npm --version    # Should be 10+
```

### Check Dependencies

```bash
cd src/
npm list --depth=0
# Should show react, vite, vitest, etc.
```

### Run Development Server

```bash
cd src/
npm run dev
```

Should output:

```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5000/
➜  Network: use --host to expose
➜  press h + enter to show help
```

## Running the Application

Different ways to run the app during development.

### Development Mode (Hot Reload)

```bash
cd src/
npm run dev
```

- Runs Vite dev server with hot module replacement
- Opens on `http://localhost:5000`
- Changes automatically reload in browser

### Production Build (Local Test)

```bash
cd src/
npm run build
npm run preview
```

- Builds optimized production bundle
- Previews production build locally
- Use this to test before deploying

### Run Tests

```bash
cd src/
npm test                # Run all tests
npm run test:coverage   # With coverage report
```

See [Testing Guide](TESTING.md) for details.

## Development Workflow

Typical day-to-day workflow for contributors.

### 1. Pull Latest Changes

```bash
git pull origin main
```

### 2. Create Feature Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

### 3. Make Changes

Edit files in `src/src/`:

```bash
# Edit component
code src/src/components/CalendarGrid.tsx

# Edit utility
code src/src/lib/date-utils.ts
```

### 4. Test Changes

```bash
cd src/

# Run dev server to see changes
npm run dev

# Run tests
npm test

# Run specific test file
npm test use-freebusy.test

# Run with coverage
npm run test:coverage
```

### 5. Lint and Format

```bash
cd src/

# Check for lint errors
npm run lint

# Auto-fix lint errors
npm run lint:fix
```

### 6. Commit Changes

```bash
git add .
git commit -m "feat: Add timezone selector to calendar view"
```

See [Git Commit Messages](../../STYLE_GUIDE.md#git-workflow) for format.

### 7. Push and Create PR

```bash
git push origin feature/your-feature-name
# Open PR on GitHub
```

## Troubleshooting

Common setup issues and solutions.

### Port 5000 Already in Use

**Problem:** Vite can't start because port 5000 is occupied.

**Solutions:**

1. Kill process using port 5000:

   ```bash
   # Find process
   lsof -i :5000
   
   # Kill it
   kill -9 <PID>
   ```

2. Or change port in `src/vite.config.ts`:

   ```typescript
   export default defineConfig({
     server: {
       port: 5001,  // Use different port
     },
   });
   ```

### Module Not Found Errors

**Problem:** Import errors or `MODULE_NOT_FOUND`.

**Solutions:**

1. Reinstall dependencies:

   ```bash
   cd src/
   rm -rf node_modules package-lock.json
   npm install
   ```

2. Check Node version:

   ```bash
   node --version  # Must be 20+
   ```

3. Clear Vite cache:

   ```bash
   cd src/
   rm -rf node_modules/.vite
   npm run dev
   ```

### Tests Failing

**Problem:** Tests fail with errors.

**Solutions:**

1. Ensure you're in `src/` directory:

   ```bash
   cd src/
   npm test
   ```

2. Clear test cache:

   ```bash
   cd src/
   rm -rf node_modules/.vitest
   npm test
   ```

3. Check for TypeScript errors:

   ```bash
   cd src/
   npx tsc --noEmit
   ```

See [Testing Guide](TESTING.md) for more troubleshooting.

### Dev Container Won't Build

**Problem:** Dev Container fails to build or start.

**Solutions:**

1. Rebuild container:
   - Command Palette → **Dev Containers: Rebuild Container**

2. Check Docker is running:

   ```bash
   docker ps
   ```

3. Check Docker resources:
   - Docker Desktop → Settings → Resources
   - Increase memory to 4GB+ if needed

4. Clear Docker cache:

   ```bash
   docker system prune -a
   ```

### Environment Variables Not Working

**Problem:** `VITE_FREEBUSY_API` not being used.

**Solutions:**

1. Check file name is `.env.local` (not `.env`):

   ```bash
   ls -la src/.env*
   ```

2. Restart dev server after changing `.env.local`:

   ```bash
   # Stop server (Ctrl+C)
   npm run dev
   ```

3. Verify variable starts with `VITE_`:

   ```
   VITE_FREEBUSY_API=http://localhost:8787/freebusy
   ```

   Variables MUST start with `VITE_` to be exposed to the app.

### Getting Help

For additional help:

1. Check [Testing Guide](TESTING.md) for test-related issues
2. Check [Architecture Guide](ARCHITECTURE.md) for code structure questions
3. Check [Deployment Guide](DEPLOYMENT.md) for deployment issues
4. Review [Style Guide](../../STYLE_GUIDE.md) for coding standards
5. 🐛 [Report bugs](https://github.com/robertsinfosec/freebusy-site/issues)
6. 💬 [Ask in Discussions](https://github.com/robertsinfosec/freebusy-site/discussions)

> **Navigation:** [Home](../../README.md) | [Contributing](../../CONTRIBUTING.md) | [Testing](TESTING.md) | [Architecture](ARCHITECTURE.md) | [Style Guide](../../STYLE_GUIDE.md)
