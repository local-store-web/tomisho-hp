# とみ笑 WEBSITE LAB — TYPE D / Experience

独立した R&D ブランチ `dot/tomisho-type-d-experience`。
開始点は main `dc8170f92afbdf9ea543d3d928667f4e23d7efc1`。main・既存公開先・ドメインは変更しません。

## 見る

ビルド不要の HTML / CSS / Vanilla JavaScript です。

```sh
python3 -m http.server 8033
```

`http://localhost:8033` を開きます。JavaScript 無効でも本文・写真・電話予約・地図リンクを利用できます。

## コンセプト

「夜に、余熱を。」

入口 → 炭火 → 旬の料理 → カウンターと酒の余韻 → 荻窪の店舗案内。
巨大な明朝体と炭色の余白、素材の近接写真で、一晩の距離感をつくります。
PC では料理を横に見渡し、スマートフォンでは縦の編集ページとして読み進めます。
スクロールはブラウザー標準のままです。

## ファイル

- `index.html`: 意味構造・事実情報・metadata
- `styles.css`: 独立した TYPE D のデザイン。360 / 390 / 768 / 1440px を想定
- `script.js`: 料理の送りボタン、章ナビ、任意の低負荷 Canvas 演出
- `assets/images/`: 既存素材を保存
- `assets/optimized/`: 既存料理写真だけから作成した 480 / 960px WebP
- `assets/favicon.png`: 既存ロゴの小型版
- `tests/validate.py`: 外部依存のないソース・リンク整合性チェック
- `tests/browser-qa.cjs`: 別途 Playwright が使える QA 環境向けの実ブラウザ検証
- `docs/TYPE-D-REPORT.md`: 設計意図、検証の範囲、本番化前の確認事項

## 検証

```sh
python3 tests/validate.py
node --check script.js
node --check tests/browser-qa.cjs
# Playwright が利用できる環境でのみ実行（サイトの実行依存ではありません）
node tests/browser-qa.cjs
```

ブラウザ検証は `docs/qa/screenshots/` と `docs/qa/browser-results.json` に結果を作ります。
ローカル HTTP のみを使用し、外部公開・電話発信・予約送信はしません。

## 実験用の公開制御

- `noindex, nofollow` を設定した比較用実装
- canonical / OGP URL は確認済みの現在の公開ホームページ `https://local-store-web.github.io/tomisho-hp/` を参照
- 本番採用前に営業情報・権利・撮影・最終 URL を確認し、採用が決まった場合のみ noindex を見直す
- 公開設定変更・merge・deploy はこのブランチでは行わない
- 今回はライブラリー、ビルド、CMS、外部フォント、トラッカー、外部 iframe を追加していない
