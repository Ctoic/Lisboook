# Spec: Lisbook Full-Stack Replatform

## Assumptions
1. The current static repository is the brand and feature reference for the rebuild.
2. The new system will ship as a web platform first, with API choices made to support a later React Native app.
3. The required stack is `Next.js` for public web, `NestJS` for backend APIs, and `PostgreSQL` for relational data.
4. Audio and image binaries should not live in PostgreSQL; they should live in object storage with signed delivery URLs.
5. The admin panel should manage all content and operations currently hardcoded in the static site.
6. “Keep the same branding and structure” means preserve the Lisbook identity, page IA, and visual direction, not the legacy implementation quirks.

## Objective
Rebuild Lisbook from a static HTML/CSS/JS audiobook site into an industry-standard full-stack platform with:

- A public web app for listeners
- A secure admin app for content and operations
- A NestJS API layer reusable by future React Native clients
- A PostgreSQL-backed content model instead of hardcoded JSON and page-specific markup
- A design system that preserves existing Lisbook branding, page hierarchy, and core UX

Success means the new system can reproduce the current site’s public experience dynamically, while making books, chapters, comments, pages, FAQs, and media fully manageable from admin.

## Existing Site Reference Summary

### Branding to preserve
- Dark-first UI
- Green accent color and audio/book identity
- Lisbook logo and favicon
- Friendly reader/listener tone
- Home/explore/detail-page driven information architecture

### Current public pages/features that must map into the new product
- `index.html`: hero, featured audiobooks, comments, chatbot entry, cross-book navigation
- `explore.html`: search, filters, sort, recommendations, share modal
- Book detail/player pages like `gd.html`, `pbd.html`, `fs.html`, `adventures.html`, `rdpd.html`
- `about.html`
- `contact.html`
- `faq.html`
- `profile.html`
- `scan.html`
- Shared navbar/footer
- Theme toggle
- Language selection
- Favorites
- Newsletter capture
- Share links
- Comments
- Scanner prototype
- Audiobook API integration concept

### Legacy behaviors to modernize, not copy literally
- Hardcoded HTML per book
- Random/mock metadata generation
- LocalStorage-only state for critical features
- Direct client-side API fetching to third-party sources
- Inline scripts and page-specific duplicated logic
- Hidden cursor / decorative effects that may hurt accessibility

## Recommended Architecture

### Monorepo structure
Use an `npm` workspace with Turborepo.

```text
apps/
  web/            Next.js public listener app
  admin/          Next.js admin portal
  api/            NestJS API
packages/
  ui/             Shared design system
  config/         Shared eslint, prettier, tsconfig
  types/          Shared types generated from OpenAPI or zod schemas
  utils/          Shared helpers
infra/
  docker/         Local dev services
  terraform/      Optional later-stage infra as code
docs/
tasks/
```

### Why this shape
- Web and admin evolve independently without mixing public and operational concerns.
- NestJS becomes the single backend for web, admin, and future React Native clients.
- Shared packages prevent duplicated UI tokens and DTO drift.

## Tech Stack

### Frontend
- `Next.js 15+` with App Router
- `TypeScript`
- `Tailwind CSS`
- `shadcn/ui` for admin-grade primitives, themed to Lisbook branding
- `React Query` for server state
- `next-intl` if multilingual support remains in scope

### Backend
- `NestJS`
- `Prisma ORM`
- `PostgreSQL`
- `Swagger / OpenAPI`
- `BullMQ` for background jobs if scanning, email, transcoding, or indexing is needed

### Storage and infrastructure
- `PostgreSQL` for structured data
- `S3-compatible object storage` for covers, audio, waveform artifacts, and attachments
- `Redis` for queues, rate limiting, and caching
- `Cloudflare CDN` or equivalent for asset delivery

### Auth and security
- RBAC with `listener`, `editor`, `admin`, `super_admin`
- Access token + refresh token rotation
- HTTP-only cookies for web sessions
- Mobile-ready token flow for future React Native
- Audit logs for admin actions

## Commands
These are the target commands for the rebuilt system.

```bash
npm install
npm run dev
npm run dev:web
npm run dev:admin
npm run dev:api
npm run lint
npm run test
npm run test:e2e
npm run build
npm run db:migrate
npm run db:seed
npm run api:openapi
```

## Project Structure

```text
apps/web/app                Public routes
apps/web/components         Public UI components
apps/web/features           Feature modules by domain

apps/admin/app              Admin routes
apps/admin/components       Admin UI components
apps/admin/features         Admin modules

apps/api/src/modules        NestJS domain modules
apps/api/src/common         Shared backend concerns
apps/api/prisma             Prisma schema, migrations, seeders

packages/ui/src             Shared tokens and components
packages/types/src          Generated contracts
docs/                       Specs, ADRs, diagrams
tasks/                      Plan and task breakdown
```

## Branding and UX Rules

### Keep
- Lisbook name, logo, favicon, dark-first look, green accent, book/audio framing
- Page hierarchy: home, explore, book detail, about, contact, FAQ, profile, scan
- Visual motifs around books, listening, discovery

