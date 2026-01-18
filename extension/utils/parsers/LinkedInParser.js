/**
 * LinkedIn Parser
 * Extracts saved posts from LinkedIn Saved Posts page with rich metadata
 * 
 * @fileoverview Parser class for extracting LinkedIn saved posts with enhanced metadata
 * @version 1.0.0
 */

/**
 * LinkedInParser class for extracting saved posts from LinkedIn
 */
class LinkedInParser {
  /**
   * Creates a new LinkedInParser instance
   */
  constructor() {
    // Ensure sanitizeLinkedInUrl is available
    if (typeof window === 'undefined' || !window.sanitizeLinkedInUrl) {
      console.error('[SmarTrack] sanitizeLinkedInUrl not available. Make sure urlSanitizer.js is loaded first.');
    }
  }

  /**
   * Helper to find the best image in a list item using specific DOM selectors
   * Targets the user's specific HTML structure for reliable image extraction
   * @param {HTMLElement} item - The list item element
   * @returns {string|null} Image URL or null
   */
  findBestImage(item) {
    // Priority 1: The 'Content' Image (The specific class found in user's HTML)
    const contentImg = item.querySelector('img.entity-result__embedded-object-image');
    if (contentImg && contentImg.src && !contentImg.src.includes('data:image/gif')) {
      console.log('[SRT] Image Scanner result: Found (content image)', contentImg.src);
      return contentImg.src;
    }

    // Priority 2: Any image in the 'right side' content container
    // (Excludes the profile pic on the left)
    const rightContainer = item.querySelector('.entity-result__content-inner-container--right-padding');
    if (rightContainer) {
      const anyRightImg = rightContainer.querySelector('img');
      if (anyRightImg && anyRightImg.src && !anyRightImg.src.includes('data:image/gif')) {
        console.log('[SRT] Image Scanner result: Found (right container)', anyRightImg.src);
        return anyRightImg.src;
      }
    }

    // Priority 3: Fallback to Profile Picture (class 'presence-entity__image')
    const profileImg = item.querySelector('img.presence-entity__image');
    if (profileImg && profileImg.src && !profileImg.src.includes('data:image/gif')) {
      console.log('[SRT] Image Scanner result: Found (profile pic fallback)', profileImg.src);
      return profileImg.src;
    }

    console.log('[SRT] Image Scanner result: Missed');
    return null;
  }

