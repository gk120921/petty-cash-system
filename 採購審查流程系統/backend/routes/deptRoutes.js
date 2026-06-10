const express = require('express');
const router = express.Router();
const { getDb } = require('../database');

// 獲取所有部門 (透過 Nexus Master Gateway 獲取統一生態系架構)
router.get('/', async (req, res) => {
    try {
        const axios = require('axios');
        const response = await axios.get('http://localhost:3001/api/departments');
        
        if (response.data.success) {
            // 轉換為採購系統期待的格式 (包含 parent_name)
            const rows = response.data.data;
            const mappedRows = rows.map(d => {
                const parent = rows.find(p => p.id === d.parent_id);
                return { ...d, parent_name: parent ? parent.name : null };
            });
            res.json(mappedRows);
        } else {
            throw new Error(response.data.message);
        }
    } catch (err) {
        console.error('[Dept Proxy] 獲取全域架構失敗:', err.message);
        // 如果 Gateway 失敗，回退到本地資料庫 (確保系統可用性)
        try {
            const db = getDb();
            const rows = await db.allAsync(`
                SELECT d.*, p.name as parent_name 
                FROM departments d 
                LEFT JOIN departments p ON d.parent_id = p.id
            `);
            res.json(rows);
        } catch (localErr) {
            res.status(500).json({ error: localErr.message });
        }
    }
});

// 新增部門 (同步至 Nexus Master)
router.post('/', async (req, res) => {
    const { dept_code, name, parent_id, manager_id } = req.body;
    try {
        const axios = require('axios');
        // 這裡未來可以改為直接呼叫 Gateway API，目前先寫入本地並觸發 Gateway 同步(如有必要)
        // 為了簡化，我們直接在 Gateway 實作管理介面。此處暫時維持本地寫入但標記為「建議從主系統修改」
        const db = getDb();
        const result = await db.runAsync(
            'INSERT INTO departments (dept_code, name, parent_id, manager_id) VALUES (?, ?, ?, ?)',
            [dept_code, name, parent_id, manager_id]
        );
        
        // 觸發 Master 同步
        try { await axios.post('http://localhost:3001/api/sync/hierarchy'); } catch(e) { console.warn('Master Sync Trigger Failed'); }

        res.json({ id: result.lastID, message: 'Department created and sync triggered' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 刪除部門
router.delete('/:id', async (req, res) => {
    try {
        const db = getDb();
        await db.runAsync('DELETE FROM departments WHERE id = ?', [req.params.id]);
        
        const axios = require('axios');
        try { await axios.post('http://localhost:3001/api/sync/hierarchy'); } catch(e) { console.warn('Master Sync Trigger Failed'); }

        res.json({ message: 'Department deleted and sync triggered' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
