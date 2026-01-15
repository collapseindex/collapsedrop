/**
 * CollapseDrop v1.1.0
 * BYOLLM — Context injection for the AI age
 * https://github.com/collapseindex/collapsedrop
 * 
 * Copyright (c) 2026 Alex Kwon / Collapse Index Labs
 * All Rights Reserved.
 * 
 * Free to use on your sites. Cannot be sold or included in paid products.
 * See LICENSE for full terms. Commercial licensing: ask@collapseindex.org
 * Support: https://ko-fi.com/collapseindex
 */

(function(global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = global || self, global.CollapseDrop = factory());
}(this, function() {
  'use strict';

  // Token estimation ratios (chars per token)
  const TOKEN_RATIOS = {
    english: 4,
    korean: 2,
    chinese: 1.5,
    japanese: 2,
    mixed: 3
  };

  // Default configuration
  const DEFAULTS = {
    theme: 'dark',
    language: 'english',
    showTokens: true,
    showChars: true,
    copyText: 'Copy',
    copiedText: '✓ Copied!',
    copiedDuration: 2000,
    showShare: true,
    shareText: 'Share',
    sharedText: '✓ Shared!',
    shareTitle: 'AI Context',
    title: 'Ask AI About This',
    subtitle: 'Copy and paste into ChatGPT, Claude, or any LLM',
    collapsed: false,
    maxHeight: '500px',
    // Color customization
    colorBg: null,
    colorBorder: null,
    colorText: null,
    colorTitle: null,
    colorMuted: null,
    colorBtnBg: null,
    colorBtnText: null,
    colorBtnHover: null,
    colorSuccess: null,
    // Font customization
    fontFamily: null,      // Font for titles/UI (e.g., 'Inter, sans-serif')
    fontMono: null,        // Font for content/code (e.g., 'JetBrains Mono, monospace')
    // Branding
    logo: null,           // URL to logo image (shows in header)
    logoSize: '32px',      // Logo size
    backgroundImage: null, // URL to background image
    backgroundOverlay: 0.85, // Overlay opacity (0-1) for readability
    // Multi-tab support
    tabs: null, // Array of {label: string, content: string} or null for single mode
    activeTab: 0, // Index of initially active tab
    // Callbacks
    onCopy: null,
    onShare: null,
    onExpand: null,
    onCollapse: null,
    onTabChange: null
  };

  /**
   * Estimate token count from text
   */
  function estimateTokens(text, language = 'english') {
    const ratio = TOKEN_RATIOS[language] || TOKEN_RATIOS.mixed;
    return Math.ceil(text.length / ratio);
  }

  /**
   * Format number with locale separators
   */
  function formatNumber(num) {
    return num.toLocaleString();
  }

  /**
   * Copy text to clipboard
   */
  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        document.body.removeChild(textarea);
        return true;
      } catch (e) {
        document.body.removeChild(textarea);
        return false;
      }
    }
  }

  /**
   * Create CollapseDrop instance
   */
  class CollapseDrop {
    constructor(element, options = {}) {
      this.element = typeof element === 'string' 
        ? document.querySelector(element) 
        : element;
      
      if (!this.element) {
        console.error('CollapseDrop: Element not found');
        return;
      }

      this.options = { ...DEFAULTS, ...options };
      this.content = this.element.textContent || this.element.innerText;
      this.isCollapsed = this.options.collapsed;
      
      // Multi-tab support
      this.hasTabs = Array.isArray(this.options.tabs) && this.options.tabs.length > 0;
      this.activeTabIndex = this.options.activeTab || 0;
      
      this.init();
    }

    init() {
      // Get content before we replace the element (for single-content mode)
      if (!this.hasTabs) {
        this.content = this.element.textContent.trim();
      }
      
      // Build the widget
      this.render();
      
      // Update token count
      this.updateStats();
      
      // Bind events
      this.bindEvents();
    }

    render() {
      const theme = this.options.theme;
      const currentContent = this.getCurrentContent();
      
      // Build tabs HTML if we have tabs
      const tabsHtml = this.hasTabs ? this.renderTabs() : '';
      
      // Build logo HTML if logo provided
      const logoHtml = this.options.logo 
        ? `<img class="collapsedrop__logo" src="${encodeURI(this.options.logo)}" alt="" style="width: ${this.escapeHtml(this.options.logoSize)}; height: ${this.escapeHtml(this.options.logoSize)};">` 
        : '';
      
      // Check for background image
      const hasBg = this.options.backgroundImage;
      
      // Escape title/subtitle for XSS prevention
      const safeTitle = this.escapeHtml(this.options.title);
      const safeSubtitle = this.escapeHtml(this.options.subtitle);
      
      this.element.innerHTML = `
        <div class="collapsedrop collapsedrop--${theme}${this.hasTabs ? ' collapsedrop--tabbed' : ''}${hasBg ? ' collapsedrop--has-bg' : ''}" data-collapsed="${this.isCollapsed}">
          ${hasBg ? `<div class="collapsedrop__bg" style="background-image: url('${encodeURI(this.options.backgroundImage)}');"></div><div class="collapsedrop__bg-overlay"></div>` : ''}
          <div class="collapsedrop__header">
            ${logoHtml}
            <div class="collapsedrop__title-section">
              <h3 class="collapsedrop__title">${safeTitle}</h3>
              <p class="collapsedrop__subtitle">${safeSubtitle}</p>
            </div>
            <button class="collapsedrop__toggle" aria-label="Toggle content">
              <svg class="collapsedrop__toggle-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
          
          <div class="collapsedrop__body" style="max-height: ${this.isCollapsed ? '0' : this.options.maxHeight}">
            ${tabsHtml}
            <div class="collapsedrop__toolbar">
              <span class="collapsedrop__stats"></span>
              <div class="collapsedrop__actions">
                ${this.options.showShare ? `<button class="collapsedrop__share">${this.options.shareText}</button>` : ''}
                <button class="collapsedrop__copy">${this.options.copyText}</button>
              </div>
            </div>
            <pre class="collapsedrop__content">${this.escapeHtml(currentContent)}</pre>
          </div>
        </div>
      `;

      // Cache DOM references
      this.widget = this.element.querySelector('.collapsedrop');
      this.body = this.element.querySelector('.collapsedrop__body');
      this.toggleBtn = this.element.querySelector('.collapsedrop__toggle');
      this.copyBtn = this.element.querySelector('.collapsedrop__copy');
      this.shareBtn = this.element.querySelector('.collapsedrop__share');
      this.statsEl = this.element.querySelector('.collapsedrop__stats');
      this.contentEl = this.element.querySelector('.collapsedrop__content');
      this.tabBtns = this.element.querySelectorAll('.collapsedrop__tab');
      
      // Apply custom colors
      this.applyColors();
    }

    renderTabs() {
      if (!this.hasTabs) return '';
      
      const tabs = this.options.tabs.map((tab, index) => {
        const isActive = index === this.activeTabIndex;
        return `<button class="collapsedrop__tab${isActive ? ' collapsedrop__tab--active' : ''}" 
                        data-tab-index="${index}"
                        aria-selected="${isActive}">${tab.label}</button>`;
      }).join('');
      
      return `<div class="collapsedrop__tabs" role="tablist">${tabs}</div>`;
    }

    getCurrentContent() {
      if (this.hasTabs) {
        return this.options.tabs[this.activeTabIndex]?.content || '';
      }
      return this.content;
    }

    switchTab(index) {
      if (!this.hasTabs || index === this.activeTabIndex) return;
      if (index < 0 || index >= this.options.tabs.length) return;
      
      this.activeTabIndex = index;
      
      // Update tab buttons
      this.tabBtns.forEach((btn, i) => {
        const isActive = i === index;
        btn.classList.toggle('collapsedrop__tab--active', isActive);
        btn.setAttribute('aria-selected', isActive);
      });
      
      // Update content
      this.contentEl.textContent = this.getCurrentContent();
      
      // Update stats for new tab
      this.updateStats();
      
      // Callback
      if (typeof this.options.onTabChange === 'function') {
        this.options.onTabChange(index, this.options.tabs[index]);
      }
    }

    applyColors() {
      const el = this.widget;
      const o = this.options;
      
      if (o.colorBg) el.style.setProperty('--cd-bg', o.colorBg);
      if (o.colorBorder) el.style.setProperty('--cd-border', o.colorBorder);
      if (o.colorText) el.style.setProperty('--cd-text', o.colorText);
      if (o.colorTitle) el.style.setProperty('--cd-text-title', o.colorTitle);
      if (o.colorMuted) {
        el.style.setProperty('--cd-text-muted', o.colorMuted);
        el.style.setProperty('--cd-bg-header', o.colorBg || 'inherit');
      }
      if (o.colorBtnBg) el.style.setProperty('--cd-btn-bg', o.colorBtnBg);
      if (o.colorBtnText) el.style.setProperty('--cd-btn-text', o.colorBtnText);
      if (o.colorBtnHover) {
        el.style.setProperty('--cd-btn-hover-bg', o.colorBtnHover);
        el.style.setProperty('--cd-btn-hover-text', '#ffffff');
      }
      if (o.colorSuccess) {
        el.style.setProperty('--cd-btn-success-bg', o.colorSuccess);
      }
      // Font customization
      if (o.fontFamily) el.style.setProperty('--cd-font-sans', o.fontFamily);
      if (o.fontMono) el.style.setProperty('--cd-font-mono', o.fontMono);
      // Background overlay opacity
      if (o.backgroundImage && o.backgroundOverlay !== undefined) {
        el.style.setProperty('--cd-bg-overlay-opacity', o.backgroundOverlay);
      }
    }

    escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }

    bindEvents() {
      // Toggle collapse
      this.toggleBtn.addEventListener('click', () => this.toggle());
      
      // Copy button
      this.copyBtn.addEventListener('click', () => this.copy());
      
      // Share button
      if (this.shareBtn) {
        this.shareBtn.addEventListener('click', () => this.share());
      }
      
      // Tab buttons
      if (this.hasTabs) {
        this.tabBtns.forEach((btn) => {
          btn.addEventListener('click', () => {
            const index = parseInt(btn.dataset.tabIndex, 10);
            this.switchTab(index);
          });
        });
      }
      
      // Keyboard support
      this.element.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          if (e.target === this.toggleBtn) {
            e.preventDefault();
            this.toggle();
          }
          // Tab keyboard support
          if (e.target.classList.contains('collapsedrop__tab')) {
            e.preventDefault();
            const index = parseInt(e.target.dataset.tabIndex, 10);
            this.switchTab(index);
          }
        }
        // Arrow key navigation for tabs
        if (this.hasTabs && e.target.classList.contains('collapsedrop__tab')) {
          if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
            e.preventDefault();
            const newIndex = e.key === 'ArrowRight' 
              ? (this.activeTabIndex + 1) % this.options.tabs.length
              : (this.activeTabIndex - 1 + this.options.tabs.length) % this.options.tabs.length;
            this.switchTab(newIndex);
            this.tabBtns[newIndex].focus();
          }
        }
      });
    }

    updateStats() {
      const parts = [];
      const currentContent = this.getCurrentContent();
      
      if (this.options.showTokens) {
        const tokens = estimateTokens(currentContent, this.options.language);
        parts.push(`~${formatNumber(tokens)} tokens`);
      }
      
      if (this.options.showChars) {
        parts.push(`${formatNumber(currentContent.length)} chars`);
      }
      
      this.statsEl.textContent = parts.join(' · ');
    }

    async copy() {
      const currentContent = this.getCurrentContent();
      const success = await copyToClipboard(currentContent);
      
      if (success) {
        // Visual feedback
        const originalText = this.copyBtn.textContent;
        this.copyBtn.textContent = this.options.copiedText;
        this.copyBtn.classList.add('collapsedrop__copy--success');
        
        setTimeout(() => {
          this.copyBtn.textContent = originalText;
          this.copyBtn.classList.remove('collapsedrop__copy--success');
        }, this.options.copiedDuration);
        
        // Callback
        if (typeof this.options.onCopy === 'function') {
          this.options.onCopy(currentContent);
        }
      }
    }

    async share() {
      const currentContent = this.getCurrentContent();
      const shareData = {
        title: this.options.shareTitle,
        text: currentContent
      };
      
      // Try native share API first (mobile)
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        try {
          await navigator.share(shareData);
          this.showShareSuccess();
          if (typeof this.options.onShare === 'function') {
            this.options.onShare(currentContent);
          }
          return;
        } catch (err) {
          if (err.name !== 'AbortError') {
            console.error('Share failed:', err);
          }
          return;
        }
      }
      
      // Fallback: copy to clipboard
      const success = await copyToClipboard(currentContent);
      if (success) {
        this.showShareSuccess();
        if (typeof this.options.onShare === 'function') {
          this.options.onShare(currentContent);
        }
      }
    }

    showShareSuccess() {
      const originalText = this.shareBtn.textContent;
      this.shareBtn.textContent = this.options.sharedText;
      this.shareBtn.classList.add('collapsedrop__share--success');
      
      setTimeout(() => {
        this.shareBtn.textContent = originalText;
        this.shareBtn.classList.remove('collapsedrop__share--success');
      }, this.options.copiedDuration);
    }

    toggle() {
      this.isCollapsed = !this.isCollapsed;
      this.widget.setAttribute('data-collapsed', this.isCollapsed);
      
      if (this.isCollapsed) {
        this.body.style.maxHeight = '0';
        if (typeof this.options.onCollapse === 'function') {
          this.options.onCollapse();
        }
      } else {
        this.body.style.maxHeight = this.options.maxHeight;
        if (typeof this.options.onExpand === 'function') {
          this.options.onExpand();
        }
      }
    }

    expand() {
      if (this.isCollapsed) this.toggle();
    }

    collapse() {
      if (!this.isCollapsed) this.toggle();
    }

    setContent(content) {
      this.content = content;
      this.contentEl.textContent = content;
      this.updateStats();
    }

    getContent() {
      return this.getCurrentContent();
    }

    // Tab management methods
    getActiveTab() {
      return this.hasTabs ? this.activeTabIndex : null;
    }

    setActiveTab(index) {
      this.switchTab(index);
    }

    getTabs() {
      return this.hasTabs ? this.options.tabs : null;
    }

    addTab(tab, index = null) {
      if (!this.hasTabs) {
        // Convert to tabbed mode
        this.options.tabs = [{ label: 'Default', content: this.content }];
        this.hasTabs = true;
      }
      
      if (index === null) {
        this.options.tabs.push(tab);
      } else {
        this.options.tabs.splice(index, 0, tab);
      }
      
      // Re-render to show new tabs
      this.render();
      this.updateStats();
      this.bindEvents();
    }

    removeTab(index) {
      if (!this.hasTabs || this.options.tabs.length <= 1) return;
      
      this.options.tabs.splice(index, 1);
      
      // Adjust active tab if needed
      if (this.activeTabIndex >= this.options.tabs.length) {
        this.activeTabIndex = this.options.tabs.length - 1;
      }
      
      // Re-render
      this.render();
      this.updateStats();
      this.bindEvents();
    }

    destroy() {
      this.element.innerHTML = this.getCurrentContent();
    }
  }

  /**
   * Static init method for easy initialization
   */
  CollapseDrop.init = function(selector, options) {
    const elements = document.querySelectorAll(selector);
    const instances = [];
    
    elements.forEach(el => {
      instances.push(new CollapseDrop(el, options));
    });
    
    return instances.length === 1 ? instances[0] : instances;
  };

  /**
   * Auto-init elements with data-collapsedrop attribute
   */
  CollapseDrop.autoInit = function() {
    document.querySelectorAll('[data-collapsedrop]').forEach(el => {
      const options = {};
      
      // Parse data attributes
      if (el.dataset.theme) options.theme = el.dataset.theme;
      if (el.dataset.language) options.language = el.dataset.language;
      if (el.dataset.title) options.title = el.dataset.title;
      if (el.dataset.subtitle) options.subtitle = el.dataset.subtitle;
      if (el.dataset.collapsed === 'true') options.collapsed = true;
      if (el.dataset.showTokens === 'false') options.showTokens = false;
      if (el.dataset.showChars === 'false') options.showChars = false;
      if (el.dataset.copyText) options.copyText = el.dataset.copyText;
      if (el.dataset.copiedText) options.copiedText = el.dataset.copiedText;
      if (el.dataset.showShare === 'false') options.showShare = false;
      if (el.dataset.shareText) options.shareText = el.dataset.shareText;
      if (el.dataset.sharedText) options.sharedText = el.dataset.sharedText;
      if (el.dataset.activeTab) options.activeTab = parseInt(el.dataset.activeTab, 10);
      // Color customization
      if (el.dataset.colorBg) options.colorBg = el.dataset.colorBg;
      if (el.dataset.colorBorder) options.colorBorder = el.dataset.colorBorder;
      if (el.dataset.colorText) options.colorText = el.dataset.colorText;
      if (el.dataset.colorTitle) options.colorTitle = el.dataset.colorTitle;
      if (el.dataset.colorMuted) options.colorMuted = el.dataset.colorMuted;
      if (el.dataset.colorBtnBg) options.colorBtnBg = el.dataset.colorBtnBg;
      if (el.dataset.colorBtnText) options.colorBtnText = el.dataset.colorBtnText;
      if (el.dataset.colorBtnHover) options.colorBtnHover = el.dataset.colorBtnHover;
      if (el.dataset.colorSuccess) options.colorSuccess = el.dataset.colorSuccess;
      // Font customization
      if (el.dataset.fontFamily) options.fontFamily = el.dataset.fontFamily;
      if (el.dataset.fontMono) options.fontMono = el.dataset.fontMono;
      // Branding
      if (el.dataset.logo) options.logo = el.dataset.logo;
      if (el.dataset.logoSize) options.logoSize = el.dataset.logoSize;
      if (el.dataset.backgroundImage) options.backgroundImage = el.dataset.backgroundImage;
      if (el.dataset.backgroundOverlay) options.backgroundOverlay = parseFloat(el.dataset.backgroundOverlay);
      
      // Parse tabs from child elements with data-tab attribute
      const tabElements = el.querySelectorAll('[data-tab]');
      if (tabElements.length > 0) {
        options.tabs = Array.from(tabElements).map(tabEl => ({
          label: tabEl.dataset.tab,
          content: tabEl.textContent.trim()
        }));
        // Clear original content since we're using tabs
        el.innerHTML = '';
      }
      
      new CollapseDrop(el, options);
    });
  };

  // Auto-init on DOMContentLoaded
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', CollapseDrop.autoInit);
    } else {
      CollapseDrop.autoInit();
    }
  }

  // Expose utilities
  CollapseDrop.estimateTokens = estimateTokens;
  CollapseDrop.version = '1.1.0';

  return CollapseDrop;
}));