  /**
   * Extracts saved items from the LinkedIn Saved Posts page
   * Uses "Inside-Out" strategy to bypass randomized top-level classes
   * @returns {Array<Object>} Array of extracted post objects
   */
  getSavedItems() {
    const validLinks = [];
    
    // STRATEGY: Find the stable content container, then find its parent LI
    // This bypasses the randomized class names on the LI elements
    const contentContainers = Array.from(document.querySelectorAll('.entity-result__content-container'));
    const items = contentContainers.map(container => container.closest('li')).filter(li => li);
    
    console.log(`[SRT] Found ${items.length} items using Inside-Out strategy`);

    items.forEach((item, index) => {
      try {
        // 1. URL Extraction (Remove class dependency)
        // Look for ANY anchor tag that points to a post or update
        const anchor = item.querySelector('a[href*="/feed/update/"], a[href*="/posts/"], a[href*="linkedin.com/pulse/"]');
        
        let url = anchor ? anchor.href : null;
        
        // Debugging: Log why we might skip this item
        if (!url) {
          console.warn(`[SRT] Item ${index} skipped: No post URL found in item`, item);
          return; // Continue to next item
        }

        // 2. Image Extraction (Use the specific classes from the user's HTML dump)
        let thumbnail = null;
        const embeddedImg = item.querySelector('.entity-result__embedded-object-image, .ivm-view-attr__img--centered');
        if (embeddedImg && embeddedImg.src && !embeddedImg.src.includes('data:image/gif')) {
          thumbnail = embeddedImg.src;
        }
        
        // Fallback to profile pic if main image missing
        if (!thumbnail) {
          const profileImg = item.querySelector('.presence-entity__image');
          if (profileImg && profileImg.src && !profileImg.src.includes('data:image/gif')) {
            thumbnail = profileImg.src;
          }
        }

        // Fix Image Validation: Ensure thumbnail is a valid absolute URL
        if (thumbnail && !thumbnail.startsWith('http')) {
          thumbnail = null; // Prevent chrome-extension://invalid errors
        }

        // 3. Title & Description Extraction
        // Strategy A: Look for the specific Actor container first (Most reliable)
        const actorNode = item.querySelector('.entity-result__content-actor .app-aware-link span[aria-hidden="true"]');
        
        // Strategy B: Look for the first link text in the title container
        const titleNode = item.querySelector('.entity-result__title-text .app-aware-link span[aria-hidden="true"]');
        
        // Strategy C: Fallback to the raw link text
        const rawLink = item.querySelector('.app-aware-link');
        
        let author = 'LinkedIn User';
        if (actorNode) {
          author = actorNode.innerText.trim();
        } else if (titleNode) {
          author = titleNode.innerText.trim();
        } else if (rawLink) {
          author = rawLink.innerText.trim();
        }
        
        // Use the 'summary' class which contains the post text
        const summaryEl = item.querySelector('.entity-result__content-summary');
        const rawDescription = summaryEl ? summaryEl.innerText.trim() : '';
        
        // Clean up the description (remove "see more", newlines)
        const cleanDescription = rawDescription.replace(/\n+/g, ' ').replace('…see more', '').replace('… see more', '').trim();
        const snippet = cleanDescription.substring(0, 60);
        
        const title = cleanDescription ? `${author}: ${snippet}${snippet.length >= 60 ? '...' : ''}` : `${author} (Saved Post)`;
        
        // 4. Sanitize and validate URL
        try {
          // Sanitize URL using the sanitizer if available
          const cleanUrl = window.sanitizeLinkedInUrl ? window.sanitizeLinkedInUrl(url) : null;
          if (cleanUrl) {
            validLinks.push({
              title,
              url: cleanUrl,
              description: cleanDescription,
              thumbnail,
              category: 'LinkedIn Saved Posts',
              source: 'linkedin',
              contentType: 'post'
            });
            
            console.log(`[SRT] Extracted item ${index}:`, {
              title: title.substring(0, 60),
              hasDescription: cleanDescription.length > 0,
              hasThumbnail: !!thumbnail
            });
          } else {
            console.warn(`[SRT] Item ${index}: URL sanitization failed`, url);
          }
        } catch (e) {
          console.warn(`[SRT] Item ${index}: URL processing error`, e);
        }
      } catch (e) {
        console.error(`[SRT] Item ${index} parse error`, e);
      }
    });

    // Add verbose logging before returning
    console.log('[SRT] Parsing Report:', { 
      foundItems: items.length, 
      validLinks: validLinks.length 
    });

    return validLinks;
  }

  /**
   * Extracts data from a single list item
   * @param {HTMLElement} item - The list item element
   * @param {number} index - Index of the item (for logging)
   * @returns {Object|null} Extracted post data or null if invalid
   */
  extractItemData(item, index) {
    // 5. URL Extraction
    const anchor = this.findPostAnchor(item);
    if (!anchor || !anchor.href) {
      return null;
    }

    let url = anchor.href;
    
    // Validate URL contains LinkedIn post paths
    if (!url.includes('/posts/') && !url.includes('/feed/update/')) {
      return null;
    }

    // Sanitize URL
    const cleanUrl = window.sanitizeLinkedInUrl ? window.sanitizeLinkedInUrl(url) : null;
    if (!cleanUrl) {
      console.debug(`[SmarTrack] Item ${index}: URL sanitization failed`);
      return null;
    }

    // Extract all text content first for better analysis
    const allText = item.innerText || item.textContent || '';
    
    // 4. Enhanced Title Construction
    const authorName = this.extractAuthorName(item, anchor);
    let description = this.extractDescription(item);
    
    // If description is still empty, try extracting from all text
    if (!description || description.length < 20) {
      description = this.extractDescriptionFromText(allText);
    }
    
    const postSnippet = description ? description.substring(0, 50).trim() : '';
    const title = this.constructTitle(authorName, postSnippet, description, allText);

    // 2. Enhanced Image Extraction using Regex Scanner approach
    const thumbnail = this.findBestImage(item);
    console.log('[SRT] Image Scanner result:', thumbnail ? 'Found' : 'Missed', thumbnail);

    // Return object with required structure
    return {
      title: title,
      url: cleanUrl,
      description: description || '',
      thumbnail: thumbnail,
      category: 'LinkedIn Saved Posts',
      source: 'linkedin',
      contentType: 'post'
    };
  }

