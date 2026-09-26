-- 0001_init.sql — initial schema for the Kotoha fansite (see docs/IMPLEMENTATION_PLAN.md §9)
-- Conventions:
--   * all timestamps are timestamptz (UTC); "today" defaults use Japan time (Asia/Tokyo)
--   * admin-entered text is single-field, shown as typed in both languages
--   * content is never hard-deleted by the app: rows move to archived_content

-- ---------------------------------------------------------------------------
-- Shared trigger: keep updated_at current
-- ---------------------------------------------------------------------------
create or replace function set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Accounts
-- ---------------------------------------------------------------------------
create sequence admin_number_seq start with 2 minvalue 2;

create table admin_users (
  id                        bigint generated always as identity primary key,
  username                  text not null unique check (username ~ '^[a-z0-9_.-]{3,40}$'),
  role                      text not null default 'admin' check (role in ('owner', 'admin')),
  admin_number              integer unique check (admin_number >= 2),
  password_hash             text not null,
  must_change_password      boolean not null default true,
  temp_password_expires_at  timestamptz,
  password_changed_at       timestamptz,
  failed_login_count        integer not null default 0 check (failed_login_count >= 0),
  locked_until              timestamptz,
  last_login_at             timestamptz,
  is_active                 boolean not null default true,
  preferred_lang            text check (preferred_lang in ('ja', 'en')),
  created_by                bigint references admin_users (id) on delete set null,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),
  constraint admin_number_matches_role check (
    (role = 'owner' and admin_number is null) or (role = 'admin' and admin_number is not null)
  ),
  constraint owner_always_active check (role <> 'owner' or is_active)
);
-- exactly one owner
create unique index admin_users_single_owner on admin_users ((role)) where role = 'owner';
create trigger admin_users_updated_at before update on admin_users
  for each row execute function set_updated_at();

create table admin_sessions (
  id             bigint generated always as identity primary key,
  admin_user_id  bigint not null references admin_users (id) on delete cascade,
  token_hash     text not null unique,
  created_at     timestamptz not null default now(),
  last_seen_at   timestamptz not null default now(),
  expires_at     timestamptz not null,
  revoked_at     timestamptz,
  user_agent     text
);
create index admin_sessions_user_idx on admin_sessions (admin_user_id);
create index admin_sessions_expires_idx on admin_sessions (expires_at);

create table login_attempts (
  id                  bigint generated always as identity primary key,
  attempted_at        timestamptz not null default now(),
  ip_hash             text not null,
  username_attempted  text not null,
  succeeded           boolean not null
);
create index login_attempts_ip_idx on login_attempts (ip_hash, attempted_at desc);
create index login_attempts_user_idx on login_attempts (username_attempted, attempted_at desc);

