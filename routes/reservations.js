const express = require('express');
const db = require('../database');
const moment = require('moment');

const router = express.Router();

// 予約一覧の取得
router.get('/', (req, res) => {
  const query = `
    SELECT 
      r.id,
      r.reservation_date,
      r.reservation_time,
      r.status,
      r.created_at,
      r.updated_at,
      m.name as menu_name,
      m.price as menu_price,
      u.line_id as user_line_id
    FROM reservations r
    LEFT JOIN menu_items m ON r.menu_id = m.id
    LEFT JOIN users u ON r.user_id = u.id
    ORDER BY r.reservation_date DESC, r.reservation_time DESC
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('予約一覧取得エラー:', err);
      return res.status(500).json({ error: '予約一覧の取得に失敗しました' });
    }
    res.json(rows);
  });
});

// 予約の詳細取得
router.get('/:id', (req, res) => {
  const id = req.params.id;
  
  const query = `
    SELECT 
      r.id,
      r.reservation_date,
      r.reservation_time,
      r.status,
      r.created_at,
      r.updated_at,
      m.name as menu_name,
      m.price as menu_price,
      u.line_id as user_line_id
    FROM reservations r
    LEFT JOIN menu_items m ON r.menu_id = m.id
    LEFT JOIN users u ON r.user_id = u.id
    WHERE r.id = ?
  `;

  db.get(query, [id], (err, row) => {
    if (err) {
      console.error('予約詳細取得エラー:', err);
      return res.status(500).json({ error: '予約詳細の取得に失敗しました' });
    }
    if (!row) {
      return res.status(404).json({ error: '予約が見つかりません' });
    }
    res.json(row);
  });
});

// 予約の作成
router.post('/', (req, res) => {
  const { user_id, reservation_date, reservation_time, menu_id } = req.body;

  if (!user_id || !reservation_date || !reservation_time || !menu_id) {
    return res.status(400).json({ error: '必要なパラメータが不足しています' });
  }

  // 予約の重複チェック
  const checkQuery = `
    SELECT id FROM reservations 
    WHERE reservation_date = ? AND reservation_time = ? AND status = 'confirmed'
  `;

  db.get(checkQuery, [reservation_date, reservation_time], (err, existingReservation) => {
    if (err) {
      console.error('予約重複チェックエラー:', err);
      return res.status(500).json({ error: '予約の作成に失敗しました' });
    }

    if (existingReservation) {
      return res.status(409).json({ error: '指定された時間は既に予約されています' });
    }

    // 予約の作成
    const insertQuery = `
      INSERT INTO reservations (user_id, reservation_date, reservation_time, menu_id, status)
      VALUES (?, ?, ?, ?, 'confirmed')
    `;

    db.run(insertQuery, [user_id, reservation_date, reservation_time, menu_id], function(err) {
      if (err) {
        console.error('予約作成エラー:', err);
        return res.status(500).json({ error: '予約の作成に失敗しました' });
      }

      // 作成された予約の詳細を取得
      const selectQuery = `
        SELECT 
          r.id,
          r.reservation_date,
          r.reservation_time,
          r.status,
          r.created_at,
          m.name as menu_name,
          m.price as menu_price
        FROM reservations r
        LEFT JOIN menu_items m ON r.menu_id = m.id
        WHERE r.id = ?
      `;

      db.get(selectQuery, [this.lastID], (err, row) => {
        if (err) {
          console.error('作成された予約の取得エラー:', err);
          return res.status(500).json({ error: '予約は作成されましたが、詳細の取得に失敗しました' });
        }
        res.status(201).json(row);
      });
    });
  });
});

// 予約の更新
router.put('/:id', (req, res) => {
  const id = req.params.id;
  const { reservation_date, reservation_time, menu_id, status } = req.body;

  if (!reservation_date || !reservation_time || !menu_id || !status) {
    return res.status(400).json({ error: '必要なパラメータが不足しています' });
  }

  // 予約の存在確認
  db.get('SELECT id FROM reservations WHERE id = ?', [id], (err, row) => {
    if (err) {
      console.error('予約存在確認エラー:', err);
      return res.status(500).json({ error: '予約の更新に失敗しました' });
    }
    if (!row) {
      return res.status(404).json({ error: '予約が見つかりません' });
    }

    // 予約の更新
    const updateQuery = `
      UPDATE reservations 
      SET reservation_date = ?, reservation_time = ?, menu_id = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    db.run(updateQuery, [reservation_date, reservation_time, menu_id, status, id], function(err) {
      if (err) {
        console.error('予約更新エラー:', err);
        return res.status(500).json({ error: '予約の更新に失敗しました' });
      }

      // 更新された予約の詳細を取得
      const selectQuery = `
        SELECT 
          r.id,
          r.reservation_date,
          r.reservation_time,
          r.status,
          r.created_at,
          r.updated_at,
          m.name as menu_name,
          m.price as menu_price
        FROM reservations r
        LEFT JOIN menu_items m ON r.menu_id = m.id
        WHERE r.id = ?
      `;

      db.get(selectQuery, [id], (err, row) => {
        if (err) {
          console.error('更新された予約の取得エラー:', err);
          return res.status(500).json({ error: '予約は更新されましたが、詳細の取得に失敗しました' });
        }
        res.json(row);
      });
    });
  });
});

