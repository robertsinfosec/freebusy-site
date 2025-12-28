# robertsinfosec Free/Busy Calendar

A professional free/busy calendar viewer that displays real-time availability from an iCal feed.

![coverage](badges/coverage.svg) ![tests](badges/tests.svg)

## Features

- **Real-time Calendar Integration**: Fetches and displays normalized free/busy from the Freebusy API
- **Owner-day Anchoring (v2)**: Day columns are anchored to the calendar owner's timezone (IANA)
- **Viewer Timezone Switching**: Dropdown changes time labels + block placement without changing which owner-days are shown
- **Working Hours Visualization (v2)**: Working hours come from the API and are defined in owner-local time
- **Auto-refresh**: Calendar updates every 5 minutes to show current availability
- **Professional Design**: Cybersecurity-themed interface with IBM Plex Mono typography

## Time Semantics (API v2)

- **Owner timezone (calendar anchoring)**: Day columns are generated from `window.startDate` through `window.endDateInclusive` and are anchored to `calendar.timeZone`.
- **Viewer timezone (display only)**: The viewer timezone affects hour labels and vertical placement of blocks, but does not change which day columns exist.
- **Busy intervals**: `busy[]` uses canonical UTC instants (`startUtc` inclusive, `endUtc` exclusive). Rendering clips intervals to each owner-day column.
- **All-day intervals**: `kind: allDay` renders as fully busy for that owner-day column.
- **DST correctness**: Conversions rely on IANA timezone rules (no fixed offsets).

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
