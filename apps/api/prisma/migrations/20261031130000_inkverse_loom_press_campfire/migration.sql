-- CreateEnum
CREATE TYPE "CampfireKind" AS ENUM ('spark', 'duel', 'tale', 'prompt');

-- AlterTable
ALTER TABLE "CreatorProfile" ADD COLUMN     "lastWriteDay" TEXT,
ADD COLUMN     "longestStreak" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "streakDays" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Saga" ADD COLUMN     "blurb" TEXT,
ADD COLUMN     "coverStyle" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "hearth" JSONB,
ADD COLUMN     "loom" JSONB,
ADD COLUMN     "publishedAt" TIMESTAMP(3),
ADD COLUMN     "slug" TEXT,
ADD COLUMN     "tagline" TEXT;

-- CreateTable
CREATE TABLE "CampfirePost" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "kind" "CampfireKind" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "sideA" TEXT,
    "sideB" TEXT,
    "tags" TEXT[],
    "tavern" TEXT NOT NULL DEFAULT 'general',
    "adoptedCount" INTEGER NOT NULL DEFAULT 0,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CampfirePost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampfireReply" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "side" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CampfireReply_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampfireReaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "postId" TEXT,
    "replyId" TEXT,
    "kind" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CampfireReaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CampfirePost_kind_createdAt_idx" ON "CampfirePost"("kind", "createdAt");

-- CreateIndex
CREATE INDEX "CampfirePost_tavern_createdAt_idx" ON "CampfirePost"("tavern", "createdAt");

-- CreateIndex
CREATE INDEX "CampfireReply_postId_createdAt_idx" ON "CampfireReply"("postId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CampfireReaction_userId_postId_kind_key" ON "CampfireReaction"("userId", "postId", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "CampfireReaction_userId_replyId_kind_key" ON "CampfireReaction"("userId", "replyId", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "Saga_slug_key" ON "Saga"("slug");

-- AddForeignKey
ALTER TABLE "CampfirePost" ADD CONSTRAINT "CampfirePost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampfireReply" ADD CONSTRAINT "CampfireReply_postId_fkey" FOREIGN KEY ("postId") REFERENCES "CampfirePost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampfireReply" ADD CONSTRAINT "CampfireReply_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampfireReaction" ADD CONSTRAINT "CampfireReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampfireReaction" ADD CONSTRAINT "CampfireReaction_postId_fkey" FOREIGN KEY ("postId") REFERENCES "CampfirePost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampfireReaction" ADD CONSTRAINT "CampfireReaction_replyId_fkey" FOREIGN KEY ("replyId") REFERENCES "CampfireReply"("id") ON DELETE CASCADE ON UPDATE CASCADE;

