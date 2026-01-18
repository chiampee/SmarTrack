/**
 * LinkedIn Parser
 * Extracts saved posts from LinkedIn Saved Posts page with rich metadata
 * 
 * @fileoverview Parser class for extracting LinkedIn saved posts with enhanced metadata
 * @version 1.1.0 (Stable Inside-Out Strategy)
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
      return contentImg.src;
    }

    // Priority 2: Any image in the 'right side' content container
    // (Excludes the profile pic on the left)
    const rightContainer = item.querySelector('.entity-result__content-inner-container--right-padding');
    if (rightContainer) {
      const anyRightImg = rightContainer.querySelector('img');
      if (anyRightImg && anyRightImg.src && !anyRightImg.src.includes('data:image/gif')) {
        return anyRightImg.src;
      }
    }

    // Priority 3: Fallback to Profile Picture (class 'presence-entity__image')
    const profileImg = item.querySelector('img.presence-entity__image');
    if (profileImg && profileImg.src && !profileImg.src.includes('data:image/gif')) {
      return profileImg.src;
    }

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
        // ============================================================
        // 1. URL Extraction
        // ============================================================
        let url = null;
        
        // Strategy A: Specific Content Patterns (Best quality)
        // Added support for: learning, events, video, and jobs
        const specificAnchor = item.querySelector('a[href*="/feed/update/"], a[href*="/posts/"], a[href*="linkedin.com/pulse/"], a[href*="/learning/"], a[href*="/events/"], a[href*="/video/"], a[href*="/jobs/"]');
        
        if (specificAnchor) {
          url = specificAnchor.href;
        }
        
        // Strategy B: The Title Link (The General Fallback)
        // If A failed, grab the main clickable link in the title area.
        // This covers ANY content type (3rd party articles, weird formats, etc.)
        if (!url) {
          const titleAnchor = item.querySelector('.entity-result__title-text a.app-aware-link');
          if (titleAnchor) {
            url = titleAnchor.href;
          }
        }
        
        // Debugging: Log why we might skip this item
        if (!url) {
          // Try to log what kind of text we found to help debug future skips
          const textPreview = item.innerText.substring(0, 50).replace(/\n/g, ' ');
          console.warn(`[SRT] Item ${index} skipped: No URL found. Text: "${textPreview}..."`);
          return; // Continue to next item
        }

        // ============================================================
        // 2. Image Extraction
        // ============================================================
        let thumbnail = this.findBestImage(item);
        
        // STRICT VALIDATION: Prevent chrome-extension://invalid errors
        // If the image is not a valid absolute URL, discard it
        if (thumbnail && !thumbnail.startsWith('http')) {
          thumbnail = null; 
        }

        // ============================================================
        // 3. Title & Author Extraction
        // ============================================================
        
        // Strategy A: Look for the specific Actor container first (Most reliable)
        // The structure is: .entity-result__content-actor -> .app-aware-link -> span[aria-hidden="true"]
        const actorNode = item.querySelector('.entity-result__content-actor .app-aware-link span[aria-hidden="true"]');
        
        // Strategy B: Look for the first link text in the title container
        const titleNode = item.querySelector('.entity-result__title-text .app-aware-link span[aria-hidden="true"]');
        
        // Strategy C: Fallback to the raw link text
        const rawLink = item.querySelector('.app-aware-link');
        
        let author = 'LinkedIn User';
        if (actorNode) author = actorNode.innerText.trim();
        else if (titleNode) author = titleNode.innerText.trim();
        else if (rawLink) author = rawLink.innerText.trim();
        
        // ============================================================
        // 4. Description & Final Title
        // ============================================================
        
        // Use the 'summary' class which contains the post text
        const summaryEl = item.querySelector('.entity-result__content-summary');
        const rawDescription = summaryEl ? summaryEl.innerText.trim() : '';
        
        // Clean up the description (remove "see more", newlines)
        const cleanDescription = rawDescription.replace(/\n+/g, ' ').replace('…see more', '').replace('… see more', '').trim();
        const snippet = cleanDescription.substring(0, 60);
        
        const title = cleanDescription ? `${author}: ${snippet}${snippet.length >= 60 ? '...' : ''}` : `${author} (Saved Post)`;
        
        // ============================================================
        // 5. Finalize & Sanitize
        // ============================================================
        try {
          const cleanUrl = window.sanitizeLinkedInUrl ? window.sanitizeLinkedInUrl(url) : url;
          
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
}

// Export as global class for content script access
if (typeof window !== 'undefined') {
  window.LinkedInParser = LinkedInParser;
}

// Also export for module systems (if needed in future)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { LinkedInParser };
}
