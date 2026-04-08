# Brand Standards

> **Status**: Baseline v1.0  
> **Last Updated**: April 8, 2026  
> **Purpose**: Ensure consistent visual identity, voice, and terminology across all user-facing touchpoints

This document defines the brand identity for **freebusy-site** — the visual language, tone, and terminology that make the application recognizable and professional.

## Brand Positioning

> [!NOTE]
> **freebusy-site** is a professional, technical tool for sharing calendar availability. The brand should evoke:
> - **Professionalism**: Appropriate for business scheduling contexts
> - **Technical precision**: Clarity and accuracy in time representation
> - **Security-minded**: Trustworthy handling of calendar data
> - **Efficiency**: Quick visual scanning without cognitive overhead
>
> **Not**: Playful, consumer-focused, or overly minimal to the point of ambiguity.

## Visual Identity

### Color Palette

The color system uses **Radix UI color scales** for semantic consistency and automatic light/dark mode support. The primary accent color is **Cyan** (teal-blue), chosen to evoke cybersecurity, technology, and trust.

#### Primary Colors

| Color | Usage | Light Mode | Dark Mode |
|-------|-------|------------|-----------|
| **Cyan (accent)** | Interactive elements, primary CTA, current day highlight | `var(--cyan-9)` | `var(--cyan-9)` |
| **Slate (neutral)** | Text, borders, backgrounds | `var(--slate-1)` to `var(--slate-12)` | `var(--slate-dark-1)` to `var(--slate-dark-12)` |
| **Red** | Error states, unavailable calendars | `var(--red-9)` | `var(--red-dark-9)` |

#### Semantic Tokens

Use these semantic tokens rather than direct color values:

| Token | CSS Variable | Purpose |
|-------|--------------|---------|
| Foreground | `var(--color-fg)` | Primary text color |
| Foreground Secondary | `var(--color-fg-secondary)` | Secondary/muted text |
| Background | `var(--color-bg)` | Page background |
| Background Inset | `var(--color-bg-inset)` | Card backgrounds, elevated surfaces |
| Background Overlay | `var(--color-bg-overlay)` | Modal overlays |
| Accent | `var(--color-accent-9)` | Primary interactive elements |
| Neutral 1-12 | `var(--color-neutral-1)` through `var(--color-neutral-12)` | Graduated neutral scale |

#### Working Hours Visualization

- **Working hours background**: Lighter/neutral background (`neutral-2` or `neutral-3`)
- **Non-working hours**: Slightly darker/muted (`neutral-4` with reduced opacity)
- **Busy blocks**: Primary accent color (`accent-9`) with sufficient contrast
- **Current day highlight**: Accent color border or subtle background tint

### Typography

**Primary typeface**: **Inter**

- **Weights**: 400 (regular), 500 (medium), 600 (semi-bold), 700 (bold)
- **Source**: Google Fonts CDN (preconnected for performance)
- **Rationale**: Inter is a highly legible, technical sans-serif optimized for UI and screen readability

#### Type Scale

| Element | Size | Weight | Usage |
|---------|------|--------|-------|
| **H1** (Page title) | `text-2xl` (24px) / `sm:text-3xl` (30px) | 700 (bold) | Main page heading: "robertsinfosec Free/Busy" |
| **H2** (Week labels) | `text-lg` (18px) | 600 (semi-bold) | Week section headers |
| **Body** | `text-base` (16px) | 400 (regular) | Descriptive text, calendar labels |
| **Small** | `text-sm` (14px) | 400 (regular) | Metadata, timestamps, secondary info |
| **Tiny** | `text-xs` (12px) | 400 (regular) | Badges, pills, fine print |

### Spacing and Layout

**Spacing scale**: Tailwind default scale multiplied by `--size-scale` variable (default: `1`)

- **Container padding**: `2rem` (32px)
- **Card padding**: `1rem` (16px) to `1.5rem` (24px)
- **Section gaps**: `2rem` (32px) vertical spacing between major sections
- **Component gaps**: `0.5rem` (8px) to `1rem` (16px) for related elements

### Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `sm` | `var(--radius-sm)` | Small elements (badges, pills) |
| `md` | `var(--radius-md)` | Buttons, inputs, cards |
| `lg` | `var(--radius-lg)` | Larger cards, modals |
| `xl` | `var(--radius-xl)` | Hero sections (if used) |
| `full` | `var(--radius-full)` | Circular elements (theme toggle) |

### Icons

**Icon library**: **Phosphor Icons** (`@phosphor-icons/react`)

