-- CreateEnum
CREATE TYPE "AtlasKind" AS ENUM ('place', 'lore', 'faction', 'event');

-- CreateTable
CREATE TABLE "Soul" (
    "id" TEXT NOT NULL,
    "sagaId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "aliases" TEXT[],
    "role" TEXT NOT NULL DEFAULT 'supporting',
    "summary" TEXT,
    "appearance" TEXT,
    "personality" TEXT,
    "desires" TEXT,
    "fears" TEXT,
    "secrets" TEXT,
    "voice" TEXT,
    "arcStart" TEXT,
    "arcEnd" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Soul_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SoulBond" (
    "id" TEXT NOT NULL,
    "sagaId" TEXT NOT NULL,
    "fromSoulId" TEXT NOT NULL,
    "toSoulId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SoulBond_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AtlasEntry" (
    "id" TEXT NOT NULL,
    "sagaId" TEXT NOT NULL,
    "kind" "AtlasKind" NOT NULL,
    "name" TEXT NOT NULL,
    "aliases" TEXT[],
    "summary" TEXT,
    "details" TEXT,
    "parentId" TEXT,
    "era" TEXT,
    "chronoOrder" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AtlasEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntityMention" (
    "id" TEXT NOT NULL,
    "folioId" TEXT NOT NULL,
    "soulId" TEXT,
    "atlasEntryId" TEXT,
    "count" INTEGER NOT NULL,

    CONSTRAINT "EntityMention_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Soul_sagaId_sortOrder_idx" ON "Soul"("sagaId", "sortOrder");

-- CreateIndex
CREATE INDEX "SoulBond_sagaId_idx" ON "SoulBond"("sagaId");

-- CreateIndex
CREATE UNIQUE INDEX "SoulBond_fromSoulId_toSoulId_key" ON "SoulBond"("fromSoulId", "toSoulId");

-- CreateIndex
CREATE INDEX "AtlasEntry_sagaId_kind_idx" ON "AtlasEntry"("sagaId", "kind");

-- CreateIndex
CREATE INDEX "EntityMention_folioId_idx" ON "EntityMention"("folioId");

-- CreateIndex
CREATE INDEX "EntityMention_soulId_idx" ON "EntityMention"("soulId");

-- CreateIndex
CREATE INDEX "EntityMention_atlasEntryId_idx" ON "EntityMention"("atlasEntryId");

-- AddForeignKey
ALTER TABLE "Soul" ADD CONSTRAINT "Soul_sagaId_fkey" FOREIGN KEY ("sagaId") REFERENCES "Saga"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SoulBond" ADD CONSTRAINT "SoulBond_sagaId_fkey" FOREIGN KEY ("sagaId") REFERENCES "Saga"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SoulBond" ADD CONSTRAINT "SoulBond_fromSoulId_fkey" FOREIGN KEY ("fromSoulId") REFERENCES "Soul"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SoulBond" ADD CONSTRAINT "SoulBond_toSoulId_fkey" FOREIGN KEY ("toSoulId") REFERENCES "Soul"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtlasEntry" ADD CONSTRAINT "AtlasEntry_sagaId_fkey" FOREIGN KEY ("sagaId") REFERENCES "Saga"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtlasEntry" ADD CONSTRAINT "AtlasEntry_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "AtlasEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntityMention" ADD CONSTRAINT "EntityMention_folioId_fkey" FOREIGN KEY ("folioId") REFERENCES "Folio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntityMention" ADD CONSTRAINT "EntityMention_soulId_fkey" FOREIGN KEY ("soulId") REFERENCES "Soul"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntityMention" ADD CONSTRAINT "EntityMention_atlasEntryId_fkey" FOREIGN KEY ("atlasEntryId") REFERENCES "AtlasEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