  /**
   * Finds the post anchor element
   * @param {HTMLElement} item - The list item element
   * @returns {HTMLElement|null} Anchor element or null
   */
  findPostAnchor(item) {
    // Try app-aware-link first
    let anchor = item.querySelector('a.app-aware-link[href*="/posts/"], a.app-aware-link[href*="/feed/update/"]');
    
    if (!anchor) {
      // Try any anchor with /posts/ or /feed/update/
      const anchors = item.querySelectorAll('a[href*="/posts/"], a[href*="/feed/update/"]');
      anchor = anchors[0] || null;
    }

    return anchor;
  }

  /**
   * Extracts author name from the item
   * @param {HTMLElement} item - The list item element
   * @param {HTMLElement} anchor - The primary anchor element
   * @returns {string} Author name or empty string
   */
  extractAuthorName(item, anchor) {
    // Try multiple selectors for author name
    const selectors = [
      '.entity-result__title-text',
      '.entity-result__title',
      'span[aria-hidden="true"]',
      '.app-aware-link span',
      'a.app-aware-link span',
      '[data-test-id="entity-result-title"]',
      'h3',
      'h4'
    ];

    for (const selector of selectors) {
      let authorEl = item.querySelector(selector);
      if (!authorEl && anchor) {
        authorEl = anchor.querySelector(selector);
      }
      
      if (authorEl) {
        const text = authorEl.innerText.trim() || authorEl.textContent.trim();
        if (text && text.length > 0 && text.length < 100) {
          // Clean up text - remove extra whitespace and newlines
          const cleaned = text.replace(/\s+/g, ' ').trim();
          return cleaned.substring(0, 50);
        }
      }
    }

    // Fallback: get text from primary anchor or any link
    if (anchor) {
      const anchorText = anchor.innerText.trim() || anchor.textContent.trim();
      if (anchorText) {
        // Take first meaningful line (skip empty lines)
        const lines = anchorText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        if (lines.length > 0) {
          // First line is usually author name
          return lines[0].substring(0, 50);
        }
      }
    }

    // Last resort: try to find any text node that looks like a name
    const allText = item.innerText || item.textContent || '';
    const lines = allText.split('\n').map(l => l.trim()).filter(l => l.length > 0 && l.length < 100);
    if (lines.length > 0) {
      return lines[0].substring(0, 50);
    }

    return '';
  }

  /**
   * Extracts description/post body from the item
   * @param {HTMLElement} item - The list item element
   * @returns {string} Full description text or empty string
   */
  extractDescription(item) {
    // Priority: Try .entity-result__content-summary first (capture full text)
    const contentSummary = item.querySelector('.entity-result__content-summary');
    if (contentSummary) {
      const text = contentSummary.innerText.trim() || contentSummary.textContent.trim();
      if (text && text.length > 20) {
        // Clean up text but preserve full content
        const cleaned = text.replace(/\s+/g, ' ').trim();
        // Skip if it looks like just metadata
        if (!cleaned.match(/^(View|followers|mo|ago|•)/i)) {
          return cleaned;
        }
      }
    }

    // Fallback: Try other selectors for description
    const selectors = [
      '.entity-result__summary',
      '.feed-shared-text',
      '.entity-result__primary-subtitle',
      '.entity-result__summary-text',
      '[class*="summary"]',
      '[class*="content"]',
      '[class*="description"]',
      '[class*="text"]',
      'p',
      '.break-words',
      '[data-test-id="entity-result-summary"]'
    ];

    for (const selector of selectors) {
      const descEl = item.querySelector(selector);
      if (descEl) {
        const text = descEl.innerText.trim() || descEl.textContent.trim();
        // Only use if it's substantial (more than 20 chars) and not just author info
        if (text && text.length > 20) {
          // Clean up text
          const cleaned = text.replace(/\s+/g, ' ').trim();
          // Skip if it looks like just metadata (e.g., "View company", "followers", etc.)
          if (!cleaned.match(/^(View|followers|mo|ago|•)/i)) {
            return cleaned;
          }
        }
      }
    }

    // Fallback: extract all text and find the longest paragraph-like section
    const allText = item.innerText || item.textContent || '';
    if (allText) {
      const lines = allText.split('\n')
        .map(l => l.trim())
        .filter(l => l.length > 30 && l.length < 500); // Filter for substantial text blocks
      
      if (lines.length > 0) {
        // Find the longest line that doesn't look like metadata
        const substantialLines = lines.filter(l => 
          !l.match(/^(View|followers|mo|ago|•|LinkedIn)/i) &&
          !l.includes('View company') &&
          !l.includes('followers')
        );
        
        if (substantialLines.length > 0) {
          // Return the longest substantial line
          return substantialLines.reduce((a, b) => a.length > b.length ? a : b);
        }
        
        // If no substantial lines, return first long line
        return lines[0];
      }
    }

    return '';
  }

