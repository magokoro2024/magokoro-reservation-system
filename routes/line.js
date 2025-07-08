const express = require('express');
const line = require('@line/bot-sdk');
const db = require('../database');
const moment = require('moment');

const router = express.Router();

// LINE Bot設定
const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const client = new line.Client(config);

// テスト用エンドポイント
router.get('/webhook', (req, res) => {
  res.json({
    status: 'ok',
    message: 'LINE Bot Webhook endpoint is working',
    timestamp: new Date().toISOString()
  });
});

// Webhook endpoint
router.post('/webhook', line.middleware(config), (req, res) => {
  Promise
    .all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error('Webhook error:', err);
      res.status(500).end();
    });
});

// イベントハンドラー
async function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }

  const userId = event.source.userId;
  const messageText = event.message.text;

  // ユーザー情報を取得または作成
  await getOrCreateUser(userId);

  // メッセージの処理
  if (messageText === '予約する' || messageText === '予約') {
    return handleReservationStart(event);
  } else if (messageText === '予約確認' || messageText === '確認') {
    return handleReservationCheck(event);
  } else if (messageText === '予約キャンセル' || messageText === 'キャンセル') {
    return handleReservationCancel(event);
  } else if (messageText === 'メニュー' || messageText === 'メニュー確認') {
    return handleMenuRequest(event);
  } else if (messageText === '営業時間' || messageText === '営業時間確認') {
    return handleBusinessHours(event);
  } else if (messageText.startsWith('予約_')) {
    return handleReservationStep(event);
  } else {
    return handleDefaultMessage(event);
  }
}

// ユーザー情報の取得または作成
async function getOrCreateUser(userId) {
  return new Promise((resolve, reject) => {
    const sqliteDb = db.getDb();
    sqliteDb.get('SELECT * FROM users WHERE line_user_id = ?', [userId], (err, row) => {
      if (err) {
        reject(err);
      } else if (!row) {
        sqliteDb.run('INSERT INTO users (line_user_id) VALUES (?)', [userId], (err) => {
          if (err) reject(err);
          else resolve();
        });
      } else {
        resolve();
      }
    });
  });
}

// 予約開始の処理
async function handleReservationStart(event) {
  const quickReply = {
    items: [
      {
        type: 'action',
        action: {
          type: 'message',
          label: '今日',
          text: '予約_今日'
        }
      },
      {
        type: 'action',
        action: {
          type: 'message',
          label: '明日',
          text: '予約_明日'
        }
      },
      {
        type: 'action',
        action: {
          type: 'message',
          label: '明後日',
          text: '予約_明後日'
        }
      }
    ]
  };

  const replyToken = event.replyToken;
  const message = {
    type: 'text',
    text: 'ご予約ありがとうございます！\n\nご希望の日付をお選びください：\n\n営業時間：平日11:00-14:30\n（土日祝は休業）',
    quickReply: quickReply
  };

  return client.replyMessage(replyToken, message);
}

// 予約ステップの処理
async function handleReservationStep(event) {
  const messageText = event.message.text;
  const userId = event.source.userId;

  if (messageText === '予約_今日' || messageText === '予約_明日' || messageText === '予約_明後日') {
    return handleDateSelection(event, messageText);
  } else if (messageText.startsWith('予約_時間_')) {
    return handleTimeSelection(event, messageText);
  } else if (messageText.startsWith('予約_メニュー_')) {
    return handleMenuSelection(event, messageText);
  } else if (messageText.startsWith('予約_確認_')) {
    return handleReservationConfirmation(event, messageText);
  }
}

// 日付選択の処理
async function handleDateSelection(event, messageText) {
  let selectedDate;
  const today = moment();
  
  if (messageText === '予約_今日') {
    selectedDate = today.clone();
  } else if (messageText === '予約_明日') {
    selectedDate = today.clone().add(1, 'day');
  } else if (messageText === '予約_明後日') {
    selectedDate = today.clone().add(2, 'days');
  }

  // 土日祝のチェック
  if (selectedDate.day() === 0 || selectedDate.day() === 6) {
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: '申し訳ございません。土日祝は休業日です。\n平日をお選びください。'
    });
  }

  // 時間選択のクイックリプライ
  const quickReply = {
    items: [
      {
        type: 'action',
        action: {
          type: 'message',
          label: '11:00',
          text: `予約_時間_${selectedDate.format('YYYY-MM-DD')}_11:00`
        }
      },
      {
        type: 'action',
        action: {
          type: 'message',
          label: '11:30',
          text: `予約_時間_${selectedDate.format('YYYY-MM-DD')}_11:30`
        }
      },
      {
        type: 'action',
        action: {
          type: 'message',
          label: '12:00',
          text: `予約_時間_${selectedDate.format('YYYY-MM-DD')}_12:00`
        }
      },
      {
        type: 'action',
        action: {
          type: 'message',
          label: '12:30',
          text: `予約_時間_${selectedDate.format('YYYY-MM-DD')}_12:30`
        }
      },
      {
        type: 'action',
        action: {
          type: 'message',
          label: '13:00',
          text: `予約_時間_${selectedDate.format('YYYY-MM-DD')}_13:00`
        }
      },
      {
        type: 'action',
        action: {
          type: 'message',
          label: '13:30',
          text: `予約_時間_${selectedDate.format('YYYY-MM-DD')}_13:30`
        }
      },
      {
        type: 'action',
        action: {
          type: 'message',
          label: '14:00',
          text: `予約_時間_${selectedDate.format('YYYY-MM-DD')}_14:00`
        }
      }
    ]
  };

  return client.replyMessage(event.replyToken, {
    type: 'text',
    text: `${selectedDate.format('MM月DD日')}をお選びいただきました。\n\nご希望の時間をお選びください：`,
    quickReply: quickReply
  });
}

