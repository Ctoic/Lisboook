# Implementation Plan: Lisbook Full-Stack Replatform

## Overview
Rebuild the current static Lisbook site into an npm-workspace monorepo containing a public Next.js web app, a separate Next.js admin portal, and a NestJS API backed by PostgreSQL and object storage. The plan preserves the current brand and page hierarchy while replacing hardcoded content with a proper CMS-style backend and admin workflow.

## Architecture Decisions
- Use an npm workspace with `apps/web`, `apps/admin`, and `apps/api` to keep public, admin, and backend concerns isolated.
- Use `NestJS + Prisma + PostgreSQL` as the source of truth for catalog, user, engagement, and CMS data.
- Use object storage for covers and audio; only metadata and relationships live in PostgreSQL.
- Make the public web app and future React Native app consume the same versioned REST API.
- Preserve branding through shared tokens/components in `packages/ui` instead of copying legacy HTML/CSS structure.

## Dependency Graph

```text
Design system + route map
        │
        ├── Database schema + Prisma models
        │       │
        │       ├── NestJS domain modules + auth/RBAC
        │       │       │
        │       │       ├── Admin UI
        │       │       └── Public web app
        │       │
        │       └── Seed + content migration
        │
        └── Shared API contracts
                │
                ├── Web integration
                └── Admin integration
```

## Phases

### Phase 1: Foundation
- Monorepo scaffolding
- Shared linting, formatting, TypeScript, env handling
- Design token extraction from legacy site
- Core database schema
- Authentication and RBAC skeleton

### Checkpoint: Foundation
- Local dev boots for web, admin, and api
- Database migrations run cleanly
- Shared UI tokens available in both frontends
- Auth skeleton works in API and admin

### Phase 2: Content Platform
- Audiobook, author, narrator, category, chapter, and asset modules
- Admin CRUD for content
- Seed/import current legacy content
- Public home, explore, and book detail pages wired to API

### Checkpoint: Core Content
- A migrated book is fully playable from dynamic data
- Explore filters operate on real database fields
- Admin can publish/unpublish content without code changes

### Phase 3: Engagement and CMS
- Comments moderation
- Favorites and listening progress
- FAQ, About, Contact, footer/navigation CMS
- Share links and SEO metadata

### Checkpoint: Public Experience
- Legacy public feature parity is substantially achieved
- Profile, comments, favorites, and static pages work end-to-end

### Phase 4: Advanced Features
- Scanner backend flow
- Recommendation rails
- Chat assistant grounding
- Analytics and audit logs

### Checkpoint: Launch Readiness
- E2E coverage on primary flows
- Admin permissions tested
- Error monitoring and logs in place
- Content entry workflow documented

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Legacy features are scattered across static pages and duplicated scripts | High | Treat the existing repo as a reference inventory first, then migrate by domain instead of by file |
| Audio hosting strategy is undefined | High | Decide storage/CDN model early and abstract asset delivery behind backend services |
| Admin scope expands into a full CMS | High | Define MVP-managed entities first: books, chapters, comments, FAQs, pages, settings |
| Search/filter expectations exceed MVP data model | Medium | Add explicit searchable/sortable fields in schema from day one |
| Scanner and chatbot can derail the core rebuild | Medium | Put both behind later-phase modules and feature flags |
| Future React Native requirements create auth/API churn | High | Use mobile-ready auth and stable REST contracts from the start |

## Parallelization Opportunities
- One stream can scaffold the monorepo while another extracts brand tokens and page mapping.
- API schema and admin information architecture can proceed in parallel once core entities are agreed.
- Public web and admin implementation can run in parallel after API contracts stabilize.
- Scanner and chatbot work should remain sequential and later, after the core content platform is stable.

## Open Questions
- Subscription/entitlement support now vs later
- Required depth of multilingual content
- Separate admin domain vs protected route group
- Whether scan recognition must be in MVP
- Whether comments require pre-moderation by default