  /**
   * Extracts description from raw text content
   * @param {string} allText - All text content from the item
   * @returns {string} Extracted description or empty string
   */
  extractDescriptionFromText(allText) {
    if (!allText) return '';
    
    const lines = allText.split('\n')
      .map(l => l.trim())
      .filter(l => {
        // Filter out metadata lines
        const lower = l.toLowerCase();
        return l.length > 30 && 
               l.length < 500 &&
               !lower.match(/^(view|followers|mo|ago|•|linkedin|save|share|comment|like)/i) &&
               !lower.includes('view company') &&
               !lower.includes('followers') &&
               !lower.includes('connections') &&
               !lower.match(/^\d+\s*(mo|yr|day|week)/i); // Skip time stamps
      });
    
    if (lines.length > 0) {
      // Return the longest line that looks like content
      const contentLines = lines.filter(l => 
        !l.match(/^[A-Z][a-z]+\s+[A-Z]/) || // Skip "FirstName LastName" patterns
        l.length > 50 // But keep if it's long enough
      );
      
      if (contentLines.length > 0) {
        return contentLines.reduce((a, b) => a.length > b.length ? a : b);
      }
      
      return lines[0];
    }
    
    return '';
  }

  /**
   * Constructs the title from author name and post snippet
   * @param {string} authorName - Author name
   * @param {string} postSnippet - First 60 chars of description
   * @param {string} description - Full description
   * @param {string} allText - All text from item (for fallback)
   * @returns {string} Constructed title
   */
  constructTitle(authorName, postSnippet, description, allText = '') {
    // If we have both author and description snippet, use that format
    if (authorName && description && postSnippet) {
      // Clean snippet - remove extra whitespace
      const cleanSnippet = postSnippet.replace(/\s+/g, ' ').trim();
      // Add ellipsis if snippet was truncated (first 50 chars)
      const snippet = cleanSnippet.length >= 50 ? cleanSnippet.substring(0, 47) + '...' : cleanSnippet;
      return `${authorName}: ${snippet}`;
    }

    // If we have author but no description, try to get something from allText
    if (authorName) {
      // Even without description, try to make it more informative
      if (postSnippet && postSnippet.length > 10) {
        return `${authorName}: ${postSnippet}`;
      }
      
      // Try to extract a snippet from allText
      if (allText) {
        const fallbackSnippet = this.extractDescriptionFromText(allText);
        if (fallbackSnippet && fallbackSnippet.length > 20) {
          const snippet = fallbackSnippet.substring(0, 50).trim();
          return `${authorName}: ${snippet}${snippet.length >= 50 ? '...' : ''}`;
        }
      }
      
      return `${authorName}: LinkedIn Post`;
    }

    // Last resort: try to extract any meaningful text from allText
    if (allText) {
      const fallbackSnippet = this.extractDescriptionFromText(allText);
      if (fallbackSnippet && fallbackSnippet.length > 20) {
        return fallbackSnippet.substring(0, 80) + (fallbackSnippet.length > 80 ? '...' : '');
      }
    }

    return 'LinkedIn Post';
  }

