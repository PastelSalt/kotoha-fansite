-- seed.sql — initial public content (idempotent: safe to run more than once).
-- Sources (researched 2026-09-26): Kotoha YouTube channel, official lit.link 実績, hakoniwalily.jp news/release pages.
-- Text is single-field and shown as typed in both languages (owner decision). Official Japanese wording is used
-- where it exists; short summaries written by the developer are listed in docs/JA_REVIEW_LIST.md.
-- NO credentials here: the Owner account is created by `npm run admin:bootstrap`.

-- ---------------------------------------------------------------------------
-- Latest works (videos) — the 3 newest works; stream replays excluded
-- ---------------------------------------------------------------------------
insert into videos (youtube_id, title, posted_on, status, published_at)
values
  ('032NxAyaLfQ', 'ダミーロマンス / DECO*27【Covered by Kotoha】', '2026-09-25', 'published', now()),
  ('FLH4EoRCgSQ', '劇薬中毒 /＝LOVE（イコールラブ）【Covered by Hanon×Kotoha】', '2026-09-24', 'published', now()),
  ('7pKeXq9AkBc', '透明夜(feat.MIMI) / Kotoha【Music Video】', '2026-09-23', 'published', now())
on conflict (youtube_id) do nothing;

-- ---------------------------------------------------------------------------
-- News
-- ---------------------------------------------------------------------------
insert into news (posted_on, headline, summary, links, status, published_at)
select v.posted_on::date, v.headline, v.summary, v.links::jsonb, 'published', now()
from (values
  ('2026-09-25',
   'ダミーロマンス / DECO*27【Covered by Kotoha】公開！',
   'Kotohaの歌ってみた最新作がYouTubeで公開されました。',
   '[{"url":"https://www.youtube.com/watch?v=032NxAyaLfQ","label_key":"watch"}]'),
  ('2026-09-24',
   '劇薬中毒 /＝LOVE【Covered by Hanon×Kotoha】公開！',
   'HanonとKotohaによるカバー動画がYouTubeで公開されました。',
   '[{"url":"https://www.youtube.com/watch?v=FLH4EoRCgSQ","label_key":"watch"}]'),
  ('2026-09-23',
   '透明夜(feat.MIMI) / Kotoha【Music Video】公開＆ミニアルバム「透明夜」リリース！',
   'MIMI様描き下ろし楽曲「透明夜」のMVが公開。Kotoha×MIMI コラボミニアルバム「透明夜」も9月23日(水)からデジタル配信中です。',
   '[{"url":"https://www.youtube.com/watch?v=7pKeXq9AkBc","label_key":"watch"},{"url":"https://hakoniwalily.jp/news/post-0108/","label_key":"details"}]'),
  ('2026-09-15',
   'HoneyWorks feat.ハコニワリリィ、2nd EVENT「Wonder Greeting」チケット2次先行 申込開始！',
   '2nd EVENT「Wonder Greeting」のチケット2次先行の申込受付がスタートしました。詳細は公式サイトをチェック！',
   '[{"url":"https://hakoniwalily.jp/news/20260915-2000/","label_key":"tickets"}]'),
  ('2026-08-27',
   'TVアニメ「世界最強の魔女、始めました」のOP主題歌がHoneyWorks feat.ハコニワリリィ「影響力∞アイドル」に決定！10月7日デジタルリリース！',
   '新曲「影響力∞アイドル」がTVアニメのOP主題歌に決定。10月7日にデジタルリリース予定です。',
   '[{"url":"https://hakoniwalily.jp/news/20260827-1200/","label_key":"details"}]'),
  ('2026-08-15',
   'HoneyWorks feat.ハコニワリリィ、2nd EVENT「Wonder Greeting」開催決定！',
   'HoneyWorks feat.ハコニワリリィの2nd EVENT「Wonder Greeting」の開催が決定しました。',
   '[{"url":"https://hakoniwalily.jp/news/20260815-1615/","label_key":"details"}]'),
  ('2026-07-15',
   'ハコリリ夏祭りにてCD購入キャンペーン開催！',
   '『ハコリリ夏祭り2026』の会場でCD購入キャンペーンが開催されました。',
   '[{"url":"https://hakoniwalily.jp/news/20260715-2215/","label_key":"details"}]'),
  ('2026-07-03',
   '「HoneyWorks Presents ハニフェス 2026 ～女子校文化祭 ハロウィンパーティ～」出演決定！',
   'ハコニワリリィの「ハニフェス 2026」への出演が決定しました。',
   '[{"url":"https://hakoniwalily.jp/news/post-0107/","label_key":"details"}]'),
  ('2026-06-07',
   'TVアニメ『乙女怪獣キャラメリゼ』エンディングテーマがHoneyWorks feat.ハコニワリリィ「オトメノホンキ」に決定！7月8日デジタルリリース！',
   '新曲「オトメノホンキ」がTVアニメのEDテーマに決定。7月8日にデジタルリリースされました。',
   '[{"url":"https://hakoniwalily.jp/release/%e3%82%aa%e3%83%88%e3%83%a1%e3%83%8e%e3%83%9b%e3%83%b3%e3%82%ad/","label_key":"details"}]'),
  ('2026-05-25',
   '『ハコリリ夏祭り2026』キービジュアル＆チケット情報解禁！',
   '『ハコリリ夏祭り2026』のキービジュアルとチケット情報が公開されました。',
   '[{"url":"https://hakoniwalily.jp/news/post-106/","label_key":"details"}]')
) as v(posted_on, headline, summary, links)
where not exists (
  select 1 from news n where n.headline = v.headline and n.posted_on = v.posted_on::date
);

