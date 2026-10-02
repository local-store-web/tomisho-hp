# TOMISHO WEBSITE LAB — TYPE B / Brand LP

独立した R&D 案。ブランチは `dot/tomisho-type-b-brand-lp`、出発点は main の `dc8170f92afbdf9ea543d3d928667f4e23d7efc1` です。

## コンセプト

**荻窪の夜に、ひとつ奥へ。**

街 → 暖簾 → カウンター → 炭火 → 料理 → 料理人 → 日本酒 → 夜、という一晩を、写真と余白で辿る editorial / cinematic LP。店内・店主の写真がない部分は、抽象的な木の線とタイポグラフィで表現しています。架空の店舗写真は使っていません。

## 実装

- `index.html` / `styles.css` / `script.js` の静的サイト
- プロダクション依存ライブラリなし、外部フォント・外部埋め込みなし
- 既存 JPG / PNG は保存。`assets/images/optimized/` に既存料理画像の WebP 派生を追加
- 内容・住所・電話・営業時間: `index.html`
- 色・組版・responsive: `styles.css` の tokens と media queries
- ナビゲーション補助・軽い表示モーション: `script.js`
- 設計・検証・残件: [docs/TYPE-B-REPORT.md](docs/TYPE-B-REPORT.md)

## ローカルで見る

ブラウザを実行できる環境で、このディレクトリにて:

```sh
python3 -m http.server 4311 --bind 127.0.0.1
```

`http://127.0.0.1:4311/` を開きます。ビルド工程はありません。HTML を直接開いても基本表示・ナビゲーションは動きます。

## 検証

```sh
python3 qa/verify_static.py
node --check script.js
node --check qa/verify_browser.cjs
git diff --check
```

Playwright と Chromium を利用できる環境で:

```sh
node qa/verify_browser.cjs
```

必要なら `CHROMIUM_PATH` に承認済みの Chromium 実行ファイルを指定できます。QA 用パッケージはサイトの依存にはなりません。`axe-core` が利用可能な環境では同ハーネスが WCAG 2/2.1 A/AA の自動検査も行います。

360 / 390 / 768 / 1440 px、各幅の first view / full page / 店舗情報、mobile navigation / 予約、JS 無効、reduced motion、画像・console・横はみ出し・touch target・focus を検査し、`qa/evidence/` に結果と PNG を出力します。スクリーンショット生成後は人による画面確認も行います。

### 現在の確認状況

ソース検査と Linux headless Chromium 実画面検証は PASS。4 幅のスクリーンショットを目視し、axe-core 4.10.3 の WCAG 2 / 2.1 A・AA 自動検査は violation 0。Lighthouse、実機 Safari / Android、VoiceOver / TalkBack、外部リンクの最終遷移先は未検証です。詳細は [検証レポート](docs/TYPE-B-REPORT.md) を参照してください。

## 公開について

この実験ブランチは `noindex, nofollow` です。canonical / OGP は確認された現行サイト URL を参照しますが、このブランチの公開・本番反映は行いません。

main、production、公開ブランチ、Pages 公開元、domain は変更しません。merge / deploy / 本番昇格には別途の明示的承認が必要です。既存 README の本番公開手順は、この R&D ブランチの操作手順から除きました。