// 時間選択の処理
async function handleTimeSelection(event, messageText) {
  const parts = messageText.split('_');
  const date = parts[2];
  const time = parts[3];

  // メニュー選択のクイックリプライ
  const menuItems = await getMenuItems();
  const quickReply = {
    items: menuItems.map(item => ({
      type: 'action',
      action: {
        type: 'message',
        label: `${item.name}(${item.price}円)`,
        text: `予約_メニュー_${date}_${time}_${item.id}`
      }
    }))
  };

  return client.replyMessage(event.replyToken, {
    type: 'text',
    text: `${moment(date).format('MM月DD日')} ${time}をお選びいただきました。\n\nご希望のメニューをお選びください：`,
    quickReply: quickReply
  });
}

// メニュー選択の処理
async function handleMenuSelection(event, messageText) {
  const parts = messageText.split('_');
  const date = parts[2];
  const time = parts[3];
  const menuId = parts[4];

  const menuItem = await getMenuItemById(menuId);
  
  const quickReply = {
    items: [
      {
        type: 'action',
        action: {
          type: 'message',
          label: '予約確定',
          text: `予約_確認_${date}_${time}_${menuId}`
        }
      },
      {
        type: 'action',
        action: {
          type: 'message',
          label: 'やり直し',
          text: '予約する'
        }
      }
    ]
  };

  return client.replyMessage(event.replyToken, {
    type: 'text',
    text: `予約内容をご確認ください：\n\n日時：${moment(date).format('MM月DD日')} ${time}\nメニュー：${menuItem.name}(${menuItem.price}円)\n\n予約を確定しますか？`,
    quickReply: quickReply
  });
}

// 予約確定の処理
async function handleReservationConfirmation(event, messageText) {
  const parts = messageText.split('_');
  const date = parts[2];
  const time = parts[3];
  const menuId = parts[4];
  const userId = event.source.userId;

  try {
    // 予約をデータベースに保存
    const reservationId = await createReservation(userId, date, time, menuId);
    const menuItem = await getMenuItemById(menuId);

    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: `予約が完了しました！\n\n予約番号：${reservationId}\n日時：${moment(date).format('MM月DD日')} ${time}\nメニュー：${menuItem.name}(${menuItem.price}円)\n\nお時間になりましたら店舗にお越しください。\n\nキャンセルの場合は「予約キャンセル」とメッセージしてください。`
    });
  } catch (error) {
    console.error('予約作成エラー:', error);
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: '申し訳ございません。予約の作成に失敗しました。もう一度お試しください。'
    });
  }
}

// 予約確認の処理
async function handleReservationCheck(event) {
  const userId = event.source.userId;
  
  try {
    const reservations = await getUserReservations(userId);
    
    if (reservations.length === 0) {
      return client.replyMessage(event.replyToken, {
        type: 'text',
        text: '現在、予約はございません。'
      });
    }

    let message = '現在の予約一覧：\n\n';
    reservations.forEach(reservation => {
      message += `予約番号：${reservation.id}\n`;
      message += `日時：${moment(reservation.reservation_date).format('MM月DD日')} ${reservation.reservation_time}\n`;
      message += `メニュー：${reservation.menu_name}(${reservation.menu_price}円)\n`;
      message += `状態：${reservation.status}\n\n`;
    });

    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: message
    });
  } catch (error) {
    console.error('予約確認エラー:', error);
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: '予約確認に失敗しました。もう一度お試しください。'
    });
  }
}

