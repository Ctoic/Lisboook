// Placeholder titles shown on the homepage while they are still being produced.
// Clicking any of them tells the listener the book is coming soon.

export type UpcomingStatus = "In the studio" | "Being narrated" | "Final edit";

export interface UpcomingBook {
  slug: string;
  title: string;
  author: string;
  genre: UpcomingGenre;
  length: string;
  status: UpcomingStatus;
}

export const upcomingGenres = ["Classics", "Adventure", "Mystery", "Science & Ideas", "Poetry & Myth"] as const;
export type UpcomingGenre = (typeof upcomingGenres)[number];

export const upcomingBooks: UpcomingBook[] = [
  { slug: "pride-and-prejudice", title: "Pride and Prejudice", author: "Jane Austen", genre: "Classics", length: "11h 35m", status: "Being narrated" },
  { slug: "jane-eyre", title: "Jane Eyre", author: "Charlotte Brontë", genre: "Classics", length: "18h 50m", status: "In the studio" },
  { slug: "great-expectations", title: "Great Expectations", author: "Charles Dickens", genre: "Classics", length: "17h 10m", status: "Final edit" },
  { slug: "middlemarch", title: "Middlemarch", author: "George Eliot", genre: "Classics", length: "31h 20m", status: "In the studio" },
  { slug: "wuthering-heights", title: "Wuthering Heights", author: "Emily Brontë", genre: "Classics", length: "12h 05m", status: "Being narrated" },

  { slug: "treasure-island", title: "Treasure Island", author: "R. L. Stevenson", genre: "Adventure", length: "6h 50m", status: "Final edit" },
  { slug: "twenty-thousand-leagues", title: "Twenty Thousand Leagues Under the Seas", author: "Jules Verne", genre: "Adventure", length: "12h 30m", status: "Being narrated" },
  { slug: "the-call-of-the-wild", title: "The Call of the Wild", author: "Jack London", genre: "Adventure", length: "3h 10m", status: "In the studio" },
  { slug: "around-the-world-80-days", title: "Around the World in Eighty Days", author: "Jules Verne", genre: "Adventure", length: "6h 40m", status: "Final edit" },
  { slug: "the-count-of-monte-cristo", title: "The Count of Monte Cristo", author: "Alexandre Dumas", genre: "Adventure", length: "47h 15m", status: "In the studio" },

  { slug: "the-hound-of-the-baskervilles", title: "The Hound of the Baskervilles", author: "Arthur Conan Doyle", genre: "Mystery", length: "6h 15m", status: "Being narrated" },
  { slug: "the-moonstone", title: "The Moonstone", author: "Wilkie Collins", genre: "Mystery", length: "19h 40m", status: "In the studio" },
  { slug: "the-mysterious-affair-at-styles", title: "The Mysterious Affair at Styles", author: "Agatha Christie", genre: "Mystery", length: "7h 00m", status: "Final edit" },
  { slug: "the-woman-in-white", title: "The Woman in White", author: "Wilkie Collins", genre: "Mystery", length: "24h 35m", status: "Being narrated" },

  { slug: "on-the-origin-of-species", title: "On the Origin of Species", author: "Charles Darwin", genre: "Science & Ideas", length: "17h 45m", status: "In the studio" },
  { slug: "meditations", title: "Meditations", author: "Marcus Aurelius", genre: "Science & Ideas", length: "4h 50m", status: "Final edit" },
  { slug: "the-art-of-war", title: "The Art of War", author: "Sun Tzu", genre: "Science & Ideas", length: "1h 20m", status: "Being narrated" },
  { slug: "relativity", title: "Relativity: The Special and General Theory", author: "Albert Einstein", genre: "Science & Ideas", length: "4h 10m", status: "In the studio" },

  { slug: "the-odyssey", title: "The Odyssey", author: "Homer", genre: "Poetry & Myth", length: "11h 55m", status: "Being narrated" },
  { slug: "leaves-of-grass", title: "Leaves of Grass", author: "Walt Whitman", genre: "Poetry & Myth", length: "14h 20m", status: "In the studio" },
  { slug: "the-divine-comedy", title: "The Divine Comedy", author: "Dante Alighieri", genre: "Poetry & Myth", length: "14h 05m", status: "Final edit" },
  { slug: "the-prophet", title: "The Prophet", author: "Kahlil Gibran", genre: "Poetry & Myth", length: "1h 35m", status: "Being narrated" }
];
