# TYPE D — Experience / Award

## 1. Branch / baseline

- Branch: `dot/tomisho-type-d-experience`
- Base main: `dc8170f92afbdf9ea543d3d928667f4e23d7efc1`
- 本案は main から独立制作。他案の構造・コード・デザインの流用なし
- main、公開 branch、Pages、ドメイン、本番データには変更なし

## 2. Concept / target experience

**夜に、余熱を。**

来店前の情報収集を、荻窪の一晩の入口に変える。「火」「旬」「余韻」の順にページの明暗と写真の距離を切り替える。店の空気を読み進めた後、電話と道順に迷わず到達する体験。

巨大な明朝体、低彩度の深緑、灰白の明るい料理章、細い橙の線。演出に店舗の実写があるようには見せず、未撮影の炭火は明確な CSS の抽象表現、酒はタイポグラフィで扱う。

## 3. Independent information architecture

1. 入口 — 料理を大きく見せる導入、ブランド名、任意の微かな火の粉
2. 火 — 抽象的な炭の造形と、待つ時間
3. 旬 — 横方向の料理連続写真。モバイルでは非対称の縦組み
4. 余韻 — カウンターでの会話、日本酒。架空の店主画像・経歴なし
5. 荻窪 — 住所、既存営業時間、地図、電話予約

章ナビは PC の補助として使用。スマートフォンはヘッダーの直接リンクと固定下部 CTA を優先する。

## 4. Implementation / libraries

- 静的 HTML / CSS / Vanilla JavaScript、production 依存ライブラリー **0**
- Canvas 2D は装飾のみ。本文表示・スクロール・電話予約から独立
- 約 30fps 上限、粒子数 PC 24 / mobile 12、DPR 1.5 上限
- 画面外・非表示タブで停止。`prefers-reduced-motion`、save-data、低メモリー端末には演出を省略
- ユーザーが随時停止・再開できるボタン。音声なし、カーソル置換なし、スクロール乗っ取りなし
- 横写真は native overflow + scroll snap。送りボタン、キーボードスクロール可能
- JS 無効でも全文、全写真、予約と地図のリンクは HTML に存在
- `tests/browser-qa.cjs` の Playwright は QA のみ。公開サイトへの bundle / deployment 影響はない

## 5. Existing assets

実装使用: `grilled-fish.jpg`（Hero）、`seasonal-sashimi.jpg`、`uni-bite.jpg`、`oyster.jpg`、`logo-tomisho.png`。
料理は既存素材だけを WebP 480 / 960px に変換。元ファイルは全て保存。
`hero-sashimi.jpg` は既存公開 URL 上の OGP を参照。
その他の元写真は削除せず、無理に全画像を配置していない。

## 6. Major changes

既存の説明型カード構成を、5 つの章からなる没入型エディトリアルに置き換え。外部地図 iframe を直接リンクにして第三者リクエストを減らした。画像サイズ指定、lazy loading、Hero priority と srcset を導入。favicon、Restaurant JSON-LD、R&D noindex を追加。旧所有者 URL の canonical / OGP を確認済み現在 URL に修正。

## 7. Verification status (rendered QA, 2026-10-02)

実行済み:

- `python3 tests/validate.py`: pass
- `node --check script.js`: pass
- `node --check tests/browser-qa.cjs`: pass
- HTML の 1 h1 / 1 main / lang、重複 ID、内部アンカー、全 src / srcset の実ファイル、画像 alt / dimensions、blank-link rel を実データで検証
- 住所・営業時間・電話・Instagram・Maps が baseline の事実と一致
- JSON-LD が parse 可能で、review / rating / award / 推測の価格帯を含まない
- 既存写真の実ピクセルを確認済み

この環境の `/usr/bin/chromium` を Playwright から起動し、ローカル HTTP 上の実レンダリングを確認した。`BROWSER_EXECUTABLE=/usr/bin/chromium node tests/browser-qa.cjs` は **pass**。結果は `docs/qa/browser-results.json`、画像は `docs/qa/screenshots/` に保存。

| viewport | first view | full page | result |
| --- | --- | --- | --- |
| 360 × 844 | `360-first-view.png` | `360-full.png` | pass |
| 390 × 844 | `390-first-view.png` | `390-full.png` | pass |
| 768 × 1000 | `768-first-view.png` | `768-full.png` | pass |
| 1440 × 1000 | `1440-first-view.png` | `1440-full.png` | pass |

各幅で水平 overflow なし、全写真ロード成功、console / page error / failed request なし、可視のリンク・ボタンは 44px 以上、h1 は 1 個。画像を目視し、desktop の横料理列、mobile の縦料理列、章の余白、写真の切り抜き、ヘッダー、固定下部 CTA と footer 余白を確認。PC は送りボタンとフォーカス後の右矢印キー、mobile は固定 CTA から店舗案内、footer から先頭への反復遷移を確認。skip link の Tab / Enter と focus outline も確認。

Canvas は停止・再開、hidden tab 時の停止・復帰を animation-frame 計数で確認。context 不可、save-data、低メモリー時は動作ボタンが現れず本文が表示される。reduced-motion 時は演出ボタン非表示で通常コンテンツとナビが使え、JS 無効でも全文・電話リンクを利用可能。tel / Instagram / Maps の宛先はソースで照合し、実際に発信・外部ページ遷移はしていない。

