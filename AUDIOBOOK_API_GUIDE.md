# Free Audiobook API Integration Guide

This guide explains how to integrate free audiobook APIs into your Lisbook application.

## Overview

The audiobook API integration provides access to thousands of free, public domain audiobooks from multiple sources including:

- **LibriVox**: Volunteer-read public domain books
- **Internet Archive**: Large collection of public domain content
- **Open Library**: Metadata and some audiobook links

## Files Added/Modified

### New Files
- `audiobook-api.js` - Main API service class
- `test-audiobook-api.html` - Test page for API functionality
- `AUDIOBOOK_API_GUIDE.md` - This documentation

### Modified Files
- `explore.html` - Added API service script
- `explore.js` - Integrated API service with existing functionality
- `explore_style.css` - Added styles for new buttons and loading states

## Features

### 1. **Multi-Source API Integration**
- Fetches from LibriVox, Internet Archive, and other sources
- Automatic fallback to local data if APIs fail
- Caching system to reduce API calls

### 2. **Enhanced Search**
- Real-time search with debouncing
- Search across multiple API sources
- Fallback to local search if API fails

### 3. **Audio Player**
- Built-in HTML5 audio player
- Chapter navigation
- Download functionality
- Modal-based player interface

### 4. **Smart Book Cards**
- Different buttons for audiobooks vs regular books
- Play/Download buttons for audiobooks
- Read/Listen buttons for regular books

## API Service Usage

### Basic Usage
```javascript
const apiService = new AudiobookAPIService();

// Fetch audiobooks
const books = await apiService.fetchAudiobooks({ limit: 50 });

// Search audiobooks
const results = await apiService.searchAudiobooks('sherlock holmes', {
    genre: 'Mystery',
    limit: 20
});

// Get specific audiobook
const book = await apiService.getAudiobookById('book_id');
```

### Configuration Options
```javascript
const options = {
    limit: 50,           // Number of books to fetch
    search: 'query',     // Search term
    genre: 'Mystery',    // Filter by genre
    author: 'Doyle'      // Filter by author
};
```

## API Sources

### 1. LibriVox
- **URL**: `https://librivox.org/api/feed/audiobooks`
- **Content**: Public domain books read by volunteers
- **Format**: RSS/JSON feeds
- **Quality**: High-quality volunteer narrations

### 2. Internet Archive
- **URL**: `https://archive.org/advancedsearch.php`
- **Content**: Large collection of public domain content
- **Format**: JSON API
- **Quality**: Various sources, some professional

### 3. Open Library
- **URL**: `https://openlibrary.org`
- **Content**: Metadata and some audiobook links
- **Format**: REST API
- **Quality**: Primarily metadata

## Error Handling

The API service includes comprehensive error handling:

1. **API Failures**: Falls back to local data
2. **Network Issues**: Retries with exponential backoff
3. **Invalid Data**: Filters out malformed entries
4. **Rate Limiting**: Implements caching to reduce API calls

## Caching System

- **Duration**: 30 minutes per cache entry
- **Storage**: In-memory Map
- **Keys**: Based on search parameters
- **Cleanup**: Automatic expiration

## Testing

Use the test page to verify functionality:

1. Open `test-audiobook-api.html` in your browser
2. Check API connection status
3. Test search functionality
4. Verify audiobook playback

## Browser Compatibility

- **Modern Browsers**: Full support
- **Audio**: HTML5 audio element
- **CORS**: Handled with appropriate headers
- **Mobile**: Responsive design

## Performance Considerations

### 1. **Lazy Loading**
- Images load on demand
- Audio files fetched when needed
- Chapter data loaded progressively

### 2. **Debounced Search**
- 500ms delay between keystrokes
- Prevents excessive API calls
- Improves user experience

### 3. **Caching Strategy**
- API responses cached for 30 minutes
- Reduces server load
- Faster subsequent requests

## Security Considerations

### 1. **CORS Handling**
- All API calls respect CORS policies
- Fallback mechanisms for blocked requests
- No sensitive data in client-side code

### 2. **Content Validation**
- All audiobook data validated before display
- Malicious content filtered out
- Safe fallback images for covers

### 3. **Rate Limiting**
- Built-in request throttling
- Respects API rate limits
- Graceful degradation under load

## Future Enhancements

### 1. **Additional Sources**
- Project Gutenberg integration
- HathiTrust API
- Local library systems

### 2. **Advanced Features**
- Offline support with Service Workers
- Progressive Web App capabilities
- Advanced audio controls

### 3. **User Experience**
- Bookmarking system
- Reading progress tracking
- Personalized recommendations

## Troubleshooting

### Common Issues

1. **No Books Loading**
   - Check browser console for errors
   - Verify API endpoints are accessible
   - Check CORS settings

2. **Audio Not Playing**
   - Verify audio file URLs are valid
   - Check browser audio codec support
   - Ensure proper CORS headers

3. **Search Not Working**
   - Check API service initialization
   - Verify search parameters
   - Check network connectivity

### Debug Mode

Enable debug logging:
```javascript
// Add to console for detailed logging
localStorage.setItem('debug', 'audiobook-api');
```

## Contributing

To add new audiobook sources:

1. Add source configuration to `baseUrls`
2. Implement fetch method (e.g., `fetchFromNewSource`)
3. Add result processing method
4. Update error handling
5. Add tests

## License

This integration uses public domain content and respects all source licenses. All audiobooks are legally free to use and distribute.

## Support

For issues or questions:
1. Check the browser console for errors
2. Test with the provided test page
3. Verify API endpoints are accessible
4. Check network connectivity

---

**Note**: This integration provides access to free, public domain audiobooks. All content is legally available for use and distribution.
