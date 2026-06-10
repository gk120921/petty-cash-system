const path = require('path');

const config = {
  port: 3001,
  databases: {
    // 整合系統自己的資料庫 (帳號中心)
    nexus: path.join(__dirname, 'nexus_master.db'),
    
    // 整合後的子系統資料庫 (內部路徑)
    petty_cash: path.join(__dirname, '../零用金申請系統/backend/petty_cash.db'),
    procurement: path.join(__dirname, '../採購審查流程系統/backend/procurement.db'),
    warehouse_json: path.join(__dirname, '../印度採購管理系統/data.json'),
    warehouse_sqlite: path.join(__dirname, 'warehouse_migrated.db')
  },
  jwtSecret: 'nexus_secret_key_2026'
};

module.exports = config;