  /**
   * Extracts image from the item with priority-based hierarchy
   * @param {HTMLElement} item - The list item element
   * @returns {string|null} Image URL or null
   */
  extractImage(item) {
    const allImages = Array.from(item.querySelectorAll('img[src]'));
    
    if (allImages.length === 0) {
      return null;
    }

    // Filter out tracking pixels (1x1 images) and invalid images
    const validImages = allImages.filter(img => {
      const src = img.src || '';
      if (!src || src.includes('data:image/svg')) {
        return false;
      }
      
      // Check dimensions to filter out 1x1 tracking pixels
      const width = img.naturalWidth || img.width || 0;
      const height = img.naturalHeight || img.height || 0;
      
      // Skip 1x1 or very small images (likely tracking pixels)
      if (width <= 1 && height <= 1) {
        return false;
      }
      
      return true;
    });

    if (validImages.length === 0) {
      return null;
    }

    // Priority 1: Post Thumbnail - Look for image inside .entity-result__universal-image or .entity-result__image
    const priority1Images = validImages.filter(img => {
      const parent = img.closest('.entity-result__universal-image, .entity-result__image');
      return parent !== null;
    });

    if (priority1Images.length > 0) {
      // If multiple found, pick the one with largest dimensions
      const bestImage = this.selectLargestImage(priority1Images);
      if (bestImage) {
        return bestImage.src;
      }
    }

    // Priority 2: Shared Article Image - Look for img inside .app-aware-link that isn't the author's profile link
    const appAwareLinks = item.querySelectorAll('a.app-aware-link');
    const priority2Images = [];
    
    for (const link of appAwareLinks) {
      // Skip if this is likely the author's profile link (usually contains /in/ or /company/)
      const href = link.href || '';
      if (href.includes('/in/') || href.includes('/company/')) {
        continue;
      }
      
      // Find images inside this link
      const linkImages = Array.from(link.querySelectorAll('img[src]'));
      for (const img of linkImages) {
        const src = img.src || '';
        if (src && !src.includes('data:image/svg')) {
          const width = img.naturalWidth || img.width || 0;
          const height = img.naturalHeight || img.height || 0;
          if (width > 1 && height > 1) {
            priority2Images.push(img);
          }
        }
      }
    }

    if (priority2Images.length > 0) {
      const bestImage = this.selectLargestImage(priority2Images);
      if (bestImage) {
        return bestImage.src;
      }
    }

    // Priority 3: Profile Pic Fallback - Author's profile picture
    const profileImageContainers = item.querySelectorAll('.entity-result__primary-image, .actor-name');
    const priority3Images = [];
    
    for (const container of profileImageContainers) {
      const containerImages = Array.from(container.querySelectorAll('img[src]'));
      for (const img of containerImages) {
        const src = img.src || '';
        if (src && !src.includes('data:image/svg')) {
          const width = img.naturalWidth || img.width || 0;
          const height = img.naturalHeight || img.height || 0;
          if (width > 1 && height > 1) {
            priority3Images.push(img);
          }
        }
      }
    }

    if (priority3Images.length > 0) {
      const bestImage = this.selectLargestImage(priority3Images);
      if (bestImage) {
        return bestImage.src;
      }
    }

    // Final fallback: Use largest image from all valid images
    const bestImage = this.selectLargestImage(validImages);
    if (bestImage) {
      return bestImage.src;
    }

    return null;
  }

  /**
   * Selects the image with the largest visual dimensions
   * @param {Array<HTMLImageElement>} images - Array of image elements
   * @returns {HTMLImageElement|null} Image with largest dimensions or null
   */
  selectLargestImage(images) {
    if (!images || images.length === 0) {
      return null;
    }

    let largestImage = null;
    let largestArea = 0;

    for (const img of images) {
      const width = img.naturalWidth || img.width || img.offsetWidth || 0;
      const height = img.naturalHeight || img.height || img.offsetHeight || 0;
      const area = width * height;

      if (area > largestArea) {
        largestArea = area;
        largestImage = img;
      }
    }

    return largestImage;
  }
}

// Export as global class for content script access
if (typeof window !== 'undefined') {
  window.LinkedInParser = LinkedInParser;
}

// Also export for module systems (if needed in future)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { LinkedInParser };
}