### Improve
- Replace mixed Bootstrap/Tailwind legacy styling with a single design system
- Improve responsive behavior, spacing consistency, and accessibility
- Replace decorative-only motion with intentional motion
- Preserve “personality” without carrying forward broken or inaccessible patterns

### Design tokens baseline
- `--color-bg`: deep graphite / charcoal
- `--color-surface`: elevated dark panels
- `--color-accent`: Lisbook green
- `--color-text`: high-contrast neutral
- `--color-muted`: secondary copy

### Accessibility
- Keyboard-usable player controls
- Visible focus states
- WCAG-compliant contrast
- Caption/transcript support if content allows
- Reduced motion mode

## Functional Scope

### Public web modules
1. Home
2. Explore catalog
3. Book detail + player
4. Authentication
5. User profile
6. Favorites / library
7. Comments and reviews
8. Share and deep links
9. Static content pages
10. Scanner entry point
11. Search and discovery
12. Newsletter / announcements
13. Chat assistant entry point

### Admin modules
1. Dashboard
2. User management
3. Role and permission management
4. Audiobook management
5. Chapter / track management
6. Author / narrator / category management
7. Media asset management
8. Comments moderation
9. FAQ management
10. Static page / CMS content management
11. Newsletter lead management
12. Scanner match management
13. Recommendation curation
14. Site settings and branding control
15. Audit logs

## Public Page Mapping

### Home
- Hero banner
- Featured / top audiobooks
- Featured categories or collections
- Social proof / stats
- Latest releases
- Newsletter CTA

### Explore
- Search by title, author, narrator, genre
- Filter by genre, language, duration, release date, popularity
- Sort by newest, title, popularity, recently updated
- Recommendation rails

### Book detail
- Cover
- Title, author, narrator, genre, duration, language
- Description
- Chapter list
- Player
- Share
- Comments
- Related books

### Profile
- Account details
- Listening history
- Favorites
- Continue listening
- Preferences: theme, language, notifications

### Scan
- Capture/upload image
- Processing state
- Match result
- Fallback when no match is found

## Domain Model

### Core content entities
- `users`
- `roles`
- `permissions`
- `user_sessions`
- `authors`
- `narrators`
- `publishers`
- `categories`
- `tags`
- `audiobooks`
- `audiobook_authors`
- `audiobook_narrators`
- `chapters`
- `audio_assets`
- `image_assets`
- `collections`
- `collection_items`

### Community and engagement entities
- `favorites`
- `listening_progress`
- `comments`
- `comment_reports`
- `ratings`
- `shares`
- `newsletter_subscribers`

### CMS and ops entities
- `pages`
- `faqs`
- `site_settings`
- `navigation_items`
- `scanner_jobs`
- `scanner_matches`
- `recommendation_rules`
- `admin_audit_logs`

## Database Structure

### users
- `id`
- `email`
- `password_hash`
- `display_name`
- `avatar_url`
- `status`
- `preferred_language`
- `theme_preference`
- `created_at`
- `updated_at`

### roles
- `id`
- `name`
- `description`

### user_roles
- `user_id`
- `role_id`

### audiobooks
- `id`
- `slug`
- `title`
- `subtitle`
- `description`
- `short_description`
- `isbn` nullable
- `language`
- `status` (`draft`, `published`, `archived`)
- `cover_asset_id`
- `publisher_id`
- `release_date`
- `total_duration_seconds`
- `is_featured`
- `visibility`
- `seo_title`
- `seo_description`
- `created_by`
- `updated_by`
- `created_at`
- `updated_at`

### chapters
- `id`
- `audiobook_id`
- `title`
- `chapter_number`
- `description`
- `duration_seconds`
- `audio_asset_id`
- `preview_start_seconds`
- `preview_end_seconds`
- `is_preview`
- `sort_order`
- `created_at`
- `updated_at`

### audio_assets
- `id`
- `storage_key`
- `source_url`
- `mime_type`
- `file_size_bytes`
- `bitrate_kbps`
- `duration_seconds`
- `waveform_json` nullable
- `checksum`
- `processing_status`
- `created_at`

### authors / narrators / categories / tags
Each should support:
- `name`
- `slug`
- `bio/description` where relevant
- `image_asset_id` where relevant
- `status`
- timestamps

### listening_progress
- `id`
- `user_id`
- `audiobook_id`
- `chapter_id`
- `position_seconds`
- `completion_percent`
- `last_listened_at`

### favorites
- `user_id`
- `audiobook_id`
- `created_at`

### comments
- `id`
- `audiobook_id`
- `user_id`
- `body`
- `status` (`pending`, `approved`, `rejected`, `hidden`)
- `parent_comment_id` nullable
- `created_at`
- `updated_at`

### faqs
- `id`
- `question`
- `answer`
- `sort_order`
- `status`
- `locale`

### pages
- `id`
- `slug`
- `title`
- `meta_title`
- `meta_description`
- `content_json`
- `status`
- `locale`
- timestamps

### scanner_jobs
- `id`
- `user_id` nullable
- `input_asset_id`
- `status`
- `recognized_text`
- `confidence_score`
- `matched_audiobook_id` nullable
- `error_message` nullable
- timestamps

