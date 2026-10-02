# TYPE B — Brand LP 制作・検証レポート

更新: 2026-10-02 / ソース確認済みチェックポイント。実画面レビューは未完了。

## 1. Branch と独立性

- Branch: `dot/tomisho-type-b-brand-lp`
- Baseline: `dc8170f92afbdf9ea543d3d928667f4e23d7efc1`
- TYPE C / D のコード・設計から派生していない独立した実装
- main / production / 公開用ブランチに対する編集・merge・deploy は実行しない

## 2. Concept

**「荻窪の夜に、ひとつ奥へ。」**

馴染みの街から、料理と人の距離が近い一晩へ。情報を並べるのではなく、ページを読み進めるにつれ店の奥へ入る編集型 Brand LP。

## 3. Target user experience

初めて知った人が「店の空気を少し感じてから、席を決める」。すでに知る人は、固定ヘッダーまたは mobile 下部から予約・店舗情報へ直行できる。長いストーリーを読まないと電話できない設計にはしない。

## 4. Design idea

- Warm charcoal `#191a17`、flat ivory `#eae5d9`、鈍い草色、少量の炭の暖色
- 日本語明朝の大きな見出しと小さな英語の編集ラベル。情報本文はゴシック
- 冒頭の大きな料理写真、抽象的なカウンター、焼き魚の close-up、明るい季節料理ページ、料理人を表すタイポグラフィ、日本酒の静かな余韻という章立て
- 角丸カード群・高級旅館調・和紙・家紋・桜・大きな装飾的エフェクトを用いない
- 店内・店主・炭火そのものの写真はない。抽象表現と、実際にある料理写真を明確に使い分ける

## 5. Implementation

Semantic HTML / CSS / vanilla JavaScript。ネイティブスクロール、anchor navigation、`details` disclosure menu。IntersectionObserver は到着時の短い fade / translate のみで、コンテンツ表示の前提にならない。スクロール量は軽いヘッダーの読了線で示す。

10 の必須要素は Hero / Philosophy / Counter / Charcoal / Food / Chef / Seasonal / Sake / Access / Reservation として実装。料理人の年齢・容姿・来店者の人物情報など、内部の方向づけ情報は公開コピーに含めていない。

## 6. Libraries

本体依存ライブラリなし。framework / build step / runtime network font / map iframe なし。

QA ハーネスだけ Playwright を使用可能。任意で axe-core。両方とも配信するサイトの bundle には入らない。Pillow は既存画像の WebP リサイズ変換にのみ使用し、生成画像・合成した店舗写真は使っていない。

## 7. Existing assets used

- `hero-sashimi.jpg`: Hero
- `grilled-fish.jpg`: Charcoal / 焼き物
- `seasonal-sashimi.jpg`: Food / 旬
- `uni-bite.jpg`: Food / 一杯に寄り添う一口
- `logo-tomisho.png`: Philosophy

全オリジナル画像は保持。他の料理画像は視覚的な繰り返しを避けるため今回表示しない。4 枚の JPG から 640px / 最大1280px の WebP を用意し、`picture` の元 JPG fallback とする。

## 8. Major changes

- IA / HTML / CSS / JS を Brand LP のために再設計
- 情報カード群を廃し、photo / typography / interval の流れに変更
- 予約導線は電話に統一。Instagram を未確認の予約方法として案内しない
- Google Maps は既存の正確なリンクを維持し、重い iframe を初期読み込みしない
- 元の旧 owner URL を、別途確認された現行 `local-store-web.github.io/tomisho-hp/` へ修正
- Favicon / image dimensions / loading priority / alt / focus / reduced motion / preview noindex を追加
- 本番設定を変える旧 README 手順を R&D 用の説明に置き換え

## 9. Deterministic verification

実施済み:

- `python3 qa/verify_static.py`: PASS。40 の anchor / asset 参照、重複 ID、heading、必須 section、metadata、既存の連絡先リンク、JSON-LD の事実を検査
- `node --check script.js`: PASS
- `node --check qa/verify_browser.cjs`: PASS
- `git diff --check`: PASS
- 使用した全既存画像を contact sheet / 元画像で目視確認
- 8 個の WebP 派生の寸法を実ファイルで確認
- 独立したソースレビューで alt の未確認表現、360px CTA overlap リスク、本文の小ささを発見し修正

未実施:

- Chromium の実行、console / runtime、スクリーンショット、実 viewport での overflow / clipping / focus の確認
- axe-core / Lighthouse / 実機 Safari / VoiceOver
- 外部 Instagram / Maps の最終遷移先の動作確認

環境上のブラウザ実行制限があり、別の実行環境で `qa/verify_browser.cjs` を実行する必要がある。ソース検査を実画面テストの代わりと表現しない。

## 10. Responsive

