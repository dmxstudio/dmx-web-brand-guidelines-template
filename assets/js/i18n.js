window.I18N = (function () {
  var lang = localStorage.getItem('meridian-lang') || 'es';
  var dict = {};

  function load(l) {
    return fetch('assets/i18n/' + l + '.json')
      .then(function (r) { return r.json(); })
      .then(function (d) { dict = d; })
      .catch(function () { dict = {}; });
  }

  var ready = load(lang);

  function t(key) {
    var v = key.split('.').reduce(function (o, k) { return o && o[k]; }, dict);
    return (v == null) ? key : v;
  }

  function apply(root) {
    root = root || document;
    root.querySelectorAll('[data-i18n]').forEach(function (el) {
      el.textContent = t(el.getAttribute('data-i18n'));
    });
    root.querySelectorAll('[data-i18n-attr]').forEach(function (el) {
      el.getAttribute('data-i18n-attr').split(';').forEach(function (pair) {
        var p = pair.split(':');
        if (p.length === 2) el.setAttribute(p[0].trim(), t(p[1].trim()));
      });
    });
    document.documentElement.lang = lang;
  }

  function setLang(l) {
    if (l === lang) return;
    lang = l;
    localStorage.setItem('meridian-lang', l);
    load(l).then(function () {
      apply();
      window.dispatchEvent(new CustomEvent('i18n:changed'));
    });
  }

  return {
    ready: ready,
    apply: apply,
    setLang: setLang,
    t: t,
    get lang() { return lang; }
  };
})();
