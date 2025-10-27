/**
 * SmarTrack Chrome Extension Popup
 * Handles link saving with content extraction
 */

class SmarTrackPopup {
  constructor() {
    this.tags = [];
    this.isProcessing = false;
    this.currentTab = null;
    
    this.init();
  }

  async init() {
    try {
      // Get current tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      this.currentTab = tab;
      
      // Populate page info
      this.populatePageInfo();
      
      // Setup event listeners
      this.setupEventListeners();
      
      // Auto-fill title if available
      this.autoFillTitle();
      
    } catch (error) {
      console.error('Failed to initialize popup:', error);
      this.showStatus('Failed to load page information', 'error');
    }
  }

  populatePageInfo() {
    const titleEl = document.getElementById('pageTitle');
    const urlEl = document.getElementById('pageUrl');
    
    if (this.currentTab) {
      titleEl.textContent = this.currentTab.title || 'Untitled';
      urlEl.textContent = this.currentTab.url || 'Unknown URL';
      
      // Auto-fill title in form
      const titleInput = document.getElementById('title');
      titleInput.value = this.currentTab.title || '';
    }
  }

  autoFillTitle() {
    const titleInput = document.getElementById('title');
    if (this.currentTab && this.currentTab.title) {
      titleInput.value = this.currentTab.title;
    }
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
        this.addTag(tagInput.value.trim());
        tagInput.value = '';
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
      
      // Get form data
      const formData = this.getFormData();
      
      // Extract page content
      const pageData = await this.extractPageData();
      
      // Combine data
      const linkData = {
        ...pageData,
        ...formData,
        url: this.currentTab.url,
        tabId: this.currentTab.id
      };

      // Save to backend
      await this.saveToBackend(linkData);
      
      this.showStatus('Link saved successfully!', 'success');
      
      // Auto-close after delay
      setTimeout(() => {
        window.close();
      }, 1500);
      
    } catch (error) {
      console.error('Save failed:', error);
      this.showStatus(`Failed to save: ${error.message}`, 'error');
    } finally {
      this.isProcessing = false;
      this.showLoading(false);
    }
  }

  getFormData() {
    return {
      title: document.getElementById('title').value.trim(),
      description: document.getElementById('description').value.trim(),
      category: document.getElementById('category').value,
      priority: document.getElementById('priority').value,
      tags: this.tags
    };
  }

  async extractPageData() {
    try {
      // Inject content script to extract page data
      const results = await chrome.scripting.executeScript({
        target: { tabId: this.currentTab.id },
        function: this.extractPageContent
      });
      
      return results[0]?.result || {};
    } catch (error) {
      console.error('Failed to extract page data:', error);
      return {};
    }
  }

  // This function runs in the page context
  extractPageContent() {
    const getMetaContent = (name) => {
      const meta = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
      return meta ? meta.getAttribute('content') : null;
    };

    return {
      title: document.title,
      description: getMetaContent('description') || getMetaContent('og:description'),
      image: getMetaContent('og:image'),
      siteName: getMetaContent('og:site_name'),
      author: getMetaContent('author'),
      publishedDate: getMetaContent('article:published_time'),
      pageText: document.body.innerText.substring(0, 1000) // First 1000 chars
    };
  }

  async saveToBackend(linkData) {
    try {
      // Try to save to backend API
      const backendApi = new BackendApiService();
      await backendApi.saveLink(linkData);
    } catch (error) {
      console.error('Backend save failed, falling back to local storage:', error);
      
      // Fallback to local storage
      await this.saveToLocalStorage(linkData);
    }
  }

  async saveToLocalStorage(linkData) {
    // Store in Chrome extension storage
    const link = {
      id: Date.now().toString(),
      ...linkData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Get existing links
    const result = await chrome.storage.local.get(['links']);
    const links = result.links || [];
    
    // Add new link
    links.push(link);
    
    // Save back to storage
    await chrome.storage.local.set({ links });
    
    // Notify background script
    chrome.runtime.sendMessage({
      type: 'LINK_SAVED',
      link: link
    });
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