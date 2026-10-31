# Task Breakdown: Lisbook Full-Stack Replatform

## Phase 1: Discovery and Foundation

- [ ] Task 1: Confirm product scope and non-MVP exclusions
  - Acceptance: MVP includes a written yes/no decision for subscriptions, multilingual content, scanner MVP, and chatbot MVP.
  - Verify: Review decisions against `docs/lisbook-fullstack-spec.md`.
  - Files: `docs/lisbook-fullstack-spec.md`

- [ ] Task 2: Scaffold monorepo with `web`, `admin`, and `api`
  - Acceptance: `npm install` and dev scripts run all three apps locally.
  - Verify: `npm run dev`, `npm run build`
  - Files: workspace root config, `apps/web`, `apps/admin`, `apps/api`, `packages/config`

- [ ] Task 3: Create Lisbook design token system and shared UI foundation
  - Acceptance: Brand colors, typography, spacing, buttons, cards, and layout primitives are reusable in both frontends.
  - Verify: Story/demo page renders in `web` and `admin`.
  - Files: `packages/ui`, `apps/web`, `apps/admin`

## Checkpoint: Foundation

- [ ] Web, admin, and API boot successfully
- [ ] Shared design primitives reflect current Lisbook branding

## Phase 2: Backend Core

- [ ] Task 4: Implement Prisma schema for auth, catalog, CMS, and engagement foundations
  - Acceptance: Core tables exist for users, roles, audiobooks, chapters, assets, comments, pages, FAQs, favorites, and progress.
  - Verify: `npm run db:migrate`
  - Files: `apps/api/prisma/schema.prisma`, migrations

- [ ] Task 5: Implement NestJS auth and RBAC
  - Acceptance: Login, refresh, logout, protected routes, and admin-only guards work.
  - Verify: API integration tests pass for auth and role checks.
  - Files: `apps/api/src/modules/auth`, `apps/api/src/modules/roles`

- [ ] Task 6: Implement catalog and asset modules
  - Acceptance: CRUD exists for audiobooks, authors, narrators, categories, chapters, and media assets.
  - Verify: Swagger docs generate and module tests pass.
  - Files: `apps/api/src/modules/*catalog*`, `apps/api/src/modules/assets`

## Checkpoint: API Core

- [ ] Auth and RBAC pass tests
- [ ] Catalog API supports public read and admin write flows

## Phase 3: Admin

- [ ] Task 7: Build admin auth shell and permission-aware navigation
  - Acceptance: Admin users can log in and only see allowed modules.
  - Verify: Manual admin login check, route protection tests.
  - Files: `apps/admin/app`, auth/guards/layout files

- [ ] Task 8: Build audiobook management UI
  - Acceptance: Admin can create, edit, publish, archive, and reorder audiobook chapters.
  - Verify: Manual CRUD flow against local API.
  - Files: `apps/admin/src/features/audiobooks`, `apps/admin/src/features/chapters`

- [ ] Task 9: Build CMS and moderation UI
  - Acceptance: Admin can manage FAQs, pages, comments, featured sections, and newsletter leads.
  - Verify: Manual CRUD flow and moderation checks.
  - Files: `apps/admin/src/features/cms`, `apps/admin/src/features/comments`

## Checkpoint: Admin

- [ ] No core public content requires code edits to update
- [ ] Audit logs capture admin mutations

## Phase 4: Public Web

- [ ] Task 10: Implement home page with dynamic featured content
  - Acceptance: Hero, featured books, and curated sections load from API/CMS.
  - Verify: Manual UI check and page test.
  - Files: `apps/web/app`, home feature files

- [ ] Task 11: Implement explore page with real search/filter/sort
  - Acceptance: Search and filters use actual DB fields, not mock values.
  - Verify: Manual filter tests and API query tests.
  - Files: `apps/web/features/explore`, search endpoints

- [ ] Task 12: Implement dynamic book detail page and player
  - Acceptance: A user can open a book, see metadata, browse chapters, and play audio.
  - Verify: Manual playback flow and E2E test.
  - Files: `apps/web/app/books/[slug]`, player components, progress endpoints

- [ ] Task 13: Implement profile, favorites, and continue-listening flows
  - Acceptance: Logged-in users can save books and resume progress.
  - Verify: E2E test for favorite + resume journey.
  - Files: `apps/web/features/profile`, `favorites`, `progress`

- [ ] Task 14: Implement About, Contact, FAQ, and shared navigation/footer from CMS
  - Acceptance: Legacy informational pages are dynamic and editable from admin.
  - Verify: Manual CMS edit reflected on public site.
  - Files: `apps/web/app/about`, `contact`, `faq`, shared layout files

## Checkpoint: Public Parity

- [ ] Dynamic web experience covers the current site’s primary public flows
- [ ] Brand and page hierarchy align with legacy Lisbook

## Phase 5: Advanced Modules

- [ ] Task 15: Implement comments and moderation workflow
  - Acceptance: Users can submit comments and admins can approve/hide/reject them.
  - Verify: Integration and E2E tests.
  - Files: API comments module, admin moderation UI, web comment UI

- [ ] Task 16: Implement scanner MVP behind feature flag
  - Acceptance: User can upload/capture a cover and receive match candidates from backend.
  - Verify: Manual scanner flow and job lifecycle test.
  - Files: scanner API, scanner admin tools, web scan page

- [ ] Task 17: Add recommendations, analytics, and assistant grounding
  - Acceptance: Recommendation rails and assistant responses use real Lisbook data sources.
  - Verify: Manual QA and logging review.
  - Files: recommendations/search/assistant modules

## Final Checkpoint

- [ ] `npm run lint`
- [ ] `npm run test`
- [ ] `npm run test:e2e`
- [ ] `npm run build`
- [ ] Launch checklist and environment docs are complete
