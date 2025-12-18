# robertsinfosec Free/Busy Calendar

A professional free/busy calendar viewer that displays real-time availability from a ProtonMail iCal feed.

## Features

- **Real-time Calendar Integration**: Fetches and displays busy/free time from ProtonMail calendar via iCal feed
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
cp .env.example .env
```

3. Edit `.env` and add your ProtonMail calendar iCal URL:
```
VITE_ICAL_URL=https://calendar.protonmail.com/api/calendar/v1/url/YOUR_CALENDAR_ID/calendar.ics
```

4. Start the development server:
```bash
npm run dev
```

## CloudFlare Pages Deployment

### Initial Setup

1. Connect your repository to CloudFlare Pages
2. Configure build settings:
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Node version**: 18 or higher

### Environment Variables

In CloudFlare Pages dashboard, add the following environment variable:

- **Variable name**: `VITE_ICAL_URL` (for build time) or `ICAL_URL` (runtime)
- **Value**: Your ProtonMail iCal URL (e.g., `https://calendar.protonmail.com/api/calendar/v1/url/YOUR_CALENDAR_ID/calendar.ics`)

### Getting Your ProtonMail iCal URL

1. Log into ProtonMail Calendar
2. Navigate to Calendar Settings
3. Find the "Share" or "Calendar Address" section
4. Copy the iCal/ICS URL
5. Use this URL as your `ICAL_URL` environment variable

**Important**: The iCal URL contains sensitive information. Keep it secure and do not commit it to version control.

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

