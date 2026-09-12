Everyone's kitchen 店主更新機能 セットアップ

1) このフォルダの中身をGitHubリポジトリのルートにアップロードしてください。
   既存の index.html / style.css / main.js は上書きします。
   admin.html / worker.js / wrangler.jsonc / .assetsignore は新規追加です。

2) CloudflareのGit連携デプロイが完了するのを待ちます。
   wrangler.jsonc の kv_namespaces により SITE_CONTENT 用KVが自動作成されます。

3) Cloudflare Dashboard → Workers & Pages → an1106 → Settings → Variables and Secrets
   で Secret を1個追加します。
     Variable name: ADMIN_PASSWORD
     Value: 店主だけが知る強いパスワード
   Type は必ず Secret にしてください。

4) Deploy後、以下を開きます。
   https://あなたのサイト/admin.html

5) 管理画面から
   ・お知らせ
   ・本日の日替わり
   ・本日のおすすめ（最大5品）
   ・売り切れON/OFF
   ・商品写真
   を更新できます。

注意:
- ADMIN_PASSWORD はGitHubのHTMLやJSに書かないでください。
- wrangler.jsonc の name は現在のWorker URLが an1106.workers.dev の前提で "an1106" にしています。
  Cloudflare上のWorker名が違う場合は、その名前に変更してください。
