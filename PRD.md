# Planning Guide

A professional free/busy calendar viewer that displays availability from a ProtonMail iCal feed, showing a 2-week window with the ability to expand to 3 weeks, designed for scheduling transparency.

**Experience Qualities**: 
1. **Professional** - Clean, trustworthy interface appropriate for business scheduling
2. **Efficient** - Quick visual scanning of availability without information overload
3. **Transparent** - Clear communication of working hours and busy/free time blocks

**Complexity Level**: Light Application (multiple features with basic state)
This is a focused calendar visualization tool with iCal parsing, date range handling, and interactive expansion functionality. It has a single view with state management for the extended week display.

## Essential Features

**iCal Feed Parsing**
- Functionality: Fetches and parses iCal data from environment variable URL to extract busy time blocks
- Purpose: Provides real-time availability data from ProtonMail calendar
- Trigger: Loads automatically on page mount and refreshes periodically
- Progression: Fetch iCal URL → Parse VEVENT entries → Extract busy time blocks → Map to calendar grid
- Success criteria: Accurately displays all busy blocks from the calendar feed with correct date/time ranges

**2-Week Calendar View with Context**
- Functionality: Displays current day through 2 weeks ahead with faded previous/next week context
- Purpose: Shows relevant scheduling window while providing temporal context
- Trigger: Automatically displays on load based on current date
- Progression: Calculate date ranges → Render week grid → Apply opacity transitions for context weeks → Highlight current day
- Success criteria: Calendar clearly shows 2 weeks with visual hierarchy distinguishing context from primary range

**Expandable Third Week**
- Functionality: "Show More" button reveals additional week of availability
- Purpose: Provides extended scheduling options for users planning further ahead
- Trigger: User clicks "Show More" button overlay on the faded future week
- Progression: Click button → Animate third week to full opacity → Replace button with full calendar data
- Success criteria: Smooth transition reveals third week with same detail level as primary weeks

**Working Hours Visualization**
- Functionality: Visual distinction between working hours (8am-6pm ET Mon-Fri) and non-working time
- Purpose: Sets clear expectations for appropriate meeting times
- Trigger: Renders automatically as part of calendar grid
- Progression: Calculate working hours per day → Apply visual treatment to working blocks → Dim non-working hours
- Success criteria: Working hours are immediately distinguishable from evenings/weekends

## Edge Case Handling
- **iCal Fetch Failure**: Display graceful error message with retry option instead of broken calendar
- **Empty Calendar**: Show all time as available with message "No busy blocks scheduled"
- **All-Day Events**: Render as full working-day busy blocks (8am-6pm)
- **Timezone Mismatches**: Convert all times to ET for consistent display
- **Overlapping Events**: Merge adjacent/overlapping busy blocks visually
- **Past Date in Range**: Gray out or visually de-emphasize any past time blocks

## Design Direction
The design should evoke cybersecurity professionalism with a technical, modern aesthetic. Think command-line inspired clarity meets contemporary web design—precise, information-dense without clutter, and trustworthy. The interface should feel like a professional tool that respects the user's time.

## Color Selection
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
A technical, highly legible typeface that conveys precision and modernity.

- **Primary Font**: IBM Plex Mono - Monospaced font providing technical credibility and excellent readability
- **Typographic Hierarchy**: 
  - H1 (Page Title): IBM Plex Mono Bold/32px/tight letter spacing (-0.02em)
  - Subtitle: IBM Plex Mono Regular/16px/normal spacing with reduced opacity
  - Calendar Headers (Days): IBM Plex Mono SemiBold/14px/wide spacing (0.05em)
  - Time Labels: IBM Plex Mono Regular/13px/tabular numbers for alignment
  - UI Labels: IBM Plex Mono Medium/14px/normal spacing

## Animations
Animations should feel technical and precise—no organic easing, but purposeful transitions that guide attention.

- **Context Week Fade**: Previous/next weeks use opacity (0.3 for context, 1.0 for active) with subtle scale (0.98) to create depth
- **Show More Expansion**: Linear ease-out over 300ms as third week fades in and button fades out
- **Busy Block Appearance**: Staggered fade-in (50ms delays) when calendar loads for satisfying reveal
- **Hover States**: Quick 150ms transitions on interactive elements with subtle brightness shifts
- **Current Day Pulse**: Gentle 2s pulse animation on current day indicator for temporal awareness

## Component Selection
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
