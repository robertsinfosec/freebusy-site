# Planning Guide

A professional free/busy calendar viewer that displays availability from an iCal feed, showing a 2-week window with the ability to expand to 3 weeks, designed for scheduling transparency.

## Experience qualities

This section captures the non-functional qualities that should guide tradeoffs in features and presentation. Use these qualities as a compass when deciding between alternative UI layouts or interactions. If a change improves one quality but harms another, call that out explicitly.

- **Professional:** A clean, trustworthy interface appropriate for business scheduling.
- **Efficient:** Quick visual scanning of availability without information overload.
- **Transparent:** Clear communication of working hours and busy/free time blocks.

## Complexity level

This section provides a high-level description of how much state and behavior the product is expected to contain. It helps keep expectations realistic for implementation effort and testing scope. The intent is a focused tool rather than a full calendar application.

- **Level:** Light application (multiple features with basic state).
- **Rationale:** A single-view calendar visualization tool with iCal parsing, date range handling, and an interactive expansion for an additional week.

## Essential Features

This section describes the minimum feature set required for a useful free/busy viewer. Each subsection documents the purpose and the acceptance criteria for that feature. Use these descriptions to validate changes and to prioritize fixes.

### iCal feed parsing

This feature is responsible for acquiring and interpreting calendar data. It should be resilient to minor input variations and failures, and should produce a stable, normalized set of busy intervals. Correctness here is foundational for every other feature.

- **Functionality:** Fetches and parses iCal data from an environment variable URL to extract busy time blocks.
- **Purpose:** Provides real-time availability data from an iCal calendar feed.
- **Trigger:** Loads automatically on page mount and refreshes periodically.
- **Progression:** Fetch iCal URL → Parse VEVENT entries → Extract busy time blocks → Map to calendar grid.
- **Success criteria:** Accurately displays all busy blocks from the calendar feed with correct date/time ranges.

### Two-week calendar view with context

This feature defines the primary visualization: a short, decision-oriented window of availability. It should favor clarity and consistency so users can quickly compare days and identify meeting-friendly times. Context weeks should support orientation without competing for attention.

- **Functionality:** Displays the current day through two weeks ahead with faded previous/next week context.
- **Purpose:** Shows a relevant scheduling window while providing temporal context.
- **Trigger:** Automatically displays on load based on the current date.
- **Progression:** Calculate date ranges → Render week grid → Apply opacity transitions for context weeks → Highlight current day.
- **Success criteria:** Calendar clearly shows two weeks with a visual hierarchy distinguishing context from the primary range.

### Expandable third week

This feature extends the primary window without overwhelming the default view. The UI should make the expanded state obvious and reversible (if supported), and the extra week should behave identically to the main weeks once shown. Any animations should be purposeful and not distract from the data.

- **Functionality:** A “Show More” button reveals an additional week of availability.
- **Purpose:** Provides extended scheduling options for users planning further ahead.
- **Trigger:** User clicks the “Show More” button overlay on the faded future week.
- **Progression:** Click button → Animate third week to full opacity → Replace button with full calendar data.
- **Success criteria:** Smooth transition reveals the third week with the same detail level as the primary weeks.

### Working hours visualization

This feature communicates the difference between “available time” and “reasonable meeting time.” It should be legible at a glance and consistent across weeks. The visualization should also remain accurate when time zones or daylight saving changes are involved.

- **Functionality:** Visually distinguishes working hours (8am–6pm ET, Mon–Fri) from non-working time.
- **Purpose:** Sets clear expectations for appropriate meeting times.
- **Trigger:** Renders automatically as part of the calendar grid.
- **Progression:** Calculate working hours per day → Apply visual treatment to working blocks → Dim non-working hours.
- **Success criteria:** Working hours are immediately distinguishable from evenings and weekends.

## Edge Case Handling

This section documents the common failure modes and tricky inputs that the UI should handle gracefully. It is intentionally practical: these cases should become tests, alerts, or explicit UX states. If a new edge case is discovered, add it here with a clear expected behavior.

- **iCal fetch failure:** Display a graceful error message with a retry option instead of a broken calendar.
- **Empty calendar:** Show all time as available with the message “No busy blocks scheduled.”
- **All-day events:** Render as full working-day busy blocks (8am–6pm).
- **Timezone mismatches:** Convert all times to ET for consistent display.
- **Overlapping events:** Merge adjacent/overlapping busy blocks visually.
- **Past dates in range:** Gray out or visually de-emphasize any past time blocks.

## Design Direction

This section provides qualitative guidance for the look and feel. It should help maintain a consistent tone across UI tweaks without prescribing exact implementation details. Use it as a guardrail to avoid either overly playful UI or overly austere dashboards.

