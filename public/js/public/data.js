// Static site data: official links and artwork credits.

export const SOCIALS = [
  { id: 'x', label: 'X (Twitter)', handle: '@kotoha_ktnh', url: 'https://x.com/kotoha_ktnh', icon: '/assets/img/icon-x-96.webp' },
  { id: 'youtube', label: 'YouTube', handle: '@Kotoha_ktnh', url: 'https://www.youtube.com/@Kotoha_ktnh', icon: '/assets/img/icon-youtube-96.webp' },
  { id: 'twitch', label: 'Twitch', handle: '@kotoha_hkll', url: 'https://www.twitch.tv/kotoha_hkll', icon: '/assets/img/icon-twitch-96.webp' },
  // Official icon from TwitCasting's brand guideline pack (https://about.moi.st/en/guideline/), resized only
  { id: 'twitcasting', label: 'TwitCasting', handle: '@kotoha_ktnh', url: 'https://twitcasting.tv/kotoha_ktnh', icon: '/assets/img/icon-twitcasting-96.webp' },
];

export const OFFICIAL_LINKS = [
  ...SOCIALS.map(({ id, label, url }) => ({ id, label, url })),
  { id: 'instagram', label: 'Instagram', url: 'https://www.instagram.com/kotoha_ktnh/' },
  { id: 'bluesky', label: 'Bluesky', url: 'https://bsky.app/profile/kotohaktnh.bsky.social' },
  { id: 'fanbox', label: 'PixivFANBOX', url: 'https://kotoha-ktnh.fanbox.cc/' },
  { id: 'litlink', label: 'lit.link', url: 'https://lit.link/kotohaktnh' },
  { id: 'hakoniwalily', label: 'ハコニワリリィ Official', url: 'https://hakoniwalily.jp/' },
  { id: 'booth', label: 'BOOTH (goods)', url: 'https://hanon-goods.booth.pm/' },
];

// Artwork credits (source URLs as shown in the owner's references). null = artist unknown.
export const CREDITS = {
  home: { handle: '@kuroli', url: 'https://x.com/kuroli/status/2093632342233641201' },
  about: null,
  news: { handle: '@Parfait_Pie_12', url: 'https://x.com/Parfait_Pie_12/status/1596201447003394048' },
  discography: { handle: '@snowclole', url: 'https://x.com/snowclole/status/1784902250097422367' },
  gallery: { handle: '@snowclole', url: 'https://x.com/snowclole/status/1762039953431875623' },
  loader1: null,
  loader2: { handle: '@kuroli', url: 'https://x.com/kuroli/status/2064361892999815515' },
  loader3: null,
  profile: null,
};
