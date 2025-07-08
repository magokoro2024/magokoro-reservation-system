# Renderでのデプロイ手順

## 📋 事前準備

✅ Renderアカウント  
✅ GitHubアカウント  
✅ LINE Developersアカウント  

## 🚀 デプロイ手順

### ステップ1: GitHubにコードをアップロード

1. **GitHub Desktopを使用する場合:**
   - GitHub Desktopを開く
   - 「Add an Existing Repository from your Hard Drive」を選択
   - `magokoro-reservation-system` フォルダを選択
   - 「Publish repository」をクリック
   - リポジトリ名: `magokoro-reservation-system`
   - 「Keep this code private」のチェックを外す（または残す）
   - 「Publish Repository」をクリック

2. **手動でアップロードする場合:**
   - GitHub.comにログイン
   - 「New repository」をクリック
   - Repository name: `magokoro-reservation-system`
   - 「Create repository」をクリック
   - 「uploading an existing file」をクリック
   - プロジェクトフォルダの全ファイルをドラッグ&ドロップ
   - Commit message: "Initial commit"
   - 「Commit new files」をクリック

### ステップ2: Renderでサービスを作成

1. **Render.comにログイン**
   - https://render.com にアクセス
   - GitHubアカウントでログイン

2. **新しいWebサービスを作成**
   - ダッシュボードで「New +」をクリック
   - 「Web Service」を選択
   - GitHubリポジトリから `magokoro-reservation-system` を選択
   - 「Connect」をクリック

3. **サービス設定**
   ```
   Name: magokoro-reservation-system
   Environment: Node
   Region: Singapore (推奨)
   Branch: main
   Build Command: npm install
   Start Command: npm start
   ```

### ステップ3: 環境変数の設定

Renderの設定画面で以下の環境変数を追加：

```env
NODE_ENV=production
PORT=10000
LINE_CHANNEL_ACCESS_TOKEN=（LINE Developersで取得）
LINE_CHANNEL_SECRET=（LINE Developersで取得）
STORE_NAME=まごころおにぎり屋
STORE_ADDRESS=〒123-4567 東京都新宿区西新宿1-1-1
STORE_PHONE=03-1234-5678
STORE_EMAIL=info@magokoro-onigiri.com
ADMIN_LINE_USER_ID=（管理者のLINE User ID）
```

### ステップ4: デプロイ実行

1. 「Create Web Service」をクリック
2. ビルドとデプロイが自動で開始される
3. 完了まで数分待つ
4. デプロイ完了後、URLが表示される（例: `https://magokoro-reservation-system.onrender.com`）

### ステップ5: LINE Developersの設定

1. **LINE Developersにログイン**
   - https://developers.line.biz/

2. **チャネルの作成（初回のみ）**
   - 「Create a provider」でプロバイダーを作成
   - 「Messaging API」チャネルを作成
   - チャネル名: まごころおにぎり屋
   - 説明: おにぎり屋の予約システム

3. **Webhook URLの設定**
   - チャネル設定 → Messaging API設定
   - Webhook URL: `https://【あなたのRenderURL】/api/line/webhook`
   - 例: `https://magokoro-reservation-system.onrender.com/api/line/webhook`
   - 「Use webhook」を有効にする

4. **チャネルアクセストークンの取得**
   - 「Channel access token」の「Issue」をクリック
   - 生成されたトークンをコピー
   - Renderの環境変数 `LINE_CHANNEL_ACCESS_TOKEN` に設定

5. **チャネルシークレットの取得**
   - Basic settings → Channel secret
   - 「Show」をクリックしてコピー
   - Renderの環境変数 `LINE_CHANNEL_SECRET` に設定

### ステップ6: 動作確認

1. **LINE公式アカウントの友達追加**
   - LINE Developersの「Messaging API」設定
   - QRコードまたはBot basic IDで友達追加

2. **テストメッセージの送信**
   - 「こんにちは」と送信
   - 自動返信が来れば成功！

3. **予約機能のテスト**
   - 「予約する」をタップ
   - 日付・時間・メニュー選択を試す

4. **管理画面のアクセス**
   - `https://【あなたのRenderURL】/admin`
   - 予約一覧が表示されるか確認

## 🔧 トラブルシューティング

### よくある問題

1. **Webhook URLでエラーが出る**
   - RenderのURLが正しいか確認
   - `/api/line/webhook` が末尾についているか確認
   - HTTPSであることを確認

2. **LINE Botが応答しない**
   - チャネルアクセストークンが正しいか確認
   - チャネルシークレットが正しいか確認
   - Webhook設定が有効になっているか確認

3. **データベースエラー**
   - Renderでは自動的にSQLiteファイルが作成される
   - 初回アクセス時にテーブルが自動作成される

4. **アプリケーションが起動しない**
   - Renderのログを確認
   - `package.json` の記述が正しいか確認
   - Node.jsバージョンが対応しているか確認

### デバッグ方法

1. **Renderのログ確認**
   - Renderダッシュボード → サービス選択 → Logs

2. **LINE Webhook のテスト**
   - LINE Developers → Messaging API → Webhook settings
   - 「Verify」ボタンでテスト

## 🎉 完了！

すべて設定が完了すると、以下が利用可能になります：

- ✅ LINE Botによる自動予約受付
- ✅ Webサイトでの店舗情報表示
- ✅ 管理画面での予約管理
- ✅ 24時間自動運用

---

**🔗 便利なリンク**

- Renderダッシュボード: https://dashboard.render.com/
- LINE Developers: https://developers.line.biz/
- GitHub: https://github.com/

質問がある場合は、各サービスのドキュメントを参照するか、コミュニティフォーラムで質問してください。 