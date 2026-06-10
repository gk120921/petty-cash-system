const express = require('express');
const upload = require('../middleware/upload');
const path = require('path');
const fs = require('fs');

module.exports = (db, excelService, wordService) => {
  const router = express.Router();

    // --- [HIGHEST PRIORITY] Batch Operations ---
    router.post('/expenses/batch-update', (req, res) => {
      console.log('[API] Batch Update Triggered:', req.body.ids?.length, 'items');
      const { ids, pay_status } = req.body;
      if (!ids || !ids.length) return res.status(400).json({ error: 'No IDs provided' });
      const placeholders = ids.map(() => '?').join(',');
      db.run(`UPDATE expenses SET pay_status = ? WHERE id IN (${placeholders})`, [pay_status, ...ids], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, count: this.changes });
      });
    });

    router.post('/expenses/batch-delete', (req, res) => {
      const { ids } = req.body;
      if (!ids || !ids.length) return res.status(400).json({ error: 'No IDs provided' });
      const placeholders = ids.map(() => '?').join(',');
      db.run(`DELETE FROM expenses WHERE id IN (${placeholders})`, ids, (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
      });
    });

    router.post('/expenses/batch-archive', (req, res) => {
      const { ids } = req.body;
      if (!ids || !ids.length) return res.status(400).json({ error: 'No IDs provided' });
      const placeholders = ids.map(() => '?').join(',');
      db.run(`UPDATE expenses SET is_archived = 1 WHERE id IN (${placeholders})`, ids, (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
      });
    });

    router.post('/expenses/batch-restore', (req, res) => {
      const { ids } = req.body;
      if (!ids || !ids.length) return res.status(400).json({ error: 'No IDs provided' });
      const placeholders = ids.map(() => '?').join(',');
      db.run(`UPDATE expenses SET is_archived = 0 WHERE id IN (${placeholders})`, ids, (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
      });
    });
    // ------------------------------------------

    // Get Expenses with Filters
    router.get('/expenses', (req, res) => {
    const { is_archived } = req.query;
    let sql = `
      SELECT e.*, 
             COALESCE(e.supplier_name, s.name) as display_name, 
             c.name_zh as category_name, 
             c.name_en as category_name_en,
             p.name as personnel_name,
             hp.name as handler_personnel_name
      FROM expenses e
      LEFT JOIN suppliers s ON e.supplier_id = s.id
      LEFT JOIN categories c ON e.category_id = c.id
      LEFT JOIN personnel p ON e.personnel_id = p.id
      LEFT JOIN personnel hp ON e.handler_personnel_id = hp.id
      WHERE e.is_archived = ?
      ORDER BY e.invoice_date DESC, e.id DESC
    `;
    db.all(sql, [is_archived === 'true' ? 1 : 0], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      const processed = rows.map(r => {
        // Handle image_path which could be a JSON array string or a single path string
        let imgPath = r.image_path;
        if (imgPath && imgPath.startsWith('[')) {
          try {
            const paths = JSON.parse(imgPath);
            imgPath = Array.isArray(paths) ? paths[0] : imgPath; // Default to first for display
          } catch (e) {
            console.error('JSON parse error for image_path:', e);
          }
        }

        return { 
          ...r, 
          supplier_name: r.display_name,
          category_name: r.category_name,
          category_name_en: r.category_name_en || r.category_name,
          image_path: imgPath // Display primary image
        };
      });
      res.json(processed);
    });
  });

  // Summary for balance adjustment
  router.get('/expenses/summary', (req, res) => {
    const sql = `
      SELECT 
        SUM(incoming) as total_in, 
        SUM(outgoing) as total_out 
      FROM expenses 
      WHERE is_archived = 1
    `;
    db.get(sql, [], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({
        archived_in: row.total_in || 0,
        archived_out: row.total_out || 0
      });
    });
  });

  // Create Expense
  router.post('/expenses', upload.array('receipts', 20), (req, res) => {
    const { 
      invoice_date, reimbursement_date, supplier_id, supplier_name, category_id, 
      detail_en, detail_zh, personnel_id, handler_personnel_id, incoming, outgoing, has_bill, pay_status,
      no_bill_reason_zh, no_bill_reason_en, ai_raw_text
    } = req.body;
    
    let image_path = null;
    if (req.files && req.files.length > 0) {
      const paths = req.files.map(f => `/uploads/${f.filename}`);
      image_path = JSON.stringify(paths);
    } else if (req.body.image_path) {
      image_path = req.body.image_path;
    }

    const insertExpense = (sid, sname, pid, handlerPid) => {
      const sql = `INSERT INTO expenses (
        invoice_date, reimbursement_date, supplier_id, supplier_name, category_id, 
        detail_en, detail_zh, personnel_id, handler_personnel_id, incoming, outgoing, 
        has_bill, pay_status, image_path, ai_raw_text,
        no_bill_reason_zh, no_bill_reason_en
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;
      
      const params = [
        invoice_date || new Date().toISOString().split('T')[0], 
        reimbursement_date || invoice_date, 
        sid ? parseInt(sid) : null, 
        sname || '', 
        parseInt(category_id) || 21, 
        detail_en || '', 
        detail_zh || '', 
        pid ? parseInt(pid) : null, 
        handlerPid ? parseInt(handlerPid) : null,
        parseFloat(incoming) || 0, 
        parseFloat(outgoing) || 0, 
        (has_bill === 'true' || has_bill === true || has_bill === 1 || has_bill === '1') ? 1 : 0, 
        pay_status || 'TO_PAY', 
        image_path, 
        ai_raw_text || '',
        no_bill_reason_zh || '', 
        no_bill_reason_en || ''
      ];

      console.log('[API] Attempting to insert expense with types casted:', params);

      db.run(sql, params, function(err) {
        if (err) {
          console.error('[DATABASE ERROR]', err);
          return res.status(500).json({ error: 'Database Error: ' + err.message });
        }
        res.json({ id: this.lastID, success: true });
      });
    };

    // 取得人員 ID (Resolve Personnel ID if passed by name)
    const resolvePersonnelId = (rawValue, callback) => {
      if (!rawValue) {
        callback(null);
        return;
      }
      if (isNaN(rawValue)) {
        db.get("SELECT id FROM personnel WHERE name = ?", [rawValue], (err, p) => {
          callback(p ? p.id : null);
        });
        return;
      }
      callback(rawValue);
    };

    const resolveAndInsert = () => {
      resolvePersonnelId(personnel_id, (resolvedPersonnelId) => {
        resolvePersonnelId(handler_personnel_id, (resolvedHandlerId) => {
          insertExpenseBasedOnSupplier(resolvedPersonnelId, resolvedHandlerId);
        });
      });
    };

    const insertExpenseBasedOnSupplier = (pid, handlerPid) => {
      if (supplier_id && !isNaN(supplier_id)) {
        db.get("SELECT name FROM suppliers WHERE id = ?", [supplier_id], (err, row) => {
          insertExpense(supplier_id, row ? row.name : null, pid, handlerPid);
        });
      } else if (supplier_name) {
        db.get("SELECT id FROM suppliers WHERE name = ?", [supplier_name], (err, row) => {
          insertExpense(row ? row.id : null, supplier_name, pid, handlerPid);
        });
      } else {
        insertExpense(null, null, pid, handlerPid);
      }
    };

    resolveAndInsert();
  });

  // Update Expense
  router.put('/expenses/:id', upload.array('receipts', 20), (req, res) => {
    const id = req.params.id;
    const body = req.body;
    
    const fields = [];
    const params = [];
    
    const allowedFields = [
      'invoice_date', 'reimbursement_date', 'supplier_id', 'category_id', 
      'detail_en', 'detail_zh', 'personnel_id', 'handler_personnel_id', 'incoming', 'outgoing', 
      'has_bill', 'pay_status', 'ai_raw_text', 'no_bill_reason_zh', 
      'no_bill_reason_en', 'is_archived'
    ];

    allowedFields.forEach(f => {
      if (body[f] !== undefined) {
        fields.push(`${f} = ?`);
        if (f === 'incoming' || f === 'outgoing') params.push(parseFloat(body[f]) || 0);
        else if (f === 'has_bill' || f === 'is_archived') params.push(body[f] === 'true' || body[f] === true || body[f] === 1 ? 1 : 0);
        else params.push(body[f]);
      }
    });

    if (req.files && req.files.length > 0) {
      const paths = req.files.map(f => `/uploads/${f.filename}`);
      fields.push(`image_path = ?`);
      params.push(JSON.stringify(paths));
    } else if (body.image_path !== undefined) {
      fields.push(`image_path = ?`);
      params.push(body.image_path);
    }

    if (fields.length === 0) return res.json({ success: true, message: 'No changes' });

    params.push(id);
    const sql = `UPDATE expenses SET ${fields.join(', ')} WHERE id = ?`;
    
    db.run(sql, params, (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    });
  });

  // Delete Expense
  router.delete('/expenses/:id', (req, res) => {
    db.run("DELETE FROM expenses WHERE id = ?", [req.params.id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    });
  });

  // Batch Operations moved to top

  router.post('/expenses/batch-pay-personnel', (req, res) => {
    const { personnel_id } = req.body;
    if (!personnel_id) return res.status(400).json({ error: 'Personnel ID required' });
    
    db.run(
      "UPDATE expenses SET pay_status = 'PAID' WHERE personnel_id = ? AND pay_status != 'PAID' AND is_archived = 0",
      [personnel_id],
      function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, count: this.changes });
      }
    );
  });

  // Excel Operations
  router.get('/export_all', async (req, res) => {
    try {
      await excelService.exportFullBackup(res);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  const handleFinancialExport = (req, res) => {
    const { is_archived, ids, startDate, endDate } = req.query;
    const isV3Export = req.path === '/export_v3';
    const dateField = isV3Export ? 'reimbursement_date' : 'invoice_date';
    
    let sql = `
      SELECT e.*, COALESCE(e.supplier_name, s.name) as supplier_name, c.name_zh as category_name, c.account_code, p.name as personnel_name, hp.name as handler_personnel_name
      FROM expenses e
      LEFT JOIN suppliers s ON e.supplier_id = s.id
      LEFT JOIN categories c ON e.category_id = c.id
      LEFT JOIN personnel p ON e.personnel_id = p.id
      LEFT JOIN personnel hp ON e.handler_personnel_id = hp.id
    `;
    
    let params = [];
    if (ids) {
      // 批次匯出模式 (Batch Export mode)
      const idList = ids.split(',');
      const placeholders = idList.map(() => '?').join(',');
      sql += ` WHERE e.id IN (${placeholders})`;
      params = idList;
    } else {
      // 全域匯出模式 (Global Export mode)
      sql += ` WHERE e.is_archived = ?`;
      params = [is_archived === 'true' ? 1 : 0];

      if (startDate) {
        sql += ` AND COALESCE(e.${dateField}, e.invoice_date, '') >= ?`;
        params.push(startDate);
      }

      if (endDate) {
        sql += ` AND COALESCE(e.${dateField}, e.invoice_date, '') <= ?`;
        params.push(endDate);
      }
    }
    
    sql += isV3Export
      ? ` ORDER BY COALESCE(e.reimbursement_date, e.invoice_date, '') ASC, e.id ASC`
      : ` ORDER BY e.invoice_date ASC, e.id ASC`;
    
    db.all(sql, params, async (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      try {
        const isArchivedExport = is_archived === 'true';
        const exportMethod = isV3Export
          ? excelService.exportFinancialReportV3.bind(excelService)
          : excelService.exportFinancialReportV2.bind(excelService);
        await exportMethod(rows, res, isArchivedExport, { startDate, endDate, dateField });
      } catch (excelErr) {
        res.status(500).json({ error: excelErr.message });
      }
    });
  };

  router.get('/export_v2', handleFinancialExport);
  router.get('/export_v3', handleFinancialExport);

  router.get('/export_inventory', (req, res) => {
    const { is_archived } = req.query;
    const sql = `
      SELECT e.*, COALESCE(e.supplier_name, s.name) as supplier_name, c.name_zh as category_name, c.account_code, p.name as personnel_name
      FROM expenses e
      LEFT JOIN suppliers s ON e.supplier_id = s.id
      LEFT JOIN categories c ON e.category_id = c.id
      LEFT JOIN personnel p ON e.personnel_id = p.id
      WHERE e.is_archived = ?
      ORDER BY e.invoice_date ASC, e.id ASC
    `;
    db.all(sql, [is_archived === 'true' ? 1 : 0], async (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      try {
        const isArchivedExport = is_archived === 'true';
        await excelService.exportInventoryReport(rows, res, isArchivedExport);
      } catch (excelErr) {
        res.status(500).json({ error: excelErr.message });
      }
    });
  });

  router.post('/expenses/import', upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).send('No file uploaded');
    try {
      const count = await excelService.importExpenses(req.file.path);
      // 自動將現有的 Unknown 人員修正為 YI CHANG
      await excelService.fixUnknownPersonnel();
      fs.unlinkSync(req.file.path);
      res.json({ success: true, count });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/export_word_receipts', (req, res) => {
    const { is_archived, ids } = req.query;
    
    let sql = `
      SELECT e.*, COALESCE(e.supplier_name, s.name) as supplier_name, c.name_zh as category_name, p.name as personnel_name
      FROM expenses e
      LEFT JOIN suppliers s ON e.supplier_id = s.id
      LEFT JOIN categories c ON e.category_id = c.id
      LEFT JOIN personnel p ON e.personnel_id = p.id
    `;
    
    let params = [];
    if (ids) {
      const idList = ids.split(',');
      const placeholders = idList.map(() => '?').join(',');
      sql += ` WHERE e.id IN (${placeholders})`;
      params = idList;
    } else {
      sql += ` WHERE e.is_archived = ?`;
      params = [is_archived === 'true' ? 1 : 0];
    }
    
    sql += ` ORDER BY e.invoice_date ASC, e.id ASC`;
    
    db.all(sql, params, async (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      try {
        const buffer = await wordService.exportReceiptsWord(rows);
        res.setHeader('Content-Disposition', `attachment; filename=Receipts_${new Date().toISOString().split('T')[0]}.docx`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.send(buffer);
      } catch (wordErr) {
        console.error('[WORD EXPORT ERROR]', wordErr);
        res.status(500).json({ error: wordErr.message });
      }
    });
  });

  return router;
};
