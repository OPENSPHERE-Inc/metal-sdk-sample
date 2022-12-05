# Metal on Symbol PoC SDK Browser (React) 向けサンプルコード

## 1. ビルド

```shell
git clone https://github.com/OPENSPHERE-Inc/metal-sdk-sample.git
cd metal-sdk-sample/browser-react
```

`dot.env` を `.env` にリネームし、内容を編集してください。

```
REACT_APP_NODE_URL=Your Node URL here
```

```shell
yarn
yarn build
```

## 2. 実行

`react-scripts` を使うと開発用 Web サーバーを起動できます。
以下のように起動してください。

```shell
yarn start
```

ブラウザーで `http://localhost:3000` を開いてください（上記コマンドで勝手にブラウザーが開きます）

メニューで各サンプルにアクセスできます。

## 3. ソースファイルリスト

- [Decode.tsx](./src/pages/Decode.tsx) - メタデータプールから Metal をデコードするサンプル
- [Fetch.tsx](./src/pages/Fetch.tsx) - Metal ID で Fetch するサンプル
- [FetchByKey.tsx](./src/pages/FetchByKey.tsx) - メタデータ Key で Fetch するサンプル
- [Forge.tsx](./src/pages/Forge.tsx) - Metal を Forge するサンプル
- [ForgeRecover.tsx](./src/pages/ForgeRecover.tsx) - Metal を差分 Forge （リカバー）するサンプル
- [Scrap.tsx](./src/pages/Scrap.tsx) - Metal ID で Metal を Scrap するサンプル
- [ScrapByPayload.tsx](./src/pages/ScrapByPayload.tsx) - 元データを指定して Metal を Scrap するサンプル
- [Verify.tsx](./src/pages/Verify.tsx) - Metal を元データと照合するサンプル