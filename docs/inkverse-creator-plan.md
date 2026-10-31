# The Inkverse: Lisbook's World for Writers and Creators

## The idea in one paragraph

Lisbook today is a place to **listen** to stories. The Inkverse makes it a place to **make** them too. A writer arrives with a half-formed idea, shapes it with **Lis** (now acting as their Muse), lays the story out on a visual board, builds characters and worlds, writes the manuscript, and publishes it as a book on Lisbook. Lis can then **read that book aloud**, chapter by chapter, to anyone. Around all of this sits a community where people share wild ideas, argue about them, and build stories together.

**The loop:** Spark an idea, then weave it, write it, publish it, have it read aloud, and share it. Feedback from the community brings back the next spark.

---

## Sections and features

### 1. The Threshold: becoming a creator
The gateway where a listener becomes a writer.

- **Quill Name**: a pen name and creator profile, separate from the listener profile and optional to make public.
- **Muse Match**: a short onboarding quiz covering favourite genres, writing style and goals (finish a novel, write short fiction, just play). Lis uses the answers to tune its tone.
- **The Inkwell (dashboard)**: your Sagas, Ink Streak, Lis's suggestions, and community activity.

### 2. Sagas: your story projects
A **Saga** is one story project. It owns everything below: board, characters, world and manuscript.
- Sagas can be a novel, a novella, a short story or a serial.
- Visibility is Private, Shared with collaborators (later), or Public.

### 3. The Loom: the creative board ⭐
An infinite canvas where you weave the parts of a story together.

- **Shards**: cards on the board. A Shard can be a scene, an idea, a plot beat, a quote, an image or a note. It can link to a character (Soul) or a place (Atlas entry).
- **Threads**: connections between Shards, with labels such as "leads to", "foreshadows", "conflicts with" or "flashback". Each type gets its own colour.
- **Board views:**
  - **Web view**: free-form mind map.
  - **Timeline view (the Chronicle)**: Shards placed in story order or in-world time.
  - **Lanes view**: one swim-lane per character or subplot, so you can see who is where.
- **Rifts (What-If branches)**: fork a section of the board to try an alternate path ("What if the mentor dies here?"), then merge it back or drop it.
- **Lis on the Loom**: select some Shards and ask Lis to *find plot holes*, *suggest a bridge scene*, or *pace this act*.
- A Shard can be promoted into a manuscript chapter with one click.

### 4. The Soulforge: character creation
Where characters (**Souls**) are born.

- **Soul Card**: name, portrait, role, appearance, personality, desires, fears, secrets, voice and speech quirks, and an arc (who they are at the start and at the end).
- **Kinship Web**: a relationship graph between Souls (family, rival, lover, mentor, and so on).
- **Soul Interview**: chat with your character *in character*. Lis plays the Soul using its card, which helps you find their voice.
- **Arc Tracker**: shows where each Soul appears across the Loom and the manuscript.

### 5. The Atlas of Elsewhere: worldbuilding
- **Realms and Places**: locations with descriptions and images, nestable (world, then city, then tavern).
- **Lore Codex**: magic systems, history, factions, rules of the world.
- **The Chronicle**: an in-world timeline of events, shared with the Loom's timeline view.

### 6. The Quill Room: the writing studio
A focused manuscript editor.

- **Folios**: chapters, drag-to-reorder, each with a status (Draft, Revising, Done).
- **Mention linking**: typing `@` links a Soul and `#` links a place, so the Arc Tracker and Lis stay aware of them.
- **Focus mode**, word goals, autosave and version history ("Snapshots").
- Lis sits in a side panel (see below).

### 7. Lis the Muse: the writing assistant
The same Lis listeners already know, with creator modes:

| Mode | What it does |
|---|---|
| **Spark** | Brainstorm premises, names, twists and titles from a rough idea |
| **Weave** | Structure help: outlines, act breaks, connecting Shards, plot-hole hunting |
| **Whisper** | Continue a passage, or write three alternative versions of a scene |
| **Polish** | Line edits for clarity, rhythm, show-don't-tell and dialogue tightening |
| **Echo** | Continuity check against the Soulforge and Atlas ("Mira's eyes were green in chapter 2") |
| **Mirror** | Reader's-eye feedback on what's gripping, what drags and what's confusing |

Guiding principle: **Lis furnishes, the writer decides.** Suggestions appear as proposals the writer accepts or rejects. Lis never silently rewrites. Published books record how much AI assistance was used (see open questions).

### 8. The Lantern Press: publishing
Turning a manuscript into a Lisbook book.