-- ---------------------------------------------------------------------------
-- Achievements — official 実績 list (verbatim) + 2026 items and debut
-- ---------------------------------------------------------------------------
insert into achievements (achieved_on, text, status, published_at)
select v.achieved_on::date, v.text, v.status, case when v.status = 'published' then now() end
from (values
  -- Released 2026-10-07 (was a draft until the release; published 2026-10-09)
  ('2026-10-07', 'TVアニメ「世界最強の魔女、始めました」OP主題歌「影響力∞アイドル」歌唱担当（HoneyWorks feat.ハコニワリリィ）', 'published'),
  ('2026-09-23', 'Kotoha×MIMI コラボミニアルバム「透明夜」デジタルリリース', 'published'),
  ('2026-07-08', 'TVアニメ『乙女怪獣キャラメリゼ』EDテーマ「オトメノホンキ」歌唱担当（HoneyWorks feat.ハコニワリリィ）', 'published'),
  ('2026-03-11', 'ハコニワリリィ 1st ALBUM『フローライト』発売', 'published'),
  ('2026-01-14', 'TVアニメ『29歳独身中堅冒険者の日常』EDテーマ「君の隣は空気が美味しい」歌唱担当（HoneyWorks feat.Kotoha）', 'published'),
  ('2025-10-06', 'TVアニメ「笑顔のたえない職場です。」OPテーマ「絶対称賛！」歌唱担当', 'published'),
  ('2025-07-27', 'Tani Yuuki×Kotoha「点描の唄」カバー動画投稿', 'published'),
  ('2025-07-06', 'ゼンレスゾーンゼロ イメージソング『ジャンキーハニー！』歌唱担当', 'published'),
  ('2025-05-07', '優里ちゃんねるにて優里×Kotoha「地球最後の告白を」カバー動画投稿', 'published'),
  ('2025-04-27', 'Imy feat.Kotoha『追憶のファインダー』歌唱担当', 'published'),
  ('2025-04-18', '8×4(エイトフォー)WebCM「髪オロシタイケドオロセナイのうた」歌唱担当', 'published'),
  ('2025-02-22', 'TVアニメ『忍者と殺し屋のふたりぐらし』ED主題歌「にんころダンス」歌唱担当', 'published'),
  ('2025-01-16', 'TVアニメ『男女の友情は成立する？（いや、しないっ!!）』OP主題歌「質問、恋って何でしょうか？」歌唱担当', 'published'),
  ('2024-12-20', 'VISUAL ARTS『ホーリーアンデッド～非モテでぼっちの死霊術士が、聖女に転生してお友達を増やします～』よりゲーム内挿入歌『好き好き好きが好きなだけ』歌唱担当', 'published'),
  ('2024-09-06', 'TVアニメ「パーティーから追放されたその治癒師、実は最強につき」EDテーマ「Only」歌唱担当', 'published'),
  ('2024-08-16', 'TVアニメ「結婚するって、本当ですか」OPテーマ「キラキラ」歌唱担当', 'published'),
  ('2024-07-30', 'ゼンレスゾーンゼロ 邪兎屋イメージソング『Rabbit Number』歌唱担当', 'published'),
  ('2024-07-26', 'beatmania IIDX収録曲『KOTONOHA』歌唱担当', 'published'),
  ('2024-04-30', 'TV「パーティーから追放されたその治癒師、実は最強につき」イメージソング『奇跡』担当', 'published'),
  ('2024-02-16', 'ユルーカ研究所様のアルバム「Euluca Lab. Music collection 2023」にて『明日もまた、この陽だまりで。』歌唱担当', 'published'),
  ('2023-11-10', 'TVアニメ「異世界でもふもふなでなでするためにがんばってます。」OPテーマ『Cotton Days』歌唱担当', 'published'),
  ('2023-10-23', '宇都圭輝様 1st solo アルバム「Four Colors」にて『今好きになる。(cover)』歌唱担当', 'published'),
  ('2023-10-17', 'LAWSON様にて『ハコニワリリィBOOK』発売', 'published'),
  ('2023-08-02', 'Sizuk様 5th Digital Single『Baby Sweet Berry Love』歌唱担当', 'published'),
  ('2023-07-08', 'VTuberとしてデビュー（AiceClass）', 'published'),
  ('2023-06-23', 'パレット様「ましろ色シンフォニー SANA EDITION」OP『雪は何色』ED『春を連れて』歌唱担当', 'published'),
  ('2023-06-09', 'TuneCore様『The Best Covers 2022』にて『真生活(cover)』Best Cover グランプリ 受賞', 'published'),
  ('2023-06-08', 'Project Mons様 原神ファンメイド楽曲『TAEILS』歌唱担当', 'published'),
  ('2023-05-03', 'Sizuk様 3rd Digital Single『夏を呼ぶ声』', 'published'),
  ('2023-03-22', 'MIMiNARI様 2ndEP「厭わない EP」にて『足りない』歌唱担当', 'published'),
  ('2022-06-01', 'TVアニメ「阿波連さんははかれない」EDテーマ『キョリ感』歌唱担当', 'published'),
  ('2021-09-01', 'TVアニメ「SDガンダムワールド ヒーローズ」EDテーマ『コガネゾラ』歌唱担当', 'published'),
  ('2021-08-21', 'FUJI×DECO*27様『涙色スカイ』歌唱担当', 'published')
) as v(achieved_on, text, status)
where not exists (
  select 1 from achievements a where a.achieved_on = v.achieved_on::date and a.text = v.text
);