-- ---------------------------------------------------------------------------
-- Content
-- ---------------------------------------------------------------------------
create table videos (
  id            bigint generated always as identity primary key,
  youtube_id    text not null unique check (youtube_id ~ '^[A-Za-z0-9_-]{11}$'),
  title         text not null check (char_length(btrim(title)) between 1 and 200),
  posted_on     date not null default ((now() at time zone 'Asia/Tokyo')::date),
  status        text not null default 'draft' check (status in ('draft', 'published')),
  published_at  timestamptz,
  created_by    bigint references admin_users (id) on delete set null,
  updated_by    bigint references admin_users (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index videos_public_idx on videos (status, posted_on desc, created_at desc);
create trigger videos_updated_at before update on videos
  for each row execute function set_updated_at();

create table news (
  id            bigint generated always as identity primary key,
  posted_on     date not null default ((now() at time zone 'Asia/Tokyo')::date),
  headline      text not null check (char_length(btrim(headline)) between 1 and 200),
  summary       text not null check (char_length(btrim(summary)) between 1 and 500),
  -- up to 3 links: [{ "url": "https://…", "label_key": "watch|listen|details|tickets|official|shop" }]
  links         jsonb not null default '[]'::jsonb
                check (jsonb_typeof(links) = 'array' and jsonb_array_length(links) <= 3),
  status        text not null default 'draft' check (status in ('draft', 'published')),
  published_at  timestamptz,
  created_by    bigint references admin_users (id) on delete set null,
  updated_by    bigint references admin_users (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index news_public_idx on news (status, posted_on desc, id desc);
create trigger news_updated_at before update on news
  for each row execute function set_updated_at();

create table achievements (
  id            bigint generated always as identity primary key,
  achieved_on   date not null,
  text          text not null check (char_length(btrim(text)) between 1 and 500),
  link_url      text check (link_url ~ '^https?://'),
  status        text not null default 'draft' check (status in ('draft', 'published')),
  published_at  timestamptz,
  created_by    bigint references admin_users (id) on delete set null,
  updated_by    bigint references admin_users (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index achievements_public_idx on achievements (status, achieved_on desc, id desc);
create trigger achievements_updated_at before update on achievements
  for each row execute function set_updated_at();

create table discography_items (
  id            bigint generated always as identity primary key,
  title         text not null check (char_length(btrim(title)) between 1 and 200),
  release_type  text not null default 'single'
                check (release_type in ('single', 'album', 'ep', 'tie_in', 'cover', 'collab', 'other')),
  released_on   date not null,
  note          text check (note is null or char_length(note) <= 500),
  youtube_id    text check (youtube_id ~ '^[A-Za-z0-9_-]{11}$'),
  links         jsonb not null default '[]'::jsonb
                check (jsonb_typeof(links) = 'array' and jsonb_array_length(links) <= 3),
  status        text not null default 'draft' check (status in ('draft', 'published')),
  published_at  timestamptz,
  created_by    bigint references admin_users (id) on delete set null,
  updated_by    bigint references admin_users (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index discography_public_idx on discography_items (status, released_on desc, id desc);
create trigger discography_items_updated_at before update on discography_items
  for each row execute function set_updated_at();

create table gallery_images (
  id                    bigint generated always as identity primary key,
  cloudinary_public_id  text not null unique,
  cloudinary_version    bigint not null,
  secure_url            text not null check (secure_url ~ '^https://'),
  width                 integer not null check (width > 0),
  height                integer not null check (height > 0),
  format                text not null,
  bytes                 integer not null check (bytes >= 0),
  author_name           text not null check (char_length(btrim(author_name)) between 1 and 100),
  source_url            text check (source_url ~ '^https?://'),
  status                text not null default 'published' check (status in ('draft', 'published')),
  uploaded_by           bigint references admin_users (id) on delete set null,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create index gallery_public_idx on gallery_images (status, created_at desc, id desc);
create trigger gallery_images_updated_at before update on gallery_images
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Archive (no permanent deletion of content) & activity log
-- ---------------------------------------------------------------------------
create table archived_content (
  id                    bigint generated always as identity primary key,
  source_table          text not null check (source_table in
                          ('videos', 'news', 'achievements', 'discography_items', 'gallery_images', 'admin_users')),
  source_section        text not null,
  original_id           bigint not null,
  record                jsonb not null,       -- full snapshot (never includes password hashes)
  archived_at           timestamptz not null default now(),
  archived_by_id        bigint references admin_users (id) on delete set null,
  archived_by_username  text not null,
  reason                text,
  note                  text,                 -- e.g. 'Image file permanently deleted from Cloudinary'
  restored_at           timestamptz,
  restored_by_id        bigint references admin_users (id) on delete set null
);
create index archived_content_source_idx on archived_content (source_table, archived_at desc);
create index archived_content_time_idx on archived_content (archived_at desc);

create table activity_log (
  id              bigint generated always as identity primary key,
  admin_user_id   bigint references admin_users (id) on delete set null,
  admin_username  text not null,
  action          text not null,               -- e.g. 'news.create', 'gallery.delete', 'account.create'
  entity_type     text,
  entity_id       bigint,
  details         jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now()
);
create index activity_log_time_idx on activity_log (created_at desc);

-- ---------------------------------------------------------------------------
-- Analytics (first-party, cookieless)
-- ---------------------------------------------------------------------------
create table analytics_events (
  id             bigint generated always as identity primary key,
  occurred_at    timestamptz not null default now(),
  event_type     text not null check (event_type in (
                   'page_view', 'section_dwell', 'video_play', 'outbound_click', 'news_link_click',
                   'gallery_open', 'gallery_credit_click', 'language_switch', 'loader_timing')),
  visit_id       text not null,               -- random per page load (not stored in the browser)
  visitor_hash   text not null,               -- daily-rotating salted hash; no raw IP stored
  section        text check (section in ('home', 'about', 'news', 'discography', 'gallery', 'footer')),
  duration_ms    integer check (duration_ms >= 0),
  content_type   text check (content_type in ('video', 'news', 'achievement', 'discography', 'gallery', 'social')),
  content_id     bigint,                      -- soft reference (history survives archiving)
  target         text,
  device_type    text not null default 'unknown' check (device_type in ('mobile', 'tablet', 'desktop', 'unknown')),
  browser        text,
  language       text check (language in ('ja', 'en')),
  country        text,
  referrer_host  text,
  environment    text not null default 'production' check (environment in ('production', 'preview', 'development'))
);
create index analytics_events_time_idx on analytics_events (occurred_at);
create index analytics_events_type_time_idx on analytics_events (event_type, occurred_at);
create index analytics_events_content_idx on analytics_events (content_type, content_id, occurred_at);

create table analytics_daily (
  day        date not null,                   -- Japan-time calendar day
  metric     text not null,
  dimension  text not null default '',
  value      bigint not null,
  primary key (day, metric, dimension)
);
