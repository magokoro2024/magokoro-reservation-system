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

// リッチメニューの設定
async function setupRichMenu() {
  try {
    // 既存のリッチメニューを削除
    const existingMenus = await client.getRichMenuList();
    for (const menu of existingMenus) {
      await client.deleteRichMenu(menu.richMenuId);
    }

    // 新しいリッチメニューを作成
    const richMenu = {
      size: {
        width: 2500,
        height: 1686
      },
      selected: false,
      name: "まごころおにぎり予約メニュー",
      chatBarText: "メニュー",
      areas: [
        {
          bounds: {
            x: 0,
            y: 0,
            width: 1250,
            height: 843
          },
          action: {
            type: "message",
            text: "予約"
          }
        },
        {
          bounds: {
            x: 1250,
            y: 0,
            width: 1250,
            height: 843
          },
          action: {
            type: "message",
            text: "確認"
          }
        },
        {
          bounds: {
            x: 0,
            y: 843,
            width: 1250,
            height: 843
          },
          action: {
            type: "message",
            text: "メニュー"
          }
        },
        {
          bounds: {
            x: 1250,
            y: 843,
            width: 1250,
            height: 843
          },
          action: {
            type: "message",
            text: "ヘルプ"
          }
        }
      ]
    };

    const richMenuId = await client.createRichMenu(richMenu);
    
    // リッチメニューを全ユーザーに設定
    await client.setDefaultRichMenu(richMenuId);
    
    console.log('リッチメニューが設定されました:', richMenuId);
  } catch (error) {
    console.error('リッチメニュー設定エラー:', error);
  }
}

// 営業日チェック（平日のみ）
function isBusinessDay(date) {
  const day = date.getDay();
  return day >= 1 && day <= 5; // 1=月曜日, 5=金曜日
}

// 営業時間の時間枠
const TIME_SLOTS = [
  '11:00', '11:30', '12:00', '12:30', 
  '13:00', '13:30', '14:00', '14:30'
];

// 利用可能な日付を7営業日分取得
function getAvailableDates() {
  const dates = [];
  const today = new Date();
  let count = 0;
  
  for (let i = 1; count < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    
    if (isBusinessDay(date)) {
      dates.push(date);
      count++;
    }
  }
  
  return dates;
}

// 日付フォーマット関数
function formatDate(date) {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
  const weekday = weekdays[date.getDay()];
  
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  
  if (date.toDateString() === tomorrow.toDateString()) {
    return `明日 ${month}/${day}`;
  } else {
    return `${month}/${day}(${weekday})`;
  }
}

