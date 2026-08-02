/**
 * Substack Footnote Reader - Main Application Script
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const urlForm = document.getElementById('urlForm');
  const urlInput = document.getElementById('urlInput');
  const shareStatus = document.getElementById('shareStatus');
  const welcomeMessage = document.getElementById('welcomeMessage');
  const loadingSpinner = document.getElementById('loadingSpinner');
  const loadingText = document.getElementById('loadingText');
  const errorMessage = document.getElementById('errorMessage');
  const errorText = document.getElementById('errorText');
  const retryBtn = document.getElementById('retryBtn');
  
  const articleContainer = document.getElementById('articleContainer');
  const articleTitle = document.getElementById('articleTitle');
  const articleSubtitle = document.getElementById('articleSubtitle');
  const articleMeta = document.getElementById('articleMeta');
  const articleBody = document.getElementById('articleBody');

  const footnoteOverlay = document.getElementById('footnoteOverlay');
  const footnoteBadge = document.getElementById('footnoteBadge');
  const footnoteContent = document.getElementById('footnoteContent');
  const closeFootnoteBtn = document.getElementById('closeFootnoteBtn');
  const jumpToFootnoteBtn = document.getElementById('jumpToFootnoteBtn');
  const returnToTextBtn = document.getElementById('returnToTextBtn');

  const themeToggle = document.getElementById('themeToggle');
  const fontSizeToggle = document.getElementById('fontSizeToggle');

  // Reading State
  let lastReadingPosition = 0;
  let activeFootnoteId = null;
  let currentArticleUrl = '';

  // Theme Management
  const themes = ['theme-light', 'theme-dark', 'theme-sepia'];
  let currentThemeIdx = 0;
  
  themeToggle.addEventListener('click', () => {
    document.body.classList.remove(themes[currentThemeIdx]);
    currentThemeIdx = (currentThemeIdx + 1) % themes.length;
    document.body.classList.add(themes[currentThemeIdx]);
    const icons = ['🌙', '☀️', '📜'];
    themeToggle.innerHTML = icons[currentThemeIdx];
  });

  // Font Size Management
  const fontSizes = ['font-small', 'font-medium', 'font-large'];
  let currentFontSizeIdx = 1;

  fontSizeToggle.addEventListener('click', () => {
    document.body.classList.remove(fontSizes[currentFontSizeIdx]);
    currentFontSizeIdx = (currentFontSizeIdx + 1) % fontSizes.length;
    document.body.classList.add(fontSizes[currentFontSizeIdx]);
  });

  // Check query params for Share Target API
  handleShareTargetParams();

  // Form Submission
  urlForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const inputVal = urlInput.value.trim();
    if (inputVal) {
      loadSubstackArticle(inputVal);
    }
  });

  retryBtn.addEventListener('click', () => {
    if (currentArticleUrl) {
      loadSubstackArticle(currentArticleUrl);
    }
  });

  // Footnote Overlay Event Handlers
  closeFootnoteBtn.addEventListener('click', closeFootnoteModal);
  footnoteOverlay.addEventListener('click', (e) => {
    if (e.target === footnoteOverlay) closeFootnoteModal();
  });

  jumpToFootnoteBtn.addEventListener('click', () => {
    if (!activeFootnoteId) return;
    const targetEl = document.getElementById(activeFootnoteId);
    closeFootnoteModal();
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      targetEl.classList.add('footnote-highlight');
      setTimeout(() => targetEl.classList.remove('footnote-highlight'), 3000);
      returnToTextBtn.classList.remove('hidden');
    }
  });

  returnToTextBtn.addEventListener('click', () => {
    window.scrollTo({ top: lastReadingPosition, behavior: 'smooth' });
    returnToTextBtn.classList.add('hidden');
  });

  /**
   * Parses Web Share Target query params from Android Share intent
   */
  function handleShareTargetParams() {
    const params = new URLSearchParams(window.location.search);
    const sharedUrl = params.get('url');
    const sharedText = params.get('text');
    const sharedTitle = params.get('title');

    let targetUrl = sharedUrl || extractUrlFromText(sharedText) || extractUrlFromText(sharedTitle);

    if (targetUrl) {
      shareStatus.textContent = '📥 Received link from Android Share... Loading article!';
      shareStatus.classList.remove('hidden');
      urlInput.value = targetUrl;
      loadSubstackArticle(targetUrl);
    }
  }

  /**
   * Helper to extract standard HTTP/HTTPS URLs from raw text
   */
  function extractUrlFromText(text) {
    if (!text) return null;
    const match = text.match(/https?:\/\/[^\s]+/i);
    return match ? match[0] : null;
  }

  /**
   * Primary Loader for Substack Articles
   */
  async function loadSubstackArticle(rawUrl) {
    currentArticleUrl = rawUrl;
    showLoading('Fetching article...');

    // Normalize URL
    let cleanUrl = rawUrl.split('?')[0]; // strip tracking params
    if (!cleanUrl.startsWith('http')) {
      cleanUrl = 'https://' + cleanUrl;
    }

    try {
      const articleData = await fetchArticleContent(cleanUrl);
      renderArticle(articleData);
    } catch (err) {
      console.error('Failed to load article:', err);
      showError(`Unable to fetch article. Please verify the URL or try again. (${err.message})`);
    }
  }

  /**
   * Fetches article via Substack API or fallback CORS proxies
   */
  async function fetchArticleContent(url) {
    const parsedUrl = new URL(url);
    const domain = parsedUrl.origin;
    const pathSegments = parsedUrl.pathname.split('/').filter(Boolean);
    
    let slug = '';
    if (pathSegments.includes('p')) {
      const pIdx = pathSegments.indexOf('p');
      slug = pathSegments[pIdx + 1];
    } else if (pathSegments.length > 0) {
      slug = pathSegments[pathSegments.length - 1];
    }

    // Strategy 1: Substack's public API endpoint via CORS proxy
    const apiUrl = `${domain}/api/v1/posts/${slug}`;
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(apiUrl)}`;

    try {
      const res = await fetch(proxyUrl);
      if (res.ok) {
        const json = await res.json();
        if (json.body_html) {
          return {
            title: json.title || 'Substack Article',
            subtitle: json.subtitle || '',
            author: json.publishedBylines?.[0]?.name || parsedUrl.hostname,
            date: json.post_date ? new Date(json.post_date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : '',
            bodyHtml: json.body_html
          };
        }
      }
    } catch (e) {
      console.log('API strategy failed, attempting full page HTML fetch fallback...');
    }

    // Strategy 2: Direct full HTML fetch via AllOrigins proxy
    const htmlProxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    const htmlRes = await fetch(htmlProxyUrl);
    if (!htmlRes.ok) {
      throw new Error('Failed to retrieve content from proxy.');
    }
    const htmlText = await htmlRes.text();

    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, 'text/html');

    const title = doc.querySelector('h1.post-title, meta[property="og:title"]')?.textContent || doc.title || 'Substack Article';
    const subtitle = doc.querySelector('h3.subtitle, meta[property="og:description"]')?.content || '';
    const bodyEl = doc.querySelector('.available-content, .post-content, .body.markup') || doc.body;

    return {
      title,
      subtitle,
      author: doc.querySelector('.byline-name, meta[name="author"]')?.content || parsedUrl.hostname,
      date: doc.querySelector('.post-date')?.textContent || '',
      bodyHtml: bodyEl.innerHTML
    };
  }

  /**
   * Renders Article & Intercepts Footnotes
   */
  function renderArticle(data) {
    articleTitle.textContent = data.title;
    articleSubtitle.textContent = data.subtitle;
    articleMeta.textContent = [data.author, data.date].filter(Boolean).join(' • ');

    // Inject Raw Body HTML
    articleBody.innerHTML = data.bodyHtml;

    // Process Footnotes for Working Interactivity
    processAndFixFootnotes();

    // UI State Transition
    welcomeMessage.classList.add('hidden');
    loadingSpinner.classList.add('hidden');
    errorMessage.classList.add('hidden');
    shareStatus.classList.add('hidden');
    articleContainer.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Core Footnote Processing Engine (Fixed)
   */
  function processAndFixFootnotes() {
    // 1. Identify all in-text links first
    const inTextLinks = articleBody.querySelectorAll(
      'a.footnote-number, a[href*="#footnote"], a[href*="#fn"], sup a'
    );

    const inTextIds = new Set();
    inTextLinks.forEach(link => {
      const id = link.getAttribute('id');
      if (id) inTextIds.add(id.toLowerCase());
    });

    // 2. Query ONLY bottom footnote containers (Excluding in-text <a> links or anchor IDs)
    const rawCandidates = articleBody.querySelectorAll(
      '.footnote, .footnotes li, p.footnote, div[id*="footnote"], li[id*="fn"], [data-footnote]'
    );

    const footnoteMap = new Map();

    rawCandidates.forEach((el, index) => {
      // Ignore if element is an <a> tag or an in-text anchor
      if (el.tagName === 'A') return;
      
      const elId = (el.getAttribute('id') || '').toLowerCase();
      if (elId.includes('anchor') || elId.includes('ref') || inTextIds.has(elId)) {
        return;
      }

      let finalId = elId;
      if (!finalId) {
        finalId = `footnote-${index + 1}`;
        el.setAttribute('id', finalId);
      }

      // Clone element for clean text extraction
      const cleanClone = el.cloneNode(true);

      // Remove back links and inline footnote number markers inside bottom text
      cleanClone.querySelectorAll('.footnote-back, .footnote-backref, a[href*="anchor"], a[href*="ref"], .footnote-number').forEach(node => node.remove());

      let cleanHtml = cleanClone.innerHTML.trim();

      // Strip leading digits like "1." or "1 " if left over in paragraph
      cleanHtml = cleanHtml.replace(/^\s*<p>\s*\d+[\.\s]*/i, '<p>');
      cleanHtml = cleanHtml.replace(/^\s*\d+[\.\s]*/i, '');

      if (!cleanHtml) return;

      footnoteMap.set(finalId, cleanHtml);

      // Also map plain number string (e.g. "1" -> cleanHtml)
      const numMatch = finalId.match(/\d+/);
      if (numMatch) {
        footnoteMap.set(numMatch[0], cleanHtml);
      }
    });

    // 3. Attach interactive popover handlers to all in-text links
    inTextLinks.forEach((link) => {
      const href = link.getAttribute('href') || '';
      const linkText = link.textContent.trim().replace(/[\[\]]/g, '');
      
      let targetId = href.replace('#', '').toLowerCase();
      if (targetId.includes('anchor') || targetId.includes('ref')) {
        targetId = `footnote-${linkText}`;
      }

      // Look up content from Map
      let content = footnoteMap.get(targetId) || footnoteMap.get(linkText);

      // Fallback: If not found in map, attempt DOM search by element with targetId
      if (!content && targetId) {
        const directEl = articleBody.querySelector(`#${targetId}`);
        if (directEl && directEl.tagName !== 'A') {
          content = directEl.innerHTML;
        }
      }

      // Enhance Link Styling
      link.classList.add('interactive-footnote');
      link.setAttribute('role', 'button');
      link.setAttribute('title', `Footnote [${linkText}]`);

      // Override click event to show popover modal
      link.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        lastReadingPosition = window.scrollY;
        activeFootnoteId = targetId;

        openFootnoteModal(linkText, content || 'Footnote text not found.');
      });
    });
  }

  function openFootnoteModal(badgeNum, htmlContent) {
    footnoteBadge.textContent = `Footnote [${badgeNum}]`;
    footnoteContent.innerHTML = htmlContent;
    footnoteOverlay.classList.remove('hidden');
    footnoteOverlay.setAttribute('aria-hidden', 'false');
  }

  function closeFootnoteModal() {
    footnoteOverlay.classList.add('hidden');
    footnoteOverlay.setAttribute('aria-hidden', 'true');
  }

  function showLoading(msg) {
    loadingText.textContent = msg;
    welcomeMessage.classList.add('hidden');
    errorMessage.classList.add('hidden');
    articleContainer.classList.add('hidden');
    loadingSpinner.classList.remove('hidden');
  }

  function showError(msg) {
    errorText.textContent = msg;
    welcomeMessage.classList.add('hidden');
    loadingSpinner.classList.add('hidden');
    articleContainer.classList.add('hidden');
    errorMessage.classList.remove('hidden');
  }
});
