(function () {
  var M = window.MERIDIAN, I = window.I18N;
  var cur = document.body.dataset.page;
  var idx = M.pages.findIndex(function (p) { return p.id === cur; });
  var clkId = null, clkUntil = 0;

  function pad(n) { return String(n).padStart(2, '0'); }

  function buildTopNav() {
    var el = document.getElementById('site-nav');
    if (!el) return;
    el.className = 'site-nav';
    var links = M.pages.map(function (p, i) {
      return '<a href="' + p.file + '"' + (p.id === cur ? ' class="active" aria-current="page"' : '') + '>' +
        '<i class="ti ' + p.icon + '" aria-hidden="true"></i>' +
        '<span class="pn">' + pad(i) + '</span>' +
        '<span data-i18n="nav.' + p.id + '">' + p.id + '</span></a>';
    }).join('');
    el.innerHTML =
      '<div class="nav-in">' +
        '<a class="brand" href="index.html">' + M.mark + '<span>' + M.brand + '</span></a>' +
        '<nav class="nav-links" id="nav-links" aria-label="Brand guide">' + links + '</nav>' +
        '<button class="theme-btn" type="button" aria-label="Tema / Theme"><i class="ti ti-moon" aria-hidden="true"></i></button>' +
        '<div class="lang" role="group" aria-label="Idioma / Language">' +
          '<button data-lang="es" type="button">ES</button>' +
          '<button data-lang="en" type="button">EN</button>' +
        '</div>' +
        '<button class="menu-btn" type="button" aria-label="Menú" aria-controls="nav-links" aria-expanded="false"><i class="ti ti-menu-2" aria-hidden="true"></i></button>' +
      '</div>';
    el.querySelectorAll('.lang button').forEach(function (b) {
      b.addEventListener('click', function () { I.setLang(b.dataset.lang); });
    });
    el.querySelector('.theme-btn').addEventListener('click', toggleTheme);
    applyTheme(currentTheme());
    if (window.matchMedia) {
      matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
        if (!localStorage.getItem('meridian-theme')) applyTheme(e.matches ? 'dark' : 'light');
      });
    }
    var menuBtn = el.querySelector('.menu-btn');
    var navLinks = el.querySelector('.nav-links');
    function closeMenu() {
      navLinks.classList.remove('open');
      menuBtn.setAttribute('aria-expanded', 'false');
      menuBtn.querySelector('i').className = 'ti ti-menu-2';
    }
    menuBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = navLinks.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      menuBtn.querySelector('i').className = open ? 'ti ti-x' : 'ti ti-menu-2';
    });
    document.addEventListener('click', function (e) {
      if (navLinks.classList.contains('open') && !el.contains(e.target)) closeMenu();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMenu();
    });
  }

  function markLang() {
    document.querySelectorAll('.lang button').forEach(function (b) {
      b.classList.toggle('on', b.dataset.lang === I.lang);
    });
  }

  function currentTheme() {
    return document.documentElement.getAttribute('data-theme') ||
      (window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  }
  function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    var btn = document.querySelector('.theme-btn');
    if (btn) {
      var dark = t === 'dark';
      btn.querySelector('i').className = 'ti ' + (dark ? 'ti-sun' : 'ti-moon');
      btn.setAttribute('aria-label', I.t(dark ? 'ui.themeLight' : 'ui.themeDark'));
    }
  }
  function toggleTheme() {
    var t = currentTheme() === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('meridian-theme', t); } catch (e) {}
    applyTheme(t);
  }

  function setActiveSub(bar, id) {
    var inner = bar.querySelector('.subnav-in');
    bar.querySelectorAll('a').forEach(function (l) {
      var on = l.getAttribute('data-sec') === id;
      l.classList.toggle('active', on);
      if (on && inner) inner.scrollLeft = l.offsetLeft - inner.clientWidth / 2 + l.offsetWidth / 2;
    });
  }

  function buildSubnav() {
    var existing = document.querySelector('.subnav');
    if (existing) existing.remove();
    var secs = Array.prototype.slice.call(document.querySelectorAll('main > section[id]'));
    if (!secs.length) return;
    var items = secs.map(function (s) {
      var h = s.querySelector('h2');
      var num = s.querySelector('.sec-num');
      return '<a href="#' + s.id + '" data-sec="' + s.id + '">' +
        (num ? '<span class="tn">' + num.textContent + '</span>' : '') +
        '<span>' + (h ? h.textContent : s.id) + '</span></a>';
    }).join('');
    var bar = document.createElement('nav');
    bar.className = 'subnav';
    bar.setAttribute('aria-label', I.t('ui.onthispage'));
    bar.innerHTML = '<div class="subnav-in">' + items + '</div>';
    document.getElementById('site-nav').insertAdjacentElement('afterend', bar);
    bar.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        clkId = a.getAttribute('data-sec');
        clkUntil = Date.now() + 800;
        setActiveSub(bar, clkId);
      });
    });
    spy(secs, bar);
  }

  function spy(secs, bar) {
    var navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 60;
    var subH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--subnav-h')) || 49;
    var lineY = navH + subH + 20;  // fixed — matches scroll-padding-top so clicked sections land active
    var ticking = false;
    function pick() {
      var docEl = document.documentElement;
      if (Math.ceil(window.innerHeight + window.scrollY) >= docEl.scrollHeight - 2) {
        return secs[secs.length - 1].id;  // bottom of page → last section
      }
      var current = secs[0].id;
      for (var i = 0; i < secs.length; i++) {
        if (secs[i].getBoundingClientRect().top <= lineY) current = secs[i].id;
        else break;
      }
      return current;
    }
    function update() {
      ticking = false;
      setActiveSub(bar, (Date.now() < clkUntil && clkId) ? clkId : pick());
    }
    function onScroll() {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }
    if (window.__meridianSpy) window.removeEventListener('scroll', window.__meridianSpy);
    window.__meridianSpy = onScroll;
    window.addEventListener('scroll', onScroll, { passive: true });
    update();
  }

  function buildPager() {
    var f = document.getElementById('pager');
    if (!f) return;
    f.className = 'pager';
    var prev = M.pages[idx - 1], next = M.pages[idx + 1];
    var h = '';
    if (prev) {
      h += '<a href="' + prev.file + '"><span class="dir"><i class="ti ti-arrow-left" aria-hidden="true"></i> <span data-i18n="ui.prev">Anterior</span></span>' +
        '<span class="tt" data-i18n="nav.' + prev.id + '">' + prev.id + '</span></a>';
    } else { h += '<span></span>'; }
    if (next) {
      h += '<a class="nx" href="' + next.file + '"><span class="dir"><span data-i18n="ui.next">Siguiente</span> <i class="ti ti-arrow-right" aria-hidden="true"></i></span>' +
        '<span class="tt" data-i18n="nav.' + next.id + '">' + next.id + '</span></a>';
    } else { h += '<span></span>'; }
    f.innerHTML = h;
  }

  function initNavHide() {
    var navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 60;
    var lastY = Math.max(0, window.scrollY);
    var ticking = false;
    function update() {
      ticking = false;
      var y = Math.max(0, window.scrollY);
      var d = y - lastY;
      if (Math.abs(d) < 6) return;
      if (d > 0 && y > navH * 1.6) document.body.classList.add('nav-up');
      else if (d < 0) document.body.classList.remove('nav-up');
      lastY = y;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
  }

  function initToTop() {
    var b = document.getElementById('to-top');
    if (!b) return;
    window.addEventListener('scroll', function () {
      b.classList.toggle('show', window.scrollY > 600);
    }, { passive: true });
    b.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
  }

  function injectPrint() {
    if (document.querySelector('.print-head')) return;
    var pageTitle = (document.querySelector('.page-head h1, .hero h1') || {}).textContent || '';
    var ph = document.createElement('div');
    ph.className = 'print-head';
    ph.innerHTML = '<span>' + M.brand + ' · Brand Guidelines</span><span>' + pageTitle + '</span>';
    var pf = document.createElement('div');
    pf.className = 'print-foot';
    pf.innerHTML = '<span>' + M.version + '</span><span>meridian.example</span>';
    document.body.appendChild(ph);
    document.body.appendChild(pf);
  }

  function setupReveal() {
    var els = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
    var vh = window.innerHeight || document.documentElement.clientHeight;
    // Initial paint: show what's already in view instantly (no load animation).
    els.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < vh && r.bottom > 0) el.classList.add('no-anim', 'in-view');
    });
    if (!('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('in-view'); });
      return;
    }
    // Re-triggers every time: reveal on enter, reset (off-screen) on exit.
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) e.target.classList.add('in-view');
        else e.target.classList.remove('in-view', 'no-anim');
      });
    }, { threshold: 0 });
    els.forEach(function (el) { io.observe(el); });
  }

  function tagMotion() {
    document.documentElement.classList.add('js');
    document.querySelectorAll('main > section').forEach(function (sec) {
      Array.prototype.forEach.call(sec.children, function (c) { c.classList.add('reveal'); });
    });
    var hw = document.querySelector('.home-wrap');
    if (hw) {
      Array.prototype.forEach.call(hw.children, function (c) {
        if (!c.classList.contains('hero') && !c.classList.contains('toc-list')) c.classList.add('reveal');
      });
      document.querySelectorAll('.toc-list .chapter').forEach(function (c) { c.classList.add('reveal'); });
      var mk = document.querySelector('.hero .mk-lg');
      if (mk) mk.classList.add('parallax');
    }
    setupReveal();
  }

  document.addEventListener('DOMContentLoaded', function () {
    buildTopNav();
    buildPager();
    initToTop();
    initNavHide();
    tagMotion();
    I.ready.then(function () {
      I.apply();
      markLang();
      buildSubnav();
      injectPrint();
    });
    window.addEventListener('i18n:changed', function () {
      I.apply();
      markLang();
      applyTheme(currentTheme());
      buildSubnav();
      var ph = document.querySelector('.print-head'), pf = document.querySelector('.print-foot');
      if (ph) ph.remove(); if (pf) pf.remove();
      injectPrint();
    });
  });
})();
