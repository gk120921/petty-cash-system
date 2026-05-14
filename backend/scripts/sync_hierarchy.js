const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const nexusDbPath = path.resolve(__dirname, '../nexus_master.db');
const procDbPath = path.resolve(__dirname, '../../採購審查流程系統/backend/procurement.db');

const nexusDb = new sqlite3.Database(nexusDbPath);
const procDb = new sqlite3.Database(procDbPath);

console.log('--- 組織架構升級程序啟動 ---');

procDb.all('SELECT * FROM departments', [], (err, rows) => {
    if (err) {
        console.error('讀取採購系統部門失敗:', err.message);
        process.exit(1);
    }

    console.log(`讀取到 ${rows.length} 個部門，準備遷移至 Nexus 主系統...`);

    nexusDb.serialize(() => {
        const stmt = nexusDb.prepare('INSERT OR REPLACE INTO departments (id, dept_code, name, parent_id, manager_id) VALUES (?, ?, ?, ?, ?)');
        
        rows.forEach(row => {
            stmt.run([row.id, row.dept_code, row.name, row.parent_id, row.manager_id]);
        });

        stmt.finalize(() => {
            console.log('--- 組織架構數據遷移完成 ---');
            nexusDb.close();
            procDb.close();
        });
    });
});
