// Regular stream: Tuesdays & Fridays 21:00 JST (= 12:00 UTC the same day). "Live" for 2 hours after.
// The ticket shows flip digits (days · hrs · min · sec); screen readers get a calm once-a-minute sentence.
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
  const ticket = document.getElementById('ticket');
  const nums = [...document.querySelectorAll('#flip .flip__num')];
  const sr = document.getElementById('stream-sr');
  const schedule = document.getElementById('stream-schedule');
  if (!ticket || nums.length !== 4) return;
  let lastMinute = -1;

  const tick = () => {
    const now = Date.now();
    const s = nextStream(now);
    if (!s) return;
    ticket.classList.toggle('is-live', s.live);
    ticket.dataset.live = String(s.live);
    // the schedule line doubles as the "your local time" tooltip
    const local = new Intl.DateTimeFormat(document.documentElement.lang, { weekday: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(s.start));
    schedule.title = t('home.streamLocal', { time: local });
    if (s.live) {
      if (lastMinute !== -2) { lastMinute = -2; sr.textContent = t('home.streamLive'); }
      return;
    }
    let diff = Math.max(0, Math.floor((s.start - now) / 1000));
    const days = Math.floor(diff / 86400); diff %= 86400;
    const h = Math.floor(diff / 3600); diff %= 3600;
    const m = Math.floor(diff / 60); const sec = diff % 60;
    [days, h, m, sec].map(pad).forEach((v, i) => {
      if (nums[i].textContent === v) return;
      nums[i].textContent = v;
      nums[i].classList.remove('is-flipping');
      void nums[i].offsetWidth;          // restart the flip animation
      nums[i].classList.add('is-flipping');
    });
    if (m !== lastMinute) {
      lastMinute = m;
      const u = t('home.units');
      sr.textContent = `${t('home.nextStream')}: ${days} ${u.d}, ${h} ${u.h}, ${m} ${u.m}`;
    }
  };

  tick();
  setInterval(tick, 1000);
  onLangChange(() => { lastMinute = -1; tick(); });
}
