import type {
  AudiobookDetailContract,
  AudiobookListItemContract,
  ChapterContract,
  FaqContract,
  PageContract
} from "@lisbook/types";

export interface AdminUserSeed {
  id: string;
  email: string;
  displayName: string;
  roles: string[];
}

const chapters: ChapterContract[] = [
  {
    id: "ch_gd_1",
    audiobookId: "ab_gd",
    title: "Introduction",
    chapterNumber: 1,
    durationSeconds: 900,
    audioAssetId: "aud_gd_1",
    isPreview: true
  },
  {
    id: "ch_gd_2",
    audiobookId: "ab_gd",
    title: "Track 02",
    chapterNumber: 2,
    durationSeconds: 1800,
    audioAssetId: "aud_gd_2",
    isPreview: false
  },
  {
    id: "ch_pbd_1",
    audiobookId: "ab_pbd",
    title: "You Are Here",
    chapterNumber: 1,
    durationSeconds: 1200,
    audioAssetId: "aud_pbd_1",
    isPreview: true
  }
];

export const seedAudiobooks: AudiobookDetailContract[] = [
  {
    id: "ab_gd",
    slug: "god-delusion",
    title: "God Delusion",
    authorName: "Richard Dawkins",
    narratorName: "Lisbook Archive",
    categoryName: "Philosophy",
    status: "published",
    visibility: "public",
    coverUrl: "/images/gd.jpeg",
    totalDurationSeconds: 2700,
    isFeatured: true,
    description:
      "A Lisbook migration seed based on the legacy catalog, used to stand up the public and admin routes.",
    language: "en",
    chapters: chapters.filter((chapter) => chapter.audiobookId === "ab_gd")
  },
  {
    id: "ab_pbd",
    slug: "pale-blue-dot",
    title: "Pale Blue Dot",
    authorName: "Carl Sagan",
    narratorName: "Lisbook Archive",
    categoryName: "Science",
    status: "published",
    visibility: "public",
    coverUrl: "/images/cs.jpg",
    totalDurationSeconds: 1200,
    isFeatured: true,
    description: "A science-focused seed title mapped from the legacy Lisbook experience.",
    language: "en",
    chapters: chapters.filter((chapter) => chapter.audiobookId === "ab_pbd")
  }
];

export const seedPages: PageContract[] = [
  {
    id: "page_about",
    slug: "about",
    title: "About Lisbook",
    status: "published",
    locale: "en",
    content:
      "Lisbook began as a university audiobook website and is now being rebuilt as a full platform."
  },
  {
    id: "page_contact",
    slug: "contact",
    title: "Contact",
    status: "published",
    locale: "en",
    content: "Reach the Lisbook team for feedback, support, and partnership inquiries."
  }
];

export const seedFaqs: FaqContract[] = [
  {
    id: "faq_1",
    question: "What is Lisbook?",
    answer: "Lisbook is an audiobook listening platform inspired by the original static site.",
    status: "published",
    locale: "en",
    sortOrder: 1
  },
  {
    id: "faq_2",
    question: "Can I listen on mobile later?",
    answer: "Yes. The API and content model are being built to support a future React Native app.",
    status: "published",
    locale: "en",
    sortOrder: 2
  }
];

export const seedUsers: AdminUserSeed[] = [
  {
    id: "user_admin_1",
    email: "admin@lisbook.local",
    displayName: "Lisbook Admin",
    roles: ["super_admin", "editor"]
  }
];

export function listSeedAudiobooks(): AudiobookListItemContract[] {
  return seedAudiobooks.map(({ chapters: _chapters, description: _description, language, ...rest }) => ({
    ...rest,
    categoryName: rest.categoryName,
    narratorName: rest.narratorName,
    totalDurationSeconds: rest.totalDurationSeconds
  }));
}
