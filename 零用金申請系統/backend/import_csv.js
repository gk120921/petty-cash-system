const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const csvPath = '../活頁簿1.csv';
const dbPath = 'petty_cash.db';

function parseCSVLine(line) {
    const result = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(cur.trim());
            cur = '';
        } else {
            cur += char;
        }
    }
    result.push(cur.trim());
    return result;
}

function convertDate(dateStr) {
    if (!dateStr) return null;
    const months = {
        'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04', 'May': '05', 'Jun': '06',
        'Jul': '07', 'Aug': '08', 'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
    };
    const parts = dateStr.split('-');
    if (parts.length !== 3) return null;
    const day = parts[0].padStart(2, '0');
    const month = months[parts[1]] || '01';
    const year = '20' + parts[2];
    return `${year}-${month}-${day}`;
}

const db = new sqlite3.Database(dbPath);

async function run() {
    console.log('--- Starting Data Replacement ---');

    // 1. Clear existing expenses
    await new Promise((resolve, reject) => {
        db.run('DELETE FROM expenses', (err) => {
            if (err) reject(err);
            else {
                console.log('Cleared existing expenses table.');
                resolve();
            }
        });
    });

    // 2. Read CSV
    const content = fs.readFileSync(csvPath, 'utf8');
    const lines = content.split('\n').filter(l => l.trim());
    
    // 3. Process each line
    for (let i = 0; i < lines.length; i++) {
        const cols = parseCSVLine(lines[i]);
        if (cols.length < 8) continue;

        const reimbDate = convertDate(cols[0]);
        const invoiceDate = convertDate(cols[1]);
        const detailEn = cols[2];
        const supplierName = cols[3];
        const detailZh = cols[4];
        const personnelName = cols[5];
        const outgoing = parseFloat((cols[7] || '').replace(/[,\"]/g, '')) || 0;
        const hasBill = (cols[8] || '').toUpperCase() === 'YES' ? 1 : 0;
        const payStatus = (cols[9] || '').toUpperCase() === 'TO PAY' ? 'TO_PAY' : 'PAID';

        // Get or Create Supplier
        let supplierId = null;
        if (supplierName) {
            supplierId = await new Promise((resolve) => {
                db.get('SELECT id FROM suppliers WHERE name = ?', [supplierName], (err, row) => {
                    if (row) resolve(row.id);
                    else {
                        db.run('INSERT INTO suppliers (name) VALUES (?)', [supplierName], function() {
                            resolve(this.lastID);
                        });
                    }
                });
            });
        }

        // Get or Create Personnel
        let personnelId = await new Promise((resolve) => {
            db.get('SELECT id FROM personnel WHERE name = ?', [personnelName], (err, row) => {
                if (row) resolve(row.id);
                else {
                    db.run('INSERT INTO personnel (name) VALUES (?)', [personnelName], function() {
                        resolve(this.lastID);
                    });
                }
            });
        });

        // Determine Category (Heuristic)
        let categoryId = 21; // Misc
        const fullDetail = (detailEn + ' ' + detailZh).toLowerCase();
        if (fullDetail.includes('meal') || fullDetail.includes('lunch') || fullDetail.includes('breakfast') || fullDetail.includes('snacks') || fullDetail.includes('\u98ef') || fullDetail.includes('\u9910')) categoryId = 15;
        else if (fullDetail.includes('cab') || fullDetail.includes('auto') || fullDetail.includes('delivery') || fullDetail.includes('highway') || fullDetail.includes('porter') || fullDetail.includes('\u8eca\u8cc7')) categoryId = 28;
        else if (fullDetail.includes('phone') || fullDetail.includes('wifi') || fullDetail.includes('recharge') || fullDetail.includes('airtel') || fullDetail.includes('\u96fb\u8a71')) categoryId = 9;
        else if (fullDetail.includes('electricity') || fullDetail.includes('water') || fullDetail.includes('tneb') || fullDetail.includes('\u6c34\u96fb')) categoryId = 12;
        else if (fullDetail.includes('paper') || fullDetail.includes('tape') || fullDetail.includes('documents') || fullDetail.includes('\u6587\u5177')) categoryId = 7;
        else if (fullDetail.includes('cleaning') || fullDetail.includes('wages') || fullDetail.includes('\u6e05\u6f54')) categoryId = 26; // Labor

        // Insert Expense
        await new Promise((resolve) => {
            db.run(`INSERT INTO expenses 
                (invoice_date, reimbursement_date, supplier_id, category_id, detail_en, detail_zh, personnel_id, outgoing, incoming, has_bill, pay_status) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [invoiceDate || reimbDate, reimbDate, supplierId, categoryId, detailEn, detailZh, personnelId, outgoing, 0, hasBill, payStatus],
                function(err) {
                    if (err) console.error('Error inserting row', i, err);
                    resolve();
                }
            );
        });
    }

    console.log('--- Import Completed ---');
    db.close();
}

run();