The design should evoke cybersecurity professionalism with a technical, modern aesthetic. Think command-line inspired clarity meets contemporary web design—precise, information-dense without clutter, and trustworthy. The interface should feel like a professional tool that respects the user's time.

## Color Selection

This section documents a high-level palette direction so the UI stays cohesive across components. These values should be treated as design intent rather than implementation requirements. Prefer theme primitives and semantic tokens when implementing in code.

A technical, security-focused palette with high contrast and professional authority.

- **Primary Color**: Deep cyan/teal (oklch(0.55 0.15 195)) - Evokes cybersecurity, technology, and trust
- **Secondary Colors**: Dark slate backgrounds (oklch(0.15 0.01 240)) for depth, with lighter grays (oklch(0.25 0.01 240)) for surfaces
- **Accent Color**: Bright electric cyan (oklch(0.75 0.18 195)) for interactive elements and current day highlighting
- **Foreground/Background Pairings**: 
  - Primary Deep Cyan (oklch(0.55 0.15 195)): White text (oklch(0.98 0 0)) - Ratio 7.2:1 ✓
  - Dark Slate BG (oklch(0.15 0.01 240)): Light text (oklch(0.90 0.01 240)) - Ratio 12.1:1 ✓
  - Accent Electric Cyan (oklch(0.75 0.18 195)): Dark text (oklch(0.15 0.01 240)) - Ratio 9.8:1 ✓
  - Working Hours (oklch(0.22 0.02 240)): Muted text (oklch(0.70 0.03 240)) - Ratio 4.7:1 ✓

## Font Selection

This section outlines the typographic intent and hierarchy. It exists to keep the UI readable and consistent across different screen sizes. Treat the hierarchy as the primary requirement; the exact typeface may be substituted if needed.

A technical, highly legible typeface that conveys precision and modernity.

- **Primary Font**: IBM Plex Mono - Monospaced font providing technical credibility and excellent readability
- **Typographic Hierarchy**: 
  - H1 (Page Title): IBM Plex Mono Bold/32px/tight letter spacing (-0.02em)
  - Subtitle: IBM Plex Mono Regular/16px/normal spacing with reduced opacity
  - Calendar Headers (Days): IBM Plex Mono SemiBold/14px/wide spacing (0.05em)
  - Time Labels: IBM Plex Mono Regular/13px/tabular numbers for alignment
  - UI Labels: IBM Plex Mono Medium/14px/normal spacing

## Animations

This section describes motion guidelines for the product. Animations should reinforce hierarchy and guide attention rather than create decoration. Keep transitions short and consistent so the UI feels predictable.

Animations should feel technical and precise—no organic easing, but purposeful transitions that guide attention.

- **Context Week Fade**: Previous/next weeks use opacity (0.3 for context, 1.0 for active) with subtle scale (0.98) to create depth
- **Show More Expansion**: Linear ease-out over 300ms as third week fades in and button fades out
- **Busy Block Appearance**: Staggered fade-in (50ms delays) when calendar loads for satisfying reveal
- **Hover States**: Quick 150ms transitions on interactive elements with subtle brightness shifts
- **Current Day Pulse**: Gentle 2s pulse animation on current day indicator for temporal awareness

## Component Selection

This section lists the building blocks and states needed to implement the PRD. It helps keep the implementation aligned with the intended interaction model and reduces ambiguity for contributors. Use it as a checklist for ensuring feature completeness.

- **Components**: 
  - Card component for calendar container with dark theme
  - Button for "Show More" with ghost variant and cyan accent
  - Badge for status indicators (Busy/Free)
  - Skeleton for loading states during iCal fetch
  - Alert for error states with retry action
  - Separator for dividing weeks visually
- **Customizations**: 
  - Custom calendar grid component using CSS Grid for time-based layout
  - Custom time slot component showing hourly blocks with busy overlays
  - Custom week header with date ranges and day names
- **States**: 
  - Calendar loads with skeleton pulse animation
  - Show More button has hover state with cyan glow effect
  - Busy blocks have subtle hover tooltip showing event time range
  - Past time slots have reduced opacity and no interaction
- **Icon Selection**: 
  - Calendar (from Phosphor) for page header
  - Clock for working hours indicator
  - CaretDown for Show More button
  - Warning for error states
- **Spacing**: 
  - Page padding: p-6 on mobile, p-8 on desktop
  - Calendar grid gap: gap-1 for compact time blocks
  - Week separation: mb-4 between week sections
  - Header margins: mb-6 for title, mb-2 for subtitle
- **Mobile**: 
  - Desktop: 7-column grid (full week) with hourly granularity
  - Tablet: 7-column grid with compressed time labels
  - Mobile: Single-day carousel with swipe navigation, vertical time axis showing working hours only
