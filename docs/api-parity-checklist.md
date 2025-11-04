# API Parity Checklist — Server vs Workers

Use this checklist to verify each server route has matching behavior in the Workers project (request/response shape, status codes, auth, cookies, audience rules, pagination, error semantics).

- Mark with [x] when verified parity is confirmed in local/staging.
- Leave notes inline if any intentional differences exist.

## Legend

- [ ] Pending verification
- [x] Verified parity

---

## Auth

- [x] POST /api/auth/logout
- [x] GET /api/auth/providers
- [x] GET /api/auth/me
- [x] POST /api/auth/refresh
- [x] GET /api/auth/config
- [x] POST /api/auth/register
- [x] POST /api/auth/login
- [x] GET /api/auth/:provider
- [x] GET /api/auth/:provider/callback

## User (Profile & Admin)

- [x] GET /api/user/profile
- [x] PUT /api/user/profile
- [x] GET /api/user
- [x] GET /api/user/:id
- [x] POST /api/user
- [x] PATCH /api/user/:id
- [x] DELETE /api/user

## Roles

- [x] GET /api/roles
- [x] POST /api/roles
- [x] PUT /api/roles
- [x] DELETE /api/roles

## Groups

- [x] GET /api/groups
- [x] GET /api/groups/:id
- [x] POST /api/groups
- [x] PUT /api/groups
- [x] PUT /api/groups/:id
- [x] POST /api/groups/:id/members
- [x] DELETE /api/groups

## Invite Codes

- [x] GET /api/invite-codes/list
- [x] POST /api/invite-codes
- [x] PUT /api/invite-codes/:id
- [x] POST /api/invite-codes/:id/revoke

## Application

- [x] POST /api/application
- [x] GET /api/application/list
- [x] POST /api/application/verify-client-secret
- [x] PUT /api/application/:id
- [x] POST /api/application/:id/regenerate-secret
- [x] DELETE /api/application/:id/revoke

## Category

- [x] POST /api/category
- [x] DELETE /api/category
- [x] PUT /api/category
- [x] GET /api/category/list

## Nav

- [x] GET /api/nav/list
- [x] POST /api/nav
- [x] GET /api/nav
- [x] PUT /api/nav/audit
- [ ] GET /api/nav/reptile (stubbed 501 on Workers)
- [x] GET /api/nav/random
- [x] DELETE /api/nav
- [x] PUT /api/nav
- [x] GET /api/nav/find
- [x] GET /api/nav/ranking
- [x] POST /api/nav/:id/view
- [x] POST /api/nav/:id/star

## Tag

- [ ] POST /api/tag (stubbed 501 on Workers)
- [ ] DELETE /api/tag (stubbed 501 on Workers)
- [ ] PUT /api/tag (stubbed 501 on Workers)
- [x] GET /api/tag/list

## URL Checker

- [x] GET /api/url-checker/status
- [ ] POST /api/url-checker/start (stubbed 501 on Workers)
- [ ] POST /api/url-checker/stop (stubbed 501 on Workers)
- [ ] POST /api/url-checker/restart (stubbed 501 on Workers)
- [ ] PUT /api/url-checker/config (stubbed 501 on Workers)
- [x] POST /api/url-checker/check
- [x] POST /api/url-checker/check/:id
- [x] GET /api/url-checker/nav-status

## Favorites

- [x] POST /api/favorites
- [x] POST /api/favorites/remove
- [x] GET /api/favorites/list
- [x] GET /api/favorites/structured
- [ ] PUT /api/favorites/placements (stubbed 501 on Workers)
- [x] GET /api/favorites/check
- [x] GET /api/favorites/count
- [ ] PUT /api/favorites/folders/:id (stubbed 501 on Workers)
- [ ] DELETE /api/favorites/folders/:id (stubbed 501 on Workers)

## Translate

- [x] POST /api/translate

## Email Settings

- [x] GET /api/email-settings
- [x] PUT /api/email-settings
- [x] POST /api/email-settings/test
- [x] GET /api/email-settings/health

---

Notes:

- When verifying, check: response envelope `{ code, msg, data }`, field names, nullability, arrays vs objects, pagination `{ data, total, pageNumber }`, auth/cookie behavior, audience visibility, and numeric/string id formats.
- Document any intentional deviations here (with rationale) to avoid regressions.
