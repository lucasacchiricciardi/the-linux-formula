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

  worker.onmessage = function(e) {
    var msg = e.data;
    if (msg.type === 'news') {
      hideError();
      renderArticles(msg.data);
    } else if (msg.type === 'error') {
      showError(msg.message);
    } else if (msg.type === 'unchanged') {
      // no action needed
    }
  };

  worker.onerror = function(e) {
    showError('Worker runtime error: ' + e.message);
  };
})();