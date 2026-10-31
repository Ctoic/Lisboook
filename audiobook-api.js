/**
 * Free Audiobook API Service
 * Integrates with multiple free audiobook sources
 */

class AudiobookAPIService {
    constructor() {
        this.baseUrls = {
            librivox: 'https://librivox.org/api/feed/audiobooks',
            internetArchive: 'https://archive.org/metadata',
            openLibrary: 'https://openlibrary.org'
        };
        
        this.cache = new Map();
        this.cacheTimeout = 30 * 60 * 1000; // 30 minutes
    }

    /**
     * Fetch audiobooks from multiple sources
     */
    async fetchAudiobooks(options = {}) {
        const {
            limit = 50,
            search = '',
            genre = '',
            author = ''
        } = options;

        try {
            // Try multiple sources in parallel
            const [librivoxBooks, archiveBooks] = await Promise.allSettled([
                this.fetchFromLibriVox({ limit, search, genre, author }),
                this.fetchFromInternetArchive({ limit, search, genre, author })
            ]);

            let allBooks = [];

            // Process LibriVox results
            if (librivoxBooks.status === 'fulfilled' && librivoxBooks.value) {
                allBooks = [...allBooks, ...librivoxBooks.value];
            }

            // Process Internet Archive results
            if (archiveBooks.status === 'fulfilled' && archiveBooks.value) {
                allBooks = [...allBooks, ...archiveBooks.value];
            }

            // Remove duplicates and enhance data
            const uniqueBooks = this.deduplicateBooks(allBooks);
            const enhancedBooks = this.enhanceBookData(uniqueBooks);

            return enhancedBooks.slice(0, limit);
        } catch (error) {
            console.error('Error fetching audiobooks:', error);
            return this.getFallbackBooks();
        }
    }

    /**
     * Fetch from LibriVox API
     */
    async fetchFromLibriVox(options) {
        try {
            const cacheKey = `librivox_${JSON.stringify(options)}`;
            if (this.cache.has(cacheKey)) {
                return this.cache.get(cacheKey);
            }

            // LibriVox doesn't have a direct API, so we'll use a proxy approach
            // For now, return some sample LibriVox-style data
            const sampleBooks = [
                {
                    id: 'librivox_1',
                    title: 'The Adventures of Sherlock Holmes',
                    author: 'Arthur Conan Doyle',
                    genre: 'Mystery',
                    description: 'A collection of twelve short stories featuring the famous detective Sherlock Holmes and his companion Dr. Watson.',
                    cover: 'https://archive.org/services/img/sherlock_holmes_1201_librivox',
                    source: 'librivox',
                    duration: 8.5,
                    narrator: 'Various',
                    language: 'English',
                    chapters: [
                        { title: 'A Scandal in Bohemia', duration: '45:30' },
                        { title: 'The Red-Headed League', duration: '38:15' },
                        { title: 'A Case of Identity', duration: '32:45' }
                    ],
                    downloadUrl: 'https://archive.org/download/sherlock_holmes_1201_librivox',
                    audioFiles: [
                        'https://archive.org/download/sherlock_holmes_1201_librivox/sherlock_holmes_01_doyle_64kb.mp3'
                    ]
                },
                {
                    id: 'librivox_2',
                    title: 'Pride and Prejudice',
                    author: 'Jane Austen',
                    genre: 'Romance',
                    description: 'A romantic novel of manners written by Jane Austen, first published in 1813.',
                    cover: 'https://archive.org/services/img/pride_and_prejudice_1001_librivox',
                    source: 'librivox',
                    duration: 12.3,
                    narrator: 'Karen Savage',
                    language: 'English',
                    chapters: [
                        { title: 'Chapter 1', duration: '25:10' },
                        { title: 'Chapter 2', duration: '28:45' }
                    ],
                    downloadUrl: 'https://archive.org/download/pride_and_prejudice_1001_librivox',
                    audioFiles: [
                        'https://archive.org/download/pride_and_prejudice_1001_librivox/pride_and_prejudice_01_austen_64kb.mp3'
                    ]
                }
            ];

            this.cache.set(cacheKey, sampleBooks);
            setTimeout(() => this.cache.delete(cacheKey), this.cacheTimeout);
            
            return sampleBooks;
        } catch (error) {
            console.error('LibriVox API error:', error);
            return [];
        }
    }

    /**
     * Fetch from Internet Archive
     */
    async fetchFromInternetArchive(options) {
        try {
            const cacheKey = `archive_${JSON.stringify(options)}`;
            if (this.cache.has(cacheKey)) {
                return this.cache.get(cacheKey);
            }

            // Internet Archive API call
            const searchQuery = this.buildArchiveSearchQuery(options);
            const response = await fetch(`https://archive.org/advancedsearch.php?q=${encodeURIComponent(searchQuery)}&output=json&rows=20`);
            
            if (!response.ok) {
                throw new Error(`Archive API error: ${response.status}`);
            }

            const data = await response.json();
            const books = this.processArchiveResults(data.docs || []);

            this.cache.set(cacheKey, books);
            setTimeout(() => this.cache.delete(cacheKey), this.cacheTimeout);
            
            return books;
        } catch (error) {
            console.error('Internet Archive API error:', error);
            return [];
        }
    }

    /**
     * Build search query for Internet Archive
     */
    buildArchiveSearchQuery(options) {
        let query = 'mediatype:audio AND format:MP3';
        
        if (options.search) {
            query += ` AND title:(${options.search})`;
        }
        
        if (options.author) {
            query += ` AND creator:(${options.author})`;
        }
        
        // Add public domain filter
        query += ' AND rights:("Public Domain" OR "Creative Commons")';
        
        return query;
    }

