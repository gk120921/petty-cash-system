const express = require('express');
const bcrypt = require('bcryptjs');

module.exports = (db, authService) => {
  const router = express.Router();

  // Login
  router.post('/login', async (req, res) => {
    const { employee_id, password } = req.body;
    try {
      const result = await authService.login(employee_id, password);
      if (!result.success) return res.status(401).json({ error: result.error });
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Personnel CRUD
  router.get('/personnel', (req, res) => {
    db.all("SELECT id, name, employee_id, role, status, (CASE WHEN password IS NOT NULL THEN 'HAS_PASSWORD' ELSE NULL END) as password FROM personnel", [], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  });

  router.post('/personnel', async (req, res) => {
    const { name, employee_id, password, role, status } = req.body;
    const hashedPassword = password ? await bcrypt.hash(password, 10) : await bcrypt.hash(employee_id || name, 10);
    const sql = "INSERT INTO personnel (name, employee_id, password, role, status) VALUES (?, ?, ?, ?, ?)";
    db.run(sql, [name, employee_id || name, hashedPassword, role || 'Employee', status || 'ACTIVE'], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    });
  });

  router.put('/personnel/:id', async (req, res) => {
    const { name, employee_id, password, role, status } = req.body;
    let sql = "UPDATE personnel SET name = ?, employee_id = ?, role = ?, status = ? WHERE id = ?";
    let params = [name, employee_id, role, status, req.params.id];
    
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      sql = "UPDATE personnel SET name = ?, employee_id = ?, password = ?, role = ?, status = ? WHERE id = ?";
      params = [name, employee_id, hashedPassword, role, status, req.params.id];
    }

    db.run(sql, params, (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    });
  });

  router.delete('/personnel/:id', (req, res) => {
    db.run("DELETE FROM personnel WHERE id = ?", [req.params.id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    });
  });

  // Permissions
  router.get('/permissions', (req, res) => {
    db.all("SELECT * FROM settings WHERE key LIKE 'perms_%'", [], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      const perms = {};
      rows.forEach(row => {
        try { perms[row.key] = JSON.parse(row.value); } catch(e) { perms[row.key] = row.value; }
      });
      res.json(perms);
    });
  });

  router.post('/permissions', (req, res) => {
    const { role, permissions } = req.body;
    if (!role) return res.status(400).json({ error: 'Role is required' });
    const key = `perms_${role.toLowerCase()}`;
    const value = JSON.stringify(permissions);
    
    db.run("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", [key, value], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    });
  });

  return router;
};
