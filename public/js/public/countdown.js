// Regular stream countdown: Tuesdays & Fridays 21:00 JST (= 12:00 UTC the same day). "Live" for 2 hours after.
import { t, onLangChange } from '../shared/i18n-core.js';

const STREAM_DAYS = [2, 5];            // Tue, Fri (UTC day == JST day at 12:00 UTC)
const START_UTC_HOUR = 12;
const LIVE_MS = 2 * 60 * 60 * 1000;

export function nextStream(now = Date.now()) {
  const d = new Date(now);
  for (let i = -1; i < 9; i++) {
    const start = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + i, START_UTC_HOUR);
    if (!STREAM_DAYS.includes(new Date(start).getUTCDay())) continue;
    if (now < start) return { start, live: false };
    if (now < start + LIVE_MS) return { start, live: true };
  }
  return null;
}

const pad = (n) => String(n).padStart(2, '0');

export function startCountdown() {
  const card = document.getElementById('stream-card');
  const out = document.getElementById('stream-countdown');
  const sr = document.getElementById('stream-sr');
  const schedule = document.getElementById('stream-schedule');
  if (!card || !out) return;
  let lastMinute = -1;

  const tick = () => {
    const now = Date.now();
    const s = nextStream(now);
    if (!s) return;
    card.classList.toggle('is-live', s.live);
    if (s.live) {
      out.textContent = t('home.streamLive');
    } else {
      let diff = Math.max(0, Math.floor((s.start - now) / 1000));
      const days = Math.floor(diff / 86400); diff %= 86400;
      const h = Math.floor(diff / 3600); diff %= 3600;
      const m = Math.floor(diff / 60); const sec = diff % 60;
      out.textContent = `${pad(days)} ${pad(h)} ${pad(m)} ${pad(sec)}`;
      if (m !== lastMinute) {           // screen readers get a calm once-a-minute text
        lastMinute = m;
        const u = t('home.units');
        sr.textContent = `${t('home.streamLabel')} ${days} ${u.d}, ${h} ${u.h}, ${m} ${u.m}`;
      }
    }
    // Viewer's local time for the next stream (tooltip)
    const local = new Intl.DateTimeFormat(document.documentElement.lang, {
      weekday: 'short', hour: '2-digit', minute: '2-digit',
    }).format(new Date(s.start));
    schedule.title = t('home.streamLocal', { time: local });
  };

  tick();
  setInterval(tick, 1000);
  onLangChange(() => { lastMinute = -1; tick(); });
}
