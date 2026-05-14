const ExcelJS = require('exceljs');
const db = require('./database');
const path = require('path');

async function migrate() {
  const excelFile = path.resolve(__dirname, '../Petty cash 2026 - Apr2026  - updated (05.06).xlsx');
  const workbook = new ExcelJS.Workbook();
  
  try {
    await workbook.xlsx.readFile(excelFile);
    const sheet = workbook.getWorksheet('Apr2026') || workbook.getWorksheet(1);
    console.log(`Starting migration from sheet: ${sheet.name}`);

    // Skip headers, start from row 7 (based on observation)
    let count = 0;
    for (let i = 7; i <= sheet.rowCount; i++) {
      const row = sheet.getRow(i);
      if (!row.getCell(2).value) continue; // Skip empty rows

      const invoiceDate = row.getCell(3).value instanceof Date ? row.getCell(3).value.toISOString().split('T')[0] : String(row.getCell(3).value || '');
      const reimbursementDate = row.getCell(4).value instanceof Date ? row.getCell(4).value.toISOString().split('T')[0] : String(row.getCell(4).value || '');
      const detailEn = String(row.getCell(5).value || '');
      const supplierName = String(row.getCell(6).value || '').trim();
      const detailZh = String(row.getCell(7).value || '');
      const personnelName = String(row.getCell(8).value || '').trim();
      const incoming = parseFloat(row.getCell(10).value) || 0;
      const outgoing = parseFloat(row.getCell(11).value) || 0;
      const hasBill = String(row.getCell(13).value).toUpperCase() === 'YES' ? 1 : 0;
      const payStatus = String(row.getCell(14).value).toUpperCase() || 'PAID';

      // 1. Ensure supplier exists
      if (supplierName) {
        await new Promise((resolve) => {
          db.run("INSERT OR IGNORE INTO suppliers (name) VALUES (?)", [supplierName], resolve);
        });
      }

      // 2. Ensure personnel exists
      if (personnelName) {
        await new Promise((resolve) => {
          db.run("INSERT OR IGNORE INTO personnel (name) VALUES (?)", [personnelName], resolve);
        });
      }

      // 3. Insert expense
      const sql = `
        INSERT INTO expenses (
          invoice_date, reimbursement_date, supplier_id, category_id,
          detail_en, detail_zh, personnel_id, incoming, outgoing,
          has_bill, pay_status
        ) VALUES (
          ?, ?, 
          (SELECT id FROM suppliers WHERE name = ?),
          (SELECT id FROM categories WHERE name_zh LIKE '%' || ? || '%' LIMIT 1),
          ?, ?, 
          (SELECT id FROM personnel WHERE name = ?),
          ?, ?, ?, ?
        )
      `;

      await new Promise((resolve, reject) => {
        db.run(sql, [
          invoiceDate, reimbursementDate, supplierName, '', detailEn, detailZh, personnelName, incoming, outgoing, hasBill, payStatus
        ], (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      count++;
    }
    console.log(`Successfully migrated ${count} records from Excel.`);
  } catch (err) {
    console.error('Migration failed:', err);
  }
}

// Also import default suppliers from HTML list if provided
const defaultSuppliers = [
  '202 宿舍飲水', '802 Dormitory Electricity Fee', 'airtel', 'AKSHAYA HYPER MARKET',
  'Apprtment EB bill', 'auto(運費)', 'Baskar Store', 'Bharat Petroleum',
  'Blue Dart', 'Cab charges', 'CMR TOOLS', 'Delivery charge',
  'D-Mart', 'EKV market', 'Food Exp Voucher', 'Hana Enterprises',
  'Madras Ago Products', 'Mettur Transport', 'MR ENTERPRISE', 'Murugan Store',
  'NAMMR FRUITS AND NUTS', 'ORBIT Wires & Cables', 'Padamavathi Hotel', 'Rapido (Porter)',
  'selvarani cabs', 'Seoul Store', 'SHOPPERS STOP', 'SMART BAZAAR',
  'smartshift logistics', 'suriya traders', 'Surya Traders', 'V V K ENTERPRISES',
  'Wages voucher', '工廠辦公室鑰匙拷貝', '交通費', '過路費'
];

async function importDefaults() {
  const stmt = db.prepare("INSERT OR IGNORE INTO suppliers (name) VALUES (?)");
  defaultSuppliers.forEach(s => stmt.run(s));
  stmt.finalize();
  console.log('Imported default suppliers.');
}

importDefaults().then(() => migrate());
