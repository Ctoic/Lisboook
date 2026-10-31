# Graph Report - .  (2026-10-31)

## Corpus Check
- 278 files · ~188,475 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1746 nodes · 3685 edges · 115 communities (97 shown, 18 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 149 edges (avg confidence: 0.8)
- Token cost: 348,794 input · 0 output

## Community Hubs (Navigation)
- Legacy HTML Book Pages
- Marked Markdown Library
- Inkverse Kinship Web
- Web Layout Chrome
- Audiobook DTOs & Pagination
- API Module Wiring
- Book Detail Routes
- Web Home & Book Cards
- Admin Auth & Seeding
- Inkverse Pages
- Next.js Configs & Layouts
- Ollama Assistant Backend
- Muse & Assistant Panels
- Admin Package Deps
- Web Package Deps
- Inkverse Controller
- CMS Pages Module
- Dev Seed Data
- Atlas World Schema
- Asset Storage Service
- Root Monorepo Tooling
- Base TS Config
- Atlas Mentions Logic
- Admin Login & Audiobook Form
- Inkverse Service
- World Controller
- Web About & CMS
- Inkwell Saga Dashboard
- Legacy Cover Scanner JS
- Legacy Site Script
- Chapters Module
- Voice Assistant Speech
- Web TS Config
- API Dev Dependencies
- API TS Config
- Legacy Audiobook API Client
- Admin Assets & API Client
- Authors Module
- Categories Module
- Narrators Module
- Cover & Brand Images
- Admin Catalog Manager
- API Runtime Dependencies
- Web Local Storage & Auth Modal
- Auth & Roles Guards
- Delivery Roadmap Phases
- Inkverse Creator Plan
- Admin Dashboard Shell
- Web Login & Account Menu
- Saga Validation
- Newsletter Module
- Web Root Layout
- Fullstack Spec Architecture
- Admin Root Layout
- Admin TS Config
- Root Scripts
- Inkverse Folio Helpers
- Admin Audiobooks Page
- Assistant Streaming Client
- Scanner Docs
- Roles Module
- Users Module
- Assistant Launcher & Mascot
- Legacy Media Import
- API Bootstrap & Errors
- FAQs Module
- Player & Library Providers
- Audiobook API Guide
- UI Package Deps
- Admin Website Pages
- Health Check Module
- API Build TS Config
- Contributing & README
- Admin Placeholder Sections
- Nest CLI Config
- Dynamic Components Guide
- Brand Palette Package
- API Package Meta
- Types Package Meta
- Image Asset DTOs
- Author DTOs
- Category DTOs
- Narrator DTOs
- Newsletter DTO
- Web Client API
- Admin Dashboard Page
- Config Package Meta
- Legacy Translations
- Conduct & Security Policy
- Contributors CI Workflow
- Admin Next Env Types
- Jest Config
- Nest CLI Dependency
- ts-jest Dependency
- Express Types Dependency
- Web Next Env Types
- About Logos
- Jira Test Page
- 1984 Cover
- Great Gatsby Cover
- Moby-Dick Cover
- Pride and Prejudice Cover
- Catcher in the Rye Cover
- To Kill a Mockingbird Cover

## God Nodes (most connected - your core abstractions)
1. `base()` - 48 edges
2. `PrismaService` - 37 edges
3. `AuthenticatedRequest` - 32 edges
4. `useToast()` - 31 edges
5. `Button` - 27 edges
6. `Home Page (index)` - 27 edges
7. `request()` - 26 edges
8. `InkverseService` - 24 edges
9. `AdminRoute()` - 22 edges
10. `WorldService` - 22 edges

## Surprising Connections (you probably didn't know these)
- `Lisbook Full Delivery Roadmap` --semantically_similar_to--> `Implementation Plan: Full-Stack Replatform`  [INFERRED] [semantically similar]
  docs/full-delivery-roadmap.md → tasks/plan.md
- `Share Audiobook modal` --semantically_similar_to--> `Social share links (WhatsApp/Twitter/Facebook to pbd.html)`  [INFERRED] [semantically similar]
  explore.html → pbd.html
- `hashPassword()` --indirect_call--> `N()`  [INFERRED]
  apps/api/src/common/auth/password.ts → marked.min.js
- `LisBook Audio Book Player` --semantically_similar_to--> `Contributing to LisBook`  [INFERRED] [semantically similar]
  README.md → CONTRIBUTING.md
- `Scanner Architecture (empty)` --conceptually_related_to--> `Book Cover Scanner Complete Guide`  [AMBIGUOUS]
  SCANNER_ARCHITECTURE.md → SCANNER_GUIDE.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Inkverse Creator Loop (spark, weave, write, publish, read aloud)** — docs_inkverse_creator_plan_the_loom, docs_inkverse_creator_plan_soulforge, docs_inkverse_creator_plan_atlas_of_elsewhere, docs_inkverse_creator_plan_quill_room, docs_inkverse_creator_plan_lantern_press, docs_inkverse_creator_plan_the_hearth, docs_inkverse_creator_plan_lis_the_muse [EXTRACTED 1.00]
- **Replatform Monorepo Apps** — docs_lisbook_fullstack_spec_apps_web, docs_lisbook_fullstack_spec_apps_admin, docs_lisbook_fullstack_spec_apps_api, tasks_plan_packages_ui, packages_config_readme_lisbook_config [INFERRED 0.85]
- **Scanner Backend Recognition Options** — scanner_guide_google_cloud_vision, scanner_guide_custom_ml_model, scanner_guide_isbn_barcode_scanner, scanner_guide_post_api_scan_book [EXTRACTED 1.00]
- **Audiobook book page pattern (player + chapters + share + comments)** — adventures_audio_player, pbd_social_share_links, pbd_comment_form, translation_data_translate_i18n, pbd_header_placeholder [INFERRED 0.85]
- **Dynamic navbar/footer component layout** — page_template_placeholder_includes, dynamic_components_script, includes_navbar_page, includes_footer_page, page_template_page [INFERRED 0.85]
- **GitHub API-driven people features** — github_api, about_contributors_list, profile_friends_system, profile_friends_localstorage [INFERRED 0.75]
- **Lisbook audiobook catalog cover assets** — images_1984_cover, images_adventures_sherlock_holmes_cover, images_frankestine_cover, images_gd_cover, images_pride_and_prejudice_cover, images_sapiens_cover, images_thecatcher_cover, images_to_kill_a_mockingbird_cover, images_cs_cover, images_god_delusion_cover, images_great_gatsby_cover, images_moby_dick_cover [INFERRED 0.85]
- **Lisbook headphones brand logo variants** — images_favicon_logo, apps_web_public_images_favicon_logo, images_lisbook_about_white_logo, images_lisbook_about_logo, images_lisbook_logo_1_logo, images_lisbook_logo_logo [INFERRED 0.95]
- **Lisbook UI screenshots across versions** — images_lisbook_app_screeshot_ui, images_sc2_ui, images_screenshot_from_2024_01_12_10_47_49_ui [INFERRED 0.85]

## Communities (115 total, 18 thin omitted)

### Community 0 - "Legacy HTML Book Pages"
Cohesion: 0.09
Nodes (70): GitHub contributors list, About Page, Book page audio player (#audio-player / #ctrl-player), Adventures of Sherlock Holmes (Arthur Conan Doyle), Adventures of Sherlock Holmes Book Page, app.js, audiobook-api.js, Bootstrap 5.3.3 CDN (+62 more)

### Community 1 - "Marked Markdown Library"
Cohesion: 0.05
Nodes (47): A(), blockquote(), blockTokens(), br(), checkbox(), code(), codespan(), constructor() (+39 more)

### Community 2 - "Inkverse Kinship Web"
Cohesion: 0.08
Nodes (48): bondColor, KinshipWeb(), roleColor, Candidate, candidatesFor(), MenuState, useMentionMenu(), SagaNav() (+40 more)

### Community 3 - "Web Layout Chrome"
Cohesion: 0.10
Nodes (43): columns, Brand(), links, NewsletterForm(), ArrowRightIcon(), BackIcon(), base(), BookIcon() (+35 more)

### Community 4 - "Audiobook DTOs & Pagination"
Cohesion: 0.06
Nodes (30): PaginationQueryDto, IsInt, IsOptional, Min, Type, AudiobooksService, PublicAudiobooksController, Body (+22 more)

### Community 5 - "API Module Wiring"
Cohesion: 0.12
Nodes (28): AdminRoute(), PrismaModule, Module, PrismaService, Injectable, slugify(), AssetsModule, Module (+20 more)

### Community 6 - "Book Detail Routes"
Cohesion: 0.08
Nodes (32): BookPage(), generateMetadata(), Params, ExploreView(), SortKey, sorts, ExplorePage(), metadata (+24 more)

### Community 7 - "Web Home & Book Cards"
Cohesion: 0.12
Nodes (33): BookDetail(), categoriesOf(), HomePage(), steps, ContinueListening(), Favorites(), Preferences(), ProfilePage() (+25 more)

### Community 8 - "Admin Auth & Seeding"
Cohesion: 0.09
Nodes (27): AdminSession, StoredSession, main(), prisma, derive(), hashPassword(), isPasswordHash(), verifyPassword() (+19 more)

### Community 9 - "Inkverse Pages"
Cohesion: 0.09
Nodes (18): Atlas(), AtlasEditor(), blank(), Draft, draftOf(), parentOptions(), payload(), View (+10 more)

### Community 10 - "Next.js Configs & Layouts"
Cohesion: 0.06
Nodes (25): nextConfig, metadata, metadata, metadata, metadata, nextConfig, ^build, coverage/** (+17 more)

### Community 11 - "Ollama Assistant Backend"
Cohesion: 0.08
Nodes (23): ASSISTANT_MODEL, chatJson(), ChatMessage, ChatRole, cleanMessages(), KEEP_ALIVE, OLLAMA_BASE_URL, streamOllamaChat() (+15 more)

### Community 12 - "Muse & Assistant Panels"
Cohesion: 0.09
Nodes (30): ScanPage(), inline(), Markdown(), CastPanel(), cleanProse(), EditorContext, Idea, LiveWrite (+22 more)

### Community 13 - "Admin Package Deps"
Cohesion: 0.07
Nodes (29): dependencies, @lisbook/types, @lisbook/ui, next, react, react-dom, devDependencies, @types/node (+21 more)

### Community 14 - "Web Package Deps"
Cohesion: 0.07
Nodes (29): dependencies, @lisbook/types, @lisbook/ui, next, react, react-dom, devDependencies, @types/node (+21 more)

### Community 15 - "Inkverse Controller"
Cohesion: 0.21
Nodes (13): AuthenticatedRequest, InkverseController, Body, Controller, Delete, Get, Param, Patch (+5 more)

### Community 16 - "CMS Pages Module"
Cohesion: 0.10
Nodes (18): IsIn, IsOptional, IsString, MinLength, UpdatePageDto, AdminPagesController, PagesModule, PagesService (+10 more)

### Community 17 - "Dev Seed Data"
Cohesion: 0.08
Nodes (20): AdminUserSeed, chapters, seedAudiobooks, seedFaqs, seedPages, seedUsers, IsIn, IsInt (+12 more)

### Community 18 - "Atlas World Schema"
Cohesion: 0.10
Nodes (24): ATLAS_GUIDE, ATLAS_KINDS, ATLAS_SCHEMA, BOND_KINDS, clip(), InterviewBody, MentionRow, mentionRows() (+16 more)

### Community 19 - "Asset Storage Service"
Cohesion: 0.10
Nodes (13): LocalStorageService, StoredAssetDescriptor, Injectable, AssetsController, AssetsService, Body, Controller, Get (+5 more)

### Community 20 - "Root Monorepo Tooling"
Cohesion: 0.08
Nodes (24): devDependencies, turbo, typescript, turbo, typescript, name, packageManager, private (+16 more)

### Community 21 - "Base TS Config"
Cohesion: 0.08
Nodes (24): dom, dom.iterable, es2022, compilerOptions, allowJs, baseUrl, esModuleInterop, incremental (+16 more)

### Community 22 - "Atlas Mentions Logic"
Cohesion: 0.14
Nodes (8): appearances(), rebuildSagaMentions(), toAtlas(), toSoul(), Get, Inject, Injectable, WorldService

### Community 23 - "Admin Login & Audiobook Form"
Cohesion: 0.13
Nodes (16): AudiobookFormModal(), defaultState, FormState, toFormState(), LoginForm(), Button(), ButtonProps, ButtonSize (+8 more)

### Community 24 - "Inkverse Service"
Cohesion: 0.17
Nodes (4): InkverseService, toFolioSummary(), Inject, Injectable

### Community 25 - "World Controller"
Cohesion: 0.23
Nodes (11): Body, Controller, Delete, Param, Patch, Post, Put, Req (+3 more)

### Community 26 - "Web About & CMS"
Cohesion: 0.15
Nodes (17): AboutPage(), metadata, milestones, values, ContactForm(), Errors, Fields, topics (+9 more)

### Community 27 - "Inkwell Saga Dashboard"
Cohesion: 0.17
Nodes (17): comingSoon, Inkwell(), timeAgo(), SnapshotsModal(), SagaDraft, SagaFields(), draftOf(), SagaOverview() (+9 more)

### Community 28 - "Legacy Cover Scanner JS"
Cohesion: 0.18
Nodes (19): buttons, cameraPreview, captureImage(), displayResult(), handleCameraError(), MOCK_BOOKS, playAudioPreview(), previewAudio (+11 more)

### Community 29 - "Legacy Site Script"
Cohesion: 0.12
Nodes (10): fetchContributors(), generateContributorsHTML(), initializeTheme(), loadContributors(), loadFavourites(), NOTE: This requires EmailJS setup ('your_service_id' and 'feedback_form'…, setTheme(), toggleHeart() (+2 more)

### Community 30 - "Chapters Module"
Cohesion: 0.11
Nodes (15): ChaptersController, ChaptersService, Body, Controller, Inject, Injectable, Post, CreateChapterDto (+7 more)

### Community 31 - "Voice Assistant Speech"
Cohesion: 0.14
Nodes (13): AssistantPanel(), suggestionsFor(), getRecognition(), pickVoice(), Recognition, RecognitionCtor, RecognitionEvent, RecognitionResult (+5 more)

### Community 32 - "Web TS Config"
Cohesion: 0.10
Nodes (19): compilerOptions, baseUrl, paths, plugins, exclude, extends, include, next-env.d.ts (+11 more)

### Community 33 - "API Dev Dependencies"
Cohesion: 0.11
Nodes (19): devDependencies, jest, @nestjs/schematics, @nestjs/testing, prisma, ts-node, tsx, @types/jest (+11 more)

### Community 34 - "API TS Config"
Cohesion: 0.11
Nodes (18): compilerOptions, allowSyntheticDefaultImports, declaration, emitDecoratorMetadata, experimentalDecorators, module, moduleResolution, noEmit (+10 more)

### Community 36 - "Admin Assets & API Client"
Cohesion: 0.20
Nodes (16): AssetsPage(), ApiErrorShape, AssetsListContract, AssetsProviderContract, AudioAssetContract, createAdminImageAsset(), CreateImageAssetPayload, getAdminAssets() (+8 more)

### Community 37 - "Authors Module"
Cohesion: 0.13
Nodes (10): AuthorsController, AuthorsService, Body, Controller, Get, Inject, Injectable, Param (+2 more)

### Community 38 - "Categories Module"
Cohesion: 0.13
Nodes (10): CategoriesController, CategoriesService, Body, Controller, Get, Inject, Injectable, Param (+2 more)

### Community 39 - "Narrators Module"
Cohesion: 0.13
Nodes (10): NarratorsController, NarratorsService, Body, Controller, Get, Inject, Injectable, Param (+2 more)

### Community 40 - "Cover & Brand Images"
Cohesion: 0.12
Nodes (18): Lisbook favicon (web app public copy), Sherlock Holmes: The Complete Collection by Arthur Conan Doyle (cover), Bookify Logo placeholder, Pale Blue Dot by Carl Sagan (AI portrait cover art), Lisbook favicon (headphones logo, black bg), Frankenstein by Mary Shelley (cover), Dumnezeu, o amagire (The God Delusion, Romanian ed.) by Richard Dawkins (cover), The God Delusion by Richard Dawkins (cover) (+10 more)

### Community 41 - "Admin Catalog Manager"
Cohesion: 0.26
Nodes (15): CatalogPage(), DetailField, SectionConfig, createAdminAuthor(), createAdminCategory(), createAdminNarrator(), getAdminAuthors(), getAdminCategories() (+7 more)

### Community 42 - "API Runtime Dependencies"
Cohesion: 0.12
Nodes (17): dependencies, class-transformer, class-validator, @nestjs/common, @nestjs/core, @nestjs/platform-express, @prisma/client, reflect-metadata (+9 more)

### Community 43 - "Web Local Storage & Auth Modal"
Cohesion: 0.21
Nodes (14): AuthModal(), readJson(), removeKey(), storageKeys, writeJson(), AuthContext, AuthContextValue, AuthProvider() (+6 more)

### Community 44 - "Auth & Roles Guards"
Cohesion: 0.13
Nodes (9): AuthenticatedUser, AuthGuard, Inject, Injectable, Roles(), ROLES_KEY, RolesGuard, Inject (+1 more)

### Community 45 - "Delivery Roadmap Phases"
Cohesion: 0.14
Nodes (15): Lisbook Full Delivery Roadmap, Legacy Static Site (read-only reference), Phase 1: Backend Foundation, Phase 2: Admin Content Platform, Phase 3: Public Site Parity, Phase 4: User Account and Engagement, Phase 5: Advanced Features, Phase 6: Launch Hardening (+7 more)

### Community 46 - "Inkverse Creator Plan"
Cohesion: 0.23
Nodes (15): apps/api/src/modules/assistant (Ollama streaming), The Atlas of Elsewhere Worldbuilding, EntityMention Model, The Inkverse Creator Plan, The Lantern Press Publishing, Lis the Muse Writing Assistant, The Quill Room Writing Studio (Folios), Saga Story Project (+7 more)

### Community 47 - "Admin Dashboard Shell"
Cohesion: 0.20
Nodes (9): UsersPage(), AdminShell(), icons, navigationSections, AdminRoleContract, AdminUserContract, getAdminRoles(), getAdminUsers() (+1 more)

### Community 48 - "Web Login & Account Menu"
Cohesion: 0.27
Nodes (11): LoginPage(), AuthModalProps, AccountMenu(), isActive(), MobileDrawer(), Navbar(), authCopy, SignInForm() (+3 more)

### Community 49 - "Saga Validation"
Cohesion: 0.33
Nodes (4): longText(), names(), oneOf(), text()

### Community 50 - "Newsletter Module"
Cohesion: 0.17
Nodes (9): NewsletterController, NewsletterService, Body, Controller, Inject, Injectable, Post, HttpCode (+1 more)

### Community 51 - "Web Root Layout"
Cohesion: 0.21
Nodes (9): metadata, viewport, Footer(), AppProviders(), ThemeContext, ThemeContextValue, themeInitScript, ToastProvider() (+1 more)

### Community 52 - "Fullstack Spec Architecture"
Cohesion: 0.24
Nodes (13): apps/admin Next.js Admin Portal, apps/api NestJS API, apps/web Next.js Public App, CMS Strategy, Lisbook Design Tokens (dark-first, green accent), Lisbook Full-Stack Replatform Spec, NestJS + Prisma + PostgreSQL Backend, RBAC (listener, editor, admin, super_admin) (+5 more)

### Community 53 - "Admin Root Layout"
Cohesion: 0.21
Nodes (8): metadata, login(), AuthContext, AuthContextValue, AuthProvider(), readStoredSession(), ADMIN_STORAGE_KEY, API_BASE_URL

### Community 54 - "Admin TS Config"
Cohesion: 0.17
Nodes (11): compilerOptions, plugins, exclude, extends, include, next-env.d.ts, .next/types/**/*.ts, node_modules (+3 more)

### Community 55 - "Root Scripts"
Cohesion: 0.17
Nodes (12): scripts, build, lint, media:import, openapi, prisma, prisma:generate, prisma:seed (+4 more)

### Community 56 - "Inkverse Folio Helpers"
Cohesion: 0.17
Nodes (11): BIBLE_BUDGET, countWords(), FOLIO_STATUSES, folioSummarySelect, GOALS, InkverseModule, MUSE_MODES, MuseBody (+3 more)

### Community 57 - "Admin Audiobooks Page"
Cohesion: 0.29
Nodes (10): AudiobooksPage(), AudiobookFormModalProps, AudiobookPayload, createAdminAudiobook(), getAdminAudiobooks(), getAudiobookDetail(), updateAdminAudiobook(), ExploreViewProps (+2 more)

### Community 58 - "Assistant Streaming Client"
Cohesion: 0.31
Nodes (9): AssistantMode, AssistantRequest, AssistantRole, streamAssistant(), streamChat(), StreamEvent, AssistantContextValue, AssistantMessage (+1 more)

### Community 59 - "Scanner Docs"
Cohesion: 0.25
Nodes (11): Scanner Architecture (empty), Book Cover Scanner Complete Guide, Custom ML Model Option, getUserMedia Camera Access, Google Cloud Vision OCR Option, ISBN Barcode Scanner Option, POST /api/scan-book Endpoint, processImage() mock function (+3 more)

### Community 60 - "Roles Module"
Cohesion: 0.20
Nodes (6): RolesController, RolesService, Controller, Get, Inject, Injectable

### Community 61 - "Users Module"
Cohesion: 0.20
Nodes (6): Controller, Get, Inject, Injectable, UsersController, UsersService

### Community 62 - "Assistant Launcher & Mascot"
Cohesion: 0.31
Nodes (8): AssistantLauncher(), greetedThisSession(), markGreeted(), Message(), Mascot(), MascotMood, MascotProps, useAssistant()

### Community 63 - "Legacy Media Import"
Cohesion: 0.31
Nodes (8): books, durationSeconds(), LegacyBook, LegacyChapter, main(), mediaUrl(), prisma, slugify()

### Community 64 - "API Bootstrap & Errors"
Cohesion: 0.28
Nodes (4): AppModule, Module, HttpExceptionFilter, Catch

### Community 65 - "FAQs Module"
Cohesion: 0.25
Nodes (5): AdminFaqsController, PublicFaqsController, Controller, Get, Inject

### Community 66 - "Player & Library Providers"
Cohesion: 0.39
Nodes (8): AssistantContext, BookSnapshot, hasAudio(), NowPlaying, PlayerContext, PlayerContextValue, PlayerProvider(), ChapterContract

### Community 67 - "Audiobook API Guide"
Cohesion: 0.33
Nodes (9): Free Audiobook API Integration Guide, AudiobookAPIService, 30-minute In-Memory API Cache, 500ms Debounced Search, Internet Archive API, LibriVox API, Fallback to Local Data on API Failure, Open Library API (+1 more)

### Community 68 - "UI Package Deps"
Cohesion: 0.22
Nodes (8): dependencies, @lisbook/types, @lisbook/types, main, name, private, types, version

### Community 69 - "Admin Website Pages"
Cohesion: 0.39
Nodes (7): PAGE_SLUGS, STATUS_OPTIONS, WebsitePage(), getFaqs(), getPageBySlug(), updateAdminFaq(), updateAdminPage()

### Community 70 - "Health Check Module"
Cohesion: 0.29
Nodes (5): HealthController, HealthModule, Controller, Get, Module

### Community 71 - "API Build TS Config"
Cohesion: 0.25
Nodes (7): exclude, extends, dist, node_modules, test, **/*spec.ts, ./tsconfig.json

### Community 73 - "Contributing & README"
Cohesion: 0.33
Nodes (7): Bug Report Issue Template, Contributing to LisBook, Fork, Branch, Pull Request Workflow, Legacy Playlist (God Delusion parts 1-14), Hacktoberfest Contribution, LisBook Audio Book Player, Playback Controls (play/pause, stop, chapter nav, speed, volume, theme)

### Community 75 - "Nest CLI Config"
Cohesion: 0.29
Nodes (6): collection, compilerOptions, deleteOutDir, tsConfigPath, $schema, sourceRoot

### Community 76 - "Dynamic Components Guide"
Cohesion: 0.38
Nodes (7): Legacy Behaviors to Modernize, Dynamic Navbar and Footer Guide, dynamic-components.js, Footer Placeholder (includes/footer.html), Navbar Placeholder (includes/navbar.html), page-template.html, Single-Source Shared Navbar/Footer

### Community 77 - "Brand Palette Package"
Cohesion: 0.29
Nodes (5): BrandPalette, LegacyReferencePage, legacyReferencePages, lisbookPalette, lisbookTagline

### Community 78 - "API Package Meta"
Cohesion: 0.33
Nodes (5): name, prisma, seed, private, version

### Community 79 - "Types Package Meta"
Cohesion: 0.33
Nodes (5): main, name, private, types, version

### Community 80 - "Image Asset DTOs"
Cohesion: 0.50
Nodes (5): CreateImageAssetDto, IsOptional, IsString, MinLength, UpdateImageAssetDto

### Community 81 - "Author DTOs"
Cohesion: 0.60
Nodes (5): CreateAuthorDto, IsOptional, IsString, MinLength, UpdateAuthorDto

### Community 82 - "Category DTOs"
Cohesion: 0.60
Nodes (5): CreateCategoryDto, IsOptional, IsString, MinLength, UpdateCategoryDto

### Community 83 - "Narrator DTOs"
Cohesion: 0.60
Nodes (5): CreateNarratorDto, IsOptional, IsString, MinLength, UpdateNarratorDto

### Community 84 - "Newsletter DTO"
Cohesion: 0.40
Nodes (5): SubscribeDto, IsOptional, IsString, IsEmail, MaxLength

### Community 85 - "Web Client API"
Cohesion: 0.70
Nodes (4): login(), post(), register(), subscribeToNewsletter()

### Community 88 - "Config Package Meta"
Cohesion: 0.50
Nodes (3): name, private, version

### Community 89 - "Legacy Translations"
Cohesion: 0.67
Nodes (3): applyTranslations(), changeLanguage(), translations

### Community 91 - "Conduct & Security Policy"
Cohesion: 0.67
Nodes (3): Code of Conduct, Contributor Covenant v2.1, Security Policy

## Ambiguous Edges - Review These
- `Scanner Architecture (empty)` → `Book Cover Scanner Complete Guide`  [AMBIGUOUS]
  SCANNER_ARCHITECTURE.md · relation: conceptually_related_to
- `Lisbook Full Delivery Roadmap` → `pnpm Workspace Packages (apps/*, packages/*)`  [AMBIGUOUS]
  docs/full-delivery-roadmap.md · relation: conceptually_related_to
- `Top Audio Books card grid` → `Pale Blue Dot by Carl Sagan (AI portrait cover art)`  [AMBIGUOUS]
  Images/Lisbook-App-ScreeShot.jpg · relation: references
- `Bookify Logo placeholder` → `Lisbook logo (black square)`  [AMBIGUOUS]
  Images/bookify.jpg · relation: conceptually_related_to

## Knowledge Gaps
- **376 isolated node(s):** `DetailField`, `metricCards`, `deliveryRails`, `PAGE_SLUGS`, `STATUS_OPTIONS` (+371 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **18 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Scanner Architecture (empty)` and `Book Cover Scanner Complete Guide`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Lisbook Full Delivery Roadmap` and `pnpm Workspace Packages (apps/*, packages/*)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Top Audio Books card grid` and `Pale Blue Dot by Carl Sagan (AI portrait cover art)`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._
- **What is the exact relationship between `Bookify Logo placeholder` and `Lisbook logo (black square)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `PrismaService` connect `API Module Wiring` to `FAQs Module`, `Audiobook DTOs & Pagination`, `Authors Module`, `Categories Module`, `Narrators Module`, `Admin Auth & Seeding`, `Ollama Assistant Backend`, `Auth & Roles Guards`, `CMS Pages Module`, `Atlas World Schema`, `Asset Storage Service`, `Newsletter Module`, `Atlas Mentions Logic`, `Inkverse Folio Helpers`, `Inkverse Service`, `Roles Module`, `Users Module`, `Chapters Module`?**
  _High betweenness centrality (0.056) - this node is a cross-community bridge._
- **Why does `hashPassword()` connect `Admin Auth & Seeding` to `Marked Markdown Library`?**
  _High betweenness centrality (0.049) - this node is a cross-community bridge._
- **Why does `AdminRoute()` connect `API Module Wiring` to `FAQs Module`, `Authors Module`, `Categories Module`, `Narrators Module`, `Auth & Roles Guards`, `CMS Pages Module`, `Asset Storage Service`, `Roles Module`, `Users Module`, `Chapters Module`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._