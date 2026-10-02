// Pre-paint (classic, blocking, tiny) — a file rather than an inline <script> so the CSP needs no hashes.
// Language (explicit choice only; IP default is applied during loading) + random loader art.
(function () {
  var d = document.documentElement, lang = null;
  try {
    var q = new URLSearchParams(location.search).get('lang');
    if (q === 'ja' || q === 'en') lang = q; else lang = localStorage.getItem('kf_lang');
  } catch (e) {}
  if (lang === 'ja' || lang === 'en') { d.lang = lang; d.dataset.langChosen = '1'; }
  d.dataset.loaderArt = String(1 + Math.floor(Math.random() * 3));
  d.classList.add('js');
  // Third-party stylesheets are added from script so they never block the first paint:
  // on a slow network the loader still shows at once and fonts swap in when they arrive.
  // [href, Subresource Integrity hash] — Google Fonts CSS varies per browser, so it can't carry one.
  // The public site (html[data-site=public], design v2) has its own animation system; login/admin keep Animate.css.
  var sheets = [['https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=M+PLUS+Rounded+1c:wght@500;700;800&family=Yomogi&display=swap', ''],
   ['https://cdn.jsdelivr.net/npm/lenis@1.1.18/dist/lenis.css', 'sha256-X9HQQlKUVJZP551O2vV2oeXKi83GoJN+cfyXquUg6xs=']];
  if (d.dataset.site !== 'public') sheets.push(['https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css', 'sha384-Gu3KVV2H9d+yA4QDpVB7VcOyhJlAVrcXd0thEjr4KznfaFPLe0xQJyonVxONa4ZC']);
  sheets.forEach(function (s) {
    var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = s[0];
    if (s[1]) { l.integrity = s[1]; l.crossOrigin = 'anonymous'; }
    document.head.appendChild(l);
  });
})();
