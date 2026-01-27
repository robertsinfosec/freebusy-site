# Deployment Guide

> **Navigation:** [Home](../../README.md) | [Contributing](../../CONTRIBUTING.md) | [Setup](SETUP.md) | [Testing](TESTING.md) | [Architecture](ARCHITECTURE.md)

Complete deployment and operations guide for freebusy-site.

## Table of Contents

- [Deployment to Cloudflare Pages](#deployment-to-cloudflare-pages)
- [Environment Configuration](#environment-configuration)
- [Build Process](#build-process)
- [Operational Troubleshooting](#operational-troubleshooting)
- [Monitoring and Debugging](#monitoring-and-debugging)

## Deployment to Cloudflare Pages

How to deploy the frontend to Cloudflare Pages.

### Prerequisites

- Cloudflare account
- GitHub repository access
- Deployed Freebusy API endpoint

### Initial Setup

1. **Connect GitHub Repository:**
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
   - Navigate to **Pages**
   - Click **Create a project**
   - Connect your GitHub account
   - Select `robertsinfosec/freebusy-site` repository

2. **Configure Build Settings:**

   ```
   Production branch:     main
   Build command:         npm run build
   Build output directory: dist
   Root directory:        src
   ```

   > [!IMPORTANT]
   > The root directory MUST be `src` because that's where `package.json` lives.

3. **Set Environment Variables:**

   Navigate to **Settings** → **Environment variables** and add:

   ```
   Variable Name:        VITE_FREEBUSY_API
   Value:                https://your-freebusy-api.example.com/freebusy
   ```

   Replace with your actual Freebusy API endpoint URL.

4. **Deploy:**
   - Click **Save and Deploy**
   - Cloudflare will build and deploy automatically
   - First deploy takes 2-5 minutes

### Deployment Workflow

Every push to `main` triggers automatic deployment:

1. GitHub Actions CI runs (tests, linting, build)
2. If CI passes, Cloudflare Pages detects the push
3. Cloudflare clones repo and runs build
4. Built site is deployed to Cloudflare CDN
5. Site is live at `*.pages.dev` URL

### Custom Domain

To use a custom domain:

1. Go to **Pages** → Your project → **Custom domains**
2. Click **Set up a custom domain**
3. Enter your domain (e.g., `calendar.example.com`)
4. Follow DNS setup instructions
5. Wait for DNS propagation (can take 24-48 hours)

### Preview Deployments

Cloudflare automatically creates preview deployments for PRs:

- **URL format:** `<commit-hash>.freebusy-site.pages.dev`
- **Lifespan:** Deleted after PR is merged/closed
- **Use case:** Test changes before merging

## Environment Configuration

How environment variables work.

### Environment Variables

All environment variables MUST be prefixed with `VITE_` to be exposed to the app.

#### VITE_FREEBUSY_API

- **Purpose:** URL of the Freebusy API endpoint
- **Example:** `https://api.freebusy.example.com/freebusy`
- **Required:** Yes
- **Default:** `http://localhost:8787/freebusy` (development only)

Set this in:
- **Production:** Cloudflare Pages dashboard
- **Development:** `src/.env.local` file

### Local vs Production

Development (`.env.local`):

```bash
# Local API (when running freebusy-api locally)
VITE_FREEBUSY_API=http://localhost:8787/freebusy
```

Production (Cloudflare Pages):

```bash
# Deployed API endpoint
VITE_FREEBUSY_API=https://api.freebusy.example.com/freebusy
```

### Changing Environment Variables

On Cloudflare Pages:

1. Go to **Settings** → **Environment variables**
2. Edit or add variable
3. Click **Save**
4. Trigger a new deployment (push to `main` or click **Retry deployment**)

> [!WARNING]
> Changing environment variables does NOT automatically redeploy. You must trigger a new deployment manually.

## Build Process

Understanding how the build works.

### Build Steps

1. **Install dependencies:**

   ```bash
   cd src/
   npm ci  # Clean install from lockfile
   ```

2. **Version stamping:**

   ```bash
   npm run prebuild  # Generates version.generated.ts
   ```

3. **Vite build:**

   ```bash
   npm run build     # TypeScript compile + bundle
   ```

4. **Output:**

   Built files in `src/dist/`:
   
   ```
   dist/
   ├── assets/
   │   ├── index-abc123.js
   │   ├── index-def456.css
   │   └── ...
   ├── index.html
   └── version.txt
   ```

### Build Configuration

Vite configuration in `src/vite.config.ts`:

```typescript
export default defineConfig({
  build: {
    outDir: 'dist',
    sourcemap: false,  // No source maps in production
    minify: 'esbuild', // Fast minification
  },
  server: {
    port: 5000,
    strictPort: true,  // Fail if port occupied
  },
});
```

### Testing Production Build Locally

```bash
cd src/

# Build for production
npm run build

# Preview production build
npm run preview
```

Opens on `http://localhost:4173` by default.

## Operational Troubleshooting

Common operational issues and how to fix them.

### API Unavailable (503) or Disabled

**Symptom:** UI shows "unavailable" banner or "sharing is turned off" message.

**Diagnosis:**

1. Check if API endpoint is reachable:

   ```bash
   curl https://your-api-endpoint.com/freebusy
   ```

2. Check API health:

   ```bash
   curl https://your-api-endpoint.com/health
   ```

3. Check Cloudflare Pages environment variable:
   - Dashboard → Settings → Environment variables
   - Verify `VITE_FREEBUSY_API` is correct

**Solutions:**

- If API is down, check [freebusy-api](https://github.com/robertsinfosec/freebusy-api) deployment
- If API is disabled (`FREEBUSY_ENABLED=false`), this is intentional
- If URL is wrong, update environment variable and redeploy

### Rate Limited (429)

**Symptom:** UI shows "rate limit exceeded" message.

**Diagnosis:**

API is returning `429 Too Many Requests`. This is expected behavior when rate limits are hit.

**Solutions:**

- Wait for rate limit window to reset (check `rateLimit.nextAllowedAtUtc` in response)
- If persistent, check if API rate limits are too restrictive
- Contact API administrator to adjust limits if needed

### CORS Errors

**Symptom:** Browser console shows CORS errors, data fails to load.

**Diagnosis:**

Freebusy API is not allowing requests from your Pages domain.

**Solutions:**

1. Check API `ALLOWED_ORIGINS` environment variable
2. Add your Pages domain to allowed origins:
   
   ```
   ALLOWED_ORIGINS=https://your-site.pages.dev,https://calendar.example.com
   ```

3. Redeploy API with updated origins

### Build Failures

**Symptom:** Cloudflare Pages deployment fails during build.

**Common causes:**

1. **TypeScript errors:**
   
   ```bash
   cd src/
   npx tsc --noEmit
   ```

2. **Missing dependencies:**
   
   ```bash
   cd src/
   npm install
   ```

3. **Lint errors:**
   
   ```bash
   cd src/
   npm run lint
   ```

4. **Test failures:**
   
   ```bash
   cd src/
   npm test
   ```

**Solutions:**

- Fix errors locally and push
- Check build logs in Cloudflare Pages dashboard
- Ensure `package-lock.json` is committed

### White Screen / Blank Page

**Symptom:** Site loads but shows blank white screen.

**Diagnosis:**

1. Check browser console for JavaScript errors
2. Check if assets are loading (Network tab)
3. Check if API is reachable

**Solutions:**

1. **Check base path:** Ensure site is deployed to root, not subdirectory
2. **Check environment variables:** Verify `VITE_FREEBUSY_API` is set
3. **Clear browser cache:** Hard refresh (Ctrl+Shift+R)
4. **Check build output:** Verify `dist/index.html` exists

### Stale Content

**Symptom:** Changes don't appear after deployment.

**Solutions:**

1. **Hard refresh:** Ctrl+Shift+R in browser
2. **Check deployment status:** Cloudflare Pages → Deployments
3. **Verify build:** Check build logs show latest commit hash
4. **CDN cache:** Can take 1-2 minutes to propagate globally

## Monitoring and Debugging

Tools and techniques for monitoring production.

### Cloudflare Analytics

View traffic and performance metrics:

1. Go to **Pages** → Your project → **Analytics**
2. View:
   - Requests per day
   - Bandwidth usage
   - Countries
   - Referrers

### Browser DevTools

Use browser console to debug:

```javascript
// Check version
fetch('/version.txt').then(r => r.text()).then(console.log)

// Check API endpoint
console.log(import.meta.env.VITE_FREEBUSY_API)

// Check API response
fetch(import.meta.env.VITE_FREEBUSY_API)
  .then(r => r.json())
  .then(console.log)
```

### Health Checks

Monitor API health:

```bash
# Check API health
curl https://your-api.com/health

# Check API freebusy endpoint
curl https://your-api.com/freebusy

# Check with verbose output
curl -v https://your-api.com/freebusy
```

### Logs

Cloudflare Pages doesn't provide runtime logs (static site). Check:

- **Build logs:** Cloudflare Pages dashboard
- **API logs:** Freebusy API Cloudflare Worker logs
- **Browser logs:** Browser DevTools console

### Performance

Check site performance:

- **Lighthouse:** Chrome DevTools → Lighthouse tab
- **WebPageTest:** https://www.webpagetest.org/
- **Cloudflare Analytics:** Pages dashboard

### Rollback

To rollback to a previous version:

1. Go to **Pages** → Your project → **Deployments**
2. Find previous successful deployment
3. Click **⋯** menu → **Rollback to this deployment**
4. Confirm rollback

> [!NOTE]
> Rollback deploys the old build but doesn't change your Git history.

## Quick Reference

Common operational commands and links.

### Useful Links

- **Cloudflare Pages:** https://dash.cloudflare.com/ → Pages
- **GitHub Actions:** https://github.com/robertsinfosec/freebusy-site/actions
- **Codecov:** https://codecov.io/gh/robertsinfosec/freebusy-site
- **API Repo:** https://github.com/robertsinfosec/freebusy-api

### Common Commands

```bash
# Local development
cd src/ && npm run dev

# Test production build
cd src/ && npm run build && npm run preview

# Run tests
cd src/ && npm test

# Check build
cd src/ && npm run build

# Check types
cd src/ && npx tsc --noEmit

# Lint
cd src/ && npm run lint
```

### Emergency Contacts

- **Security issues:** `security@robertsinfosec.com`
- **GitHub Issues:** https://github.com/robertsinfosec/freebusy-site/issues

> **Navigation:** [Home](../../README.md) | [Contributing](../../CONTRIBUTING.md) | [Setup](SETUP.md) | [Testing](TESTING.md) | [Architecture](ARCHITECTURE.md)
