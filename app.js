const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const morgan = require('morgan');
const database = require('./database');
const config = require('./config');

const app = express();

// ログ設定
app.use(morgan('combined'));

// ミドルウェア設定
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 静的ファイルの提供
app.use(express.static(path.join(__dirname, 'public')));

// ルーティング設定
app.use('/api/line', require('./routes/line'));
app.use('/api/reservations', require('./routes/reservations'));

// ビューエンジン設定
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');

// HTMLファイルの提供
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'admin.html'));
});

app.get('/privacy', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'privacy.html'));
});

app.get('/terms', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'terms.html'));
});

// エラーハンドリング
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// 404エラーハンドリング
app.use((req, res) => {
  res.status(404).send('Page not found');
});

// サーバー起動
const PORT = process.env.PORT || config.port || 3000;

// サーバー起動（データベースは既にモジュール読み込み時に初期化済み）
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app; 