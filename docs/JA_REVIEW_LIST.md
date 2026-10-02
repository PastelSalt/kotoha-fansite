# Japanese Review List

Japanese text **written by the developer** (not copied from official sources). Please have a native speaker check these. Per the owner's decision, nothing changes until that feedback arrives.

Status legend: ⏳ awaiting review · ✅ reviewed OK · ✏️ changed after review

## 1. Seed news summaries (`db/seed.sql` → `news.summary`)

Headlines are official wording (hakoniwalily.jp / YouTube titles). Only the summaries below are mine.

| Date | Summary | Status |
|---|---|---|
| 2026-09-25 | Kotohaの歌ってみた最新作がYouTubeで公開されました。 | ⏳ |
| 2026-09-24 | HanonとKotohaによるカバー動画がYouTubeで公開されました。 | ⏳ |
| 2026-09-23 | MIMI様描き下ろし楽曲「透明夜」のMVが公開。Kotoha×MIMI コラボミニアルバム「透明夜」も9月23日(水)からデジタル配信中です。 | ⏳ |
| 2026-09-15 | 2nd EVENT「Wonder Greeting」のチケット2次先行の申込受付がスタートしました。詳細は公式サイトをチェック！ | ⏳ |
| 2026-08-27 | 新曲「影響力∞アイドル」がTVアニメのOP主題歌に決定。10月7日にデジタルリリース予定です。 | ⏳ |
| 2026-08-15 | HoneyWorks feat.ハコニワリリィの2nd EVENT「Wonder Greeting」の開催が決定しました。 | ⏳ |
| 2026-07-15 | 『ハコリリ夏祭り2026』の会場でCD購入キャンペーンが開催されました。 | ⏳ |
| 2026-07-03 | ハコニワリリィの「ハニフェス 2026」への出演が決定しました。 | ⏳ |
| 2026-06-07 | 新曲「オトメノホンキ」がTVアニメのEDテーマに決定。7月8日にデジタルリリースされました。 | ⏳ |
| 2026-05-25 | 『ハコリリ夏祭り2026』のキービジュアルとチケット情報が公開されました。 | ⏳ |

## 2. Achievements written in the official style (`achievements.text`)

The 27 entries from the official 実績 list are verbatim. These are mine:

| Date | Text | Status |
|---|---|---|
| 2026-10-07 | TVアニメ「世界最強の魔女、始めました」OP主題歌「影響力∞アイドル」歌唱担当（HoneyWorks feat.ハコニワリリィ）*(draft until release)* | ⏳ |
| 2026-09-23 | Kotoha×MIMI コラボミニアルバム「透明夜」デジタルリリース | ⏳ |
| 2026-07-08 | TVアニメ『乙女怪獣キャラメリゼ』EDテーマ「オトメノホンキ」歌唱担当（HoneyWorks feat.ハコニワリリィ） | ⏳ |
| 2026-03-11 | ハコニワリリィ 1st ALBUM『フローライト』発売 | ⏳ |
| 2023-07-08 | VTuberとしてデビュー（AiceClass） | ⏳ |

**Typographic fixes to official text** (brackets only, wording unchanged): 2024-12-20 closing 」→』; 2023-10-23 ｢Four Colors｣ → 「Four Colors」; 2023-06-23 「…｣ → 「…」.

## 3. Discography notes (`discography_items.note`)

| Title | Note | Status |
|---|---|---|
| 影響力∞アイドル | HoneyWorks feat.ハコニワリリィ / TVアニメ「世界最強の魔女、始めました」OP主題歌 | ⏳ |
| 透明夜 | Kotoha×MIMI コラボミニアルバム | ⏳ |
| オトメノホンキ | HoneyWorks feat.ハコニワリリィ / TVアニメ『乙女怪獣キャラメリゼ』EDテーマ | ⏳ |
| フローライト | ハコニワリリィ 1st ALBUM | ⏳ |
| 君の隣は空気が美味しい / 君が灯してくれた光を今 | ハコニワリリィ デジタルシングル | ⏳ |
| 絶対称賛！ / にんころダンス / 質問、恋って何でしょうか？ / キラキラ | (anime tie-in descriptions, taken from official wording) | ⏳ |

## 4. UI text, headings, About, footer (`public/locales/ja.json`)

