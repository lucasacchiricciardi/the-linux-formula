(function() {
  // Wait for DOM if script is deferred
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      init();
    });
  } else {
    init();
  }

  function init() {
    // Global error handlers for production
    window.onerror = function(message, source, lineno, colno, error) {
      showError('An error occurred. Please refresh the page.');
      return false;
    };

    window.onunhandledrejection = function(event) {
      showError('An error occurred. Please refresh the page.');
    };

    var worker;
    try {
      // Determine base URL dynamically based on current page location
      // For GitHub Pages subdirectory: /the-linux-formula/
      // For custom domain: / or empty
      var pathParts = window.location.pathname.split('/').filter(Boolean);
      var baseUrl = pathParts.length > 0 ? '/' + pathParts[0] : '';
      
      worker = new Worker(baseUrl + 'newsWorker.js');
      worker.postMessage({ type: 'init', baseUrl: baseUrl });
    } catch (e) {
      showError('Failed to initialize news. Please refresh the page.');
      return;
    }

    var articlesContainer = document.getElementById('news-feed-container').querySelector('#news-feed-articles') || document.getElementById('news-feed-articles');
    var errorContainer = document.getElementById('news-feed-container').querySelector('#news-feed-error') || document.getElementById('news-feed-error');

    var currentLang = getPreferredLanguage();

    function getPreferredLanguage() {
      var langCookie = document.cookie.split('; ').find(function(row) { return row.startsWith('tlf_lang='); })?.split('=')[1];
      if (langCookie) return langCookie;
      var browserLang = navigator.language || navigator.userLanguage;
      if (browserLang.startsWith('it')) return 'it';
      if (browserLang.startsWith('en')) return 'en';
      return 'it';
    }

    function setLanguageCookie(lang) {
      document.cookie = 'tlf_lang=' + lang + '; expires=Fri, 31 Dec 9999 23:59:59 GMT; path=/';
    }

     var STORAGE_KEYS = {
       ARTICLES: function(lang) { return 'tlf_articles_' + lang; },
       LANG: 'tlf_lang',
       HASH: 'tlf_hash',
       VERSION: 'tlf_version',
       APP_VERSION: 'tlf_app_version'
     };

    function compressAndStore(lang, articles) {
      try {
        var articlesJson = JSON.stringify(articles);
        var compressed = LZString.compressToBase64(articlesJson);
        localStorage.setItem(STORAGE_KEYS.ARTICLES(lang), compressed);
      } catch (e) {
        // Silent fail
      }
    }

function retrieveAndDecompress(lang) {
  try {
    // Try to get articles for requested language
    var compressed = localStorage.getItem(STORAGE_KEYS.ARTICLES(lang));
    if (compressed) {
      var decompressed = LZString.decompressFromBase64(compressed);
      return decompressed ? JSON.parse(decompressed) : null;
    }
    
    // If not found, try to get articles from ANY language storage key
    // (since all language keys contain the full articles dataset)
    for (var i = 0; i < localStorage.length; i++) {
      var key = localStorage.key(i);
      if (key.startsWith('tlf_articles_')) {
        compressed = localStorage.getItem(key);
        if (compressed) {
          var decompressed = LZString.decompressFromBase64(compressed);
          return decompressed ? JSON.parse(decompressed) : null;
        }
      }
    }
    
    return null;
  } catch (e) {
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

    function retrieveVersion() {
      return localStorage.getItem(STORAGE_KEYS.APP_VERSION);
    }

    function storeVersion(version) {
      localStorage.setItem(STORAGE_KEYS.VERSION, version);
    }

    function clearArticleStorage(lang) {
      localStorage.removeItem(STORAGE_KEYS.ARTICLES(lang));
      localStorage.removeItem(STORAGE_KEYS.HASH);
    }

    function handleMigration() {
      var storedVersion = localStorage.getItem(STORAGE_KEYS.VERSION);
      var CURRENT_SCHEMA_VERSION = '2.0.0';
      if (!storedVersion || storedVersion !== CURRENT_SCHEMA_VERSION) {
        Object.keys(localStorage).forEach(function(key) {
          if (key.startsWith('tlf_')) {
            localStorage.removeItem(key);
          }
        });
        localStorage.setItem(STORAGE_KEYS.VERSION, CURRENT_SCHEMA_VERSION);
        return true;
      }
      return false;
    }

     function initializeOfflineFirst() {
       handleMigration();
       // Store app version for version checking
       storeVersion('2.0.0');
       try {
         var storedArticles = retrieveAndDecompress(currentLang);
         if (storedArticles && storedArticles.length > 0) {
           allArticles = storedArticles;
           var filteredArticles = storedArticles.filter(function(article) { return article.lang === currentLang; });
           renderArticles(filteredArticles);
           worker.postMessage({ type: 'refresh' });
         }
       } catch (e) {
         // Fetch normally
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

      if (allArticles.length > 0) {
        var related = getRelatedArticles(article, 2);
        renderRelatedArticles(related, card);
      }

      // Social share buttons
      var shareRow = document.createElement('div');
      shareRow.className = 'flex gap-3 mt-4 pt-4 border-t border-outline-variant/20';
      
      var linkedinBtn = document.createElement('a');
      linkedinBtn.className = 'text-on-surface-variant hover:text-[#0077b5] transition-colors text-sm font-label';
      linkedinBtn.href = 'https://www.linkedin.com/shareArticle?mini=true&url=' + encodeURIComponent('https://lucasacchiricciardi.github.io/the-linux-formula/') + '&title=' + encodeURIComponent(article.title);
      linkedinBtn.target = '_blank';
      linkedinBtn.title = 'Share on LinkedIn';
      var linkedinIcon = document.createElement('span');
      linkedinIcon.className = 'material-symbols-outlined';
      linkedinIcon.textContent = 'work';
      linkedinBtn.appendChild(linkedinIcon);
      shareRow.appendChild(linkedinBtn);
      
      var emailBtn = document.createElement('a');
      emailBtn.className = 'text-on-surface-variant hover:text-primary transition-colors text-sm font-label';
      emailBtn.href = 'mailto:?subject=' + encodeURIComponent(article.title) + '&body=' + encodeURIComponent(article.title + '\n\nhttps://lucasacchiricciardi.github.io/the-linux-formula/');
      emailBtn.title = 'Share via email';
      var emailIcon = document.createElement('span');
      emailIcon.className = 'material-symbols-outlined';
      emailIcon.textContent = 'mail';
      emailBtn.appendChild(emailIcon);
      shareRow.appendChild(emailBtn);
      
      var copyBtn = document.createElement('button');
      copyBtn.className = 'text-on-surface-variant hover:text-primary transition-colors text-sm font-label';
      copyBtn.title = 'Copy link';
      var copyIcon = document.createElement('span');
      copyIcon.className = 'material-symbols-outlined';
      copyIcon.textContent = 'link';
      copyBtn.appendChild(copyIcon);
      copyBtn.addEventListener('click', function() {
        navigator.clipboard.writeText('https://lucasacchiricciardi.github.io/the-linux-formula/').then(function() {
          copyIcon.textContent = 'check';
          setTimeout(function() { copyIcon.textContent = 'link'; }, 2000);
        });
      });
      shareRow.appendChild(copyBtn);
      
      card.appendChild(shareRow);

      return card;
    }

    function stripHtml(html) {
      return html.replace(/<[^>]*>/g, '');
    }

    function renderArticles(articles) {
      currentFilteredArticles = articles;
      currentPage = 0;
      renderPage(0);
    }

    function renderPage(page) {
      var skeleton = document.getElementById('news-feed-skeleton');
      if (skeleton) skeleton.remove();
      while (articlesContainer.firstChild) articlesContainer.removeChild(articlesContainer.firstChild);

      if (currentFilteredArticles.length === 0) {
        var msg = document.createElement('div');
        msg.className = 'col-span-full text-center py-12';
        msg.innerHTML = '<p class="font-body text-lg text-on-surface-variant">Nessun articolo trovato.</p>';
        articlesContainer.appendChild(msg);
      } else {
        currentFilteredArticles.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE).forEach(function(a) {
          articlesContainer.appendChild(createArticleElement(a));
        });
      }
      updatePaginationControls(page);
    }

    function updatePaginationControls(page) {
      var totalPages = Math.ceil(currentFilteredArticles.length / PAGE_SIZE);
      var paginationContainer = document.getElementById('blog-pagination-container');

      if (paginationContainer) {
        paginationContainer.innerHTML = '';
        if (totalPages > 1) {
          var div = document.createElement('div');
          div.className = 'hidden md:flex justify-center items-center gap-6 mt-12';

          var prevBtn = document.createElement('button');
          prevBtn.className = 'font-label text-xs uppercase tracking-wider text-on-surface-variant hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
          prevBtn.textContent = '← Precedente';
          prevBtn.disabled = (page === 0);
          prevBtn.addEventListener('click', function() {
            if (page > 0) { currentPage = page - 1; renderPage(currentPage); document.getElementById('news-feed-container').scrollIntoView({ behavior: 'smooth' }); }
          });

          var info = document.createElement('span');
          info.className = 'font-label text-xs uppercase tracking-wider text-on-surface-variant';
          info.textContent = (page + 1) + ' / ' + totalPages;

          var nextBtn = document.createElement('button');
          nextBtn.className = 'font-label text-xs uppercase tracking-wider text-on-surface-variant hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
          nextBtn.textContent = 'Successivo →';
          nextBtn.disabled = (page >= totalPages - 1);
          nextBtn.addEventListener('click', function() {
            if (page < totalPages - 1) { currentPage = page + 1; renderPage(currentPage); document.getElementById('news-feed-container').scrollIntoView({ behavior: 'smooth' }); }
          });

          div.appendChild(prevBtn); div.appendChild(info); div.appendChild(nextBtn);
          paginationContainer.appendChild(div);
        }
      }

      var loadMoreBtn = document.getElementById('blog-load-more');
      if (loadMoreBtn) {
        var hasMore = (page + 1) * PAGE_SIZE < currentFilteredArticles.length;
        loadMoreBtn.style.display = hasMore ? '' : 'none';
        if (hasMore) {
          loadMoreBtn.onclick = function() {
            currentPage++;
            currentFilteredArticles.slice(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE)
              .forEach(function(a) { articlesContainer.appendChild(createArticleElement(a)); });
            if ((currentPage + 1) * PAGE_SIZE >= currentFilteredArticles.length) loadMoreBtn.style.display = 'none';
          };
        }
      }
    }

    var allArticles = [];

    // Pagination state
    var PAGE_SIZE = 6;
    var currentPage = 0;
    var currentFilteredArticles = [];
    
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

    function showToast(message, type) {
      type = type || 'info';
      var container = document.getElementById('toast-container');
      if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.style.cssText = 'position:fixed;top:20px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:8px;';
        document.body.appendChild(container);
      }
      var toast = document.createElement('div');
      var bg = type === 'success' ? 'bg-primary-container' : type === 'error' ? 'bg-error-container' : 'bg-surface-container-high';
      var fg = type === 'success' ? 'text-on-primary-container' : type === 'error' ? 'text-on-error-container' : 'text-on-surface';
      toast.className = 'font-body text-sm ' + bg + ' ' + fg + ' px-4 py-3 border border-outline-variant/20 shadow-lg animate-slideIn';
      toast.textContent = message;
      container.appendChild(toast);
      setTimeout(function() {
        toast.style.opacity = '0'; toast.style.transition = 'opacity 0.3s';
        setTimeout(function() { toast.remove(); }, 300);
      }, 4000);
    }

    function setupPushNotifications() {
      var btn = document.getElementById('push-enable-btn');
      var btnM = document.getElementById('push-enable-btn-mobile');
      if (!btn && !btnM) return;

      function setGranted() {
        [btn, btnM].forEach(function(b) {
          if (!b) return;
          b.style.opacity = '0.5'; b.disabled = true; b.title = 'Notifiche abilitate ✓';
        });
      }
      function handleClick() {
        if (Notification.permission === 'granted') { setGranted(); return; }
        if (Notification.permission !== 'denied') {
          Notification.requestPermission().then(function(p) {
            if (p === 'granted') { setGranted(); showToast('Notifiche abilitate! Riceverai avvisi per i nuovi articoli.', 'success'); }
          });
        }
      }
      if (btn) btn.addEventListener('click', handleClick);
      if (btnM) btnM.addEventListener('click', handleClick);
      if (Notification.permission === 'granted') setGranted();
    }

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
      if (errorContainer) {
        errorContainer.textContent = message;
        errorContainer.classList.remove('hidden');
      }
    }

    var menuBtn = document.getElementById('mobile-menu-btn');
    var mobileMenu = document.getElementById('mobile-menu');
    if (menuBtn && mobileMenu) {
      menuBtn.addEventListener('click', function() {
        if (mobileMenu.classList.contains('hidden')) {
          mobileMenu.classList.remove('hidden');
          var icon = menuBtn.querySelector('.material-symbols-outlined');
          if (icon) icon.textContent = 'close';
          var firstLink = mobileMenu.querySelector('a');
          if (firstLink) firstLink.focus();
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
      try {
        var msg = e.data;
        if (msg.type === 'news') {
          var previousHash = localStorage.getItem(STORAGE_KEYS.HASH);
          var isNewArticles = previousHash && previousHash !== msg.hash;

          compressAndStore(currentLang, msg.data);
          if (msg.hash) storeHash(msg.hash);
          if (msg.version) storeVersion(msg.version);
          allArticles = msg.data;
          var filteredArticles = msg.data.filter(function(article) { return article.lang === currentLang; });
          renderArticles(filteredArticles);

          if (isNewArticles) showToast('📰 Nuovo articolo disponibile!', 'success');
        } else if (msg.type === 'error') {
          showError('Unable to load news. Please check your connection.');
    } else if (msg.type === 'unchanged') {
      // Re-filter and re-render with current language
      var filteredArticles = allArticles.filter(function(article) { return article.lang === currentLang; });
      renderArticles(filteredArticles);
    } else if (msg.type === 'version-mismatch') {
      // Clear local cache and reload
      clearArticleStorage(currentLang);
      storeVersion(msg.newVersion);
    }
      } catch (err) {
        showError('An error occurred while loading news.');
      }
    };

    worker.onerror = function(e) {
      showError('Worker runtime error: ' + e.message);
    };

    function setupLanguageSwitcher() {
      var itBtn = document.getElementById('lang-it-btn');
      var enBtn = document.getElementById('lang-en-btn');
      var itBtnMobile = document.getElementById('lang-it-btn-mobile');
      var enBtnMobile = document.getElementById('lang-en-btn-mobile');

      function updateSwitcherUI(lang) {
        if (itBtn) {
          itBtn.classList.toggle('border-primary', lang === 'it');
          itBtn.classList.toggle('border-outline-variant/20', lang !== 'it');
        }
        if (enBtn) {
          enBtn.classList.toggle('border-primary', lang === 'en');
          enBtn.classList.toggle('border-outline-variant/20', lang !== 'en');
        }
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
        var searchInput = document.getElementById('news-search');
        if (searchInput && searchInput.value) {
          var filtered = filterArticles(searchInput.value);
          renderArticles(filtered);
        }
      }

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

      updateSwitcherUI(currentLang);
    }

    setupLanguageSwitcher();
    initializeOfflineFirst();
    setupSearch();
    setupPushNotifications();

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(function() {
        // Silent fail
      });
    }
  } // end init()

  // Start initialization
})();