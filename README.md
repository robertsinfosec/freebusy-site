# robertsinfosec Free/Busy Calendar

A professional free/busy calendar viewer that displays real-time availability from an iCal feed.

![coverage](badges/coverage.svg) ![tests](badges/tests.svg)

## Features

- **Real-time Calendar Integration**: Fetches and displays busy/free time from an iCal feed
- **Smart Date Ranges**: Shows 2 weeks ahead with context from the previous week and option to expand to 3 weeks
- **Working Hours Visualization**: Clearly distinguishes working hours (Mon-Fri, 8am-6pm ET) from non-working time
- **Auto-refresh**: Calendar updates every 5 minutes to show current availability
- **Professional Design**: Cybersecurity-themed interface with IBM Plex Mono typography

## Local Development

1. Install dependencies:
```bash
npm install
```

2. Set up your environment variables:
```bash
cp .env.example .env.local
```

3. Edit `.env.local` and set the backend API URL:
```bash
# Defaults to this if unset
VITE_FREEBUSY_API=http://localhost:8787/freebusy
```

4. Start the development server:
```bash
npm run dev
```

## Testing

Unit tests (updates `badges/tests.svg`):
```bash
npm test
```

Coverage (CLI summary and HTML report in `coverage/`, updates both badges):
```bash
npm run test:coverage
```

Badges are generated locally and committed to the repo:
- Coverage: `badges/coverage.svg`
- Tests: `badges/tests.svg`

## CloudFlare Pages Deployment

### Initial Setup

1. Connect your repository to CloudFlare Pages
2. Configure build settings:
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Node version**: 18 or higher

### Environment Variables

In CloudFlare Pages dashboard, add the following environment variable:

- **Variable name**: `VITE_FREEBUSY_API`
- **Value**: Your deployed FreeBusy API endpoint (e.g., `https://your-api.example.com/freebusy`)

### Custom Domain Setup

To host at `freebusy.robertsinfosec.com`:

1. In CloudFlare Pages, go to your project's "Custom domains" section
2. Click "Set up a custom domain"
3. Enter `freebusy.robertsinfosec.com`
4. CloudFlare will automatically configure the DNS records

## Technical Details

- **Framework**: React 19 with TypeScript
- **Styling**: Tailwind CSS v4 with custom cybersecurity theme
- **Components**: Shadcn UI components
- **Icons**: Phosphor Icons
- **Animations**: Framer Motion
- **Font**: IBM Plex Mono (Google Fonts)

## Browser Support

Modern browsers with ES2020+ support:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## License

Private use only.
