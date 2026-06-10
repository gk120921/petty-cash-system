const express = require('express');

module.exports = (db) => {
  const router = express.Router();

  // 1. Get all categories
  router.get('/categories', (req, res) => {
    db.all("SELECT * FROM categories ORDER BY id DESC", [], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  });

  // 2. Create new category
  router.post('/categories', (req, res) => {
    const { name_zh, name_en, account_code, type } = req.body;
    const sql = `INSERT INTO categories (name_zh, name_en, account_code, type) VALUES (?, ?, ?, ?)`;
    db.run(sql, [name_zh, name_en, account_code, type || 'EXPENSE'], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, success: true });
    });
  });

  // 3. Update category
  router.put('/categories/:id', (req, res) => {
    const { id } = req.params;
    const { name_zh, name_en, account_code, type } = req.body;
    const sql = `UPDATE categories SET name_zh = ?, name_en = ?, account_code = ?, type = ? WHERE id = ?`;
    db.run(sql, [name_zh, name_en, account_code, type, id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, changes: this.changes });
    });
  });

  // 4. Delete category
  router.delete('/categories/:id', (req, res) => {
    const { id } = req.params;
    db.run("DELETE FROM categories WHERE id = ?", [id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    });
  });

  return router;
};
