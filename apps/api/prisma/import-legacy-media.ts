/**
 * Imports the audio and cover art that ship with the legacy static site into the database:
 * creates AudioAsset / ImageAsset rows, links chapters to them and fills in real durations.
 * Safe to re-run: every row is upserted by a stable key.
 *
 *   npm run media:import --workspace=@lisbook/api
 */
import { PrismaClient } from "@prisma/client";
import { execFileSync } from "node:child_process";
import { existsSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const prisma = new PrismaClient();
const MEDIA_ROOT = process.env.MEDIA_ROOT ?? resolve(process.cwd(), "../..");

interface LegacyChapter {
  title: string;
  file: string;
}

interface LegacyBook {
  slug: string;
  title: string;
  author: string;
  category: string;
  description: string;
  cover: string;
  /** Existing seed chapter ids to reuse (in order) so saved listening progress keeps working. */
  reuseChapterIds?: Array<string | undefined>;
  chapters: LegacyChapter[];
}

const books: LegacyBook[] = [
  {
    slug: "pale-blue-dot",
    title: "Pale Blue Dot",
    author: "Carl Sagan",
    category: "Science",
    cover: "cs.jpg",
    description:
      "Carl Sagan's meditation on humanity's place in the cosmos, inspired by the Voyager 1 photograph of Earth as a tiny speck of light. Sagan traces how science has repeatedly demoted us from the centre of the universe, explores the planets and moons visited by our spacecraft, and argues that our future lies in exploring and settling space — while cherishing the only home we've ever known.",
    reuseChapterIds: [undefined, "seed-ch-pbd-1"],
    chapters: [
      { title: "Introduction", file: "PaleBlueDot/Introduction.mp3" },
      { title: "You Are Here", file: "PaleBlueDot/chap-1_you_are_here.mp3" },
      { title: "Aberrations of Light", file: "PaleBlueDot/Chap-2_aberrations of light.mp3" },
      { title: "The Great Demotions", file: "PaleBlueDot/chap-3_the great demotions.mp3" },
      { title: "A Universe Not Made for Us", file: "PaleBlueDot/chap-4_a universe not made for us.mp3" },
      { title: "Is There Intelligent Life on Earth?", file: "PaleBlueDot/chap-5_is there intelligent life on earth.mp3" },
      { title: "The Triumph of Voyager", file: "PaleBlueDot/chap-6_the triumph of voyager.mp3" },
      { title: "Among the Moons of Saturn", file: "PaleBlueDot/chap-7_among the moons of saturn.mp3" },
      { title: "The First New Planet", file: "PaleBlueDot/chap-8_the first new planet.mp3" }
    ]
  },
  {
    slug: "god-delusion",
    title: "God Delusion",
    author: "Richard Dawkins",
    category: "Philosophy",
    cover: "GD.jpeg",
    description:
      "Richard Dawkins makes the case against belief in a supernatural creator, examining the classic arguments for God's existence, the evolutionary roots of religion and morality, and the role of faith in society. A provocative, widely debated work on science, reason and religion.",
    reuseChapterIds: ["seed-ch-gd-1", "seed-ch-gd-2"],
    chapters: Array.from({ length: 14 }, (_, i) => ({ title: `Part ${i + 1}`, file: `part${i + 1}.mp3` }))
  },
  {
    slug: "frankenstein",
    title: "Frankenstein",
    author: "Mary Shelley",
    category: "Fiction",
    cover: "Frankestine.jpg",
    description:
      "Mary Shelley's gothic classic about Victor Frankenstein, a young scientist who brings a creature to life and then abandons it. A haunting story about ambition, responsibility, loneliness and what it means to be human.",
    chapters: Array.from({ length: 9 }, (_, i) => ({ title: `Chapter ${i + 1}`, file: `FS/${String(i + 1).padStart(2, "0")}.mp3` }))
  }
];

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function mediaUrl(kind: "audio" | "images", file: string) {
  return `/media/${kind}/${file.split("/").map(encodeURIComponent).join("/")}`;
}

// macOS ships `afinfo`; elsewhere the duration stays 0 and can be filled in by the admin later.
function durationSeconds(path: string) {
  try {
    const out = execFileSync("afinfo", [path], { encoding: "utf8" });
    const match = out.match(/estimated duration:\s*([\d.]+)/);
    return match ? Math.round(Number(match[1])) : 0;
  } catch {
    return 0;
  }
}

async function main() {
  for (const book of books) {
    const coverPath = join(MEDIA_ROOT, "Images", book.cover);
    const cover = existsSync(coverPath)
      ? await prisma.imageAsset.upsert({
          where: { storageKey: `legacy/images/${book.cover}` },
          update: { sourceUrl: mediaUrl("images", book.cover) },
          create: {
            storageKey: `legacy/images/${book.cover}`,
            sourceUrl: mediaUrl("images", book.cover),
            mimeType: "image/jpeg",
            fileSizeBytes: statSync(coverPath).size
          }
        })
      : null;

    const category = await prisma.category.upsert({
      where: { slug: slugify(book.category) },
      update: {},
      create: { name: book.category, slug: slugify(book.category), status: "published" }
    });
    const author = await prisma.author.upsert({
      where: { slug: slugify(book.author) },
      update: {},
      create: { name: book.author, slug: slugify(book.author), status: "published" }
    });
    const narrator = await prisma.narrator.upsert({
      where: { slug: "lisbook-archive" },
      update: {},
      create: { name: "Lisbook Archive", slug: "lisbook-archive", status: "published" }
    });

    const existing = await prisma.audiobook.findUnique({ where: { slug: book.slug } });
    const audiobook = existing
      ? await prisma.audiobook.update({
          where: { id: existing.id },
          data: {
            coverAssetId: cover?.id ?? existing.coverAssetId,
            // Only replace the placeholder copy written by the seed script.
            description: existing.description.includes("seed") ? book.description : existing.description
          }
        })
      : await prisma.audiobook.create({
          data: {
            slug: book.slug,
            title: book.title,
            description: book.description,
            status: "published",
            visibility: "public",
            categoryId: category.id,
            coverAssetId: cover?.id,
            authors: { create: [{ authorId: author.id }] },
            narrators: { create: [{ narratorId: narrator.id }] }
          }
        });

    let total = 0;
    let linked = 0;
    for (const [index, chapter] of book.chapters.entries()) {
      const path = join(MEDIA_ROOT, "audio", chapter.file);
      if (!existsSync(path)) {
        console.warn(`  ! missing ${chapter.file}, skipped`);
        continue;
      }
      const seconds = durationSeconds(path);
      total += seconds;
      const asset = await prisma.audioAsset.upsert({
        where: { storageKey: `legacy/audio/${chapter.file}` },
        update: { sourceUrl: mediaUrl("audio", chapter.file), durationSeconds: seconds },
        create: {
          storageKey: `legacy/audio/${chapter.file}`,
          sourceUrl: mediaUrl("audio", chapter.file),
          mimeType: "audio/mpeg",
          fileSizeBytes: statSync(path).size,
          durationSeconds: seconds
        }
      });

      const id = book.reuseChapterIds?.[index] ?? `legacy-${book.slug}-${index + 1}`;
      const data = {
        title: chapter.title,
        chapterNumber: index + 1,
        sortOrder: index + 1,
        durationSeconds: seconds,
        audioAssetId: asset.id,
        isPreview: index === 0
      };
      await prisma.chapter.upsert({
        where: { id },
        update: data,
        create: { id, audiobookId: audiobook.id, ...data }
      });
      linked++;
    }

    await prisma.audiobook.update({ where: { id: audiobook.id }, data: { totalDurationSeconds: total } });
    console.log(`✓ ${book.title}: ${linked} chapters linked, ${Math.round(total / 60)} min, cover ${cover ? "set" : "missing"}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
