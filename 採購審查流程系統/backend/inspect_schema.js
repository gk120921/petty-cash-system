const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'procurement.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    console.log('--- TABLES ---');
    db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, tables) => {
        if (err) throw err;
        tables.forEach(table => {
            console.log(`\nTable: ${table.name}`);
            db.all(`PRAGMA table_info(${table.name})`, [], (err, cols) => {
                if (err) throw err;
                cols.forEach(col => {
                    console.log(`  - ${col.name} (${col.type})`);
                });
            });
        });
    });
});
