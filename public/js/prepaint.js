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
  ['https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=M+PLUS+Rounded+1c:wght@500;700;800&display=swap',
   'https://cdn.jsdelivr.net/npm/lenis@1.1.18/dist/lenis.css',
   'https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css'].forEach(function (href) {
    var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = href; document.head.appendChild(l);
  });
})();
