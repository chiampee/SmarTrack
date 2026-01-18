// extension/content/linkedin_injector.js

(function() {
  'use strict';
  
  console.log('[SmarTrack] LinkedIn Injector Loaded', window.location.href);

  // Configuration
  const CONFIG = {
    // Only run on Saved Posts page
    TARGET_URL_PART: '/my-items/saved-posts/',
    BUTTON_ID: 'smartrack-sync-btn',
    BATCH_SIZE: 3,
    DELAY_MIN: 500,
    DELAY_MAX: 1500,
    MAX_RETRIES: 10,
    RETRY_DELAY: 1000
  };

  // Check if we are on the correct page
  if (!window.location.href.includes(CONFIG.TARGET_URL_PART)) {
    console.log('[SmarTrack] Not on saved posts page, exiting');
    return;
  }

  // Prevent duplicate buttons
  if (document.getElementById(CONFIG.BUTTON_ID)) {
    console.log('[SmarTrack] Button already exists');
    return;
  }

  // --- UI Creation ---
  const createSyncButton = () => {
    // Wait for body to be ready
    const ensureBody = (callback) => {
      if (document.body) {
        callback();
      } else {
        setTimeout(() => ensureBody(callback), 100);
      }
    };

    ensureBody(() => {
      // Double-check button doesn't exist
      if (document.getElementById(CONFIG.BUTTON_ID)) {
        return;
      }

      const btn = document.createElement('button');
      btn.id = CONFIG.BUTTON_ID;
      btn.innerText = '⚡ Sync to SmarTrack';
      
      // Styling
      Object.assign(btn.style, {
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: '99999',
        padding: '12px 24px',
        backgroundColor: '#7C3AED', // Violet-600
        color: 'white',
        border: 'none',
        borderRadius: '50px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        cursor: 'pointer',
        fontWeight: '600',
        fontFamily: '-apple-system, system-ui, sans-serif',
        fontSize: '14px',
        transition: 'all 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      });

      // Hover effect
      btn.onmouseover = () => btn.style.transform = 'translateY(-2px)';
      btn.onmouseout = () => btn.style.transform = 'translateY(0)';

      btn.onclick = startSyncProcess;
      document.body.appendChild(btn);
      console.log('[SmarTrack] Button created and added to page');
    });
  };

  // --- Sync Logic ---
  const startSyncProcess = async () => {
    const btn = document.getElementById(CONFIG.BUTTON_ID);
    if (!btn) {
      console.error('[SmarTrack] Button not found');
      return;
    }

    btn.innerText = '⏳ Scanning...';
    btn.disabled = true;
    btn.style.opacity = '0.8';

    try {
      // Wait a bit for content to load if needed
      await new Promise(resolve => setTimeout(resolve, 500));

      // Check if parser is available
      if (typeof window.LinkedInParser === 'undefined') {
        throw new Error('LinkedInParser not loaded. Make sure utils/parsers/LinkedInParser.js is loaded first.');
      }

      // Use LinkedInParser to extract saved items
      const parser = new window.LinkedInParser();
      let validLinks = parser.getSavedItems();

      console.log(`[SmarTrack] Valid links found: ${validLinks.length}`);
      
      // Check how many links have images
      const linksWithImages = validLinks.filter(link => link.thumbnail).length;
      const missingImages = validLinks.length - linksWithImages;
      
      if (validLinks.length === 0) {
        btn.innerText = '❌ No posts found';
        btn.style.backgroundColor = '#F59E0B'; // Amber
        setTimeout(() => {
          btn.innerText = '⚡ Sync to SmarTrack';
          btn.style.backgroundColor = '#7C3AED';
          btn.disabled = false;
          btn.style.opacity = '1';
        }, 3000);
        return;
      }

      // Show scroll hint if many links are missing images (likely lazy loading)
      if (validLinks.length > 3 && missingImages > validLinks.length * 0.5) {
        btn.innerText = '💡 Tip: Scroll down to load images first';
        btn.style.backgroundColor = '#3B82F6'; // Blue
        await new Promise(resolve => setTimeout(resolve, 3000));
        // Re-extract after hint - images may have loaded by now
        const reExtractedLinks = parser.getSavedItems();
        if (reExtractedLinks.length > 0) {
          validLinks = reExtractedLinks;
        }
      }

      // 2. Batch Sending with Jitter
      btn.innerText = `Syncing ${validLinks.length} posts...`;
      
      const batches = [];
      for (let i = 0; i < validLinks.length; i += CONFIG.BATCH_SIZE) {
        batches.push(validLinks.slice(i, i + CONFIG.BATCH_SIZE));
      }

      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        try {
          // Send batch to background
          await new Promise((resolve, reject) => {
            chrome.runtime.sendMessage(
              { 
                type: 'BATCH_SAVE_LINKS', 
                data: batch 
              },
              (response) => {
                if (chrome.runtime.lastError) {
                  console.error('[SmarTrack] Message error:', chrome.runtime.lastError);
                  reject(chrome.runtime.lastError);
                } else {
                  console.log('[SmarTrack] Batch sent successfully:', response);
                  if (response && response.success) {
                    successCount += batch.length;
                  } else {
                    errorCount += batch.length;
                  }
                  resolve(response);
                }
              }
            );
          });
        } catch (error) {
          console.error('[SmarTrack] Failed to send batch:', error);
          errorCount += batch.length;
        }

        // Human Jitter Delay (except for last batch)
        if (i < batches.length - 1) {
          const delay = Math.floor(Math.random() * (CONFIG.DELAY_MAX - CONFIG.DELAY_MIN + 1) + CONFIG.DELAY_MIN);
          await new Promise(r => setTimeout(r, delay));
        }
      }

      if (errorCount === 0) {
        btn.innerText = `✅ Synced ${successCount} posts!`;
        btn.style.backgroundColor = '#10B981'; // Green
      } else {
        btn.innerText = `⚠️ ${successCount} synced, ${errorCount} failed`;
        btn.style.backgroundColor = '#F59E0B'; // Amber
      }

    } catch (error) {
      console.error('[SmarTrack] Sync failed', error);
      btn.innerText = '❌ Error: ' + (error.message || 'Unknown error');
      btn.style.backgroundColor = '#EF4444'; // Red
    } finally {
      setTimeout(() => {
        btn.innerText = '⚡ Sync to SmarTrack';
        btn.style.backgroundColor = '#7C3AED';
        btn.disabled = false;
        btn.style.opacity = '1';
      }, 5000);
    }
  };

  // Initialize - wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createSyncButton);
  } else {
    // DOM already loaded, but wait a bit for LinkedIn's dynamic content
    setTimeout(createSyncButton, 1000);
  }

  // Also watch for navigation changes (LinkedIn is a SPA)
  let lastUrl = window.location.href;
  setInterval(() => {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      if (window.location.href.includes(CONFIG.TARGET_URL_PART)) {
        if (!document.getElementById(CONFIG.BUTTON_ID)) {
          setTimeout(createSyncButton, 1000);
        }
      }
    }
  }, 1000);

})();