- **Style**: `duotone` (two-tone) for primary icons, `regular` for utility icons
- **Size**: 16px–28px depending on context
- **Color**: Inherits from text color or uses primary accent

**Key icons**:
- `Calendar` (duotone): Logo/brand icon in header
- `CalendarPlus`: "Book a Meeting" CTA
- `SunDim` / `Moon`: Theme toggle
- `Check`: Confirmation states
- `Warning`: Error states

### Accessibility

> [!IMPORTANT]
> All color pairings must meet **WCAG 2.2 Level AA** contrast requirements:
> - **Normal text**: 4.5:1 minimum contrast ratio
> - **Large text** (18px+ or 14px bold+): 3:1 minimum contrast ratio
> - **Interactive elements**: 3:1 minimum for focus indicators and UI controls

**Verified pairings** (meeting WCAG AA):
- Accent Cyan (`oklch(0.75 0.18 195)`) on Dark Background (`oklch(0.15 0.01 240)`): **9.8:1** ✓
- Foreground text on Background: **12.1:1+** ✓
- Working hours muted text: **4.7:1** ✓

## Voice and Tone

### Writing Principles

1. **Direct and efficient**: Get to the point. No fluff.
2. **Technically precise**: Use correct terminology (timezone, IANA identifiers, UTC, ISO 8601).
3. **Professional but approachable**: Formal enough for business, human enough to not feel robotic.
4. **Transparent about limitations**: If something isn't available or is degraded, say so clearly.

### Tone Examples

| Context | ✅ Good | ❌ Avoid |
|---------|---------|----------|
| **Loading state** | "Loading availability..." | "Hang tight! We're fetching your calendar! 🎉" |
| **Error state** | "Calendar unavailable. The service may be temporarily disabled. Contact the owner for details." | "Oops! Something went wrong. Try again?" |
| **Empty calendar** | "No busy blocks scheduled. All time available." | "You're completely free! Enjoy your freedom! 🏖️" |
| **Timezone selector** | "Viewing timezone" (aria-label) | "Pick your TZ" |
| **CTA button** | "Book a Meeting" | "Let's Chat!" or "Schedule Now!" |

### Vocabulary

#### Preferred Terms

| Use This | Not That | Rationale |
|----------|----------|-----------|
| **Busy blocks** | "Events", "Meetings", "Appointments" | We intentionally do not expose event details |
| **Working hours** | "Business hours", "Office hours" | Neutral, applies to varied work arrangements |
| **Owner timezone** | "Default timezone", "My timezone" | Clear ownership and authority |
| **Viewer timezone** | "Your timezone", "Display timezone" | Clear role as presentation layer |
| **Unavailable** | "Out of office", "Blocked" | Neutral, covers all busy types |
| **Available** | "Free", "Open" | Positive framing |

#### Capitalization

- **Product name**: "freebusy-site" (lowercase, hyphenated in technical contexts), "Free/Busy" (title case with slash in UI)
- **Features**: Sentence case ("Working hours", "Timezone selector")
- **Buttons**: Title case ("Book a Meeting", "Show More")
- **Error messages**: Sentence case with period

## Terminology

### Time and Calendar Terms

- **IANA timezone**: Correct. Always use full identifiers like `America/New_York`, not abbreviations like "EST"
- **UTC**: Correct. Do not use "GMT"
- **ISO 8601**: Correct format standard for timestamps
- **Owner-day**: Correct. Calendar day in owner's timezone
- **iCal** or **iCalendar**: Correct. Not "ical" or "ICAL"

### UI Elements

- **Calendar grid**: The full multi-week view
- **Week section**: A single week container
- **Day column**: A vertical column representing one owner-day
- **Availability card**: The component showing a single day's availability
- **Busy block**: A shaded rectangle indicating unavailable time

## User-Facing Copy

### Standard Messages

#### Header Description
```
Real-time view of my scheduling availability.
Times are shown in [Timezone Label]. Unshaded areas are working hours. Shaded areas are not available.
```

#### Loading State
```
Loading availability...
```

#### Error States

**Calendar Disabled (HTTP 410)**:
```
Calendar unavailable
The service may be temporarily disabled. Contact the owner for details.
```

**Rate Limited (HTTP 429)**:
```
Rate limit exceeded
Too many requests. Try again in [countdown].
```

**Service Unavailable (HTTP 503)**:
```
Service temporarily unavailable
Please try again in a moment.
```

**Network Error**:
```
Failed to load availability
Check your connection and try again.
```

#### Empty Calendar
```
No busy blocks scheduled
All time available during working hours.
```

### Button Labels

