# Security review — 2026-10-05

This focused source review covered authentication, account linking, authorization,
administrator bootstrap credentials, and user-controlled outbound URL requests.
It is not a complete penetration test or dependency vulnerability audit. No live
accounts, production databases, or deployed services were changed.

| Severity | Confirmed issue                                                                                                                                    | Change                                                                                                                                                                                                                                                                             |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Critical | The image Worker decoded JWT payloads without checking signatures. Anyone could claim another user's identity and administrator upload privileges. | Verify HS256 signatures with Web Crypto; require an unexpired access token and a safe user ID. Reject unsigned, altered, refresh, and malformed tokens. Correct the `sysadmin` role name.                                                                                          |
| High     | Workers OAuth automatically linked a new provider identity to an existing account by email, including unverified emails.                           | Reject email conflicts instead of linking accounts. Match the Egg backend's conflict policy. Use cryptographic randomness for new provider-account passwords.                                                                                                                      |
| High     | Egg middleware authorized requests using roles, groups, and permissions embedded in JWTs, even after deletion, suspension, or demotion.            | Load the active account and current access through `MongooseAuthRepository` on every authenticated request. Fail closed if lookup fails.                                                                                                                                           |
| High     | The public URL probe, website scraper, and URL-checking clients could request private addresses or follow redirects to them.                       | Share HTTP(S) URL/IP validation, manually check every redirect, limit redirects and response size, and bound request duration. Node clients validate all DNS answers in the actual socket lookup. Edge clients check public DNS answers before each hop; see the limitation below. |
| High     | Seed and password-reset tools supplied known administrator passwords when input was omitted.                                                       | Require an explicit password with at least 12 characters, uppercase, lowercase, and a number across the Workers seed API, D1 seed CLI, Egg seed CLI, and interactive setup/reset tools.                                                                                            |
| Medium   | Workers middleware cached the first JWT secret for the isolate lifetime, allowing old signing keys after configuration changes.                    | Construct the verifier using the current request's secret; reject missing secrets.                                                                                                                                                                                                 |
| Medium   | Workers OAuth issued tokens to an inactive provider-linked account when its access-context lookup returned null.                                   | Reject the callback before issuing tokens and clear the OAuth state cookie on callback failures.                                                                                                                                                                                   |

The new shared implementations are under `packages/doggy-nav-core/src/security/`.
The Node transport is a separate submodule so browser and Workers bundles do not
load Node networking code. Existing synthetic-token integration fixtures now
provide a current account result as well as a signed token.

## Deployment and remediation

- Set `ADMIN_PASSWORD` explicitly before seeding. Environment examples document
  the requirement; there is no schema migration.
- Change any deployed administrator password that originated from the old
  defaults. Changing the code does not replace existing passwords.
- Review existing OAuth provider links for unexpected identities. The fix
  prevents new automatic links but cannot determine which historical links were
  legitimate. Revoke sessions for any affected account.
- Review image uploads for unexpected ownership or abusive content created
  through the previously unverified-token endpoint.
- Deploy the shared package and affected API, frontend API routes, and image
  service together. Requests to internal URLs are now rejected; scraper bodies
  are limited to 2 MiB and redirects to five hops.

## Edge networking limitation

Cloudflare edge `fetch` does not expose the socket lookup hook used for Node DNS
pinning. The edge helper checks A/AAAA answers using Cloudflare DNS over HTTPS,
rejects private answers and private literals, and validates every redirect.
The subsequent fetch still resolves independently, so this does **not** provide
an application-level guarantee against DNS rebinding. Keep these deployments on
public-internet egress without VPC/private-network fetch bindings. A strict
guarantee on edge requires an egress gateway that validates and pins the actual
destination. This remains an infrastructure follow-up.

The DNS/redirect checks follow the
[OWASP SSRF prevention guidance](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html).
The account-linking policy requires proof of both account identities, consistent
with [Auth0's account-linking guidance](https://auth0.com/docs/manage-users/user-accounts/user-account-linking/link-user-accounts).

## Verification

- Added cryptographic forgery/expiry/token-type tests and exercised the actual
  image Worker upload handler without R2.
- Added HTTP tests covering alternate IP spellings, IPv6, cloud metadata,
  public-to-private redirects, mixed public/private DNS answers, repeated socket
  lookups, redirect loops, host allowlists, and response-size limits.
- Added regressions for account suspension/deletion/demotion, database lookup
  failure, JWT secret rotation/removal, OAuth email conflicts and inactive
  accounts, and administrator bootstrap without an explicit strong password.
- Root lint passes with four existing frontend warnings. Root build passes.
  Core, frontend, image-service, Workers, and isolated Egg unit suites pass;
  Workers/image-service type checks pass. The Next build skips type validation
  through its existing configuration.
- A separate frontend `tsc --noEmit` reports errors in unchanged UI and utility
  files, including React type incompatibilities, the `SupportCurrency` export,
  Axios interceptor types, and IndexedDB transaction types. No errors were
  reported in the modified frontend API files; the frontend's full type check
  remains a merge blocker.
- Full Egg integration tests cannot start because local MongoDB refuses
  connections on port 27017. Root `pnpm test` is therefore blocked.
- Workers retains three existing skipped cases in `src/tests/api.test.ts`:
  registration, group detail, and data migration. These are validation gaps and
  must be resolved before a PR can claim all tests passed.
- The available runtime is Node 22.18.0; the repository requires Node >=24.
  Re-run the quality gates with Node 24 and a running test MongoDB before merging.
