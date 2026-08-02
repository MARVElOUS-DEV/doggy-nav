# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## release-1.1.0

[compare changes](https://github.com/MARVElOUS-DEV/doggy-nav/compare/release-0.0.1...release-1.1.0)

### 🚀 Enhancements

- Add site customization management across admin, server, workers, and main web, including editable branding, SEO defaults, copyright text, and feedback URL
- Add workers project and split common logic to a new core package etc. ([#30](https://github.com/MARVElOUS-DEV/doggy-nav/pull/30))
- Add seeds for workers & add ci workflow for workers & web styles optimized ([#32](https://github.com/MARVElOUS-DEV/doggy-nav/pull/32))
- Add cf pages deploy for admin web ([#43](https://github.com/MARVElOUS-DEV/doggy-nav/pull/43))
- Add main web deploy to cloudflare pages, update main web env ([#50](https://github.com/MARVElOUS-DEV/doggy-nav/pull/50))
- Add system version tracked & add ratelimit for server and workers &  now apps can be globally dsipalyed ([#57](https://github.com/MARVElOUS-DEV/doggy-nav/pull/57))
- Add detail field to nav items for rich content and integrate monaco editor ([#60](https://github.com/MARVElOUS-DEV/doggy-nav/pull/60))
- Add bookmark editor app to desktop ([#61](https://github.com/MARVElOUS-DEV/doggy-nav/pull/61))
- Update timeline page with real data & optimze the reptile request ([#64](https://github.com/MARVElOUS-DEV/doggy-nav/pull/64))
- Update timeline page, now the nav items displays staggered ([#67](https://github.com/MARVElOUS-DEV/doggy-nav/pull/67))
- Add nav select cascader picker for settings application ([#70](https://github.com/MARVElOUS-DEV/doggy-nav/pull/70))
- Add R2 storage image service ([#71](https://github.com/MARVElOUS-DEV/doggy-nav/pull/71))
- Update image uploads ([#72](https://github.com/MARVElOUS-DEV/doggy-nav/pull/72))
- Add read image endpoint ([#75](https://github.com/MARVElOUS-DEV/doggy-nav/pull/75))
- Update the image naming ([#77](https://github.com/MARVElOUS-DEV/doggy-nav/pull/77))
- Update search experience ([#85](https://github.com/MARVElOUS-DEV/doggy-nav/pull/85))
- Update avatar menu layout etc. ([#86](https://github.com/MARVElOUS-DEV/doggy-nav/pull/86))
- Enhaced tag search and tag select at admin side etc. ([#88](https://github.com/MARVElOUS-DEV/doggy-nav/pull/88))
- Add yaml to json converter ([#93](https://github.com/MARVElOUS-DEV/doggy-nav/pull/93))
- Update converter tool with query auth ([#94](https://github.com/MARVElOUS-DEV/doggy-nav/pull/94))
- Add ai providers, about me section, stripe pay integrated, enhance web experience ([#101](https://github.com/MARVElOUS-DEV/doggy-nav/pull/101))
- **site-settings:** Add hero slide management ([#102](https://github.com/MARVElOUS-DEV/doggy-nav/pull/102))
- Add passkey support & add theme change and customization & redesign auth pages ([#103](https://github.com/MARVElOUS-DEV/doggy-nav/pull/103))
- **ai:** Add similar site discovery ([5926c71](https://github.com/MARVElOUS-DEV/doggy-nav/commit/5926c71))
- **main:** Add creative desktop triggers ([c5c2919](https://github.com/MARVElOUS-DEV/doggy-nav/commit/c5c2919))
- **main:** Improve mobile desktop UX ([369a480](https://github.com/MARVElOUS-DEV/doggy-nav/commit/369a480))
- Redesign the recommendation page with a clearer responsive layout
- **converter:** Support multiple configs ([9131d1b](https://github.com/MARVElOUS-DEV/doggy-nav/commit/9131d1b))
- **ai:** Add provider failover and alerts ([aedde84](https://github.com/MARVElOUS-DEV/doggy-nav/commit/aedde84))

### 🩹 Fixes

- Update workers ci seeding ([#33](https://github.com/MARVElOUS-DEV/doggy-nav/pull/33))
- Fix wokers ci ([#34](https://github.com/MARVElOUS-DEV/doggy-nav/pull/34))
- Fix wokers ci 2 ([#35](https://github.com/MARVElOUS-DEV/doggy-nav/pull/35))
- Fix wokers ci 3 ([#36](https://github.com/MARVElOUS-DEV/doggy-nav/pull/36))
- Fix wokers ci 4 ([#37](https://github.com/MARVElOUS-DEV/doggy-nav/pull/37))
- Fix workers server error and optimize the workflow ([#42](https://github.com/MARVElOUS-DEV/doggy-nav/pull/42))
- Workers server update user & update workflow ([#48](https://github.com/MARVElOUS-DEV/doggy-nav/pull/48))
- Fix common user login ([#54](https://github.com/MARVElOUS-DEV/doggy-nav/pull/54))
- **admin web:** Fix login user menus not properly provided, admin web styles optimized ([#59](https://github.com/MARVElOUS-DEV/doggy-nav/pull/59))
- Fix nextjs security issue ([#65](https://github.com/MARVElOUS-DEV/doggy-nav/pull/65))
- Fix nextjs security issue ([#66](https://github.com/MARVElOUS-DEV/doggy-nav/pull/66))
- Auth token ([#73](https://github.com/MARVElOUS-DEV/doggy-nav/pull/73))
- Image name ([#74](https://github.com/MARVElOUS-DEV/doggy-nav/pull/74))
- Fix ts error ([#78](https://github.com/MARVElOUS-DEV/doggy-nav/pull/78))
- Display admin category names in chinese ([#84](https://github.com/MARVElOUS-DEV/doggy-nav/pull/84))
- **upload:** Align image upload flows and detail editor i18n ([#87](https://github.com/MARVElOUS-DEV/doggy-nav/pull/87))
- Fix image service url at admin web ([#91](https://github.com/MARVElOUS-DEV/doggy-nav/pull/91))
- Fix image service url at admin web, update the injection of runtime env #2 ([#92](https://github.com/MARVElOUS-DEV/doggy-nav/pull/92), [#2](https://github.com/MARVElOUS-DEV/doggy-nav/issues/2))
- Fix desktop page SSR error ([#95](https://github.com/MARVElOUS-DEV/doggy-nav/pull/95))
- Fix theme settings in desktop and dropdown menu ([1eae081](https://github.com/MARVElOUS-DEV/doggy-nav/commit/1eae081))
- Fix loading experience ([cc6092b](https://github.com/MARVElOUS-DEV/doggy-nav/commit/cc6092b))
- Fix menu active state after refreshing the page
- **main:** Fix the icon styles in the app dock at desktop page ([12f138c](https://github.com/MARVElOUS-DEV/doggy-nav/commit/12f138c))

### 📖 Documentation

- Update readme and deploy workflow ([#44](https://github.com/MARVElOUS-DEV/doggy-nav/pull/44))
- Update readme ([dcb1b3f](https://github.com/MARVElOUS-DEV/doggy-nav/commit/dcb1b3f))

### 📦 Build

- Update server dockerfile ([#31](https://github.com/MARVElOUS-DEV/doggy-nav/pull/31))
- Fix main web docker build and runtime deps ([#51](https://github.com/MARVElOUS-DEV/doggy-nav/pull/51))
- Fix main web docker build and runtime deps ([#52](https://github.com/MARVElOUS-DEV/doggy-nav/pull/52))
- Fix main web docker build and runtime deps ([#53](https://github.com/MARVElOUS-DEV/doggy-nav/pull/53))
- Update nodejs workers to obey the EGG_WORKERS var ([#97](https://github.com/MARVElOUS-DEV/doggy-nav/pull/97))

### 🏡 Chore

- Update dependencies ([#49](https://github.com/MARVElOUS-DEV/doggy-nav/pull/49))
- Detail the deploy readme part ([#55](https://github.com/MARVElOUS-DEV/doggy-nav/pull/55))
- Remove unused page,update admin docker file ([#62](https://github.com/MARVElOUS-DEV/doggy-nav/pull/62))
- Update dependencies ([#58](https://github.com/MARVElOUS-DEV/doggy-nav/pull/58))
- Update dependencies ([#69](https://github.com/MARVElOUS-DEV/doggy-nav/pull/69))
- Update deps ([#81](https://github.com/MARVElOUS-DEV/doggy-nav/pull/81))
- **ci:** Migrate project runtime to node 24 ([#89](https://github.com/MARVElOUS-DEV/doggy-nav/pull/89))
- Update github actions to clean stale docker images ([#99](https://github.com/MARVElOUS-DEV/doggy-nav/pull/99))

### 🤖 CI

- Update ci files ([#38](https://github.com/MARVElOUS-DEV/doggy-nav/pull/38))
- Update ci files 2 ([#39](https://github.com/MARVElOUS-DEV/doggy-nav/pull/39))
- Update ci files 3 ([#40](https://github.com/MARVElOUS-DEV/doggy-nav/pull/40))
- Update ci files 4 ([#41](https://github.com/MARVElOUS-DEV/doggy-nav/pull/41))
- Update deploy workflow ([#45](https://github.com/MARVElOUS-DEV/doggy-nav/pull/45))
- Update deploy workflow ([#46](https://github.com/MARVElOUS-DEV/doggy-nav/pull/46))
- Update deploy workflow 3 ([#47](https://github.com/MARVElOUS-DEV/doggy-nav/pull/47))

### ❤️ Contributors

- Caesar
- Marvel ([@MARVElOUS-DEV](https://github.com/MARVElOUS-DEV))

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
