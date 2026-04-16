const express = require('express');
const { db } = require('../db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Helper for running transactions
const runTransaction = async (queries) => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      
      let errorOccurred = false;
      for (const q of queries) {
        db.run(q.sql, q.params, function(err) {
          if (err) {
            errorOccurred = err;
          }
        });
      }

      db.run('COMMIT', function(err) {
        if (err || errorOccurred) {
          db.run('ROLLBACK');
          reject(errorOccurred || err);
        } else {
          resolve();
        }
      });
    });
  });
};

/* GET all transactions, limited by RBAC */
router.get('/', authenticate, (req, res) => {
  const { role, base_id } = req.user;
  let query = `
    SELECT t.*, a.name as asset_name, fb.name as from_base, tb.name as to_base, u.username as created_by_name
    FROM transactions t
    JOIN assets a ON t.asset_id = a.id
    LEFT JOIN bases fb ON t.from_base_id = fb.id
    LEFT JOIN bases tb ON t.to_base_id = tb.id
    JOIN users u ON t.created_by = u.id
    ORDER BY t.date DESC
  `;
  
  if (role !== 'Admin') {
    query = `
      SELECT t.*, a.name as asset_name, fb.name as from_base, tb.name as to_base, u.username as created_by_name
      FROM transactions t
      JOIN assets a ON t.asset_id = a.id
      LEFT JOIN bases fb ON t.from_base_id = fb.id
      LEFT JOIN bases tb ON t.to_base_id = tb.id
      JOIN users u ON t.created_by = u.id
      WHERE t.from_base_id = ${base_id} OR t.to_base_id = ${base_id}
      ORDER BY t.date DESC
    `;
  }

  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    res.json(rows);
  });
});

/* POST Purchase: Increases inventory at a specific base */
router.post('/purchase', authenticate, authorize(['Admin', 'Logistics Officer']), async (req, res) => {
  const { asset_id, to_base_id, quantity } = req.body;
  if (!asset_id || !to_base_id || !quantity || quantity <= 0) {
    return res.status(400).json({ message: 'Invalid payload' });
  }

  // Admin can purchase for any base, Logistics only their own
  if (req.user.role === 'Logistics Officer' && parseInt(to_base_id) !== req.user.base_id) {
    return res.status(403).json({ message: 'Can only purchase for your own base' });
  }

  const queries = [
    {
      sql: `INSERT INTO transactions (transaction_type, asset_id, quantity, to_base_id, created_by) VALUES ('Purchase', ?, ?, ?, ?)`,
      params: [asset_id, quantity, to_base_id, req.user.id]
    },
    {
      sql: `INSERT INTO inventory (asset_id, base_id, quantity) VALUES (?, ?, ?) ON CONFLICT(asset_id, base_id) DO UPDATE SET quantity = quantity + ?`,
      params: [asset_id, to_base_id, quantity, quantity]
    }
  ];

  try {
    await runTransaction(queries);
    res.json({ message: 'Purchase recorded successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Transaction failed', error: err.message });
  }
});

/* POST Transfer: Moves asset from one base to another */
router.post('/transfer', authenticate, authorize(['Admin', 'Base Commander']), async (req, res) => {
  const { asset_id, from_base_id, to_base_id, quantity } = req.body;
  if (from_base_id == to_base_id) return res.status(400).json({ message: 'Cannot transfer to the same base' });

  if (req.user.role === 'Base Commander' && parseInt(from_base_id) !== req.user.base_id) {
    return res.status(403).json({ message: 'Can only transfer from your own base' });
  }

  // Check inventory first
  db.get(`SELECT quantity FROM inventory WHERE asset_id = ? AND base_id = ?`, [asset_id, from_base_id], async (err, row) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    if (!row || row.quantity < quantity) {
      return res.status(400).json({ message: 'Insufficient inventory' });
    }

    const queries = [
      {
        sql: `INSERT INTO transactions (transaction_type, asset_id, quantity, from_base_id, to_base_id, created_by) VALUES ('Transfer', ?, ?, ?, ?, ?)`,
        params: [asset_id, quantity, from_base_id, to_base_id, req.user.id]
      },
      {
        sql: `UPDATE inventory SET quantity = quantity - ? WHERE asset_id = ? AND base_id = ?`,
        params: [quantity, asset_id, from_base_id]
      },
      {
        sql: `INSERT INTO inventory (asset_id, base_id, quantity) VALUES (?, ?, ?) ON CONFLICT(asset_id, base_id) DO UPDATE SET quantity = quantity + ?`,
        params: [asset_id, to_base_id, quantity, quantity]
      }
    ];

    try {
      await runTransaction(queries);
      res.json({ message: 'Transfer successful' });
    } catch (e) {
      res.status(500).json({ message: 'Transaction failed', error: e.message });
    }
  });
});

/* POST Assignment / Expenditure */
router.post('/assignment', authenticate, authorize(['Admin', 'Base Commander', 'Logistics Officer']), async (req, res) => {
  const { asset_id, base_id, quantity, assigned_to } = req.body;

  if (req.user.role !== 'Admin' && parseInt(base_id) !== req.user.base_id) {
    return res.status(403).json({ message: 'Can only assign from your own base' });
  }

  db.get(`SELECT quantity FROM inventory WHERE asset_id = ? AND base_id = ?`, [asset_id, base_id], async (err, row) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    if (!row || row.quantity < quantity) {
      return res.status(400).json({ message: 'Insufficient inventory' });
    }

    const queries = [
      {
        sql: `INSERT INTO transactions (transaction_type, asset_id, quantity, from_base_id, assigned_to, created_by) VALUES ('Assignment', ?, ?, ?, ?, ?)`,
        params: [asset_id, quantity, base_id, assigned_to, req.user.id]
      },
      {
        sql: `UPDATE inventory SET quantity = quantity - ? WHERE asset_id = ? AND base_id = ?`,
        params: [quantity, asset_id, base_id]
      }
    ];

    try {
      await runTransaction(queries);
      res.json({ message: 'Assignment successful' });
    } catch (e) {
      res.status(500).json({ message: 'Transaction failed', error: e.message });
    }
  });
});

module.exports = router;
