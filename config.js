// まごころおにぎり屋予約システム設定

const config = {
  // サーバー設定
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',

  // LINE Bot API設定
  line: {
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || 'YOUR_LINE_CHANNEL_ACCESS_TOKEN',
    channelSecret: process.env.LINE_CHANNEL_SECRET || 'YOUR_LINE_CHANNEL_SECRET'
  },

  // データベース設定
  database: {
    path: process.env.DB_PATH || './magokoro.db'
  },

  // 店舗情報
  store: {
    name: 'まごころおにぎり屋',
    company: '合同会社こころ',
    address: '〒347-0105 埼玉県加須市久下1-1-15',
    phone: '0480-XX-XXXX',
    email: 'magokoro2024.4@gmail.com',
    businessHours: {
      weekday: { open: '11:00', close: '14:30' },
      saturday: { is_closed: true },
      sunday: { is_closed: true }
    }
  },

  // 予約設定
  reservation: {
    maxReservationsPerDay: 80,      // 各時間帯10個 × 8時間帯 = 80個
    maxReservationsPerTimeSlot: 10, // 各時間帯の上限
    maxReservationsPerUser: 3,
    reservationHoursAhead: 24,      // 前日予約システム（24時間前まで）
    timeSlots: [
      '11:00', '11:30', '12:00', '12:30',
      '13:00', '13:30', '14:00', '14:30'
    ]
  },

  // セキュリティ設定
  security: {
    sessionSecret: process.env.SESSION_SECRET || 'your-session-secret-key-here',
    jwtSecret: process.env.JWT_SECRET || 'your-jwt-secret-key-here'
  },

  // 通知設定
  notification: {
    adminLineUserId: process.env.ADMIN_LINE_USER_ID || 'YOUR_ADMIN_LINE_USER_ID',
    enabled: process.env.NOTIFICATION_ENABLED === 'true' || true
  },

  // メッセージテンプレート
  messages: {
    welcome: `こんにちは！\n${this.store?.name || 'まごころおにぎり屋'}へようこそ🍙\n\n下記のメニューから選択してください：\n\n📅 予約する\n📋 予約確認\n🍙 メニュー\n📞 お問い合わせ`,
    
    menuInfo: `🍙 メニュー一覧\n\n【おにぎり各種】\n・塩：90円\n・ツナマヨ：100円\n・とりそぼろ：110円\n・こんぶ：110円\n・鮭：120円\n・たらこ：130円\n・高菜：130円\n\n予約をご希望の場合は「予約する」をタップしてください。`,
    
    businessHours: `📍 店舗情報\n\n住所：〒347-0105 埼玉県加須市久下1-1-15\n電話：0480-XX-XXXX\n\n営業時間：\n平日：11:00-14:30\n\n定休日：土曜日・日曜日\n\n📝 予約について：\n前日までの予約制\n30分刻みで受付\n各時間帯10個まで`,
    
    confirmReservation: '予約内容を確認しています...',
    reservationComplete: '予約が完了しました！\n詳細をメールでお送りします。',
    reservationError: 'ご予約の際にエラーが発生しました。\nお手数ですが、再度お試しください。'
  }
};

module.exports = config; 