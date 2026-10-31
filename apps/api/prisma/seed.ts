import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/common/auth/password";

const prisma = new PrismaClient();

async function main() {
  const listenerRole = await prisma.role.upsert({
    where: { name: "listener" },
    update: {},
    create: {
      name: "listener",
      description: "Public listener access"
    }
  });

  const editorRole = await prisma.role.upsert({
    where: { name: "editor" },
    update: {},
    create: {
      name: "editor",
      description: "Content management access"
    }
  });

  const superAdminRole = await prisma.role.upsert({
    where: { name: "super_admin" },
    update: {},
    create: {
      name: "super_admin",
      description: "Full administrative access"
    }
  });

  const philosophy = await prisma.category.upsert({
    where: { slug: "philosophy" },
    update: {},
    create: {
      name: "Philosophy",
      slug: "philosophy",
      status: "published"
    }
  });

  const science = await prisma.category.upsert({
    where: { slug: "science" },
    update: {},
    create: {
      name: "Science",
      slug: "science",
      status: "published"
    }
  });

  const dawkins = await prisma.author.upsert({
    where: { slug: "richard-dawkins" },
    update: {},
    create: {
      name: "Richard Dawkins",
      slug: "richard-dawkins",
      status: "published"
    }
  });

  const sagan = await prisma.author.upsert({
    where: { slug: "carl-sagan" },
    update: {},
    create: {
      name: "Carl Sagan",
      slug: "carl-sagan",
      status: "published"
    }
  });

  const narrator = await prisma.narrator.upsert({
    where: { slug: "lisbook-archive" },
    update: {},
    create: {
      name: "Lisbook Archive",
      slug: "lisbook-archive",
      status: "published"
    }
  });

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@lisbook.local" },
    update: {
      displayName: "Lisbook Admin"
    },
    create: {
      email: "admin@lisbook.local",
      displayName: "Lisbook Admin",
      // Local development login only: admin@lisbook.local / password123.
      passwordHash: await hashPassword("password123")
    }
  });

  for (const role of [listenerRole, editorRole, superAdminRole]) {
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: adminUser.id,
          roleId: role.id
        }
      },
      update: {},
      create: {
        userId: adminUser.id,
        roleId: role.id
      }
    });
  }

  const godDelusion = await prisma.audiobook.upsert({
    where: { slug: "god-delusion" },
    update: {},
    create: {
      slug: "god-delusion",
      title: "God Delusion",
      description:
        "A Lisbook migration seed based on the legacy catalog, used to stand up the public and admin routes.",
      language: "en",
      status: "published",
      visibility: "public",
      isFeatured: true,
      categoryId: philosophy.id,
      totalDurationSeconds: 2700,
      createdById: adminUser.id,
      updatedById: adminUser.id,
      authors: {
        create: [{ authorId: dawkins.id }]
      },
      narrators: {
        create: [{ narratorId: narrator.id }]
      }
    }
  });

  const paleBlueDot = await prisma.audiobook.upsert({
    where: { slug: "pale-blue-dot" },
    update: {},
    create: {
      slug: "pale-blue-dot",
      title: "Pale Blue Dot",
      description: "A science-focused seed title mapped from the legacy Lisbook experience.",
      language: "en",
      status: "published",
      visibility: "public",
      isFeatured: true,
      categoryId: science.id,
      totalDurationSeconds: 1200,
      createdById: adminUser.id,
      updatedById: adminUser.id,
      authors: {
        create: [{ authorId: sagan.id }]
      },
      narrators: {
        create: [{ narratorId: narrator.id }]
      }
    }
  });

  await prisma.chapter.upsert({
    where: { id: "seed-ch-gd-1" },
    update: {},
    create: {
      id: "seed-ch-gd-1",
      audiobookId: godDelusion.id,
      title: "Introduction",
      chapterNumber: 1,
      durationSeconds: 900,
      isPreview: true,
      sortOrder: 1
    }
  });

  await prisma.chapter.upsert({
    where: { id: "seed-ch-gd-2" },
    update: {},
    create: {
      id: "seed-ch-gd-2",
      audiobookId: godDelusion.id,
      title: "Track 02",
      chapterNumber: 2,
      durationSeconds: 1800,
      isPreview: false,
      sortOrder: 2
    }
  });

  await prisma.chapter.upsert({
    where: { id: "seed-ch-pbd-1" },
    update: {},
    create: {
      id: "seed-ch-pbd-1",
      audiobookId: paleBlueDot.id,
      title: "You Are Here",
      chapterNumber: 1,
      durationSeconds: 1200,
      isPreview: true,
      sortOrder: 1
    }
  });

  await prisma.page.upsert({
    where: { slug: "about" },
    update: {},
    create: {
      slug: "about",
      title: "About Lisbook",
      status: "published",
      locale: "en",
      contentJson:
        "Lisbook began as a university audiobook website and is now being rebuilt as a full platform."
    }
  });

  await prisma.page.upsert({
    where: { slug: "contact" },
    update: {},
    create: {
      slug: "contact",
      title: "Contact",
      status: "published",
      locale: "en",
      contentJson: "Reach the Lisbook team for feedback, support, and partnership inquiries."
    }
  });

  await prisma.faq.upsert({
    where: { id: "seed-faq-1" },
    update: {},
    create: {
      id: "seed-faq-1",
      question: "What is Lisbook?",
      answer: "Lisbook is an audiobook listening platform inspired by the original static site.",
      status: "published",
      locale: "en",
      sortOrder: 1
    }
  });

  await prisma.faq.upsert({
    where: { id: "seed-faq-2" },
    update: {},
    create: {
      id: "seed-faq-2",
      question: "Can I listen on mobile later?",
      answer: "Yes. The API and content model are being built to support a future React Native app.",
      status: "published",
      locale: "en",
      sortOrder: 2
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
