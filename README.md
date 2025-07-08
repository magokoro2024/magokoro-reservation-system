# まごころおにぎり屋 - 自動事前予約システム

## 概要

「まごころおにぎり屋」の公式LINE連携自動事前予約システムです。
お客様がLINE公式アカウントから簡単に予約を行い、店舗側で効率的に予約管理ができるシステムです。

## 機能

### 顧客向け機能
- **LINE Bot による自動予約受付**
  - 24時間いつでも予約可能
  - 直感的な操作でメニュー選択
  - 日時指定での予約
  - 予約確認・キャンセル機能

- **Webサイト**
  - 店舗情報の確認
  - メニュー一覧の閲覧
  - 予約方法の案内

### 店舗管理機能
- **管理画面**
  - 予約状況の一覧表示
  - 予約の確定・キャンセル
  - 売上統計の確認
  - メニュー管理

- **自動化機能**
  - 予約受付の自動化
  - 顧客への自動応答
  - 予約確認メールの送信

## 技術スタック

- **バックエンド**: Node.js + Express
- **データベース**: SQLite
- **フロントエンド**: HTML/CSS/JavaScript
- **LINE Bot**: LINE Bot SDK for Node.js
- **認証**: JWT (JSON Web Token)

## インストール手順

### 1. 必要なソフトウェアのインストール

```bash
# Node.js をインストール (バージョン 16以上)
# https://nodejs.org/ からダウンロード

# プロジェクトのクローンまたはダウンロード
git clone <repository-url>
cd magokoro-reservation-system
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. 環境変数の設定

プロジェクトルートに `.env` ファイルを作成し、以下の内容を設定してください：

```env
# サーバー設定
PORT=3000
NODE_ENV=development

# LINE Bot API設定
LINE_CHANNEL_ACCESS_TOKEN=your_line_channel_access_token
LINE_CHANNEL_SECRET=your_line_channel_secret

# 店舗情報
STORE_NAME=まごころおにぎり屋
STORE_ADDRESS=〒123-4567 東京都新宿区西新宿1-1-1
STORE_PHONE=03-1234-5678
STORE_EMAIL=info@magokoro-onigiri.com

# 管理者設定
ADMIN_LINE_USER_ID=your_admin_line_user_id
```

### 4. データベースの初期化

```bash
# アプリケーションを起動すると自動的にデータベースが作成されます
npm start
```

## LINE Bot の設定

### 1. LINE Developers コンソールでの設定

1. [LINE Developers](https://developers.line.biz/) にアクセス
2. 新しいプロバイダーを作成
3. Messaging API チャネルを作成
4. チャネルアクセストークンとチャネルシークレットを取得
5. Webhook URLを設定: `https://yourdomain.com/api/line/webhook`

### 2. 必要な権限の設定

- メッセージ送信
- プロフィール取得
- リッチメニュー作成

## 使用方法

### 1. アプリケーションの起動

```bash
# 開発モード
npm run dev

# 本番モード
npm start
```

### 2. アクセス方法

- **顧客向けサイト**: http://localhost:3000
- **管理画面**: http://localhost:3000/admin
- **LINE Bot Webhook**: http://localhost:3000/api/line/webhook

### 3. 基本的な使用フロー

#### 顧客側
1. LINE公式アカウントを友達追加
2. 「予約する」をタップ
3. 日付を選択
4. 時間を選択
5. メニューを選択
6. 予約完了

#### 店舗側
1. 管理画面にアクセス
2. ダッシュボードで予約状況を確認
3. 予約管理で個別の予約を確認・操作
4. メニュー管理で商品情報を更新

## API エンドポイント

### 予約関連
- `GET /api/reservations` - 全予約取得
- `GET /api/reservations/date/:date` - 指定日の予約取得
- `POST /api/reservations` - 新規予約作成
- `PUT /api/reservations/:id` - 予約更新
- `DELETE /api/reservations/:id` - 予約削除
- `GET /api/reservations/stats` - 予約統計取得

### LINE Bot関連
- `POST /api/line/webhook` - LINE Webhook

## データベース構造

### テーブル一覧
- `users` - ユーザー情報
- `reservations` - 予約情報
- `menu_items` - メニュー情報
- `business_hours` - 営業時間

## カスタマイズ

### 1. メニューの変更
管理画面の「メニュー管理」から商品の追加・編集・削除が可能です。

### 2. 営業時間の変更
管理画面の「設定」から営業時間を変更できます。

### 3. 予約制限の変更
`config.js` または管理画面の「設定」で以下を変更できます：
- 1日の最大予約数
- 1人あたりの最大予約数
- 予約可能時間（受取時間の何時間前まで）

## トラブルシューティング

### よくある問題

1. **LINE Bot が応答しない**
   - チャネルアクセストークンとシークレットを確認
   - Webhook URLが正しく設定されているか確認
   - サーバーが正常に起動しているか確認

2. **データベースエラー**
   - SQLiteファイルの権限を確認
   - データベースファイルが存在するか確認

3. **予約が保存されない**
   - API エンドポイントが正常に動作しているか確認
   - ブラウザの開発者ツールでエラーログを確認

### ログの確認

```bash
# アプリケーションのログを確認
npm start | tee app.log

# エラーログのみを確認
npm start 2>&1 | grep -i error
```

## セキュリティ

### 本番環境での注意事項

1. **環境変数の管理**
   - `.env` ファイルをGitにコミットしない
   - 本番環境では適切な環境変数管理システムを使用

2. **HTTPS の使用**
   - 本番環境では必ずHTTPSを使用
   - SSL証明書の設定

3. **データベースのセキュリティ**
   - 定期的なバックアップ
   - アクセス制限の設定

## ライセンス

MIT License

## サポート

技術的なサポートが必要な場合は、以下の情報を含めてお問い合わせください：
- エラーメッセージ
- 実行環境（OS、Node.jsバージョン）
- 問題が発生した手順

---

**まごころおにぎり屋予約システム v1.0.0** 