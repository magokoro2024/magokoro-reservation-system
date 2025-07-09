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
    deployVersion: '2025-07-09-v1.9.0',
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
  
  console.log(`メッセージ受信: "${message}" from ${userId}`);

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
  }

  console.log('デフォルト応答処理');
  return client.replyMessage(event.replyToken, {
    type: 'text',
    text: ' まごころおにぎり予約システム\n\n【コマンド】\n「予約」新しい予約\n「確認」予約確認\n「メニュー」メニュー表示\n「ヘルプ」使用方法\n\n営業時間：平日11:00-14:30（土日祝は休業）'
  });
}

// 基本的な応答関数
async function handleReservationStart(event) {
  return client.replyMessage(event.replyToken, {
    type: 'text',
    text: ' ご予約ありがとうございます！\n\n現在、予約システムを準備中です。\n詳細な予約機能は近日中に実装予定です。\n\n営業時間：平日11:00-14:30\n土日祝は休業日です'
  });
}

async function handleReservationCheck(event) {
  return client.replyMessage(event.replyToken, {
    type: 'text',
    text: ' 予約確認\n\n現在、予約システムを準備中です。\n予約確認機能は近日中に実装予定です。'
  });
}

async function handleMenuRequest(event) {
  return client.replyMessage(event.replyToken, {
    type: 'text',
    text: ' メニュー\n\n【人気おにぎり】\n鮭 - 200円\nツナマヨ - 180円\n昆布 - 150円\n梅 - 150円\n焼きたらこ - 220円\n\n価格は税込みです\n営業時間：平日11:00-14:30'
  });
}

async function handleHelp(event) {
  return client.replyMessage(event.replyToken, {
    type: 'text',
    text: ' まごころおにぎり予約システム\n\n【使用方法】\n「予約」新しい予約\n「確認」予約確認\n「メニュー」メニュー表示\n「ヘルプ」この説明\n\n【営業時間】\n平日 11:00-14:30\n（土日祝は休業）\n\n【店舗情報】\n〒347-0105 埼玉県加須市久下1-1-15'
  });
}

// 友達追加イベントの処理
async function handleFollow(event) {
  console.log('=== Follow event received ===');
  console.log('User ID:', event.source.userId);
  console.log('Reply token:', event.replyToken);
  
  const welcomeMessage = {
    type: 'text',
    text: ` まごころおにぎり予約システムへようこそ！\n\n【ご利用方法】\n下記のコマンドをメッセージで送信してください：\n\n「予約」新しい予約\n「確認」予約確認\n「メニュー」メニュー表示\n「ヘルプ」使用方法\n\n【営業時間】\n平日 11:00-14:30\n（土日祝は休業）\n\n予約をするには「予約」とメッセージしてください！`
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
    channelAccessToken: channelAccessToken ? '設定済み' : ' 未設定',
    channelSecret: channelSecret ? '設定済み' : ' 未設定',
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    webhookUrl: `${req.protocol}://${req.get('host')}/api/line/webhook`,
    timestamp: new Date().toISOString()
  };
  
  res.json({
    status: 'success',
    config: configCheck
  });
});

module.exports = router;
