/**
 * i18n - Internationalization module for LogWhispererAI landing page
 * Uses cookie-based language persistence (tlf_lang) for consistency with main site
 */
(function() {
  'use strict';

  var currentLang = 'en';
  var translations = {};
  var loadAttempts = 0;
  var MAX_LOAD_ATTEMPTS = 3;

  // Wait for DOM if script is deferred
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    currentLang = getPreferredLanguage();
    loadTranslations(currentLang);
  }

  function getPreferredLanguage() {
    var langCookie = document.cookie.split('; ').find(function(row) {
      return row.startsWith('tlf_lang=');
    });
    if (langCookie) {
      var lang = langCookie.split('=')[1];
      if (lang === 'en' || lang === 'it') return lang;
    }
    var browserLang = navigator.language || navigator.userLanguage;
    if (browserLang.startsWith('it')) return 'it';
    if (browserLang.startsWith('en')) return 'en';
    return 'en';
  }

  function setLanguageCookie(lang) {
    document.cookie = 'tlf_lang=' + lang + '; expires=Fri, 31 Dec 9999 23:59:59 GMT; path=/';
  }

  function loadTranslations(lang) {
    fetch('./i18n/' + lang + '.json')
      .then(function(response) {
        if (!response.ok) {
          throw new Error('Failed to load translations');
        }
        return response.json();
      })
      .then(function(data) {
        translations = data;
        currentLang = lang;
        applyTranslations();
        updateLanguageButtons();
      })
      .catch(function(error) {
        console.error('i18n: Failed to load ' + lang + ', attempting fallback', error);
        if (lang !== 'en' && loadAttempts < MAX_LOAD_ATTEMPTS) {
          loadAttempts++;
          loadTranslations('en');
        }
      });
  }

  function applyTranslations() {
    var elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(function(el) {
      var key = el.getAttribute('data-i18n');
      var text = getTranslation(key);
      if (text) {
        if (el.tagName === 'INPUT' && el.placeholder !== undefined) {
          el.placeholder = text;
        } else {
          el.textContent = text;
        }
      }
    });

    // Update document language attribute
    document.documentElement.lang = currentLang;
  }

  function getTranslation(key) {
    var keys = key.split('.');
    var value = translations;
    for (var i = 0; i < keys.length; i++) {
      if (value && typeof value === 'object') {
        value = value[keys[i]];
      } else {
        return null;
      }
    }
    return value;
  }

  function switchLanguage(lang) {
    if (lang === currentLang) return;
    setLanguageCookie(lang);
    loadTranslations(lang);
  }

  function updateLanguageButtons() {
    var buttons = document.querySelectorAll('[data-lang-switch]');
    buttons.forEach(function(btn) {
      var targetLang = btn.getAttribute('data-lang-switch');
      if (targetLang === currentLang) {
        btn.classList.add('lang-active');
        btn.setAttribute('aria-current', 'true');
      } else {
        btn.classList.remove('lang-active');
        btn.removeAttribute('aria-current');
      }
    });
  }

  // Expose public API
  window.i18n = {
    switchLanguage: switchLanguage,
    getCurrentLanguage: function() { return currentLang; },
    getTranslation: getTranslation,
    reload: function() { loadTranslations(currentLang); }
  };
})();