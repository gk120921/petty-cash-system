const db = require('./database');

function ensureColumn(tableName, columnName, definition) {
    return new Promise((resolve) => {
        db.all(`PRAGMA table_info(${tableName})`, (err, columns) => {
            if (err) {
                console.error(`Error checking table ${tableName}:`, err);
                return resolve();
            }
            const exists = columns.some(c => c.name === columnName);
            if (!exists) {
                console.log(`Adding column ${columnName} to ${tableName}...`);
                db.run(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`, (err) => {
                    if (err) console.error(`Error adding ${columnName}:`, err);
                    resolve();
                });
            } else {
                resolve();
            }
        });
    });
}

async function fix() {
    console.log('Starting Schema Check...');
    await ensureColumn('expenses', 'ai_raw_text', 'TEXT');
    await ensureColumn('expenses', 'no_bill_reason_zh', 'TEXT');
    await ensureColumn('expenses', 'no_bill_reason_en', 'TEXT');
    await ensureColumn('expenses', 'supplier_name', 'TEXT');
    console.log('Schema Check Completed.');
    process.exit(0);
}

fix();