// 予約の削除
router.delete('/:id', (req, res) => {
  const id = req.params.id;

  // 予約の存在確認
  db.get('SELECT id FROM reservations WHERE id = ?', [id], (err, row) => {
    if (err) {
      console.error('予約存在確認エラー:', err);
      return res.status(500).json({ error: '予約の削除に失敗しました' });
    }
    if (!row) {
      return res.status(404).json({ error: '予約が見つかりません' });
    }

    // 予約の削除
    db.run('DELETE FROM reservations WHERE id = ?', [id], function(err) {
      if (err) {
        console.error('予約削除エラー:', err);
        return res.status(500).json({ error: '予約の削除に失敗しました' });
      }
      res.json({ message: '予約が削除されました' });
    });
  });
});

// 予約のキャンセル
router.put('/:id/cancel', (req, res) => {
  const id = req.params.id;

  // 予約の存在確認
  db.get('SELECT id, status FROM reservations WHERE id = ?', [id], (err, row) => {
    if (err) {
      console.error('予約存在確認エラー:', err);
      return res.status(500).json({ error: '予約のキャンセルに失敗しました' });
    }
    if (!row) {
      return res.status(404).json({ error: '予約が見つかりません' });
    }
    if (row.status === 'cancelled') {
      return res.status(400).json({ error: '既にキャンセルされた予約です' });
    }

    // 予約のキャンセル
    db.run('UPDATE reservations SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', ['cancelled', id], function(err) {
      if (err) {
        console.error('予約キャンセルエラー:', err);
        return res.status(500).json({ error: '予約のキャンセルに失敗しました' });
      }
      res.json({ message: '予約がキャンセルされました' });
    });
  });
});

// 統計情報の取得
router.get('/stats/summary', (req, res) => {
  const queries = [
    // 今日の予約数
    `SELECT COUNT(*) as count FROM reservations WHERE reservation_date = date('now', 'localtime') AND status = 'confirmed'`,
    // 今週の予約数
    `SELECT COUNT(*) as count FROM reservations WHERE reservation_date >= date('now', 'weekday 0', '-7 days') AND status = 'confirmed'`,
    // 今月の予約数
    `SELECT COUNT(*) as count FROM reservations WHERE reservation_date >= date('now', 'start of month') AND status = 'confirmed'`,
    // 総予約数
    `SELECT COUNT(*) as count FROM reservations WHERE status = 'confirmed'`
  ];

  Promise.all(queries.map(query => {
    return new Promise((resolve, reject) => {
      db.get(query, [], (err, row) => {
        if (err) reject(err);
        else resolve(row.count);
      });
    });
  }))
  .then(results => {
    res.json({
      today: results[0],
      thisWeek: results[1],
      thisMonth: results[2],
      total: results[3]
    });
  })
  .catch(err => {
    console.error('統計情報取得エラー:', err);
    res.status(500).json({ error: '統計情報の取得に失敗しました' });
  });
});

// メニュー別予約統計
router.get('/stats/menu', (req, res) => {
  const query = `
    SELECT 
      m.name as menu_name,
      COUNT(r.id) as reservation_count
    FROM reservations r
    JOIN menu_items m ON r.menu_id = m.id
    WHERE r.status = 'confirmed'
    GROUP BY m.id, m.name
    ORDER BY reservation_count DESC
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('メニュー別統計取得エラー:', err);
      return res.status(500).json({ error: 'メニュー別統計の取得に失敗しました' });
    }
    res.json(rows);
  });
});

// 時間帯別予約統計
router.get('/stats/time', (req, res) => {
  const query = `
    SELECT 
      reservation_time,
      COUNT(*) as reservation_count
    FROM reservations
    WHERE status = 'confirmed'
    GROUP BY reservation_time
    ORDER BY reservation_time
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('時間帯別統計取得エラー:', err);
      return res.status(500).json({ error: '時間帯別統計の取得に失敗しました' });
    }
    res.json(rows);
  });
});

module.exports = router; 