- **Primary CTA**: "Book a Meeting"
- **Timezone selector**: "Viewing timezone" (aria-label), displays selected timezone abbreviation
- **Theme toggle**: "Toggle theme" (aria-label), no visible text
- **Refresh/Retry**: "Try Again"
- **Export**: "Copy Availability" (if/when implemented)

## Logo and Branding Assets

### Current Logo

- **Icon**: Phosphor `Calendar` icon in duotone style
- **Size**: 28px in header
- **Color**: Primary accent (`text-primary` / cyan)

### Wordmark

- **Text**: "robertsinfosec Free/Busy"
- **Treatment**: 
  - "robertsinfosec" in lowercase (brand username)
  - "Free/Busy" in Title Case with forward slash
- **Placement**: Header, page title, browser tab

### Favicon

- **Current**: `favicon.png` (brand-specific icon)
- **Fallback**: Calendar icon if no custom favicon provided

## Link and External References

### External Links

- **Cal.com booking link**: `https://cal.com/robertsinfosec`
- **Repository**: `https://github.com/robertsinfosec/freebusy-site`
- **Related projects**: `https://github.com/robertsinfosec/freebusy-api`

### Link Treatment

- All external links open in new tab: `target="_blank" rel="noopener noreferrer"`
- External CTAs use button styling: "Book a Meeting" button with `CalendarPlus` icon

## Responsive Behavior

### Breakpoints

Follow Tailwind default breakpoints:
- `sm:` 640px+ (tablet portrait)
- `md:` 768px+
- `lg:` 1024px+ (desktop)
- `xl:` 1280px+

### Mobile Considerations

- Header stacks vertically on mobile (`flex-col` → `sm:flex-row`)
- Calendar grid uses horizontal scroll if needed (preserve day column integrity)
- Buttons remain full-width on mobile, inline on desktop
- Font sizes scale down slightly on mobile (e.g., `text-2xl` → `sm:text-3xl`)

## Dark Mode

### Implementation

- **Detection**: Respects system preference (`prefers-color-scheme`)
- **Manual toggle**: Theme toggle button in header persists preference to `localStorage`
- **Color system**: Radix UI provides automatic dark variants (`*-dark-*` scales)
- **Consistency**: All components use semantic tokens that adapt automatically

### Dark Mode Testing

> [!TIP]
> When implementing new UI, test both light and dark modes:
> ```bash
> # Force dark mode in browser DevTools:
> # Settings → Rendering → Emulate CSS media prefers-color-scheme: dark
> ```

## Component Examples

### Primary Button (CTA)
```tsx
<Button asChild variant="default" size="sm" className="gap-2">
  <a href="https://cal.com/robertsinfosec" target="_blank" rel="noopener noreferrer">
    <CalendarPlus size={16} />
    Book a Meeting
  </a>
</Button>
```

### Timezone Selector
```tsx
<Select value={viewingTimeZone} onValueChange={setViewTimeZone}>
  <SelectTrigger className="w-[190px]" aria-label="Viewing timezone">
    <SelectValue placeholder="Timezone" />
  </SelectTrigger>
  <SelectContent>
    {US_TIME_ZONES.map(tz => (
      <SelectItem key={tz.id} value={tz.id}>
        {tz.label}
        {isOwnerTZ && <Badge variant="secondary">Owner TZ</Badge>}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

### Calendar Header
```tsx
<div className="flex items-center gap-3">
  <Calendar size={28} weight="duotone" className="text-primary" />
  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
    robertsinfosec Free/Busy
  </h1>
</div>
```

## Compliance and Constraints

### Brand Usage Rules

> [!WARNING]
> The following rules are non-negotiable for maintaining brand consistency:

1. **Do not** alter the color palette without updating design tokens and contrast ratios
2. **Do not** introduce new fonts — stick with Inter
3. **Do not** use emoji in UI copy (error messages, buttons, labels) — use Phosphor icons instead
4. **Do not** use "cute" or playful language — maintain professional tone
5. **Do** ensure all text/background pairings meet WCAG AA contrast minimums
6. **Do** test all changes in both light and dark modes

### Content Review Checklist

Before committing user-facing text:
- [ ] Uses preferred terminology from this document
- [ ] Maintains professional, direct tone
- [ ] Avoids jargon or abbreviations (unless defined above)
- [ ] Tested in both light and dark modes
- [ ] Meets WCAG AA contrast requirements
- [ ] No emoji or decorative Unicode characters

---

> [!NOTE]
> **Maintenance**: Update this document when introducing new visual elements, changing terminology, or revising tone guidance. All changes should maintain consistency with existing brand direction.
