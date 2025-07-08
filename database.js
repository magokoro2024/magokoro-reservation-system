const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// データベースファイルのパス
const dbPath = path.join(__dirname, 'reservation.db');

// データベース接続
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('データベース接続エラー:', err);
  } else {
    console.log('データベースに接続しました');
  }
});

// テーブル作成
db.serialize(() => {
  // ユーザーテーブル
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      line_user_id TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 予約テーブル
  db.run(`
    CREATE TABLE IF NOT EXISTS reservations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      reservation_date TEXT NOT NULL,
      time_slot TEXT NOT NULL,
      onigiri_type TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `);

  // 在庫管理テーブル
  db.run(`
    CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reservation_date TEXT NOT NULL,
      time_slot TEXT NOT NULL,
      total_capacity INTEGER DEFAULT 10,
      reserved_count INTEGER DEFAULT 0,
      available_count INTEGER DEFAULT 10,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(reservation_date, time_slot)
    )
  `);

  // メニューテーブル
  db.run(`
    CREATE TABLE IF NOT EXISTS menu_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      price INTEGER,
      is_available BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 初期メニューデータの挿入
  const onigiriTypes = [
    { name: '塩', description: 'シンプルな塩おにぎり', price: 120 },
    { name: 'ツナマヨ', description: 'ツナマヨネーズおにぎり', price: 150 },
    { name: '昆布', description: '昆布の旨味たっぷり', price: 130 },
    { name: 'とりそぼろ', description: '鶏そぼろおにぎり', price: 140 },
    { name: '鮭', description: '新鮮な鮭のおにぎり', price: 160 },
    { name: '梅', description: '酸味の効いた梅おにぎり', price: 130 },
    { name: 'たらこ', description: 'たらこの旨味おにぎり', price: 170 },
    { name: '高菜', description: '高菜の風味豊かなおにぎり', price: 140 }
  ];

  onigiriTypes.forEach(item => {
    db.run(`
      INSERT OR IGNORE INTO menu_items (name, description, price) 
      VALUES (?, ?, ?)
    `, [item.name, item.description, item.price]);
  });
});

// 在庫初期化関数
function initializeInventory(date, timeSlot) {
  return new Promise((resolve, reject) => {
    db.run(`
      INSERT OR IGNORE INTO inventory (reservation_date, time_slot, total_capacity, reserved_count, available_count)
      VALUES (?, ?, 10, 0, 10)
    `, [date, timeSlot], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

// 在庫チェック関数
function checkInventory(date, timeSlot) {
  return new Promise((resolve, reject) => {
    db.get(`
      SELECT * FROM inventory 
      WHERE reservation_date = ? AND time_slot = ?
    `, [date, timeSlot], (err, row) => {
      if (err) {
        reject(err);
      } else {
        if (!row) {
          // 在庫レコードが存在しない場合は初期化
          initializeInventory(date, timeSlot).then(() => {
            resolve({ available_count: 10, reserved_count: 0 });
          }).catch(reject);
        } else {
          resolve(row);
        }
      }
    });
  });
}

// 在庫更新関数
function updateInventory(date, timeSlot, quantity) {
  return new Promise((resolve, reject) => {
    db.run(`
      UPDATE inventory 
      SET reserved_count = reserved_count + ?, 
          available_count = available_count - ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE reservation_date = ? AND time_slot = ?
    `, [quantity, quantity, date, timeSlot], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

// ユーザー作成/取得
function getOrCreateUser(lineUserId) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM users WHERE line_user_id = ?', [lineUserId], (err, row) => {
      if (err) {
        reject(err);
      } else if (row) {
        resolve(row);
      } else {
        db.run('INSERT INTO users (line_user_id) VALUES (?)', [lineUserId], function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ id: this.lastID, line_user_id: lineUserId });
          }
        });
      }
    });
  });
}

// 予約作成
function createReservation(lineUserId, reservationDate, timeSlot, onigiriType, quantity) {
  return new Promise(async (resolve, reject) => {
    try {
      // 在庫チェック
      const inventory = await checkInventory(reservationDate, timeSlot);
      if (inventory.available_count < quantity) {
        reject(new Error(`在庫不足: ${timeSlot}の時間枠で予約可能な数量は${inventory.available_count}個です`));
        return;
      }

      // ユーザー取得
      const user = await getOrCreateUser(lineUserId);
      
      // 予約作成
      db.run(`
        INSERT INTO reservations (user_id, reservation_date, time_slot, onigiri_type, quantity)
        VALUES (?, ?, ?, ?, ?)
      `, [user.id, reservationDate, timeSlot, onigiriType, quantity], async function(err) {
        if (err) {
          reject(err);
        } else {
          // 在庫更新
          try {
            await updateInventory(reservationDate, timeSlot, quantity);
            resolve({ id: this.lastID, reservationDate, timeSlot, onigiriType, quantity });
          } catch (inventoryError) {
            reject(inventoryError);
          }
        }
      });
    } catch (error) {
      reject(error);
    }
  });
}

// 予約一覧取得
function getReservations(lineUserId) {
  return new Promise((resolve, reject) => {
    getOrCreateUser(lineUserId).then(user => {
      db.all(`
        SELECT r.*, m.description, m.price 
        FROM reservations r
        LEFT JOIN menu_items m ON r.onigiri_type = m.name
        WHERE r.user_id = ? AND r.status = 'active'
        ORDER BY r.reservation_date, r.time_slot
      `, [user.id], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    }).catch(reject);
  });
}

// メニュー一覧取得
function getMenuItems() {
  return new Promise((resolve, reject) => {
    db.all(`
      SELECT * FROM menu_items 
      WHERE is_available = 1
      ORDER BY id
    `, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// 予約更新
function updateReservation(id, updates) {
  return new Promise((resolve, reject) => {
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    values.push(id);
    
    db.run(`UPDATE reservations SET ${fields} WHERE id = ?`, values, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve(this.changes);
      }
    });
  });
}

// 予約削除
function deleteReservation(id) {
  return new Promise((resolve, reject) => {
    db.run('UPDATE reservations SET status = "cancelled" WHERE id = ?', [id], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve(this.changes);
      }
    });
  });
}

// 旧関数との互換性のために
function insertReservation(lineUserId, date, time, menu) {
  return createReservation(lineUserId, date, time, menu, 1);
}

module.exports = {
  db,
  getOrCreateUser,
  createReservation,
  getReservations,
  getMenuItems,
  updateReservation,
  deleteReservation,
  checkInventory,
  updateInventory,
  initializeInventory,
  // 旧関数との互換性
  insertReservation
}; 