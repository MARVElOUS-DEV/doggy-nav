# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## release-0.0.1...dev

[compare changes](https://github.com/MARVElOUS-DEV/doggy-nav/compare/release-0.0.1...dev)

### 🚀 Enhancements

- Add workers project and split common logic to a new core package etc. ([#30](https://github.com/MARVElOUS-DEV/doggy-nav/pull/30))
- Add seeds for workers & add ci workflow for workers & web styles optimized ([#32](https://github.com/MARVElOUS-DEV/doggy-nav/pull/32))
- Add cf pages deploy for admin web ([#43](https://github.com/MARVElOUS-DEV/doggy-nav/pull/43))
- Add main web deploy to cloudflare pages, update main web env ([#50](https://github.com/MARVElOUS-DEV/doggy-nav/pull/50))
- Add system version tracked & add ratelimit for server and workers &  now apps can be globally dsipalyed ([#57](https://github.com/MARVElOUS-DEV/doggy-nav/pull/57))
- Add detail field to nav items for rich content and integrate monaco editor ([#60](https://github.com/MARVElOUS-DEV/doggy-nav/pull/60))
- Add bookmark editor app to desktop ([#61](https://github.com/MARVElOUS-DEV/doggy-nav/pull/61))
- Update timeline page with real data & optimze the reptile request ([#64](https://github.com/MARVElOUS-DEV/doggy-nav/pull/64))
- Add changelog ([c325a1c](https://github.com/MARVElOUS-DEV/doggy-nav/commit/c325a1c))

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
- Fix nextjs security issue ([2c3b6a1](https://github.com/MARVElOUS-DEV/doggy-nav/commit/2c3b6a1))
- Fix menu active status when refresh the page ([6a69cfb](https://github.com/MARVElOUS-DEV/doggy-nav/commit/6a69cfb))

### 📖 Documentation

- Update readme and deploy workflow ([#44](https://github.com/MARVElOUS-DEV/doggy-nav/pull/44))

### 📦 Build

- Update server dockerfile ([#31](https://github.com/MARVElOUS-DEV/doggy-nav/pull/31))
- Fix main web docker build and runtime deps ([#51](https://github.com/MARVElOUS-DEV/doggy-nav/pull/51))
- Fix main web docker build and runtime deps ([#52](https://github.com/MARVElOUS-DEV/doggy-nav/pull/52))
- Fix main web docker build and runtime deps ([#53](https://github.com/MARVElOUS-DEV/doggy-nav/pull/53))

### 🏡 Chore

- Update dependencies ([#49](https://github.com/MARVElOUS-DEV/doggy-nav/pull/49))
- Detail the deploy readme part ([#55](https://github.com/MARVElOUS-DEV/doggy-nav/pull/55))
- Remove unused page,update admin docker file ([#62](https://github.com/MARVElOUS-DEV/doggy-nav/pull/62))
- Update dependencies ([#58](https://github.com/MARVElOUS-DEV/doggy-nav/pull/58))

### 🤖 CI

- Update ci files ([#38](https://github.com/MARVElOUS-DEV/doggy-nav/pull/38))
- Update ci files 2 ([#39](https://github.com/MARVElOUS-DEV/doggy-nav/pull/39))
- Update ci files 3 ([#40](https://github.com/MARVElOUS-DEV/doggy-nav/pull/40))
- Update ci files 4 ([#41](https://github.com/MARVElOUS-DEV/doggy-nav/pull/41))
- Update deploy workflow ([#45](https://github.com/MARVElOUS-DEV/doggy-nav/pull/45))
- Update deploy workflow ([#46](https://github.com/MARVElOUS-DEV/doggy-nav/pull/46))
- Update deploy workflow 3 ([#47](https://github.com/MARVElOUS-DEV/doggy-nav/pull/47))

### ❤️ Contributors
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