1. **Proof**: Lis runs a final Echo and Polish pass and a checklist (title, blurb, cover, all chapters marked Done).
2. **Cover Forge**: upload a cover, or generate one from the blurb (later).
3. **Light the Lantern**: publish. The Saga becomes a book in the catalog under a **Debut Shelf** / "Inkverse Originals" category.
4. Published books get ratings, comments and favourites like every other book, plus a **Reader Pulse** view for the author (reads, completion, favourite chapters).
5. Admins can review books before they go public (configurable).

### 9. The Hearth: Lis reads aloud
Published Inkverse books can be **read by Lis, chapter by chapter**.

- It plugs into the existing player and mini-player, so it feels like any audiobook.
- **Voice Casting**: the author gives the narrator and each Soul a voice, so dialogue changes voice per character.
- Phase 1 uses the browser speech engine we already have in `apps/web/lib/speech.ts`. Later we pre-render real audio with a TTS model and store it as `AudioAsset`s, so it plays everywhere.
- Listeners can stop at any moment and ask Lis about the story, using the assistant flow that works today with book and chapter context.

### 10. The Campfire: community
Where people share ideas, debate, and build together.

- **Sparks**: short idea posts ("A world where memories are currency"). Others react with **Embers** (upvotes) and can **Adopt** a Spark, which turns it into a new Saga with credit to the original poster.
- **Duels**: structured debates. Someone poses a question ("Should villains always get redemption?"), people pick a side, argue in two columns, and the community votes.
- **Round Robin Tales**: chain stories where each person adds the next passage within a time window.
- **Critique Circles**: small groups that swap chapters for feedback, with a "be kind, be specific" prompt.
- **Moonlit Prompts**: a weekly writing challenge with a featured winner.
- **Taverns**: topic channels (Fantasy, Sci-Fi, Horror, Romance, Worldbuilding, Craft).
- Safety: report button, admin moderation queue (extends the existing comment moderation), and an optional Lis pre-screen for abuse and spam.

### 11. Ink Ranks: progression (optional, later)
A light gamification layer that rewards making things rather than grinding.
- **Ranks**: Scribbler, Wordsmith, Storyweaver, Loremaster, Mythmaker.
- **Ink Streak**: writing-day streaks. **Badges** for a first published book, 10 Sparks adopted, winning a Duel, and so on.

---

## How it fits the current codebase

What we already have and will reuse:
- **Monorepo**: `apps/web` (Next.js), `apps/admin` (Next.js), `apps/api` (NestJS + Prisma + Postgres), `packages/types`, `packages/ui`.
- **Assistant**: `apps/api/src/modules/assistant` streams from a local Ollama model, and `apps/web/providers/assistant-provider.tsx` manages threads, speech and the book/chapter context.
- **Catalog and player**: `Audiobook`, `Chapter`, `AudioAsset`, `ListeningProgress`, `Comment`, `Rating`, plus the player provider and mini-player.
- **Auth and RBAC**: `User`, `Role`, `Permission`, and admin moderation for comments.

### New data models (Prisma)
```text
CreatorProfile   userId, quillName, bio, avatar, genres[], museSettings(json), inkRank, streak
Saga             id, ownerId, title, logline, genre, form, visibility, status, coverAssetId,
                 publishedAudiobookId?  (link to the catalog book once published)
Shard            id, sagaId, kind(scene|idea|beat|note|image|quote), title, body,
                 x, y, color, laneKey?, chronoOrder?, riftId?
Thread           id, sagaId, fromShardId, toShardId, kind(leads_to|foreshadows|conflicts|flashback|custom), label
Rift             id, sagaId, name, parentRiftId?, status(open|merged|discarded)
Soul             id, sagaId, name, role, portraitAssetId, traits(json), arc(json), voiceId?
SoulBond         id, sagaId, fromSoulId, toSoulId, kind, note
AtlasEntry       id, sagaId, kind(place|lore|faction|event), name, body, parentId?, chronoDate?
Folio            id, sagaId, title, order, status, content(json: editor doc), wordCount
FolioSnapshot    id, folioId, content, createdAt
EntityMention    folioId|shardId -> soulId|atlasEntryId      (powers Arc Tracker and Echo)
MuseSession      id, sagaId, mode, messages(json), createdAt   (optional history)

Spark            id, authorId, body, tags[], emberCount, adoptedCount
Duel             id, authorId, question, sideA, sideB, closesAt
DuelArgument     id, duelId, side, authorId, body, emberCount
RoundRobin       id, title, prompt, turnMinutes, status;  RoundRobinPassage(order, authorId, body)
CommunityPost    generic threads in Taverns;  CommunityReply
Ember            userId + target(type,id)  (unique)
Report           reporterId, target(type,id), reason, status
```