-- ---------------------------------------------------------------------------
-- Discography — covers come from youtube_id (placeholder shown when null;
-- admins can add the MV link later from the dashboard)
-- ---------------------------------------------------------------------------
insert into discography_items (title, release_type, released_on, note, youtube_id, links, status, published_at)
select v.title, v.release_type, v.released_on::date, v.note, v.youtube_id, v.links::jsonb, 'published', now()
from (values
  ('影響力∞アイドル', 'tie_in', '2026-10-07',
   'HoneyWorks feat.ハコニワリリィ / TVアニメ「世界最強の魔女、始めました」OP主題歌', null,
   '[{"url":"https://hakoniwalily.jp/release/%e5%bd%b1%e9%9f%bf%e5%8a%9b%e2%88%9e%e3%82%a2%e3%82%a4%e3%83%89%e3%83%ab/","label_key":"details"}]'),
  ('透明夜', 'ep', '2026-09-23',
   'Kotoha×MIMI コラボミニアルバム', '7pKeXq9AkBc',
   '[{"url":"https://www.youtube.com/watch?v=7pKeXq9AkBc","label_key":"watch"},{"url":"https://hakoniwalily.jp/news/post-0108/","label_key":"details"}]'),
  ('オトメノホンキ', 'tie_in', '2026-07-08',
   'HoneyWorks feat.ハコニワリリィ / TVアニメ『乙女怪獣キャラメリゼ』EDテーマ', null,
   '[{"url":"https://hakoniwalily.jp/release/%e3%82%aa%e3%83%88%e3%83%a1%e3%83%8e%e3%83%9b%e3%83%b3%e3%82%ad/","label_key":"details"}]'),
  ('フローライト', 'album', '2026-03-11',
   'ハコニワリリィ 1st ALBUM', null,
   '[{"url":"https://hakoniwalily.jp/release/727/","label_key":"details"}]'),
  -- Kotoha's solo tie-in (official credit "HoneyWorks feat.Kotoha"). Its OP twin 「君が灯してくれた光を今」 is
  -- "HoneyWorks feat.Hanon" (Hanon's solo work), so it is not part of Kotoha's discography.
  ('君の隣は空気が美味しい', 'tie_in', '2026-01-14',
   'HoneyWorks feat.Kotoha / TVアニメ『29歳独身中堅冒険者の日常』EDテーマ', null,
   '[{"url":"https://hakoniwalily.jp/release/%e5%90%9b%e3%81%ae%e9%9a%a3%e3%81%af%e7%a9%ba%e6%b0%97%e3%81%8c%e7%be%8e%e5%91%b3%e3%81%97%e3%81%84/","label_key":"details"}]'),
  ('絶対称賛！', 'tie_in', '2025-10-06',
   'TVアニメ「笑顔のたえない職場です。」OPテーマ', null,
   '[{"url":"https://hakoniwalily.jp/release/%e7%b5%b6%e5%af%be%e7%a7%b0%e8%b3%9b%ef%bc%81/","label_key":"details"}]'),
  ('追憶のファインダー', 'collab', '2025-04-27',
   'Imy feat.Kotoha', null, '[]'),
  ('にんころダンス', 'tie_in', '2025-02-22',
   'TVアニメ『忍者と殺し屋のふたりぐらし』ED主題歌', null,
   '[{"url":"https://hakoniwalily.jp/release/%e3%81%ab%e3%82%93%e3%81%93%e3%82%8d%e3%83%80%e3%83%b3%e3%82%b9/","label_key":"details"}]'),
  ('質問、恋って何でしょうか？', 'tie_in', '2025-01-16',
   'TVアニメ『男女の友情は成立する？（いや、しないっ!!）』OP主題歌', null,
   '[{"url":"https://hakoniwalily.jp/release/%e8%b3%aa%e5%95%8f%e3%80%81%e6%81%8b%e3%81%a3%e3%81%a6%e4%bd%95%e3%81%a7%e3%81%97%e3%82%87%e3%81%86%e3%81%8b%ef%bc%9f/","label_key":"details"}]'),
  ('キラキラ', 'tie_in', '2024-08-16',
   'TVアニメ「結婚するって、本当ですか」OPテーマ', null,
   '[{"url":"https://hakoniwalily.jp/release/%e3%82%ad%e3%83%a9%e3%82%ad%e3%83%a9/","label_key":"details"}]')
) as v(title, release_type, released_on, note, youtube_id, links)
where not exists (
  select 1 from discography_items d where d.title = v.title and d.released_on = v.released_on::date
);