// 予約開始時の応答
async function handleReservationStart(event) {
  const availableDates = getAvailableDates();
  
  const quickReplyItems = availableDates.map(date => ({
    type: 'action',
    action: {
      type: 'postback',
      label: formatDate(date),
      data: `予約_日付_${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    }
  }));

  const message = {
    type: 'text',
    text: '🍙 まごころおにぎり予約システム\n\n📅 ご希望の日付をお選びください：\n\n⏰ 営業時間：平日11:00-14:30\n🕐 30分刻みで受付中\n📦 各時間枠最大10個まで\n\n※土日祝は休業日です',
    quickReply: {
      items: quickReplyItems
    }
  };

  return client.replyMessage(event.replyToken, message);
}

// 時間選択の応答（在庫数表示付き）
async function handleTimeSelection(event, selectedDate) {
  try {
    const quickReplyItems = [];
    
    // 各時間枠の在庫チェック
    for (const timeSlot of TIME_SLOTS) {
      const inventory = await checkInventory(selectedDate, timeSlot);
      const availableCount = inventory.available_count;
      
      if (availableCount > 0) {
        quickReplyItems.push({
          type: 'action',
          action: {
            type: 'postback',
            label: `${timeSlot} (残${availableCount}個)`,
            data: `予約_時間_${selectedDate}_${timeSlot}`
          }
        });
      }
    }

    if (quickReplyItems.length === 0) {
      const message = {
        type: 'text',
        text: '申し訳ございません。\n選択された日付は全ての時間枠が満席となっております。\n\n別の日付をお選びください。'
      };
      return client.replyMessage(event.replyToken, message);
    }

    const message = {
      type: 'text',
      text: `📅 ${selectedDate}\n\n🕐 ご希望の時間をお選びください：\n\n💡 ご予約は30分ごとの時間枠ごとに最大10個までご指定いただけます`,
      quickReply: {
        items: quickReplyItems
      }
    };

    return client.replyMessage(event.replyToken, message);
  } catch (error) {
    console.error('時間選択エラー:', error);
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: 'エラーが発生しました。もう一度お試しください。'
    });
  }
}

// おにぎり種類選択（カルーセル表示）
async function showOnigiriSelection(event, selectedDate, selectedTime) {
  try {
    const inventory = await checkInventory(selectedDate, selectedTime);
    const availableCount = inventory.available_count;
    
    if (availableCount <= 0) {
      const message = {
        type: 'text',
        text: '申し訳ございません。\n選択された時間枠は満席となっております。\n\n別の時間をお選びください。'
      };
      return client.replyMessage(event.replyToken, message);
    }

    const menuItems = await getMenuItems();
    const columns = menuItems.map(item => ({
      thumbnailImageUrl: `https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=300&h=200&fit=crop&overlay=text&text=${encodeURIComponent(item.name)}`,
      title: item.name,
      text: `${item.description}\n¥${item.price}`,
      actions: [
        {
          type: 'postback',
          label: '選択する',
          data: `予約_おにぎり_${selectedDate}_${selectedTime}_${item.name}`
        }
      ]
    }));

    const message = {
      type: 'template',
      altText: 'おにぎりを選択してください',
      template: {
        type: 'carousel',
        columns: columns
      }
    };

    return client.replyMessage(event.replyToken, message);
  } catch (error) {
    console.error('おにぎり選択エラー:', error);
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: 'エラーが発生しました。もう一度お試しください。'
    });
  }
}

// 数量選択の応答
async function handleQuantitySelection(event, selectedDate, selectedTime, selectedOnigiri) {
  try {
    const inventory = await checkInventory(selectedDate, selectedTime);
    const availableCount = inventory.available_count;
    
    if (availableCount <= 0) {
      const message = {
        type: 'text',
        text: '申し訳ございません。\n選択された時間枠は満席となっております。\n\n別の時間をお選びください。'
      };
      return client.replyMessage(event.replyToken, message);
    }

    const maxQuantity = Math.min(availableCount, 5); // 最大5個まで
    const quickReplyItems = [];
    
    for (let i = 1; i <= maxQuantity; i++) {
      quickReplyItems.push({
        type: 'action',
        action: {
          type: 'postback',
          label: `${i}個`,
          data: `予約_数量_${selectedDate}_${selectedTime}_${selectedOnigiri}_${i}`
        }
      });
    }

    const message = {
      type: 'text',
      text: `🍙 ${selectedOnigiri}\n📅 ${selectedDate} ${selectedTime}\n\n数量をお選びください：\n（残り${availableCount}個）`,
      quickReply: {
        items: quickReplyItems
      }
    };

    return client.replyMessage(event.replyToken, message);
  } catch (error) {
    console.error('数量選択エラー:', error);
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: 'エラーが発生しました。もう一度お試しください。'
    });
  }
}

// 予約確定の応答
async function handleReservationConfirmation(event, selectedDate, selectedTime, selectedOnigiri, quantity) {
  try {
    const reservation = await createReservation(
      event.source.userId,
      selectedDate,
      selectedTime,
      selectedOnigiri,
      parseInt(quantity)
    );

    const menuItems = await getMenuItems();
    const selectedItem = menuItems.find(item => item.name === selectedOnigiri);
    const totalPrice = selectedItem ? selectedItem.price * parseInt(quantity) : 0;

    const message = {
      type: 'text',
      text: `✅ 予約が確定しました！\n\n【予約詳細】\n📅 日時：${selectedDate} ${selectedTime}\n🍙 おにぎり：${selectedOnigiri}\n🔢 数量：${quantity}個\n💰 合計金額：¥${totalPrice}\n\n🏪 当日のご来店をお待ちしております！\n\n※変更・キャンセルは前日までにご連絡ください。\n※営業時間：平日11:00-14:30`
    };

    return client.replyMessage(event.replyToken, message);
  } catch (error) {
    console.error('予約確定エラー:', error);
    const errorMessage = {
      type: 'text',
      text: `❌ 予約エラー\n\n${error.message}\n\n別の時間枠をお選びください。`
    };
    return client.replyMessage(event.replyToken, errorMessage);
  }
}

// 予約確認の応答
async function handleReservationCheck(event) {
  try {
    const reservations = await getReservations(event.source.userId);
    
    if (reservations.length === 0) {
      const message = {
        type: 'text',
        text: '現在、予約はございません。\n\n新しい予約をするには「予約」とメッセージしてください。'
      };
      return client.replyMessage(event.replyToken, message);
    }

    let responseText = '📋 あなたの予約一覧：\n\n';
    let totalPrice = 0;
    
    reservations.forEach((reservation, index) => {
      const itemPrice = reservation.price * reservation.quantity;
      totalPrice += itemPrice;
      
      responseText += `${index + 1}. 📅 ${reservation.reservation_date} ${reservation.time_slot}\n`;
      responseText += `   🍙 ${reservation.onigiri_type} × ${reservation.quantity}個\n`;
      responseText += `   💰 ¥${itemPrice}\n\n`;
    });
    
    responseText += `合計金額：¥${totalPrice}\n\n`;
    responseText += '※変更・キャンセルは前日までにご連絡ください。';

    const message = {
      type: 'text',
      text: responseText
    };

    return client.replyMessage(event.replyToken, message);
  } catch (error) {
    console.error('予約確認エラー:', error);
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: 'エラーが発生しました。もう一度お試しください。'
    });
  }
}

// メッセージイベントの処理
async function handleMessage(event) {
  const message = event.message.text;
  const userId = event.source.userId;
  
  console.log(`メッセージ受信: "${message}" from ${userId}`);

  if (message === '予約') {
    console.log('予約処理開始');
    return handleReservationStart(event);
  } else if (message === '確認') {
    console.log('予約確認処理開始');
    return handleReservationCheck(event);
  } else if (message === 'メニュー') {
    console.log('メニュー表示処理開始');
    return showOnigiriSelection(event, null, null);
  } else if (message === 'ヘルプ') {
    console.log('ヘルプ表示処理開始');
    const helpMessage = {
      type: 'text',
      text: '🍙 まごころおにぎり予約システム\n\n【使用方法】\n・「予約」→新しい予約\n・「確認」→予約確認\n・「メニュー」→メニュー表示\n・「ヘルプ」→この説明\n\n【営業時間】\n平日 11:00-14:30\n（土日祝は休業）\n\n【予約枠】\n30分刻み、各枠最大10個まで'
    };
    return client.replyMessage(event.replyToken, helpMessage);
  }

  console.log('デフォルト応答処理');
  return client.replyMessage(event.replyToken, {
    type: 'text',
    text: '🍙 まごころおにぎり予約システム\n\n【コマンド】\n・「予約」→新しい予約\n・「確認」→予約確認\n・「メニュー」→メニュー表示\n・「ヘルプ」→使用方法'
  });
}

// ポストバックイベントの処理
async function handlePostback(event) {
  const data = event.postback.data;

  if (data.startsWith('予約_日付_')) {
    const selectedDate = data.replace('予約_日付_', '');
    return handleTimeSelection(event, selectedDate);
  }

  if (data.startsWith('予約_時間_')) {
    const parts = data.replace('予約_時間_', '').split('_');
    const selectedDate = parts[0];
    const selectedTime = parts[1];
    return showOnigiriSelection(event, selectedDate, selectedTime);
  }

  if (data.startsWith('予約_おにぎり_')) {
    const parts = data.replace('予約_おにぎり_', '').split('_');
    const selectedDate = parts[0];
    const selectedTime = parts[1];
    const selectedOnigiri = parts[2];
    return handleQuantitySelection(event, selectedDate, selectedTime, selectedOnigiri);
  }

  if (data.startsWith('予約_数量_')) {
    const parts = data.replace('予約_数量_', '').split('_');
    const selectedDate = parts[0];
    const selectedTime = parts[1];
    const selectedOnigiri = parts[2];
    const quantity = parts[3];
    return handleReservationConfirmation(event, selectedDate, selectedTime, selectedOnigiri, quantity);
  }

  return client.replyMessage(event.replyToken, {
    type: 'text',
    text: 'エラーが発生しました。もう一度お試しください。'
  });
}

// メインのwebhookハンドラー
router.post('/webhook', line.middleware(config), (req, res) => {
  Promise.all(req.body.events.map(handleEvent))
    .then(() => res.json({ status: 'success' }))
    .catch((error) => {
      console.error('Webhook Error:', error);
      res.status(500).json({ error: 'Internal server error' });
    });
});

// リッチメニュー設定エンドポイント
router.post('/setup-richmenu', async (req, res) => {
  try {
    await setupRichMenu();
    res.json({ status: 'success', message: 'リッチメニューが設定されました' });
  } catch (error) {
    console.error('リッチメニュー設定エラー:', error);
    res.status(500).json({ error: 'リッチメニュー設定に失敗しました' });
  }
});

// 環境変数チェックエンドポイント
router.get('/check-config', (req, res) => {
  const configCheck = {
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN ? '設定済み' : '未設定',
    channelSecret: process.env.LINE_CHANNEL_SECRET ? '設定済み' : '未設定',
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development'
  };
  
  res.json({
    status: 'success',
    config: configCheck,
    webhookUrl: `${req.protocol}://${req.get('host')}/api/line/webhook`
  });
});

// 友達追加イベントの処理
async function handleFollow(event) {
  const welcomeMessage = {
    type: 'text',
    text: `🍙 まごころおにぎり予約システムへようこそ！\n\n【ご利用方法】\n下記のコマンドをメッセージで送信してください：\n\n📅「予約」→新しい予約\n📋「確認」→予約確認\n🍙「メニュー」→メニュー表示\n❓「ヘルプ」→使用方法\n\n【営業時間】\n平日 11:00-14:30\n（土日祝は休業）\n\n予約をするには「予約」とメッセージしてください！`
  };
  return client.replyMessage(event.replyToken, welcomeMessage);
}

// イベント処理
async function handleEvent(event) {
  console.log('Event received:', event);
  
  if (event.type === 'message' && event.message.type === 'text') {
    return handleMessage(event);
  }

  if (event.type === 'postback') {
    return handlePostback(event);
  }

  if (event.type === 'follow') {
    return handleFollow(event);
  }

  return Promise.resolve(null);
}

module.exports = router; 