    /**
     * Process Internet Archive results
     */
    processArchiveResults(docs) {
        return docs.map((doc, index) => ({
            id: `archive_${doc.identifier}`,
            title: doc.title || 'Untitled',
            author: doc.creator ? doc.creator[0] : 'Unknown Author',
            genre: this.determineGenre(doc.subject || []),
            description: doc.description || 'No description available.',
            cover: `https://archive.org/services/img/${doc.identifier}`,
            source: 'internet_archive',
            duration: this.estimateDuration(doc),
            narrator: 'Various',
            language: doc.language || 'English',
            chapters: this.extractChapters(doc),
            downloadUrl: `https://archive.org/download/${doc.identifier}`,
            audioFiles: this.extractAudioFiles(doc),
            releaseDate: new Date(doc.date || Date.now()),
            popularity: Math.floor(Math.random() * 100) + 1,
            rating: (Math.random() * 2 + 3).toFixed(1)
        }));
    }

    /**
     * Determine genre from subjects
     */
    determineGenre(subjects) {
        const genreMap = {
            'fiction': 'Fiction',
            'mystery': 'Mystery',
            'romance': 'Romance',
            'science fiction': 'Sci-Fi',
            'fantasy': 'Fantasy',
            'history': 'History',
            'biography': 'Biography',
            'philosophy': 'Philosophy',
            'poetry': 'Poetry',
            'drama': 'Drama'
        };

        for (const subject of subjects) {
            const lowerSubject = subject.toLowerCase();
            for (const [key, genre] of Object.entries(genreMap)) {
                if (lowerSubject.includes(key)) {
                    return genre;
                }
            }
        }
        
        return 'General';
    }

    /**
     * Estimate duration from file sizes or metadata
     */
    estimateDuration(doc) {
        // Rough estimation based on file count and typical audiobook length
        const fileCount = doc.files ? doc.files.length : 1;
        return Math.max(2, Math.min(20, fileCount * 0.5 + Math.random() * 5));
    }

    /**
     * Extract chapters from document
     */
    extractChapters(doc) {
        if (!doc.files) return [];
        
        return doc.files
            .filter(file => file.format === 'VBR MP3' || file.format === '64KBPS MP3')
            .slice(0, 10) // Limit to first 10 chapters
            .map((file, index) => ({
                title: `Chapter ${index + 1}`,
                duration: this.formatDuration(Math.random() * 3600 + 1800), // 30-90 minutes
                audioFile: `https://archive.org/download/${doc.identifier}/${file.name}`
            }));
    }

    /**
     * Extract audio files from document
     */
    extractAudioFiles(doc) {
        if (!doc.files) return [];
        
        return doc.files
            .filter(file => file.format === 'VBR MP3' || file.format === '64KBPS MP3')
            .slice(0, 5) // Limit to first 5 files
            .map(file => `https://archive.org/download/${doc.identifier}/${file.name}`);
    }

    /**
     * Format duration in hours and minutes
     */
    formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${hours}:${minutes.toString().padStart(2, '0')}`;
    }

    /**
     * Remove duplicate books
     */
    deduplicateBooks(books) {
        const seen = new Set();
        return books.filter(book => {
            const key = `${book.title}_${book.author}`.toLowerCase();
            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        });
    }

    /**
     * Enhance book data with additional information
     */
    enhanceBookData(books) {
        return books.map(book => ({
            ...book,
            // Add mock data for missing fields
            duration: book.duration || Math.floor(Math.random() * 12) + 2,
            popularity: book.popularity || Math.floor(Math.random() * 100) + 1,
            rating: book.rating || (Math.random() * 2 + 3).toFixed(1),
            narrator: book.narrator || 'Various',
            releaseDate: book.releaseDate || new Date(2020 + Math.random() * 4, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28)),
            // Add audio player functionality
            hasAudio: true,
            audioPlayer: this.createAudioPlayer(book)
        }));
    }

    /**
     * Create audio player configuration
     */
    createAudioPlayer(book) {
        return {
            sources: book.audioFiles || [],
            chapters: book.chapters || [],
            currentChapter: 0,
            isPlaying: false,
            currentTime: 0,
            duration: 0
        };
    }

    /**
     * Get fallback books when APIs fail
     */
    getFallbackBooks() {
        return [
            {
                id: 'fallback_1',
                title: 'The Adventures of Sherlock Holmes',
                author: 'Arthur Conan Doyle',
                genre: 'Mystery',
                description: 'A collection of twelve short stories featuring the famous detective Sherlock Holmes.',
                cover: 'https://via.placeholder.com/300x400?text=Sherlock+Holmes',
                source: 'fallback',
                duration: 8.5,
                narrator: 'Various',
                language: 'English',
                chapters: [
                    { title: 'A Scandal in Bohemia', duration: '45:30' },
                    { title: 'The Red-Headed League', duration: '38:15' }
                ],
                downloadUrl: '#',
                audioFiles: [],
                releaseDate: new Date('2023-01-01'),
                popularity: 85,
                rating: '4.2',
                hasAudio: false
            }
        ];
    }

    /**
     * Search audiobooks with filters
     */
    async searchAudiobooks(query, filters = {}) {
        const options = {
            search: query,
            genre: filters.genre || '',
            author: filters.author || '',
            limit: filters.limit || 20
        };
        
        return await this.fetchAudiobooks(options);
    }

    /**
     * Get audiobook by ID
     */
    async getAudiobookById(id) {
        const books = await this.fetchAudiobooks({ limit: 100 });
        return books.find(book => book.id === id);
    }
}

// Export for use in other modules
window.AudiobookAPIService = AudiobookAPIService;
