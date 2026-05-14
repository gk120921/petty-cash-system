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

async function compare() {
    console.log('--- CSV Analysis ---');
    const content = fs.readFileSync(csvPath, 'utf8');
    const lines = content.split('\n').filter(l => l.trim());
    let csvTotal = 0;
    let csvCount = 0;
    
    lines.forEach((line) => {
        const cols = parseCSVLine(line);
        // Amount should be index 7 (8th column)
        const amtStr = (cols[7] || '').replace(/[,\"]/g, '');
        const amt = parseFloat(amtStr);
        if (!isNaN(amt)) {
            csvTotal += amt;
            csvCount++;
        }
    });
    console.log(`CSV Rows: ${lines.length}`);
    console.log(`CSV Records with Valid Amount: ${csvCount}`);
    console.log(`CSV Total Outgoing: ${csvTotal}`);

    console.log('\n--- Database Analysis ---');
    const db = new sqlite3.Database(dbPath);
    db.all('SELECT outgoing FROM expenses', [], (err, dbRows) => {
        if (err) {
            console.error(err);
            return;
        }
        let dbTotal = 0;
        dbRows.forEach(r => dbTotal += (r.outgoing || 0));
        console.log(`Database Rows: ${dbRows.length}`);
        console.log(`Database Total Outgoing: ${dbTotal}`);
        
        console.log('\n--- Comparison ---');
        console.log(`Row Diff (DB - CSV): ${dbRows.length - lines.length}`);
        console.log(`Amount Diff (DB - CSV): ${dbTotal - csvTotal}`);
        
        db.close();
    });
}

compare();
