const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'magokoro.db');

class Database {
  constructor() {
    this.db = null;
  }

  initialize() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(DB_PATH, (err) => {
        if (err) {
          console.error('データベース接続エラー:', err);
          reject(err);
        } else {
          console.log('データベースに接続しました');
          this.createTables()
            .then(() => resolve())
            .catch(reject);
        }
      });
    });
  }

  createTables() {
    return new Promise((resolve, reject) => {
      const queries = [
        // ユーザーテーブル
        `CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          line_user_id TEXT UNIQUE NOT NULL,
          display_name TEXT,
          phone_number TEXT,
          email TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        
        // 予約テーブル
        `CREATE TABLE IF NOT EXISTS reservations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          reservation_date TEXT NOT NULL,
          reservation_time TEXT NOT NULL,
          quantity INTEGER NOT NULL DEFAULT 1,
          menu_items TEXT,
          total_price INTEGER DEFAULT 0,
          status TEXT DEFAULT 'pending',
          special_requests TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id)
        )`,
        
        // メニューテーブル
        `CREATE TABLE IF NOT EXISTS menu_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          price INTEGER NOT NULL,
          description TEXT,
          category TEXT,
          is_available BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        
        // 営業時間テーブル
        `CREATE TABLE IF NOT EXISTS business_hours (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          day_of_week INTEGER NOT NULL,
          open_time TEXT NOT NULL,
          close_time TEXT NOT NULL,
          is_open BOOLEAN DEFAULT 1
        )`,
        
        // 営業日カレンダーテーブル
        `CREATE TABLE IF NOT EXISTS business_calendar (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          business_date DATE NOT NULL UNIQUE,
          is_open BOOLEAN NOT NULL DEFAULT 1,
          notes TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`
      ];

      let completed = 0;
      const total = queries.length;

      queries.forEach(query => {
        this.db.run(query, (err) => {
          if (err) {
            console.error('テーブル作成エラー:', err);
            reject(err);
          } else {
            completed++;
            if (completed === total) {
              console.log('データベーステーブルの作成が完了しました');
              this.insertInitialData()
                .then(() => resolve())
                .catch(reject);
            }
          }
        });
      });
    });
  }

  insertInitialData() {
    return new Promise((resolve, reject) => {
      // メニューの初期データ
      const menuItems = [
        ['塩', 90, 'シンプルな塩おにぎり', 'regular'],
        ['ツナマヨ', 100, '人気のツナマヨおにぎり', 'regular'],
        ['とりそぼろ', 110, '手作りとりそぼろおにぎり', 'regular'],
        ['こんぶ', 110, '北海道産昆布使用', 'regular'],
        ['鮭', 120, '新鮮な鮭を使用したおにぎり', 'regular'],
        ['たらこ', 130, '九州産たらこ使用', 'regular'],
        ['高菜', 130, '九州産高菜使用', 'regular']
      ];

      // 営業時間の初期データ（月曜日=1, 日曜日=0）
      const businessHours = [
        [1, '11:00', '14:30', 1], // 月曜日
        [2, '11:00', '14:30', 1], // 火曜日
        [3, '11:00', '14:30', 1], // 水曜日
        [4, '11:00', '14:30', 1], // 木曜日
        [5, '11:00', '14:30', 1], // 金曜日
        [6, '11:00', '14:30', 0], // 土曜日（休み）
        [0, '11:00', '14:30', 0]  // 日曜日（休み）
      ];

      // 初期営業日カレンダー（3ヶ月分の平日を営業日として設定）
      const businessCalendar = this.generateInitialBusinessCalendar();
      
      let completed = 0;
      let total = menuItems.length + businessHours.length + businessCalendar.length;

      // メニューアイテムの挿入
      menuItems.forEach(item => {
        this.db.run(
          `INSERT OR IGNORE INTO menu_items (name, price, description, category) VALUES (?, ?, ?, ?)`,
          item,
          (err) => {
            if (err) {
              console.error('メニューデータ挿入エラー:', err);
            }
            completed++;
            if (completed === total) {
              console.log('初期データの挿入が完了しました');
              resolve();
            }
          }
        );
      });

      // 営業時間の挿入
      businessHours.forEach(hours => {
        this.db.run(
          `INSERT OR IGNORE INTO business_hours (day_of_week, open_time, close_time, is_open) VALUES (?, ?, ?, ?)`,
          hours,
          (err) => {
            if (err) {
              console.error('営業時間データ挿入エラー:', err);
            }
            completed++;
            if (completed === total) {
              console.log('初期データの挿入が完了しました');
              resolve();
            }
          }
        );
      });

      // 営業日カレンダーの挿入
      businessCalendar.forEach(calendar => {
        this.db.run(
          `INSERT OR IGNORE INTO business_calendar (business_date, is_open, notes) VALUES (?, ?, ?)`,
          calendar,
          (err) => {
            if (err) {
              console.error('営業日カレンダーデータ挿入エラー:', err);
            }
            completed++;
            if (completed === total) {
              console.log('初期データの挿入が完了しました');
              resolve();
            }
          }
        );
      });
    });
  }

  // 初期営業日カレンダーを生成（3ヶ月分）
  generateInitialBusinessCalendar() {
    const calendar = [];
    const today = new Date();
    const endDate = new Date();
    endDate.setMonth(today.getMonth() + 3); // 3ヶ月後まで

    let currentDate = new Date(today);
    
    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay(); // 0=日曜日, 1=月曜日, ..., 6=土曜日
      const dateString = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD形式
      
      // 平日（月〜金）は営業日、土日は休業日
      const isOpen = dayOfWeek >= 1 && dayOfWeek <= 5;
      const notes = isOpen ? '平日営業' : '土日休業';
      
      calendar.push([dateString, isOpen ? 1 : 0, notes]);
      
      // 次の日に進む
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return calendar;
  }

  getDb() {
    return this.db;
  }

  close() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            reject(err);
          } else {
            console.log('データベース接続を閉じました');
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }
}

module.exports = new Database(); 