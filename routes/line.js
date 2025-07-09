const express = require('express');
const line = require('@line/bot-sdk');
const { 
  createReservation, 
  getReservations, 
  getMenuItems, 
  checkInventory,
  updateReservation,
  deleteReservation 
} = require('../database');

const router = express.Router();

// LINE Bot設定
const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET
};

// 環境変数チェック
console.log('LINE Bot設定確認:');
console.log('- Channel Access Token:', process.env.LINE_CHANNEL_ACCESS_TOKEN ? '設定済み' : '未設定');
console.log('- Channel Secret:', process.env.LINE_CHANNEL_SECRET ? '設定済み' : '未設定');

const client = new line.Client(config);

// Webhookエンドポイント（GET - 検証用）
router.get('/webhook', (req, res) => {
  console.log('=== Webhook GET request received ===');
  console.log('Query parameters:', req.query);
  console.log('Timestamp:', new Date().toISOString());
  
  res.json({
    status: 'success',
    message: 'LINE Webhook endpoint is working!',
    method: 'GET',
    timestamp: new Date().toISOString(),
    deployVersion: '2025-07-09-v1.9.5-final',
    note: 'This endpoint is for verification purposes. Actual webhook events should be sent via POST.'
  });
});

// Webhookエンドポイント（POST - イベント処理）
router.post('/webhook', (req, res) => {
  console.log('=== Webhook POST request received ===');
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  console.log('Number of events:', req.body.events ? req.body.events.length : 0);
  
  try {
    if (!req.body.events || req.body.events.length === 0) {
      console.log('No events in request body');
      return res.json({ status: 'success', message: 'No events to process' });
    }
    
    Promise.all(req.body.events.map(handleEvent))
      .then((results) => {
        console.log('All events processed successfully:', results.length);
        res.json({ status: 'success', processedEvents: results.length });
      })
      .catch((error) => {
        console.error('Webhook Error:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
      });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed', details: error.message });
  }
});

// イベント処理
async function handleEvent(event) {
  console.log('Event received:', event);
  
  if (event.type === 'message' && event.message.type === 'text') {
    return handleMessage(event);
  }

  if (event.type === 'follow') {
    return handleFollow(event);
  }

  return Promise.resolve(null);
}

// メッセージ処理
async function handleMessage(event) {
  const message = event.message.text;
  const userId = event.source.userId;

  console.log(メッセージ受信: "" from );

  if (message === '予約' || message === '予約する') {
    console.log('予約処理開始');
    return handleReservationStart(event);
  } else if (message === '確認' || message === '予約確認') {
    console.log('予約確認処理開始');
    return handleReservationCheck(event);
  } else if (message === 'メニュー') {
    console.log('メニュー表示処理開始');
    return handleMenuRequest(event);
  } else if (message === 'ヘルプ') {
    console.log('ヘルプ表示処理開始');
    return handleHelp(event);
  } else if (message === '営業時間') {
    console.log('営業時間表示処理開始');
    return handleBusinessHours(event);
  } else if (message === '店舗情報') {
    console.log('店舗情報表示処理開始');
    return handleStoreInfo(event);
  }

  console.log('デフォルト応答処理');
  return client.replyMessage(event.replyToken, {
    type: 'text',
    text: ' まごころおにぎり予約システム\n\n【コマンド】\n「予約」新しい予約\n「確認」予約確認\n「メニュー」メニュー表示\n「ヘルプ」使用方法\n「営業時間」営業時間確認\n「店舗情報」店舗情報\n\n営業時間：平日11:00-14:30（土日は休業）'
  });
}

// 予約開始処理
async function handleReservationStart(event) {
  return client.replyMessage(event.replyToken, {
    type: 'text',
    text: ' ご予約ありがとうございます！\n\n現在、予約システムを準備中です。\n詳細な予約機能は近日中に実装予定です。\n\n営業時間：平日11:00-14:30\n土日は休業日です'
  });
}

// 予約確認処理
async function handleReservationCheck(event) {
  return client.replyMessage(event.replyToken, {
    type: 'text',
    text: ' 予約確認\n\n現在、予約システムを準備中です。\n予約確認機能は近日中に実装予定です。'
  });
}

// メニュー表示処理
async function handleMenuRequest(event) {
  return client.replyMessage(event.replyToken, {
    type: 'text',
    text: ' メニュー\n\n【おにぎり】\n塩 - 90円\nツナマヨ - 100円\n昆布 - 110円\nとりそぼろ - 110円\n梅 - 120円\n鮭 - 120円\nたらこ - 130円\n高菜 - 130円\n\n価格は税込みです\n売り切れ次第終了\n\n営業時間：平日11:00-14:30'
  });
}

// ヘルプ表示処理
async function handleHelp(event) {
  return client.replyMessage(event.replyToken, {
    type: 'text',
    text: ' まごころおにぎり予約システム\n\n【使用方法】\n「予約」新しい予約\n「確認」予約確認\n「メニュー」メニュー表示\n「ヘルプ」この説明\n「営業時間」営業時間確認\n「店舗情報」店舗情報\n\n【営業時間】\n平日 11:00-14:30\n（土日は休業）\n\n【店舗情報】\n〒347-0063\n埼玉県加須市久下1-1-15'
  });
}

// 営業時間表示処理
async function handleBusinessHours(event) {
  return client.replyMessage(event.replyToken, {
    type: 'text',
    text: ' 営業時間\n\n【営業日】\n平日（月火水木金）\n\n【営業時間】\n11:00 - 14:30\n\n【休業日】\n土日\n\n 売り切れ次第終了となります\n事前予約をおすすめします！'
  });
}

// 店舗情報表示処理
async function handleStoreInfo(event) {
  return client.replyMessage(event.replyToken, {
    type: 'text',
    text: ' 店舗情報\n\n【まごころおにぎり】\n〒347-0063\n埼玉県加須市久下1-1-15\n\n 電話番号\n0480-53-8424\n\n 営業時間\n平日 11:00-14:30\n（土日は休業）\n\n事前予約承ります'
  });
}

// 友達追加イベント処理
async function handleFollow(event) {
  console.log('=== Follow event received ===');
  console.log('User ID:', event.source.userId);
  console.log('Reply token:', event.replyToken);
  
  const welcomeMessage = {
    type: 'text',
    text:  まごころおにぎり予約システムへようこそ！\n\n【ご利用方法】\n下記のコマンドをメッセージで送信してください：\n\n「予約」新しい予約\n「確認」予約確認\n「メニュー」メニュー表示\n「ヘルプ」使用方法\n「営業時間」営業時間確認\n「店舗情報」店舗情報\n\n【営業時間】\n平日 11:00-14:30\n（土日は休業）\n\n予約をするには「予約」とメッセージしてください！
  };
  
  try {
    const result = await client.replyMessage(event.replyToken, welcomeMessage);
    console.log('Welcome message sent successfully:', result);
    return result;
  } catch (error) {
    console.error('Error sending welcome message:', error);
    throw error;
  }
}

// テストエンドポイント
router.get('/test', (req, res) => {
  res.json({
    status: 'success',
    message: 'LINE Bot API is running',
    timestamp: new Date().toISOString(),
    endpoints: {
      checkConfig: '/api/line/check-config',
      webhook: '/api/line/webhook (GET/POST)'
    }
  });
});

// 環境変数チェックエンドポイント
router.get('/check-config', (req, res) => {
  const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const channelSecret = process.env.LINE_CHANNEL_SECRET;
  
  const configCheck = {
    channelAccessToken: channelAccessToken ? '設定済み' : '未設定',
    channelSecret: channelSecret ? '設定済み' : '未設定',
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    webhookUrl: ${req.protocol}:///api/line/webhook,
    timestamp: new Date().toISOString()
  };
  
  res.json({
    status: 'success',
    config: configCheck
  });
});

module.exports = router;