未実施: 実機 iOS / Android、スクリーンリーダー、Lighthouse、CLS / Core Web Vitals の計測、実回線での速度評価。Playwright の desktop/mobile viewport は端末そのものの保証ではない。

## 8. Purposeful review loop

### Round 1 — IA / implementation / source review

- 食材写真しかないため、店内・店主・炭火を架空の写真で補わず、抽象造形とタイプで成立させた
- スマートフォンで横写真を強制する構造を避け、縦の独立構成へ変更
- モバイルの header タッチ幅を最低 44px に統一。中間幅の細い章ナビを非表示化
- Pointer の子要素基準座標を Hero 基準に修正
- 未使用の生成派生画像を除去。既存原本は維持
- アクション / 営業情報の狭幅表示を 12px へ統一。装飾ラベルだけを小さい文字に限定
- 未確認の柑橘品種を画像 alt に特定しないよう修正
- `[hidden]{display:none!important}` により CSS の display 指定が未対応時 / reduced-motion 時の非表示を上書きしないことを確認
- 静的検証を再実行し pass

### Round 2 — visual / typography / interaction

4 幅の first view と full page を実画面で確認。390px の Hero で英語キャプションが魚の明るい部分にかかっていたため、mobile 写真上端のグラデーションを強めて読める状態にした。再撮影して確認。本文の小文字化、画像未読込、見切れ、固定 CTA と操作対象の重なりは見られなかった。

### Round 3 — narrow viewport / accessibility / performance

Browser acceptance に native 横列の矢印キー、mobile 往復導線、Canvas の停止・復帰とフォールバックを追加し再実行、pass。実機確認は production checklist に残す。

## 9. Responsive and accessibility design

- 360 / 390px: 単列、縦写真列、下部予約 CTA、CTA 分の footer 余白、safe-area 対応
- 768px: PC の連続写真を保ち、補助レール非表示
- 1440px: 左に大きな文字、右に料理、余白の章ナビ
- Semantic landmarks、skip link、visible focus、aria-current、Canvas / 抽象造形は aria-hidden
- 最低 44px を意図した操作領域、画像 alt、新しいタブの説明、動きを停止可能
- 同じ事実を不必要に増やさず、価格・受賞・レビュー・店主経歴を作成しない
- WCAG 適合認証や正式な監査を行ったという主張はしていない

## 10. Performance

ビルド不要、外部フォント・ライブラリー・tracker・iframe なし。主要 HTML / CSS / JS 合計は **41,611 bytes**（非圧縮ファイルサイズ、`docs/qa/asset-sizes.json`）。4 枚の料理は responsive WebP、Hero のみ eager + high priority、下部写真とロゴは lazy。寸法 / aspect-ratio を持ち layout shift を抑制。Canvas は小数粒子のみで、停止条件を持つ。Browser QA ではローカル HTTP 上で全画像と資産がロードしたことを確認。ファイルサイズは byte budget、ローカルの読込結果は機能確認であり、Lighthouse score・Core Web Vitals・実回線の体感速度を表さない。

## 11. Unresolved / production checklist

1. 店舗本人に営業時間、祝日の扱い、住所、電話、Maps、料理写真の利用権を再確認する。日・月の定休と祝日表記の優先関係は未確定
2. 既存写真の季節・提供状況とコピーを確認する。素材写真は現在の献立の保証ではない
3. 実際の店主・炭火・カウンター・外観を撮影し、抽象表現の必要箇所を更新する
4. 本番採用案決定後、最終 URL・OGP 画像・noindex を見直す
5. iOS Safari / Android Chrome の実機、VoiceOver、低速回線で再検証する
6. 本番移行は別途個別承認を得る。ここでは実行しない

## 12. Photography priorities

1. カウンター越しの店主の手と料理（店主本人の公開許諾込み）
2. 実際の炭火の寄り。火よりも赤い炭と暗部の階調
3. 夜の外観と暖簾。荻窪の街から入る距離が分かる構図
4. 料理を差し出す瞬間。客の顔は写さないか個別許諾
5. カウンターの木、器、肘を置く距離感
6. 日本酒を注ぐ手元と酒器
7. 店主の自然なポートレート（確認・公開許諾前提）
8. 横長と縦長の両方で撮った代表の焼き物
9. 季節の魚介の一皿、自然な暗部を残した照明
10. 閉店前の静かな店内。人物や著名人の来店を示唆しない

## 13. Reuse for future restaurant work

- 店固有の動作・素材を抽象化して、主張しすぎない演出へ変える方法
- Desktop の横鑑賞と mobile の縦編集を別々に設計する構造
- 章ナビ、native scroll snap、独立した Canvas 装飾、動作停止機構
- 物語から電話・道順へ自然に終着する情報設計
- 低性能 / reduced-motion / no-JS でも失わないコンテンツ構造
- 実店舗写真が不足した時、架空写真ではなくタイポグラフィを使う判断

テーマ、色、写真、物語は店舗ごとに再設計すべきで、コードを当てはめるだけでは Experience 型にならない。
