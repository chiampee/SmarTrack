/**
 * SmarTrack Chrome Extension Popup
 * Enhanced with selected text capture and metadata extraction
 */

class SmarTrackPopup {
  constructor() {
    this.tags = [];
    this.isProcessing = false;
    this.currentTab = null;
    this.pageData = {};
    this.selectedText = '';
    
    this.init();
  }

  async init() {
    try {
      // Get current tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      this.currentTab = tab;
      
      // Extract page metadata
      await this.extractPageMetadata();
      
      // Check for selected text
      await this.captureSelectedText();
      
      // Populate UI
      this.populateUI();
      
      // Setup event listeners
      this.setupEventListeners();
      
    } catch (error) {
      console.error('Failed to initialize popup:', error);
      this.showStatus('Failed to load page', 'error');
    }
  }

  async extractPageMetadata() {
    try {
      // Execute content script to extract metadata
      const [result] = await chrome.scripting.executeScript({
        target: { tabId: this.currentTab.id },
        func: () => {
          const getMetaContent = (name) => {
            const meta = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
            return meta ? meta.getAttribute('content') : null;
          };

          return {
            title: document.title,
            url: window.location.href,
            description: getMetaContent('description') || getMetaContent('og:description'),
            image: getMetaContent('og:image'),
            favicon: document.querySelector('link[rel="icon"]')?.getAttribute('href') || 
                     document.querySelector('link[rel="shortcut icon"]')?.getAttribute('href'),
            selectedText: window.getSelection().toString().trim()
          };
        }
      });
      
      this.pageData = result.result || {};
      
    } catch (error) {
      console.error('Failed to extract metadata:', error);
      this.pageData = {
        title: this.currentTab.title || 'Untitled',
        url: this.currentTab.url || '',
        description: '',
        favicon: null,
        selectedText: ''
      };
    }
  }

  async captureSelectedText() {
    try {
      // Check if there's selected text
      const [result] = await chrome.scripting.executeScript({
        target: { tabId: this.currentTab.id },
        func: () => window.getSelection().toString().trim()
      });
      
      this.selectedText = result.result || '';
      
      if (this.selectedText) {
        this.showSelectedTextInfo(this.selectedText);
      }
    } catch (error) {
      console.error('Failed to capture selected text:', error);
      this.selectedText = '';
    }
  }

  populateUI() {
    // Set page preview
    const titleEl = document.getElementById('pageTitle');
    const urlEl = document.getElementById('pageUrl');
    const faviconEl = document.getElementById('favicon');
    
    titleEl.textContent = this.pageData.title || this.currentTab.title || 'Untitled';
    urlEl.textContent = this.pageData.url || this.currentTab.url || '';
    
    // Set favicon
    if (this.pageData.favicon) {
      const faviconUrl = this.pageData.favicon.startsWith('http') 
        ? this.pageData.favicon 
        : new URL(this.pageData.favicon, this.pageData.url).href;
      faviconEl.style.backgroundImage = `url(${faviconUrl})`;
      faviconEl.style.backgroundSize = 'cover';
      faviconEl.style.backgroundPosition = 'center';
    }
    
    // Auto-fill title in form
    document.getElementById('title').value = this.pageData.title || this.currentTab.title || '';
    
    // Auto-fill description
    if (this.pageData.description) {
      document.getElementById('description').value = this.pageData.description;
    }
  }

  showSelectedTextInfo(text) {
    const infoEl = document.getElementById('selectedTextInfo');
    infoEl.textContent = `📝 Using selected text (${text.length} chars)`;
    infoEl.classList.remove('hidden');
  }

  setupEventListeners() {
    // Form submission
    document.getElementById('linkForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSave();
    });

