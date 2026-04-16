const express = require('express');
const { db } = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, (req, res) => {
  const { role, base_id } = req.user;
  const { category, base } = req.query;

  let query = `
    SELECT i.id, i.quantity, a.name as asset_name, a.category, b.name as base_name, b.id as base_id
    FROM inventory i
    JOIN assets a ON i.asset_id = a.id
    JOIN bases b ON i.base_id = b.id
  `;

  let conditions = [];
  let params = [];

  // Enforce RBAC
  if (role !== 'Admin') {
    conditions.push('i.base_id = ?');
    params.push(base_id);
  }

  // Handle Filters
  if (category) {
    conditions.push('a.category = ?');
    params.push(category);
  }
  if (base && role === 'Admin') {
    conditions.push('i.base_id = ?');
    params.push(base);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    res.json(rows);
  });
});

module.exports = router;
