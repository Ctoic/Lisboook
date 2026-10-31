# Lisbook Full Delivery Roadmap

This file is the living execution checklist for the Lisbook replatform. The legacy static site at the repository root remains read-only reference content until feature parity is complete.

## Current Status

### Completed
- npm workspace scaffold
- `apps/web`, `apps/admin`, `apps/api` shells
- shared brand package
- basic Nest health route and test
- Prisma-backed core API modules and seed data
- admin auth guards and role enforcement
- admin shell, login flow, and first live audiobook management UI

### In Progress
- Phase 0 repo/doc normalization
- Phase 1 backend foundation
- Phase 2 admin content platform

## Phase 0: Repo and Planning Normalization
- [x] Standardize on npm workspace commands in root tooling
- [x] Keep the legacy static site as migration reference
- [x] Freeze app/package conventions
- [x] Create this roadmap as the primary execution checklist
- [x] Add environment template files for API, web, and admin
- [x] Add local development database bootstrap instructions

## Phase 1: Backend Foundation

### Schema and contracts
- [x] Expand the Prisma schema beyond the placeholder user model
- [x] Define shared API contracts in `packages/types`
- [x] Add first Prisma migration
- [x] Add seed data flow for local development

### Nest common layer
- [x] Add global validation pipe
- [x] Add consistent API error shape
- [x] Add common pagination DTO
- [x] Add local/dev storage abstraction

### Core modules
- [x] Health
- [x] Auth
- [x] Users
- [x] Roles
- [x] Assets
- [x] Audiobooks
- [x] Authors
- [x] Narrators
- [x] Categories
- [x] Chapters
- [x] Pages
- [x] FAQs

### Early route surface
- [x] `GET /v1/audiobooks`
- [x] `GET /v1/audiobooks/:slug`
- [x] `GET /v1/audiobooks/:slug/chapters`
- [x] `GET /v1/pages/:slug`
- [x] `GET /v1/faqs`
- [x] `POST /v1/auth/login`
- [x] `GET /v1/admin/audiobooks`
- [x] `POST /v1/admin/audiobooks`
- [x] `PATCH /v1/admin/audiobooks/:id`
- [x] `POST /v1/admin/chapters`
- [x] `PATCH /v1/admin/pages/:id`
- [x] `PATCH /v1/admin/faqs/:id`

### Follow-up required for Phase 1 completion
- [x] Replace in-memory services with Prisma-backed repositories
- [x] Add auth guards and role enforcement
- [ ] Add Swagger/OpenAPI generation from real decorators

## Phase 2: Admin Content Platform
- [x] Admin login/session shell
- [x] Admin dashboard shell
- [x] Audiobook CRUD UI
- [ ] Chapter ordering UI
- [ ] Author/narrator/category management
- [ ] Media upload/selection UI
- [ ] FAQ/page/navigation/settings CMS
- [ ] Comments moderation UI
- [ ] Newsletter lead view
- [ ] Audit log view

## Phase 3: Public Site Parity
- [ ] Shared public shell with navbar/footer/theme persistence
- [ ] Dynamic home page
- [ ] Dynamic explore page with real search/filter/sort
- [ ] Dynamic book detail/player page
- [ ] CMS-driven about/contact/FAQ pages

## Phase 4: User Account and Engagement
- [ ] Register/login/logout/session refresh
- [ ] Profile page
- [ ] Favorites and library
- [ ] Listening progress and continue listening
- [ ] Authenticated comments
- [ ] Newsletter capture
- [ ] Share tracking

## Phase 5: Advanced Features
- [ ] Scanner upload/capture UI
- [ ] Scanner job processing and match candidates
- [ ] Recommendation rules and rails
- [ ] Catalog-grounded assistant entry
- [ ] Analytics and reporting

## Phase 6: Launch Hardening
- [ ] E2E coverage for admin, public, and engagement flows
- [ ] Structured logging and request IDs
- [ ] Health/ops readiness
- [ ] Migration and rollback notes
- [ ] Launch checklist
