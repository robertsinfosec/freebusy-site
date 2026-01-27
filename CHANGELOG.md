# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [v26.127.1400] - 2026-01-27

### Changed

- Removed generated version file and updated version fetching in App component
- Updated container name and forwardPorts in devcontainer configuration

### Fixed

- Improved user prompt and input handling for merging PRs in process-ghas-prs.sh
- Enhanced PR processing script with debug mode and empty line handling
- Updated increment syntax for skipped, merged, and failed counts in PR processing script

## [v26.127.1804] - 2026-01-27

### Added

- Comprehensive developer documentation in `docs/dev/` directory
  - Developer setup guide (SETUP.md) with Dev Container and manual setup instructions
  - Architecture guide (ARCHITECTURE.md) documenting code structure and design
  - Testing guide (TESTING.md) with Vitest best practices and coverage tracking
  - Deployment guide (DEPLOYMENT.md) for Cloudflare Pages operations
  - Codecov setup guide (CODECOV.md) for code coverage tracking
- Comprehensive changelog with detailed documentation updates
- Script to automate processing of GitHub Advanced Security PRs (`scripts/process-ghas-prs.sh`)
  - Added --force option for auto-merging PRs
  - Enhanced with logging and improved description formatting
  - Debug mode and empty line handling
- Repobeats analytics image to README

### Changed

- Rewrote README.md with user-focused content for semi-technical IT professionals
- Expanded STYLE_GUIDE.md with comprehensive markdown standards and TypeScript best practices
- Updated `.github/copilot-instructions.md` with code quality standards and project patterns
- Reorganized documentation to separate user-facing content from developer-facing guides
- Updated internal documentation links to point to new `docs/dev/` structure

### Removed

- Deleted `docs/RUNBOOK.md` after consolidating content into SETUP/TESTING/DEPLOYMENT guides
- Removed obsolete BUILD_VERSION declaration

### Dependencies

- Bumped `framer-motion` from 12.24.0 to 12.24.10
- Bumped `vite` from 7.3.0 to 7.3.1 (dev)
- Bumped `react-resizable-panels` from 4.2.1 to 4.3.0
- Bumped `react-error-boundary` from 6.0.1 to 6.0.2
- Bumped `react-hook-form` from 7.69.0 to 7.70.0

## [v26.107.1902] - 2026-01-07

### Dependencies

- Bumped `framer-motion` from 12.24.0 to 12.24.10
- Bumped `vite` from 7.3.0 to 7.3.1 (dev)
- Bumped `react-resizable-panels` from 4.2.1 to 4.3.0

## [v26.106.1245] - 2026-01-06

### Added

- Eastern Time versioning system with automatic version generation
- Unit test coverage thresholds

### Changed

- Updated version generation to use Eastern Time zone
- Adjusted coverage thresholds for better test quality gates
- Updated test suites to align with new versioning approach

### Dependencies

- Bumped `zod` from 4.2.1 to 4.3.5
- Bumped `react-resizable-panels` from 4.1.0 to 4.2.1
- Bumped `framer-motion` from 12.23.26 to 12.24.0
- Bumped `typescript-eslint` from 8.51.0 to 8.52.0 (dev)
- Bumped `globals` from 16.5.0 to 17.0.0 (dev)

## [v26.106.1010] - 2026-01-06

### Changed

- Minor updates and refinements
- Version bump for release management

## [v25.1231.0111] - 2025-12-30

### Added

- Comprehensive style guide with coding standards and best practices
- Test coverage badges (tests, coverage, CodeQL, code scanning)
- Node version badge
- License, release, and activity badges
- Codecov integration for automated coverage tracking
- CI workflow with coverage upload to Codecov
- CodeQL security scanning workflow
- Workflow dispatch triggers for manual CI/CodeQL runs
- Enhanced error handling in useFreeBusy hook with API response tests
- UTC handling improvements in date utilities
- Window-aware owner days implementation

### Changed

- Rewrote and expanded STYLE_GUIDE.md for improved clarity and consistency
- Updated Codecov action configuration with verbose output and fail-on-error
- Enhanced README and documentation structure
- Improved component performance and state management
- Updated dependencies and devDependencies in package.json
- Updated documentation across multiple files for clarity and consistency

### Removed

- Badge generation scripts (replaced with Codecov integration)

## [2025-12-29] - Infrastructure Changes

### Added

- Dev Container configuration for consistent development environment

### Changed

- Moved website code to `src/` subdirectory following GitHub Folder Structure standard
- Removed git-lfs feature from devcontainer configuration

## [2025-12-28] - Feature Enhancements

### Added

- AvailabilityCard component with comprehensive tests
- Availability export functionality
- UI improvements for better user experience

### Changed

- Updated freebusy utilities and API response structure
- Enhanced availability export functionality

## [2025-12-27] - Development Setup

### Added

- Initial Dev Container configuration

## [2025-12-19] - UI/UX Improvements

### Changed

- Improved error handling in calendar fetch logic
- Enhanced button styles with better hover effects
- Updated CalendarGrid to use 'now' for past date checks
- Improved styling for past blocks and weekends
- Enhanced accessibility and visual clarity in CalendarGrid
- Better text sizes and colors for current and weekend days differentiation

## [2025-12-18] - Initial Release

### Added

- Initial project setup and structure
- Free/busy calendar viewer with iCal integration
- FreeBusy API integration with rate limiting support
- Calendar grid with timezone support
- Week-based view (Sunday through Saturday)
- Working hours display (8am-6pm ET Mon-Fri)
- Theme toggle with dark mode support
- Inter Google Font integration
- Responsive design for desktop and mobile
- Refresh functionality for latest calendar data
- Proportional busy block sizing for half-hour entries
- Hover tooltips showing start/end times for busy blocks
- "Book a Meeting" link integration (cal.com)
- Cloudflare Pages deployment configuration
- Wrangler configuration for Cloudflare Workers
- Environment variable support for iCal URL
- Cache busting for iCal fetch
- DST and timezone handling
- Tailwind CSS v4 configuration
- Vite build system
- Error handling and user feedback
- Spark AI integration

### Changed

- Updated color scheme to match robertsinfosec.com branding
- Adjusted calendar view to show 8am-6pm instead of midnight-midnight
- Set week start to current week instead of previous week
- Configured Sunday as first day of week

### Fixed

- Fixed "Failed to fetch" errors with proper error handling
- Fixed regex for date matching to support optional time component
- Fixed timezone/DST handling in timeslots
- Labeled busy blocks as "Busy"

[v26.127.1934]: https://github.com/robertsinfosec/freebusy-site/compare/v26.127.1804...v26.127.1934
[v26.127.1804]: https://github.com/robertsinfosec/freebusy-site/compare/v26.107.1902...v26.127.1804
[v26.107.1902]: https://github.com/robertsinfosec/freebusy-site/compare/v26.106.1245...v26.107.1902
[v26.106.1245]: https://github.com/robertsinfosec/freebusy-site/compare/v26.106.1010...v26.106.1245
[v26.106.1010]: https://github.com/robertsinfosec/freebusy-site/compare/v25.1231.0111...v26.106.1010
[v25.1231.0111]: https://github.com/robertsinfosec/freebusy-site/releases/tag/v25.1231.0111

