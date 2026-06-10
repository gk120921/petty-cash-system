const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, 'backend', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

const categories = [
  ['製造-文具用品', 'Manufacturing - Stationery Supplies', '5312'],
  ['製造-運費(下貨櫃、貨運、堆高機、叉車..等費用)', 'Manufacturing - Freight & Handling', '5314'],
  ['製造-郵電費(網路、電話費用)', 'Manufacturing - Postage & Telecommunications', '5315'],
  ['製造-修繕費(機台修繕、模具、堆高機、板車等等維修)', 'Manufacturing - Repairs & Maintenance', '5316'],
  ['製造-廣告費', 'Manufacturing - Advertising Expense', '5317'],
  ['製造-水電瓦斯費(宿舍、廠房等)', 'Manufacturing - Utilities', '5318'],
  ['製造-保險費', 'Manufacturing - Insurance Expense', '5319'],
  ['製造-交際費', 'Manufacturing - Entertainment Expense', '5320'],
  ['製造-伙食費', 'Manufacturing - Meal Expense', '5327'],
  ['製造-職工福利', 'Manufacturing - Employee Welfare', '5328'],
  ['製造-佣金支出', 'Manufacturing - Commission Expense', '5330'],
  ['製造-進出口費用', 'Manufacturing - Import & Export Expenses', '5332'],
  ['製造-存貨轉用', 'Manufacturing - Inventory Transfer', '5333'],
  ['製造-包裝費', 'Manufacturing - Packaging Expense', '5336'],
  ['製造-什費', 'Manufacturing - Miscellaneous Expense', '5337'],
  ['製造-書報雜誌費', 'Manufacturing - Books & Magazines', '5338'],
  ['製造-試驗費', 'Manufacturing - Testing Expense', '5339'],
  ['製造-什項購置', 'Manufacturing - Misc Purchases', '5340'],
  ['製造-消耗品費', 'Manufacturing - Consumables', '5341'],
  ['製造-勞務費', 'Manufacturing - Labor Service', '5343'],
  ['製造-樣品費', 'Manufacturing - Sample Expense', '5344'],
  ['製造-交通費', 'Manufacturing - Transportation', '5345'],
  ['製造-加工費', 'Manufacturing - Processing/Subcontract', '5347']
];

db.serialize(() => {
  const stmt = db.prepare("INSERT INTO categories (name_zh, name_en, account_code) VALUES (?, ?, ?)");
  categories.forEach(cat => {
    stmt.run(cat, (err) => {
      if (err) console.error('Error inserting:', cat[0], err.message);
      else console.log('Inserted:', cat[0]);
    });
  });
  stmt.finalize();
});

db.close();