### New API modules (`apps/api/src/modules/`)
`creators`, `sagas`, `loom` (shards, threads, rifts), `soulforge`, `atlas`, `folios`, `muse` (extends assistant with creator modes), `press` (publish pipeline that creates the `Audiobook` and `Chapter` rows), `hearth` (voice casting and TTS rendering), `campfire` (sparks, duels, round robins, taverns, embers), `reports`.

### New web routes (`apps/web/app/`)
```text
/inkverse                      The Inkwell dashboard (or the Threshold if not yet a creator)
/inkverse/sagas/new
/inkverse/sagas/[id]           Saga overview
/inkverse/sagas/[id]/loom      Creative board
/inkverse/sagas/[id]/souls     Soulforge (+ /[soulId], /[soulId]/interview)
/inkverse/sagas/[id]/atlas     Atlas of Elsewhere
/inkverse/sagas/[id]/quill     Quill Room (+ /[folioId])
/inkverse/sagas/[id]/press     Lantern Press publish flow
/campfire                      Community home
/campfire/sparks, /campfire/duels/[id], /campfire/round-robin/[id], /campfire/taverns/[slug]
/creators/[quillName]          Public creator page
```
Admin gets **Inkverse Review** (books awaiting publish approval) and **Campfire Moderation** (reports queue).

### Suggested libraries
- **Board**: `@xyflow/react` (React Flow) for the Loom.
- **Editor**: TipTap (ProseMirror) for the Quill Room, with mention extensions for `@Soul` and `#Place`.
- **Realtime (later)**: Yjs for co-writing, and Server-Sent Events (already used by the assistant) for live Duels and Round Robins.

### A note on the AI model
The current local model (`gemma4:e4b-it-qat` on Ollama) is small. It's fine for Spark, Whisper and short Polish, but Echo (continuity) and Weave over a whole novel need care:
- Send Lis only the **relevant** context: the current Folio, plus the Soul cards and Atlas entries mentioned in it (via `EntityMention`), plus a short Saga summary.
- Keep a rolling **Saga Memory** summary per chapter, updated when a Folio is marked Done.
- Make the model configurable per mode, so heavier modes can point at a bigger model later.

---

## Phased roadmap

| Phase | Name | Delivers | Done when |
|---|---|---|---|
| **1** | *First Ink* | Threshold (CreatorProfile), Sagas, Quill Room editor with Folios, Lis Muse modes Spark, Whisper and Polish | A user can create a Saga, write chapters, and get Lis help inline |
| **2** | *Souls & Realms* | Soulforge (cards, Kinship Web, Soul Interview), Atlas, `@`/`#` mentions, Echo mode | Lis catches a continuity slip using character and world data |
| **3** | *The Loom* | Board with Shards and Threads, Web, Timeline and Lanes views, Shard-to-Folio, Weave mode; Rifts at the end | A writer can plan a whole plot visually and turn it into chapters |
| **4** | *Light the Lantern* | Lantern Press publishing into the catalog, Debut Shelf, Reader Pulse, admin review | A Saga appears as a book that others can find, rate and comment on |
| **5** | *The Hearth* | Lis reads published books aloud chapter by chapter in the player, Voice Casting, then pre-rendered TTS audio | A listener presses play on an Inkverse book and Lis narrates it |
| **6** | *The Campfire* | Sparks (with Adopt), Duels, Taverns, Embers, reports and moderation | People post ideas, debate, and adopt Sparks into Sagas |
| **7** | *Myths & Legends* | Round Robin Tales, Critique Circles, Moonlit Prompts, Ink Ranks and badges, co-writing | The community is self-sustaining with recurring events |

**Recommended MVP to demo:** Phases 1, 4 and a basic 5. Write, publish, and hear Lis read it aloud. That shows the whole magic loop end-to-end quickly; the Loom and Campfire then deepen it.

---

## Open questions to decide
1. **Ownership and AI disclosure**: do published books show an "AI-assisted" label or level? (Recommended: yes, a simple badge, never blocking.)
2. **Publish review**: auto-publish, or admin approval first? (Recommended: approval at launch, relaxed later for trusted creators.)
3. **Adopting Sparks**: is it a free-for-all, or must the original poster allow adoption?
4. **Monetization (later)**: tips, premium Muse modes, paid books?
5. **Mobile**: should the Loom be desktop-first, with mobile getting a read-only board plus the Quill Room?
6. **Naming umbrella**: "Inkverse" as the creator brand. Alternatives are *The Scriptorium* or *Lis Studio*.
