const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.resolve(__dirname, '../nexus_master.db');
const db = new sqlite3.Database(dbPath);

const username = 'admin';
const rawPassword = 'admin123';
const realName = '超級系統管理員';
const role = 'admin';
const permissions = JSON.stringify({
    petty_cash: true,
    procurement: true,
    wms: true
});

async function setupAdmin() {
    console.log(`--- 開始設定超級管理員: ${username} ---`);
    
    const hashedPassword = await bcrypt.hash(rawPassword, 10);
    
    db.run(
        `INSERT OR REPLACE INTO users (username, password, real_name, role, module_permissions, status) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [username, hashedPassword, realName, role, permissions, 'ACTIVE'],
        function(err) {
            if (err) {
                console.error('設定失敗:', err.message);
            } else {
                console.log('--- 超級管理員設定完成！ ---');
                console.log(`帳號: ${username}`);
                console.log(`密碼: ${rawPassword}`);
                console.log(`權限: 已開啟所有模組`);
            }
            db.close();
        }
    );
}

setupAdmin();