360 / 390 / 768 / 1440px を対象に breakpoint と viewport 対応を実装。700px 以下は別構成の縦読み、native flow の Hero CTA、disclosure navigation、固定の電話・店舗情報バー。safe-area と fixed bar 分の本文余白を設けた。

768px 付近は独立の tablet 調整。写真の比率・位置を width ごとに指定し、見出しは明示改行。`qa/verify_browser.cjs` が各幅の PNG と実測チェックを生成する。現在は実測結果未取得。

## 11. Accessibility

- `lang=ja`、one h1、順序を維持した見出し、landmarks、skip link
- 意味のある画像 alt、abstract visuals は `aria-hidden`
- 基本操作 target は最小44px、mobile 電話バーは65px
- 常時利用可能な電話・場所、キーボード操作可能な disclosure
- Escape で menu を閉じ summary へ focus、menu anchor 選択後は対象 section へ focus
- 2px visible focus。下部固定 UI の内側にも focus ring
- reduced motion で smooth scroll / animation を停止
- JS 無効でも全コピー・画像・電話・地図リンクが利用可能
- モーション前は可視。JS が失敗しても reveal のせいで非表示にならない

これらは実装・ソース検査済みであり、支援技術での確認済みという意味ではない。

## 12. Performance

- JS は約2.5KB（非圧縮）、本体の外部ライブラリなし
- 固定寸法と aspect-ratio を使用。Hero だけ eager / high priority、それ以外は lazy
- 最大1280px WebP の料理4枚合計は約571KB、640px版4枚合計は約265KB。元画像4枚合計は約1.615MB
- 外部 map iframe / font / video / canvas は読み込まない
- animation は opacity / transform、scroll handler は passive + requestAnimationFrame
- 実測 LCP / CLS / INP / Lighthouse score は未取得。数値を推測して採点しない

## 13. Unresolved issues

1. 最優先: 別の browser-capable 環境で全4幅を実表示し、round 3 の視覚修正・再検証を行う
2. 店内・店主・炭火・日本酒の実写不足。抽象表現は意図的だが、本番撮影で説得力が増す
3. 営業時間・休業日・写真・Maps は既存 repo 情報。店舗本人の最終確認が必要
4. 系統フォントのため OS ごとに和文字面が異なる。macOS / iOS / Android で改行を最終確認
5. ローカルソースの完成は、本番公開・受賞水準の達成を保証するものではない

## 14. Production 化前

- 実画面 / 実機 / keyboard / reduced motion / no-JS / axe / Lighthouse を最終実施
- 写真の使用権・料理表記・営業情報・予約方法を店舗確認
- 公開先と canonical / OGP の整合を個別承認後に確定し、preview noindex を本番対象だけ外す
- 店内・料理人の実写に置換した場合、alt / crops / image budgets を再検証
- merge / production deploy / Pages 設定は別途承認。今回操作しない

## Review rounds

| Round | 発見 | 修正 | 確認 |
|---|---|---|---|
| 1 IA / implementation | 元の情報カード型ではこの案の物語が伝わらない | 10要素を奥へ進む7章とHero/予約へ再構成 | ソースと全 section ID 確認。実表示は未実施 |
| 2 typography / clarity | 360px Hero CTA の絶対配置 overlap リスク、本文10px、alt の未確認カウンター表記 | CTAを通常フロー化、実用本文12px、altを卓上表記へ修正 | 独立 reviewer とソース検査で再確認。実表示は未実施 |
| 3 actual visual / accessibility / performance | 実行環境がブラウザを起動できない | 自動検査・スクリーンショット harness を同梱 | 別環境で実行待ち。未完了 |

## 撮影優先順位（TYPE B）

1. カウンター越しの料理人と手元。距離感が分かる横長、本人の掲載許諾が前提
2. 夜の暖簾と入口。街から店へ入る序章
3. 炭火と焼き台。火力より、静かな赤い熱
4. 一皿を差し出す手。顔がなくても人物の気配が伝わる近景
5. 木のカウンターと一席。空間の奥行き、客の顔なし
6. 日本酒を注ぐ手と器。銘柄・ラベルの掲載可否を確認
7. 店主の自然な portrait。本人が望む姿・場面で
8. 季節料理一皿。現在のスマートフォン写真を代替する寄りと引き
9. 食後の器、グラス、灯り。一晩の終わりを表す静物
10. 荻窪の夜と外観。位置情報と導入用

## 他店への再利用

- 「入口 → 距離 → 調理 → 一皿 → つくる人 → 余韻 → 来店」の editorial IA
- 暗色 / 明色 / 中間色を章ごとに切り替える rhythm
- 写真が不足する箇所を、事実を装わず typography / abstract composition で補う方法
- 長い Brand LP と独立した reservation / access の短い導線
- 静的 first / no-JS usable / enhancement-only motion
- responsive WebP + fixed dimensions + four-width QA harness

店舗固有の言葉・画像・色・並びは案件ごとに設計し直す。共通 component 化は今回行っていない。
