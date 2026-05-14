const express = require('express');
const router = express.Router();
const { getDb } = require('../database');

router.get('/', async (req, res) => {
    try {
        const db = getDb();
        const materials = await db.allAsync('SELECT * FROM materials ORDER BY material_number ASC');
        res.json(materials);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/', async (req, res) => {
    const { material_number, name, unit } = req.body;
    try {
        const db = getDb();
        await db.runAsync('INSERT INTO materials (material_number, name, unit) VALUES (?, ?, ?)', [material_number, name, unit]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/:id', async (req, res) => {
    const { material_number, name, unit } = req.body;
    try {
        const db = getDb();
        await db.runAsync('UPDATE materials SET material_number = ?, name = ?, unit = ? WHERE id = ?', [material_number, name, unit, req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const db = getDb();
        await db.runAsync('DELETE FROM materials WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
