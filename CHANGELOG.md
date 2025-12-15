# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed
- Fix left side menu active state not preserved on page refresh for nav detail pages
- Fix login button loading spinner pushing text down

## [0.5.0] - 2025-12-04

### Fixed
- Fix Next.js security issue (#65)

### Changed
- Update dependencies (#58)

### Added
- Update timeline page with real data & optimize the reptile request (#64)

## [0.4.0] - 2025-11-29

### Added
- Add bookmark editor app to desktop (#61)
- Add detail field to nav items for rich content and integrate Monaco editor (#60)

### Fixed
- Fix login user menus not properly provided in admin web, admin web styles optimized (#59)

### Changed
- Remove unused page, update admin docker file (#62)

## [0.3.0] - 2025-11-16

### Added
- Add system version tracking & rate limiting for server and workers (#57)
- Apps can now be globally displayed (#57)
- Add main web deploy to Cloudflare Pages (#50)
- Add Cloudflare Pages deploy for admin web (#43)

### Fixed
- Fix common user login (#54)
- Fix main web docker build and runtime deps (#51, #52, #53)
- Fix workers server update user & update workflow (#48)
- Fix workers server error and optimize the workflow (#42)

### Changed
- Detail the deploy readme part (#55)
- Update dependencies (#49)

## [0.2.0] - 2025-11-07

### Added
- Add seeds for workers & CI workflow for workers (#32)
- Add workers project and split common logic to a new core package (#30)
- LinuxDo users automatically added to the LinuxDo group (#28)
- Desktop page support for mobile users (#27)

### Fixed
- Fix image name not compatible to GHCR (#25, #26)
- Fix recommend page & remove hide field of category and nav model (#23)
- Fix category visibility enums (#22)
- Fix OAuth login failures and update admin category form (#21)
- Update launchpad & dock items styles (#20)

### Changed
- Add onlyFolder for category model (#24)
- Update server dockerfile (#31)

## [0.1.0] - 2025-10-24

### Added
- Add macOS-style desktop page (#18)
- Add RBAC control & user management (#15)
- Add translate tool draft (#17)

### Fixed
- Cookie secure fixed in production (#14)
- Default menu i18n & view collection update & auth enhanced (#13)

### Changed
- Optimize Egg.js workers in docker env (#17)

## Initial Release

### Features
- Navigation management system with categories and tags
- User authentication with OAuth support (GitHub, Google, LinuxDo)
- Admin panel for content management
- Responsive design with dark/light theme support
- Favorites and bookmarks functionality
- Search functionality
- Timeline feature
- Internationalization (English & Chinese)
