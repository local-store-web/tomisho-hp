# とみ笑 GitHub Pages site

GitHub Pagesでそのまま公開できる静的HTML版です。WordPressやShopifyのテーマ化を前提にせず、`index.html`、`styles.css`、`script.js`だけで動きます。

## 公開方法

1. このフォルダの中身をGitHubリポジトリのルートへ置く
2. GitHubの`Settings > Pages`で公開元を`main`ブランチの`/root`にする
3. 公開URL`https://toraikura.github.io/tomisho-hp/`で表示確認する

まずはGitHub Pagesの仮URLで確認するため、`CNAME`は入れていません。内容が固まったら`www.tomisho.jp`をCustom domainに設定します。

## 編集する場所

- 店名、紹介文、住所、営業時間、電話番号: `index.html`
- 色、余白、写真枠、スマホ表示: `styles.css`
- スクロール時の表示アニメーション: `script.js`
- 写真: `assets/images/`

## 写真の入れ方

写真は`assets/images/`に置くのがおすすめです。例えば以下のように置くと管理しやすいです。

- `assets/images/hero-sashimi.jpg`: ファーストビューの大きい写真
- `assets/images/seasonal-sashimi.jpg`: 季節の料理
- `assets/images/grilled-fish.jpg`: 魚料理
- `assets/images/sashimi-plate.jpg`: ギャラリー用の料理写真
- `assets/images/oyster.jpg`: ギャラリー用の料理写真
- `assets/images/skewer.jpg`: ギャラリー用の料理写真
- `assets/images/uni-bite.jpg`: 一品料理

HTML側では、該当する`.photo-slot`の中身を`<img src="./assets/images/hero-sashimi.jpg" alt="とみ笑の料理" />`のように差し替えます。

## 公開前に確認すること

- 住所、電話番号、営業時間が最新か
- GoogleマップURLが店舗の正しいURLか
- 写真枠を実店舗の写真に差し替えるか
- OGP画像を用意するか
