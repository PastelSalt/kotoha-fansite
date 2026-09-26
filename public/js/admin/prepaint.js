// Pre-paint (classic, blocking, tiny): apply an explicit language choice before the first paint.
// A file rather than an inline <script> so the Content-Security-Policy needs no hashes.
(function () {
  var lang = null;
  try {
    var q = new URLSearchParams(location.search).get('lang');
    lang = (q === 'ja' || q === 'en') ? q : localStorage.getItem('kf_lang');
  } catch (e) { /* storage blocked */ }
  if (lang === 'ja' || lang === 'en') { document.documentElement.lang = lang; document.documentElement.dataset.langChosen = '1'; }
})();