### admin_audit_logs
- `id`
- `actor_user_id`
- `action`
- `entity_type`
- `entity_id`
- `before_json`
- `after_json`
- `ip_address`
- `created_at`

## API Design

### Style
- REST first
- Versioned as `/v1`
- OpenAPI-generated contracts
- Consistent error body shape
- Cursor or page-based pagination for list endpoints

### Core API modules
- `AuthModule`
- `UsersModule`
- `RolesModule`
- `AudiobooksModule`
- `AuthorsModule`
- `NarratorsModule`
- `CategoriesModule`
- `ChaptersModule`
- `AssetsModule`
- `CommentsModule`
- `FavoritesModule`
- `ProgressModule`
- `SearchModule`
- `PagesModule`
- `FaqsModule`
- `ScannerModule`
- `NewsletterModule`
- `RecommendationsModule`
- `AdminAuditModule`

### Example route groups
- `POST /v1/auth/register`
- `POST /v1/auth/login`
- `POST /v1/auth/refresh`
- `GET /v1/audiobooks`
- `GET /v1/audiobooks/:slug`
- `GET /v1/audiobooks/:slug/chapters`
- `POST /v1/audiobooks/:id/comments`
- `POST /v1/me/favorites/:audiobookId`
- `PUT /v1/me/progress/:chapterId`
- `POST /v1/scanner/jobs`
- `GET /v1/admin/audiobooks`
- `POST /v1/admin/audiobooks`
- `PATCH /v1/admin/audiobooks/:id`
- `POST /v1/admin/chapters`
- `PATCH /v1/admin/pages/:id`
- `PATCH /v1/admin/faqs/:id`

## Search, Discovery, and Recommendations

### MVP
- PostgreSQL full-text search
- Filter by genre, language, narrator, duration
- Sort by popularity, newest, title
- Curated recommendation rails from admin

### Later
- Personalized recommendations
- Similarity based on categories/tags/listening behavior
- Dedicated search engine if scale requires it

## Scanner Strategy

### MVP
- Upload or capture cover image
- Send image to backend
- Backend uses OCR/image recognition provider
- Match against stored audiobook metadata
- Return best match candidates

### Suggested implementation
- `ScannerModule` in NestJS
- Background processing queue
- Store scan attempts and outcomes for tuning
- Admin UI to manually resolve unmatched scans

## Chat Assistant Strategy

### MVP
- Keep as a scoped support/discovery assistant
- Use site content, FAQs, and catalog metadata
- Answer questions like “find me a science audiobook” or “what should I listen to next”

### Guardrails
- Do not let it hallucinate catalog availability
- Ground answers in indexed Lisbook data

## CMS Strategy

The current static content pages should become manageable content types:

- About page
- Contact information
- FAQs
- Home page sections
- Footer links
- Navigation labels
- Banner promotions

Use structured blocks in `pages.content_json` rather than raw ad hoc HTML where possible.

## Testing Strategy

### Web and admin
- `Vitest` + `React Testing Library` for units/components
- `Playwright` for end-to-end flows

### API
- `Jest` for unit and integration tests
- Supertest for HTTP contract verification

### Coverage priorities
- Auth flows
- Audiobook CRUD
- Chapter ordering
- Progress persistence
- Comments moderation
- Scanner request lifecycle
- RBAC enforcement

## Observability and Operations
- Structured logging
- Request IDs
- Error tracking
- Health endpoints
- Queue monitoring
- Admin audit logs
- Basic analytics on top books, listens, search terms, failed scans

## Boundaries

### Always do
- Preserve Lisbook branding and page hierarchy from the current repo
- Build backend-first contracts for future React Native reuse
- Validate all input at API boundaries
- Use signed asset delivery for protected media
- Enforce RBAC in admin and sensitive API routes
- Record admin mutations in audit logs

### Ask first
- Payment/subscription features
- DRM or aggressive audio protection
- Third-party AI vendor commitments
- Social login providers
- Advanced recommendation engine scope

### Never do
- Store raw audio files in PostgreSQL
- Hardcode book metadata in frontend pages
- Expose admin endpoints without role checks
- Make future mobile a separate backend fork
- Preserve inaccessible legacy UI behavior just because it exists today

## Success Criteria
- All current public pages have a dynamic equivalent in the new platform.
- All current hardcoded books and chapters can be created, edited, published, and archived from admin.
- Public users can browse, search, open a book, play chapters, favorite books, and resume progress.
- Admin users can manage books, chapters, media, comments, FAQs, pages, and featured sections without code changes.
- Backend contracts are documented and reusable for a later React Native client.
- The design system clearly reflects existing Lisbook branding while improving accessibility and maintainability.

## Open Questions
1. Will Lisbook remain fully free/public-domain, or should the schema anticipate subscriptions and entitlements now?
2. Should comments be open to everyone, or only authenticated users?
3. Is multilingual content a real requirement now, or only UI language selection?
4. Should scanning use a third-party AI service in MVP, or remain a deferred module behind a feature flag?
5. Do you want admin as a separate app (`admin.lisbook`) or under a protected route group on the main domain?
