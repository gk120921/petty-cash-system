const sqlite3 = require('../../零用金程式碼/backend/node_modules/sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPaths = {
  petty_cash: path.join(__dirname, '../../零用金程式碼/backend/petty_cash.db'),
  procurement: path.join(__dirname, '../../採購審查流程/backend/procurement.db')
};

const analyze = async () => {
  for (let [name, dbPath] of Object.entries(dbPaths)) {
    console.log(`\n--- 分析資料庫: ${name} ---`);
    const db = new sqlite3.Database(dbPath);
    
    await new Promise((resolve) => {
      db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
        if (err) {
          console.error(err);
          return resolve();
        }
        
        const tablePromises = tables.map(table => {
          return new Promise(res => {
            db.all(`PRAGMA table_info(${table.name})`, (err, columns) => {
              console.log(`Table: ${table.name}`);
              columns.forEach(col => {
                console.log(`  - ${col.name} (${col.type})`);
              });
              res();
            });
          });
        });
        
        Promise.all(tablePromises).then(resolve);
      });
    });
    db.close();
  }

  console.log(`\n--- 分析資料庫: WMS (JSON) ---`);
  const wmsPath = path.join(__dirname, '../../印度倉庫系統/data.json');
  if (fs.existsSync(wmsPath)) {
    const data = JSON.parse(fs.readFileSync(wmsPath, 'utf8'));
    console.log("JSON Root Keys:", Object.keys(data));
    if (data.items && data.items.length > 0) {
      console.log("Item Sample Keys:", Object.keys(data.items[0]));
    }
    if (data.transactions && data.transactions.length > 0) {
        console.log("Transaction Sample Keys:", Object.keys(data.transactions[0]));
    }
  }
};

analyze();
