// Pre-paint (classic, blocking, tiny): decide the motion mode before the first paint so nothing flickers.
// "calm" = the device asks for reduced motion, or the visitor switched motion off on this site (stored locally).
(function () {
  var off = false;
  try { off = localStorage.getItem('kf_motion') === 'off'; } catch (e) { /* storage blocked */ }
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.dataset.motion = off || reduce ? 'calm' : 'full';
})();
