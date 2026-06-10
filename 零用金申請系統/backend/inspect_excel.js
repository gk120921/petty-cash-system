const ExcelJS = require('exceljs');
const path = require('path');

async function inspect() {
    const filePath = path.join(__dirname, '../Petty cash 2026 - Apr2026  - updated (05.06).xlsx');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const sheet = workbook.getWorksheet(1);
    
    console.log('Sheet name:', sheet.name);
    console.log('Row count:', sheet.rowCount);
    
    for (let i = 1; i <= 5; i++) {
        const row = sheet.getRow(i);
        const values = row.values.slice(1); // skip empty 0th index
        console.log(`Row ${i}:`, values.map(v => typeof v === 'object' ? JSON.stringify(v) : v));
    }
}

inspect().catch(console.error);
