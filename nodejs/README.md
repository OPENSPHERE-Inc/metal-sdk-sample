# Metal on Symbol PoC SDK Node.js 向けサンプルコード

## 1. ビルド

```shell
git clone https://github.com/OPENSPHERE-Inc/metal-sdk-sample.git
cd metal-sdk-sample/nodejs
```

`src/` 配下のコードを適時編集してください。

```shell
yarn
yarn build
```

## 2. 実行

`dot.env` を `.env` にリネームし、内容を編集してください。

```
TEST_NODE_URL=Your Node URL here
TEST_PRIVATE_KEY=Your Private Key here
```

以下で、ビルドしたサンプルをそれぞれ実行できます。

```
node dist/decode.js
node dist/fetch.js
node dist/fetch_by_key.js
node dist/forge.js
node dist/forge_recover.js
node dist/scrap.js
node dist/scrap_by_payload.js
node dist/verify.js 
```

## 3. ソースファイルリスト

- [decode.ts](./src/decode.ts) - メタデータプールから Metal をデコードするサンプル
- [fetch.ts](./src/fetch.ts) - Metal ID で Fetch するサンプル
- [fetch_by_key.ts](./src/fetch_by_key.ts) - メタデータ Key で Fetch するサンプル
- [forge.ts](./src/forge.ts) - Metal を Forge するサンプル
- [forge_recover.ts](./src/forge_recover.ts) - Metal を差分 Forge （リカバー）するサンプル
- [scrap.ts](./src/scrap.ts) - Metal ID で Metal を Scrap するサンプル
- [scrap_by_payload.ts](./src/scrap_by_payload.ts) - 元データを指定して Metal を Scrap するサンプル
- [verify.ts](./src/verify.ts) - Metal を元データと照合するサンプル