// 予約キャンセルの処理
async function handleReservationCancel(event) {
  const userId = event.source.userId;
  
  try {
    const reservations = await getUserActiveReservations(userId);
    
    if (reservations.length === 0) {
      return client.replyMessage(event.replyToken, {
        type: 'text',
        text: 'キャンセル可能な予約はございません。'
      });
    }

    const quickReply = {
      items: reservations.map(reservation => ({
        type: 'action',
        action: {
          type: 'message',
          label: `予約${reservation.id}`,
          text: `キャンセル_${reservation.id}`
        }
      }))
    };

    let message = 'キャンセルする予約をお選びください：\n\n';
    reservations.forEach(reservation => {
      message += `予約番号：${reservation.id}\n`;
      message += `日時：${moment(reservation.reservation_date).format('MM月DD日')} ${reservation.reservation_time}\n`;
      message += `メニュー：${reservation.menu_name}\n\n`;
    });

    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: message,
      quickReply: quickReply
    });
  } catch (error) {
    console.error('予約キャンセル処理エラー:', error);
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: '予約キャンセル処理に失敗しました。もう一度お試しください。'
    });
  }
}

// メニュー表示の処理
async function handleMenuRequest(event) {
  try {
    const menuItems = await getMenuItems();
    
    let message = '【まごころ おにぎり屋 メニュー】\n\n';
    menuItems.forEach(item => {
      message += `${item.name}：${item.price}円\n`;
    });
    message += '\n予約をご希望の場合は「予約する」とメッセージしてください。';

    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: message
    });
  } catch (error) {
    console.error('メニュー表示エラー:', error);
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: 'メニュー表示に失敗しました。もう一度お試しください。'
    });
  }
}

// 営業時間表示の処理
async function handleBusinessHours(event) {
  return client.replyMessage(event.replyToken, {
    type: 'text',
    text: '【営業時間】\n平日：11:00-14:30\n土日祝：休業\n\n【店舗情報】\n〒347-0105 埼玉県加須市久下1-1-15\n\n予約をご希望の場合は「予約する」とメッセージしてください。'
  });
}

// デフォルトメッセージの処理
async function handleDefaultMessage(event) {
  const quickReply = {
    items: [
      {
        type: 'action',
        action: {
          type: 'message',
          label: '予約する',
          text: '予約する'
        }
      },
      {
        type: 'action',
        action: {
          type: 'message',
          label: '予約確認',
          text: '予約確認'
        }
      },
      {
        type: 'action',
        action: {
          type: 'message',
          label: 'メニュー',
          text: 'メニュー'
        }
      },
      {
        type: 'action',
        action: {
          type: 'message',
          label: '営業時間',
          text: '営業時間'
        }
      }
    ]
  };

  return client.replyMessage(event.replyToken, {
    type: 'text',
    text: 'いらっしゃいませ！\n「まごころ」おにぎり屋です。\n\n下記からお選びください：',
    quickReply: quickReply
  });
}

// データベースヘルパー関数
function getMenuItems() {
  return new Promise((resolve, reject) => {
    const sqliteDb = db.getDb();
    sqliteDb.all('SELECT * FROM menu_items WHERE is_available = 1', [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function getMenuItemById(id) {
  return new Promise((resolve, reject) => {
    const sqliteDb = db.getDb();
    sqliteDb.get('SELECT * FROM menu_items WHERE id = ?', [id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function createReservation(userId, date, time, menuId) {
  return new Promise((resolve, reject) => {
    const sqliteDb = db.getDb();
    sqliteDb.run(
      'INSERT INTO reservations (user_id, reservation_date, reservation_time, menu_items, status) VALUES ((SELECT id FROM users WHERE line_user_id = ?), ?, ?, ?, ?)',
      [userId, date, time, menuId, 'confirmed'],
      function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      }
    );
  });
}

function getUserReservations(userId) {
  return new Promise((resolve, reject) => {
    const sqliteDb = db.getDb();
    sqliteDb.all(`
      SELECT r.*, m.name as menu_name, m.price as menu_price 
      FROM reservations r 
      JOIN menu_items m ON r.menu_items = m.id 
      WHERE r.user_id = (SELECT id FROM users WHERE line_user_id = ?) 
      ORDER BY r.reservation_date DESC, r.reservation_time DESC
    `, [userId], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function getUserActiveReservations(userId) {
  return new Promise((resolve, reject) => {
    const sqliteDb = db.getDb();
    sqliteDb.all(`
      SELECT r.*, m.name as menu_name, m.price as menu_price 
      FROM reservations r 
      JOIN menu_items m ON r.menu_items = m.id 
      WHERE r.user_id = (SELECT id FROM users WHERE line_user_id = ?) 
      AND r.status = 'confirmed' 
      AND datetime(r.reservation_date || ' ' || r.reservation_time) > datetime('now', 'localtime')
      ORDER BY r.reservation_date, r.reservation_time
    `, [userId], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

module.exports = router; 