**All of `public/locales/ja.json` was written by the developer.** Priority lines for review:

| Key | Text | Status |
|---|---|---|
| `about.bio1` | Kotohaは、AiceClass所属の歌い手・VTuberです。Hanonとの2人組ユニット「ハコニワリリィ」のボーカルと、HoneyWorksのサポートボーカルを務めています。 | ⏳ |
| `about.bio2` | 2023年7月8日にVTuberとしてデビュー。毎週火曜日・金曜日の21:00頃から、トーク・歌・ゲームの配信をしています。ファンネームは「ことリス」、ファンマークは🍀（🥦じゃないよ！）。 | ⏳ |
| `about.pills` | 誕生日／身長／デビュー／活動／ファン／定期配信／ハッシュタグ／好きなもの | ⏳ |
| `loader.credit` | このサイトはファンプロジェクトです　制作：Moeko Software and Technologies | ⏳ |
| `footer.disclaimer` | このサイトは非公式・非営利のファンサイトです。…権利は、それぞれの権利者様・作者様に帰属します。 | ⏳ |
| `footer.contact` / `footer.privacy` | 不具合、クレジットの訂正、掲載の取り下げのご依頼はこちらまで：／…匿名で集計しています… | ⏳ |
| `gallery.by` | イラスト：{name}（ギャラリーのクレジット。以前は「{name}さん」） | ⏳ |
| `home.*`, `nav.*`, `gallery.*` | 定期配信まで：／スクロールしてね！／プロフィール／もっと見る／今はここまで！ など | ⏳ |
| Design v2 additions (2026-10-02) | `home.nextStream` 次の配信／`home.live` 配信中！／`home.weekLabel` 今週の配信予定（日本時間）／`home.bubbleVideo` 見てね♡／`home.unitHoney` HoneyWorksサポートボーカル／`home.fanArtBy` ピックアップ・{name}さん／`home.seeGallery` ギャラリーを見る ✿ | ⏳ |
| | `about.role` 歌い手・VTuber（AiceClass所属）／`about.hashtags` ハッシュタグ／`about.fanMark` ファンマークは🍀／`about.tags` #ことらじ 生配信・#ことぴく ファンアート・#ことメモ 切り抜き | ⏳ |
| | `discography.comingSoon` もうすぐ公開／`discography.inDays` あと{n}日／`discography.daysToGo` 日後／`discography.releaseOn` リリース日・{date} | ⏳ |
| | `gallery.thanks` 絵師さん、ありがとう！♡／`gallery.note` すべてのイラストに作者名を表示し、元の投稿へのリンクを付けています。 | ⏳ |
| | `motion.on/off/device` モーションON／モーションOFF／お使いの端末の設定で、動きを減らしています／`loader.didYouKnow` 知ってた？／`footer.settings` 設定／`footer.official` 公式リンク／`video.latest` 最新 | ⏳ |
| Section titles (not in the locale files) | ダイナミックな英字見出しに添えた日本語：プロフィール／ニュース／ディスコグラフィ・実績／ファンアート／最新情報／最新作／実績、縦書き：ことはってどんな人？／ことはの最新情報／うたとあゆみ | ⏳ |

## 5. Admin panel (`public/locales/admin/ja.json`)

**All of `public/locales/admin/ja.json` was written by the developer.** Only admins see it, so it is lower priority than the public site. Lines worth a look:

| Key | Text | Status |
|---|---|---|
| `password.*` | パスワードの条件（12文字以上、ユーザー名を含まない など）と強制変更の説明 | ⏳ |
| `accounts.*` | 仮パスワード（7日間有効）の説明、削除・リセットの確認文 | ⏳ |
| `archive.*` | アーカイブ／復元の説明 | ⏳ |
| `analytics.hint` | 公開サイトへの訪問数です。日本時間で集計しています（週は月曜日始まり）。 | ⏳ |
| `analytics.sectionsHint` | 各セクションまで見た訪問の割合・そこでの平均滞在時間。 | ⏳ |
| `analytics.uniquesLegend` | ユニーク訪問者（1日ごとに集計） | ⏳ |
| `analytics.privacyNote` | Cookieは使用せず、IPアドレスも保存していません。この管理画面にログイン中のブラウザ、ボット、テスト環境からのアクセスは集計されません。… | ⏳ |