    // Tag input
    const tagInput = document.getElementById('tagInput');
    tagInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const tag = tagInput.value.trim();
        if (tag) {
          this.addTag(tag);
          tagInput.value = '';
        }
      }
    });

    // Cancel button
    document.getElementById('cancelBtn').addEventListener('click', () => {
      window.close();
    });
  }

  addTag(tagText) {
    if (tagText && !this.tags.includes(tagText)) {
      this.tags.push(tagText);
      this.renderTags();
    }
  }

  removeTag(tagText) {
    this.tags = this.tags.filter(tag => tag !== tagText);
    this.renderTags();
  }

  renderTags() {
    const container = document.getElementById('tagsContainer');
    container.innerHTML = '';
    
    this.tags.forEach(tag => {
      const tagEl = document.createElement('div');
      tagEl.className = 'tag';
      tagEl.innerHTML = `
        ${tag}
        <span class="tag-remove" data-tag="${tag}">×</span>
      `;
      
      tagEl.querySelector('.tag-remove').addEventListener('click', () => {
        this.removeTag(tag);
      });
      
      container.appendChild(tagEl);
    });
  }

  async handleSave() {
    if (this.isProcessing) return;
    
    try {
      this.isProcessing = true;
      this.showLoading(true);
      this.hideStatus();
      
      // Get auth token first
      const token = await this.getAuthToken();
      
      if (!token) {
        throw new Error('Please log in at https://smar-track.vercel.app first');
      }
      
      // Get form data
      const linkData = this.getLinkData();
      
      // Save to backend
      await this.saveLink(linkData, token);
      
      this.showStatus('✅ Link saved successfully!', 'success');
      
      // Auto-close after delay
      setTimeout(() => {
        window.close();
      }, 800);
      
    } catch (error) {
      console.error('Save failed:', error);
      this.showStatus(`❌ ${error.message}`, 'error');
    } finally {
      this.isProcessing = false;
      this.showLoading(false);
    }
  }

  getLinkData() {
    const url = this.pageData.url || this.currentTab.url;
    
    // Get content text - prefer selected text, fallback to page metadata description
    const content = this.selectedText || this.pageData.description || '';
    
    return {
      url: url,
      title: document.getElementById('title').value.trim(),
      description: document.getElementById('description').value.trim(),
      content: content, // Full text content (selected text or description)
      category: document.getElementById('category').value,
      tags: this.tags,
      contentType: this.detectContentType(url),
      thumbnail: this.pageData.image || null,
      favicon: this.pageData.favicon || null,
      isFavorite: false,
      isArchived: false
    };
  }

  detectContentType(url) {
    if (!url) return 'webpage';
    const urlLower = url.toLowerCase();
    
    if (urlLower.includes('.pdf')) return 'pdf';
    if (urlLower.includes('youtube.com') || urlLower.includes('vimeo.com')) return 'video';
    if (urlLower.match(/\.(jpg|jpeg|png|gif|webp)$/)) return 'image';
    if (urlLower.includes('arxiv.org') || urlLower.includes('scholar.google')) return 'article';
    if (urlLower.includes('.doc') || urlLower.includes('.docx')) return 'document';
    
    return 'webpage';
  }

  async saveLink(linkData) {
    try {
      // Get auth token
      const token = await this.getAuthToken();
      
      if (!token) {
        throw new Error('Please log in to SmarTrack first at https://smar-track.vercel.app');
      }
      
      // Save to backend
      const backendApi = new BackendApiService();
      await backendApi.saveLink(linkData, token);
      
    } catch (error) {
      console.error('Backend save failed:', error);
      throw error;
    }
  }

  async getAuthToken() {
    try {
      // First, try to get from Chrome storage (sync'd from web app)
      const result = await chrome.storage.local.get(['authToken']);
      
      if (result.authToken) {
        console.log('✅ Got token from Chrome storage');
        return result.authToken;
      }
      
      // Try to get from localStorage (if web app is open)
      // We need to request it from the content script
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const injectionResults = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            return localStorage.getItem('authToken');
          }
        });
        
        const token = injectionResults[0]?.result;
        
        if (token) {
          console.log('✅ Got token from page localStorage');
          // Store it in Chrome storage for next time
          await chrome.storage.local.set({ authToken: token });
          return token;
        }
      } catch (e) {
        console.log('Could not get token from page:', e);
      }
      
      // No token found
      console.log('❌ No auth token found');
      return null;
      
    } catch (error) {
      console.error('Failed to get auth token:', error);
      return null;
    }
  }

  showLoading(show) {
    const loading = document.getElementById('loading');
    const form = document.getElementById('linkForm');
    
    if (show) {
      loading.style.display = 'block';
      form.style.display = 'none';
    } else {
      loading.style.display = 'none';
      form.style.display = 'block';
    }
  }

  showStatus(message, type) {
    const status = document.getElementById('status');
    status.textContent = message;
    status.className = `status status-${type}`;
    status.classList.remove('hidden');
  }

  hideStatus() {
    const status = document.getElementById('status');
    status.classList.add('hidden');
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new SmarTrackPopup();
});
