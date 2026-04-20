(function() {
  var worker;
  try {
    worker = new Worker('newsWorker.js');
  } catch (e) {
    showError('Failed to instantiate worker: ' + e.message);
    return;
  }
  var articlesContainer = document.getElementById('news-feed-container').querySelector('#news-feed-articles') || document.getElementById('news-feed-articles');
  var errorContainer = document.getElementById('news-feed-container').querySelector('#news-feed-error') || document.getElementById('news-feed-error');

  // Language detection and management
  var currentLang = getPreferredLanguage();

  function getPreferredLanguage() {
    // 1. Check cookie for user preference
    var langCookie = document.cookie
      .split('; ')
      .find(function(row) { return row.startsWith('tlf_lang='); })
      ?.split('=')[1];
    
    if (langCookie) return langCookie;

    // 2. Check browser language
    var browserLang = navigator.language || navigator.userLanguage;
    if (browserLang.startsWith('it')) return 'it';
    if (browserLang.startsWith('en')) return 'en';

    // 3. Default to Italian
    return 'it';
  }

  function setLanguageCookie(lang) {
    document.cookie = 'tlf_lang=' + lang + '; expires=Fri, 31 Dec 9999 23:59:59 GMT; path=/';
  }

  // LocalStorage keys
  var STORAGE_KEYS = {
    ARTICLES: function(lang) { return 'tlf_articles_' + lang; },
    LANG: 'tlf_lang',
    HASH: 'tlf_hash',
    VERSION: 'tlf_version',
    APP_VERSION: 'tlf_app_version'
  };

  // LZ-string compression helpers
  function compressAndStore(lang, articles) {
    try {
      var articlesJson = JSON.stringify(articles);
      var compressed = LZString.compressToBase64(articlesJson);
      localStorage.setItem(STORAGE_KEYS.ARTICLES(lang), compressed);
    } catch (e) {
      console.error('Failed to compress articles:', e);
    }
  }

  function retrieveAndDecompress(lang) {
    try {
      var compressed = localStorage.getItem(STORAGE_KEYS.ARTICLES(lang));
      if (!compressed) return null;
      var decompressed = LZString.decompressFromBase64(compressed);
      return decompressed ? JSON.parse(decompressed) : null;
    } catch (e) {
      console.error('Failed to decompress articles:', e);
      localStorage.removeItem(STORAGE_KEYS.ARTICLES(lang));
      return null;
    }
  }

  function storeHash(hash) {
    localStorage.setItem(STORAGE_KEYS.HASH, hash);
  }

  function retrieveHash() {
    return localStorage.getItem(STORAGE_KEYS.HASH);
  }

  function storeVersion(version) {
    localStorage.setItem(STORAGE_KEYS.VERSION, version);
  }

  function retrieveVersion() {
    return localStorage.getItem(STORAGE_KEYS.VERSION);
  }

  function storeAppVersion(version) {
    localStorage.setItem(STORAGE_KEYS.APP_VERSION, version);
  }

  function retrieveAppVersion() {
    return localStorage.getItem(STORAGE_KEYS.APP_VERSION);
  }

  function clearArticleStorage(lang) {
    localStorage.removeItem(STORAGE_KEYS.ARTICLES(lang));
    localStorage.removeItem(STORAGE_KEYS.HASH);
  }

  // Migration logic v1.x → v2.0
  function handleMigration() {
    var storedVersion = retrieveVersion();
    var CURRENT_SCHEMA_VERSION = '2.0.0';
    
    // If no version stored or old version, migrate
    if (!storedVersion || storedVersion !== CURRENT_SCHEMA_VERSION) {
      console.log('Migration needed from v1.x to v2.0 or first run');
      
      // Clear old localStorage
      Object.keys(localStorage).forEach(function(key) {
        if (key.startsWith('tlf_')) {
          localStorage.removeItem(key);
        }
      });
      
      // Set current version
      storeVersion(CURRENT_SCHEMA_VERSION);
      storeAppVersion(CURRENT_SCHEMA_VERSION);
      
      return true;
    }
    
    return false;
  }

  // Offline-first: try to load from localStorage first
  function initializeOfflineFirst() {
    handleMigration();
    
    // Try to load from localStorage
    var storedArticles = retrieveAndDecompress(currentLang);
    
    if (storedArticles && storedArticles.length > 0) {
      // Store all articles for search
      allArticles = storedArticles;
      // Show cached content immediately
      var filteredArticles = storedArticles.filter(function(article) {
        return article.lang === currentLang;
      });
      renderArticles(filteredArticles);
      
      // Still fetch in background for updates
      worker.postMessage({ type: 'refresh' });
    } else {
      // No cache, fetch normally (worker will do initial fetch)
    }
  }

  function createArticleElement(article) {
    var card = document.createElement('article');
    card.className = 'bg-surface-container-low p-8 border-t-4 border-primary hover:bg-surface-container-high transition-colors group';

    var title = document.createElement('h3');
    title.className = 'font-headline text-xl font-bold text-on-surface mb-2 group-hover:text-primary transition-colors';
    title.textContent = article.title;
    card.appendChild(title);

    if (article.date) {
      var date = document.createElement('span');
      date.className = 'font-label text-xs text-on-surface-variant uppercase tracking-wider';
      date.textContent = article.date;
      card.appendChild(date);
    }

    if (article.tags && article.tags.length > 0) {
      var tagsRow = document.createElement('div');
      tagsRow.className = 'flex flex-wrap gap-2 mt-3 mb-4';
      article.tags.forEach(function(tag) {
        var tagEl = document.createElement('span');
        tagEl.className = 'font-label text-[10px] uppercase tracking-widest text-on-surface-variant bg-surface-container-highest px-2 py-1';
        tagEl.textContent = tag;
        tagsRow.appendChild(tagEl);
      });
      card.appendChild(tagsRow);
    }

    if (article.content) {
      var excerpt = document.createElement('p');
      excerpt.className = 'font-body text-sm text-on-surface-variant leading-relaxed mt-3';
      var text = stripHtml(article.html || article.content);
      excerpt.textContent = text.split(' ').slice(0, 50).join(' ') + '...';
      card.appendChild(excerpt);
    }
    
    // Show related articles for first article (most recent)
    if (allArticles.length > 0) {
      var related = getRelatedArticles(article, 2);
      renderRelatedArticles(related, card);
    }

    return card;
  }

  function stripHtml(html) {
    return html.replace(/<[^>]*>/g, '');
  }

  function renderArticles(articles) {
    var skeleton = document.getElementById('news-feed-skeleton');
    if (skeleton) skeleton.remove();
    while (articlesContainer.firstChild) {
      articlesContainer.removeChild(articlesContainer.firstChild);
    }
    articles.forEach(function(article) {
      articlesContainer.appendChild(createArticleElement(article));
    });
  }

  // Search functionality
  var allArticles = [];
  
  function filterArticles(query) {
    var q = query.toLowerCase().trim();
    if (!q) {
      return allArticles.filter(function(a) { return a.lang === currentLang; });
    }
    return allArticles.filter(function(a) {
      if (a.lang !== currentLang) return false;
      var title = (a.title || '').toLowerCase();
      var content = (a.content || '').toLowerCase();
      var tags = (a.tags || []).join(' ').toLowerCase();
      return title.includes(q) || content.includes(q) || tags.includes(q);
    });
  }
  
  function setupSearch() {
    var searchInput = document.getElementById('news-search');
    if (searchInput) {
      searchInput.addEventListener('input', function(e) {
        var filtered = filterArticles(e.target.value);
        renderArticles(filtered);
      });
    }
  }
  
  // Related articles based on tags
  function getRelatedArticles(currentArticle, limit) {
    if (!currentArticle || !currentArticle.tags || currentArticle.tags.length === 0) return [];
    var currentTags = currentArticle.tags;
    return allArticles
      .filter(function(a) {
        if (a.lang !== currentLang) return false;
        if (a.id === currentArticle.id) return false;
        var shared = a.tags.filter(function(t) { return currentTags.includes(t); });
        return shared.length > 0;
      })
      .sort(function(a, b) {
        var aShared = a.tags.filter(function(t) { return currentTags.includes(t); }).length;
        var bShared = b.tags.filter(function(t) { return currentTags.includes(t); }).length;
        return bShared - aShared;
      })
      .slice(0, limit || 3);
  }
  
  function renderRelatedArticles(related, container) {
    if (!related || related.length === 0 || !container) return;
    var relatedHeader = document.createElement('div');
    relatedHeader.className = 'mt-4 pt-4 border-t border-outline-variant/20';
    var relatedLabel = document.createElement('span');
    relatedLabel.className = 'font-label text-xs text-on-surface-variant uppercase tracking-widest';
    relatedLabel.textContent = 'Related';
    relatedHeader.appendChild(relatedLabel);
    container.appendChild(relatedHeader);
    related.forEach(function(article) {
      var link = document.createElement('a');
      link.className = 'block text-sm text-primary hover:text-primary-container mt-2 font-body';
      link.textContent = '→ ' + article.title;
      container.appendChild(link);
    });
  }

  function showError(message) {
    errorContainer.textContent = message;
    errorContainer.classList.remove('hidden');
  }

  function hideError() {
    errorContainer.classList.add('hidden');
    errorContainer.textContent = '';
  }

  var menuBtn = document.getElementById('mobile-menu-btn');
  var mobileMenu = document.getElementById('mobile-menu');
  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener('click', function() {
      if (mobileMenu.classList.contains('hidden')) {
        // opening
        mobileMenu.classList.remove('hidden');
        var icon = menuBtn.querySelector('.material-symbols-outlined');
        if (icon) icon.textContent = 'close';
        // focus first link
        var firstLink = mobileMenu.querySelector('a');
        if (firstLink) firstLink.focus();
        // add escape listener
        function handleEscape(e) {
          if (e.key === 'Escape') {
            closeMenu();
            document.removeEventListener('keydown', handleEscape);
          }
        }
        document.addEventListener('keydown', handleEscape);
      } else {
        closeMenu();
      }

      function closeMenu() {
        mobileMenu.classList.add('hidden');
        var icon = menuBtn.querySelector('.material-symbols-outlined');
        if (icon) icon.textContent = 'menu';
        menuBtn.focus();
      }
    });
  }

  var copyrightEl = document.getElementById('copyright-years');
  if (copyrightEl) {
    copyrightEl.textContent = '2023 - ' + new Date().getFullYear();
  }

  var phoneEl = document.getElementById('phone-obf');
  if (phoneEl) {
    var p = '+39 ' + '393' + '92' + '42165';
    var phA = document.createElement('a');
    phA.href = 'tel:' + p;
    phA.textContent = p;
    phA.className = 'text-on-surface-variant hover:text-primary transition-colors';
    phoneEl.appendChild(phA);
  }

  var emailEl = document.getElementById('email-obf');
  if (emailEl) {
    var e = 'info' + '@' + 'lucasacchi.net';
    var emA = document.createElement('a');
    emA.href = 'mailto:' + e;
    emA.textContent = e;
    emA.className = 'text-on-surface-variant hover:text-primary transition-colors';
    emailEl.appendChild(emA);
  }

  worker.onmessage = function(e) {
    var msg = e.data;
    if (msg.type === 'news') {
      hideError();
      // Store in localStorage with compression
      compressAndStore(currentLang, msg.data);
      if (msg.hash) storeHash(msg.hash);
      storeVersion(msg.version || '2.0.0');
      // Store all articles for search
      allArticles = msg.data;
      // Filter articles by current language (client-side filtering)
      var filteredArticles = msg.data.filter(function(article) {
        return article.lang === currentLang;
      });
      renderArticles(filteredArticles);
    } else if (msg.type === 'error') {
      showError(msg.message);
    } else if (msg.type === 'unchanged') {
      // no action needed
    } else if (msg.type === 'version-mismatch') {
      // Handle version mismatch - invalidate cache and force reload
      console.log('Version mismatch: ' + msg.oldVersion + ' → ' + msg.newVersion);
      clearArticleStorage(currentLang);
      storeAppVersion(msg.newVersion);
      // Force refresh of news
      worker.postMessage({ type: 'refresh' });
    }
  };

  worker.onerror = function(e) {
    showError('Worker runtime error: ' + e.message);
  };

  // Language switcher handler
  function setupLanguageSwitcher() {
    var itBtn = document.getElementById('lang-it-btn');
    var enBtn = document.getElementById('lang-en-btn');
    var itBtnMobile = document.getElementById('lang-it-btn-mobile');
    var enBtnMobile = document.getElementById('lang-en-btn-mobile');

    function updateSwitcherUI(lang) {
      // Desktop buttons
      if (itBtn) {
        itBtn.classList.toggle('border-primary', lang === 'it');
        itBtn.classList.toggle('border-outline-variant/20', lang !== 'it');
      }
      if (enBtn) {
        enBtn.classList.toggle('border-primary', lang === 'en');
        enBtn.classList.toggle('border-outline-variant/20', lang !== 'en');
      }
      // Mobile buttons
      if (itBtnMobile) {
        itBtnMobile.classList.toggle('border-primary', lang === 'it');
        itBtnMobile.classList.toggle('border-outline-variant/20', lang !== 'it');
      }
      if (enBtnMobile) {
        enBtnMobile.classList.toggle('border-primary', lang === 'en');
        enBtnMobile.classList.toggle('border-outline-variant/20', lang !== 'en');
      }
    }

    function switchLanguage(lang) {
      currentLang = lang;
      setLanguageCookie(lang);
      worker.postMessage({ type: 'refresh' });
      updateSwitcherUI(lang);
      // Update search results if there's a search query
      var searchInput = document.getElementById('news-search');
      if (searchInput && searchInput.value) {
        var filtered = filterArticles(searchInput.value);
        renderArticles(filtered);
      }
    }

    // Desktop buttons
    if (itBtn) {
      itBtn.addEventListener('click', function() {
        if (currentLang !== 'it') switchLanguage('it');
      });
    }
    if (enBtn) {
      enBtn.addEventListener('click', function() {
        if (currentLang !== 'en') switchLanguage('en');
      });
    }

    // Mobile buttons
    if (itBtnMobile) {
      itBtnMobile.addEventListener('click', function() {
        if (currentLang !== 'it') switchLanguage('it');
      });
    }
    if (enBtnMobile) {
      enBtnMobile.addEventListener('click', function() {
        if (currentLang !== 'en') switchLanguage('en');
      });
    }

    // Initialize UI
    updateSwitcherUI(currentLang);
  }

  setupLanguageSwitcher();
  
  // Initialize offline-first load strategy
  initializeOfflineFirst();
  
  // Initialize search
  setupSearch();
  
  // Initialize contact form
  var contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
      e.preventDefault();
      var name = contactForm.querySelector('[name="name"]').value;
      var email = contactForm.querySelector('[name="email"]').value;
      var message = contactForm.querySelector('[name="message"]').value;
      var body = 'Name: ' + encodeURIComponent(name) + '\nEmail: ' + encodeURIComponent(email) + '\n\nMessage:\n' + encodeURIComponent(message);
      window.location.href = 'mailto:info@lucasacchi.net?subject=Contact from thelinuxformula.com&body=' + body;
      var successMsg = document.getElementById('contact-success');
      if (successMsg) {
        successMsg.classList.remove('hidden');
        contactForm.reset();
        setTimeout(function() { successMsg.classList.add('hidden'); }, 5000);
      }
    });
  }
  
  // Initialize PWA (Service Worker)
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').then(function(registration) {
      console.log('Service Worker registered:', registration.scope);
    }).catch(function(error) {
      console.log('Service Worker registration failed:', error);
    });
  }
})();