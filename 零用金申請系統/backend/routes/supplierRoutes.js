const express = require('express');

module.exports = (db) => {
  const router = express.Router();

  // Suppliers
  router.get('/suppliers', (req, res) => {
    db.all("SELECT * FROM suppliers ORDER BY name ASC", [], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  });

  // IMPORTANT: Define batch-delete BEFORE :id parameter routes
  router.post('/suppliers/batch-delete', (req, res) => {
    const { ids } = req.body;
    if (!ids || !ids.length) return res.status(400).json({ error: 'No IDs provided' });
    const placeholders = ids.map(() => '?').join(',');
    db.run(`DELETE FROM suppliers WHERE id IN (${placeholders})`, ids, (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    });
  });

  router.post('/suppliers', (req, res) => {
    const { name, tax_id, phone, address, contact_person } = req.body;
    if (!name) return res.status(400).json({ error: '供應商名稱為必填 (Name is required)' });
    const sql = `INSERT INTO suppliers (name, tax_id, phone, address, contact_person) VALUES (?, ?, ?, ?, ?)`;
    db.run(sql, [name, tax_id, phone, address, contact_person], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, success: true });
    });
  });

  router.put('/suppliers/:id', (req, res) => {
    const { name, tax_id, phone, address, contact_person } = req.body;
    const sql = `UPDATE suppliers SET name = ?, tax_id = ?, phone = ?, address = ?, contact_person = ? WHERE id = ?`;
    db.run(sql, [name, tax_id, phone, address, contact_person, req.params.id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    });
  });

  router.delete('/suppliers/:id', (req, res) => {
    db.run("DELETE FROM suppliers WHERE id = ?", [req.params.id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Deleted' });
    });
  });

  return router;
};
