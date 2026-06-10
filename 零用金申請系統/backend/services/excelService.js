const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

/**
 * Service to handle Excel export and import operations
 */
class ExcelService {
  constructor(db) {
    this.db = db;
  }

  /**
   * Internal helper to fetch data using Promises
   */
  async _getRows(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => err ? reject(err) : resolve(rows));
    });
  }

  _readConfiguredOpeningBalance() {
    let openingBalance = 0;
    const configPath = path.join(__dirname, '..', 'config.json');
    if (fs.existsSync(configPath)) {
      try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        openingBalance = Number(config.opening_balance) || 0;
      } catch (e) { }
    }
    return openingBalance;
  }

  async _calculateOpeningBalanceBeforeDate({ startDate, isArchivedExport = false, dateField = 'reimbursement_date' }) {
    let openingBalance = this._readConfiguredOpeningBalance();

    if (!isArchivedExport) {
      try {
        const archivedRows = await this._getRows(
          `SELECT SUM(incoming) as total_in, SUM(outgoing) as total_out FROM expenses WHERE is_archived = 1`
        );
        if (archivedRows && archivedRows.length > 0) {
          const archivedIn = Number(archivedRows[0].total_in) || 0;
          const archivedOut = Number(archivedRows[0].total_out) || 0;
          openingBalance += archivedIn - archivedOut;
        }
      } catch (err) {
        console.error('Error fetching archived summary for opening balance', err);
      }
    }

    if (!startDate) {
      return openingBalance;
    }

    const safeDateField = dateField === 'invoice_date' ? 'invoice_date' : 'reimbursement_date';
    const priorRows = await this._getRows(
      `
        SELECT SUM(incoming) as total_in, SUM(outgoing) as total_out
        FROM expenses
        WHERE is_archived = ?
          AND COALESCE(${safeDateField}, invoice_date, '') < ?
      `,
      [isArchivedExport ? 1 : 0, startDate]
    );

    if (priorRows && priorRows.length > 0) {
      const priorIn = Number(priorRows[0].total_in) || 0;
      const priorOut = Number(priorRows[0].total_out) || 0;
      openingBalance += priorIn - priorOut;
    }

    return openingBalance;
  }

  /**
   * Export all data to a multi-sheet backup
   */
  async exportFullBackup(res) {
    const workbook = new ExcelJS.Workbook();

    // 1. Setup Sheets
    const expensesSheet = workbook.addWorksheet('收支紀錄 Expenses');
    expensesSheet.columns = [
      { header: 'ID', key: 'id', width: 5 },
      { header: '發票日期', key: 'invoice_date', width: 15 },
      { header: '報帳日期', key: 'reimbursement_date', width: 15 },
      { header: '供應商', key: 'supplier_name', width: 20 },
      { header: '分類', key: 'category_name', width: 15 },
      { header: '細目(中)', key: 'detail_zh', width: 25 },
      { header: '細目(英)', key: 'detail_en', width: 25 },
      { header: '收入', key: 'incoming', width: 10 },
      { header: '支出', key: 'outgoing', width: 10 },
      { header: '狀態', key: 'pay_status', width: 10 },
      { header: '憑證(勾選)', key: 'receipt_v', width: 10 },
      { header: '照片(上傳)', key: 'photo_v', width: 10 }
    ];

    const suppliersSheet = workbook.addWorksheet('供應商 Suppliers');
    suppliersSheet.columns = [
      { header: 'ID', key: 'id', width: 5 },
      { header: '名稱', key: 'name', width: 30 },
      { header: '稅號', key: 'tax_id', width: 15 },
      { header: '電話', key: 'phone', width: 15 },
      { header: '地址', key: 'address', width: 40 }
    ];

    const categoriesSheet = workbook.addWorksheet('費用類別 Categories');
    categoriesSheet.columns = [
      { header: 'ID', key: 'id', width: 5 },
      { header: '中文名稱', key: 'name_zh', width: 20 },
      { header: '英文名稱', key: 'name_en', width: 20 },
      { header: '會計科目', key: 'account_code', width: 15 }
    ];

    const personnelSheet = workbook.addWorksheet('人員名單 Personnel');
    personnelSheet.columns = [
      { header: 'ID', key: 'id', width: 5 },
      { header: '姓名', key: 'name', width: 20 }
    ];

    // 2. Fetch Data
    const [expensesRows, suppliers, categories, personnel] = await Promise.all([
      this._getRows(`SELECT e.*, COALESCE(e.supplier_name, s.name) as supplier_name, c.name_zh as category_name FROM expenses e LEFT JOIN suppliers s ON e.supplier_id = s.id LEFT JOIN categories c ON e.category_id = c.id ORDER BY e.invoice_date ASC, e.id ASC`),
      this._getRows(`SELECT * FROM suppliers`),
      this._getRows(`SELECT * FROM categories`),
      this._getRows(`SELECT * FROM personnel`)
    ]);

    let openingBalance = 0;
    const configPath = path.join(__dirname, '..', 'config.json');
    if (fs.existsSync(configPath)) {
      try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        openingBalance = Number(config.opening_balance) || 0;
      } catch (e) { }
    }

    // 3. Add Rows
    let currentBalance = openingBalance;
    expensesSheet.columns = [
      ...expensesSheet.columns,
      { header: '結餘(Balance)', key: 'balance', width: 15 }
    ];

    expensesSheet.addRows(expensesRows.map(e => {
      const inc = Number(e.incoming) || 0;
      const out = Number(e.outgoing) || 0;
      currentBalance = currentBalance + inc - out;
      return {
        ...e,
        receipt_v: e.has_bill === 1 ? 'V' : '-',
        photo_v: e.image_path ? 'V' : '-',
        balance: currentBalance
      };
    }));
    suppliersSheet.addRows(suppliers);
    categoriesSheet.addRows(categories);
    personnelSheet.addRows(personnel);

    // 4. Write to Response
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=full_database_backup.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  }

  /**
   * Export expenses with photos (Report v2) - Customized Layout
   */
  async exportFinancialReportV2(rows, res, isArchivedExport = false) {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Petty Cash Report');

    // 1. 準備元數據 (Prepare Meta Data)
    let openingBalance = 0;
    const configPath = path.join(__dirname, '..', 'config.json');
    if (fs.existsSync(configPath)) {
      try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        openingBalance = Number(config.opening_balance) || 0;
      } catch (e) { }
    }

    if (!isArchivedExport) {
      try {
        const sumRows = await this._getRows(`SELECT SUM(incoming) as total_in, SUM(outgoing) as total_out FROM expenses WHERE is_archived = 1`);
        if (sumRows && sumRows.length > 0) {
          const archivedIn = Number(sumRows[0].total_in) || 0;
          const archivedOut = Number(sumRows[0].total_out) || 0;
          openingBalance += (archivedIn - archivedOut);
        }
      } catch (err) {
        console.error('Error fetching archived summary for excel export', err);
      }
    }

    const totalIn = rows.reduce((sum, row) => sum + (Number(row.incoming) || 0), 0);
    const totalOut = rows.reduce((sum, row) => sum + (Number(row.outgoing) || 0), 0);
    const balance = openingBalance + totalIn - totalOut;
    const exportTime = new Date().toLocaleString('zh-TW', { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).replace(/\//g, '-');

    // 計算發票區間
    const dates = rows.map(r => r.invoice_date).filter(d => d).sort();
    const invoiceRange = dates.length > 0 ? `${dates[0]} ~ ${dates[dates.length - 1]}` : 'N/A';

    // 2. 設置頂部資訊 (Row 1-4 with Merged cells)
    const metaInfo = [
      { label: '發票區間 (Invoice Range)', value: invoiceRange, row: 1 },
      { label: '期初餘額 (Opening)', value: openingBalance, row: 2 },
      { label: '匯出時間 (Export Time)', value: exportTime, row: 3 },
      { label: '本次結餘 (Balance)', value: balance, row: 4 }
    ];

    metaInfo.forEach(item => {
      const row = sheet.getRow(item.row);
      row.getCell(1).value = item.label;
      row.getCell(2).value = item.value;
      row.getCell(1).font = { bold: true };
      sheet.mergeCells(`B${item.row}:C${item.row}`); // 合計數值位

      if (item.row === 4) { // 本次結餘 (Red)
        row.getCell(1).font = { bold: true, color: { argb: 'FFFF0000' } };
        row.getCell(2).font = { bold: true, color: { argb: 'FFFF0000' } };
        row.getCell(2).numFmt = '#,##0';
      }
    });

    // 3. 定義表頭 (Starting from Row 5 as per latest screenshot)
    const headerRowIndex = 5;
    const headerValues = [
      'ID', '發票日期 (Date)', '報帳日期 (Reimbursement Date)', '會計科目 (Account Code)',
      '供應商 (Supplier)', '分類 (Category)', '細目-中 (Detail ZH)', '細目-英 (Detail EN)',
      '報帳人 (Personnel)', '收入 (In)', '支出 (Out)', '結餘 (Balance)', '照片 (Photo)'
    ];

    const headerRow = sheet.getRow(headerRowIndex);
    headerValues.splice(8, 0, '報帳人 (Personnel)');
    headerValues[headerValues.length - 1] = '經辦人 (Handler)';
    headerRow.values = headerValues;
    headerRow.font = { bold: true };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

    // 4. 欄位寬度
    const columns = [
      { width: 8 }, { width: 18 }, { width: 18 }, { width: 18 },
      { width: 22 }, { width: 22 }, { width: 28 }, { width: 28 },
      { width: 15 }, { width: 12 }, { width: 12 }, { width: 15 }, { width: 12 }
    ];
    columns.forEach((col, i) => {
      sheet.getColumn(i + 1).width = col.width;
    });

    // 5. 填充數據 (Starting from Row 6)
    let currentBalance = openingBalance;
    rows.forEach((row, index) => {
      const rowIndex = index + 6;
      const r = sheet.getRow(rowIndex);

      r.getCell(1).value = row.id;
      r.getCell(2).value = row.invoice_date;
      r.getCell(3).value = row.reimbursement_date;
      r.getCell(4).value = row.account_code || '';
      r.getCell(5).value = row.supplier_name || '';
      r.getCell(6).value = row.category_name || '';
      r.getCell(7).value = row.detail_zh || '';
      r.getCell(8).value = row.detail_en || '';
      r.getCell(9).value = row.personnel_name || '';
      r.getCell(9).value = row.personnel_name || '';
      r.getCell(9).value = row.personnel_name || '';

      const valIn = Number(row.incoming) || 0;
      const valOut = Number(row.outgoing) || 0;
      currentBalance = currentBalance + valIn - valOut;

      const cIn = r.getCell(10);
      cIn.value = valIn;
      cIn.numFmt = '"$"#,##0';
      cIn.font = { color: { argb: 'FF00B050' } }; // 收入綠色 (Income Green)

      const cOut = r.getCell(11);
      cOut.value = valOut;
      cOut.numFmt = '"$"#,##0';
      cOut.font = { color: { argb: 'FFFF0000' } }; // 支出紅色 (Expense Red)

      const cBal = r.getCell(12);
      cBal.value = currentBalance;
      cBal.numFmt = '"$"#,##0';
      cBal.font = { bold: true };

      const cPhoto = r.getCell(13);
      cPhoto.value = row.image_path ? 'V' : '-';
      cPhoto.alignment = { horizontal: 'center' };
    });

    // 6. 小計與合計 (Footer Section)
    const footerStartRow = rows.length + 6;

    const subtotalRow = sheet.getRow(footerStartRow);
    subtotalRow.getCell(9).value = '小計 (Notes)';
    subtotalRow.getCell(9).font = { bold: true };
    subtotalRow.getCell(10).value = totalIn;
    subtotalRow.getCell(11).value = totalOut;
    [10, 11].forEach(c => {
      subtotalRow.getCell(c).font = { bold: true, underline: 'double' };
      subtotalRow.getCell(c).numFmt = '"$"#,##0';
    });

    const totalRow = sheet.getRow(footerStartRow + 1);
    totalRow.getCell(9).value = '合計 (Total)';
    totalRow.getCell(9).font = { bold: true };
    const balanceCell = totalRow.getCell(10);
    balanceCell.value = totalIn - totalOut;
    balanceCell.font = { bold: true, color: { argb: 'FF00B050' }, underline: 'double' };
    balanceCell.numFmt = '"$"#,##0';

    // 7. 邊框應用
    const borderStyle = { style: 'thin', color: { argb: 'FF000000' } };

    // 元數據與結餘區邊框 (Row 1-4)
    [1, 2, 3, 4].forEach(rIdx => {
      const r = sheet.getRow(rIdx);
      r.getCell(1).border = borderStyle;
      r.getCell(2).border = borderStyle;
      r.getCell(3).border = borderStyle;
    });

    // 表格數據區邊框
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber >= headerRowIndex) {
        row.eachCell({ includeEmpty: false }, (cell) => {
          cell.border = borderStyle;
        });
      }
    });

    // 7. Photos Sheet (Removed as per user request to use Word exports for photos instead of Excel)

    const filenameDate = new Date().toISOString().split('T')[0];
    const filename = `PettyCash_Report_${filenameDate}_v2.xlsx`;

    // Use Express built-in attachment method
    res.attachment(filename);
    res.contentType('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');

    const buffer = await workbook.xlsx.writeBuffer();

    // 關鍵修正：明確告知瀏覽器檔案大小，防止下載卡住
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  }

  async exportFinancialReportV3(rows, res, isArchivedExport = false, options = {}) {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Petty Cash Report V3');
    const sortedRows = [...rows].sort((a, b) => Number(a.id || 0) - Number(b.id || 0));

    const dateField = options.dateField === 'invoice_date' ? 'invoice_date' : 'reimbursement_date';
    const startDate = options.startDate || '';
    const previousBalance = await this._calculateOpeningBalanceBeforeDate({
      startDate,
      isArchivedExport,
      dateField
    });

    const topUpRows = sortedRows.filter((row) => {
      const incoming = Number(row.incoming) || 0;
      if (incoming <= 0) return false;

      const matchedText = [
        row.category_name,
        row.detail_zh,
        row.detail_en
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return matchedText.includes('零用金撥補')
        || matchedText.includes('top-up')
        || matchedText.includes('top up')
        || matchedText.includes('petty cash top');
    });
    const topUpIds = new Set(topUpRows.map((row) => Number(row.id)));
    const detailRows = sortedRows.filter((row) => !topUpIds.has(Number(row.id)));
    const topUpTotal = topUpRows.reduce((sum, row) => sum + (Number(row.incoming) || 0), 0);
    const totalIn = sortedRows.reduce((sum, row) => sum + (Number(row.incoming) || 0), 0);
    const totalOut = sortedRows.reduce((sum, row) => sum + (Number(row.outgoing) || 0), 0);
    const detailTotalIn = detailRows.reduce((sum, row) => sum + (Number(row.incoming) || 0), 0);
    const detailTotalOut = detailRows.reduce((sum, row) => sum + (Number(row.outgoing) || 0), 0);
    const periodOpeningBalance = previousBalance + topUpTotal;
    const endingBalance = previousBalance + totalIn - totalOut;
    const exportTime = new Date()
      .toLocaleString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
      .replace(/\//g, '-');
    const periodDates = sortedRows
      .map((r) => r[dateField] || r.reimbursement_date || r.invoice_date)
      .filter(Boolean)
      .sort();
    const reimbursementRange = periodDates.length > 0 ? `${periodDates[0]} ~ ${periodDates[periodDates.length - 1]}` : 'N/A';
    const topUpDates = [...new Set(
      topUpRows
        .map((r) => r[dateField] || r.reimbursement_date || r.invoice_date)
        .filter(Boolean)
    )].sort();
    const topUpDateText = topUpDates.length === 0
      ? '-'
      : topUpDates.length === 1
        ? topUpDates[0]
        : `${topUpDates[0]} ~ ${topUpDates[topUpDates.length - 1]}`;

    const summaryRows = [
      { row: 1, label: '報帳區間 (Reimbursement Range)', value: reimbursementRange, valueType: 'text' },
      { row: 2, label: '前期餘額 (Previous Balance)', value: previousBalance, valueType: 'currency', color: 'FF0000FF' },
      { row: 3, label: '本次撥補 (Top-Up)', value: topUpTotal, valueType: 'currency', color: 'FF008000' },
      { row: 4, label: '撥補日期 (Top-Up Date)', value: topUpDateText, valueType: 'text' },
      { row: 5, label: '期初餘額 (Opening Balance)', value: periodOpeningBalance, valueType: 'currency', color: 'FF008000' },
      { row: 6, label: '本次結餘 (Current Balance)', value: endingBalance, valueType: 'currency', color: 'FFFF0000' },
      { row: 7, label: '匯出時間 (Export Time)', value: exportTime, valueType: 'text' }
    ];

    summaryRows.forEach(({ row, label, value, valueType, color }) => {
      sheet.getCell(`A${row}`).value = label;
      sheet.getCell(`A${row}`).font = {
        bold: true,
        color: color ? { argb: color } : undefined
      };
      sheet.getCell(`B${row}`).value = value;
      sheet.mergeCells(`B${row}:C${row}`);
      if (valueType === 'currency') {
        sheet.getCell(`B${row}`).numFmt = '"$"#,##0';
        sheet.getCell(`B${row}`).font = {
          bold: true,
          color: color ? { argb: color } : undefined
        };
      }
    });

    const headerRowIndex = 9;
    const dataStartRow = headerRowIndex + 1;
    const headerValues = [
      'ID',
      '發票日期 (Invoice Date)',
      '報帳日期 (Reimbursement Date)',
      '科目 (Account Code)',
      '供應商 (Supplier)',
      '分類 (Category)',
      '細目-中 (Detail ZH)',
      '細目-英 (Detail EN)',
      '報帳人 (Personnel)',
      '收入 (In)',
      '支出 (Out)',
      '結餘 (Balance)',
      '照片 (Photo)',
      '經辦人 (Handler)'
    ];

    const headerRow = sheet.getRow(headerRowIndex);
    headerRow.values = headerValues;
    headerRow.font = { bold: true };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 24;
    sheet.getCell(headerRowIndex, 9).value = '報帳人 (Personnel)';
    sheet.getCell(headerRowIndex, 10).value = '收入 (In)';
    sheet.getCell(headerRowIndex, 11).value = '支出 (Out)';
    sheet.getCell(headerRowIndex, 12).value = '結餘 (Balance)';
    sheet.getCell(headerRowIndex, 13).value = '照片 (Photo)';
    sheet.getCell(headerRowIndex, 14).value = '經辦人 (Handler)';

    const columns = [
      { width: 8 }, { width: 16 }, { width: 18 }, { width: 16 },
      { width: 24 }, { width: 20 }, { width: 28 }, { width: 28 },
      { width: 16 }, { width: 12 }, { width: 12 }, { width: 15 }, { width: 12 }
    ];
    columns.splice(8, 0, { width: 16 });
    columns.push({ width: 16 });
    columns.forEach((col, i) => {
      sheet.getColumn(i + 1).width = col.width;
    });

    let currentBalance = periodOpeningBalance;
    detailRows.forEach((row, index) => {
      const rowIndex = dataStartRow + index;
      const r = sheet.getRow(rowIndex);

      r.getCell(1).value = row.id;
      r.getCell(2).value = row.invoice_date;
      r.getCell(3).value = row.reimbursement_date;
      r.getCell(4).value = row.account_code || '';
      r.getCell(5).value = row.supplier_name || '';
      r.getCell(6).value = row.category_name || '';
      r.getCell(7).value = row.detail_zh || '';
      r.getCell(8).value = row.detail_en || '';
      r.getCell(9).value = row.personnel_name || '';

      const valueIn = Number(row.incoming) || 0;
      const valueOut = Number(row.outgoing) || 0;
      currentBalance = currentBalance + valueIn - valueOut;

      r.getCell(10).value = valueIn;
      r.getCell(10).numFmt = '"$"#,##0';
      r.getCell(10).font = { color: { argb: 'FF008000' } };

      r.getCell(11).value = valueOut;
      r.getCell(11).numFmt = '"$"#,##0';
      r.getCell(11).font = { color: { argb: 'FFFF0000' } };

      r.getCell(12).value = currentBalance;
      r.getCell(12).numFmt = '"$"#,##0';
      r.getCell(12).font = { bold: true };

      r.getCell(13).value = row.image_path ? 'V' : '-';
      r.getCell(13).alignment = { horizontal: 'center' };
      r.getCell(14).value = row.handler_personnel_name || '';
    });

    const footerStartRow = dataStartRow + detailRows.length;
    const subtotalRow = sheet.getRow(footerStartRow);
    subtotalRow.getCell(8).value = '小計 (Subtotal)';
    subtotalRow.getCell(8).font = { bold: true };
    subtotalRow.getCell(10).value = detailTotalIn;
    subtotalRow.getCell(11).value = detailTotalOut;
    [10, 11].forEach((columnIndex) => {
      subtotalRow.getCell(columnIndex).font = { bold: true, underline: 'double' };
      subtotalRow.getCell(columnIndex).numFmt = '"$"#,##0';
    });

    const totalRow = sheet.getRow(footerStartRow + 1);
    totalRow.getCell(8).value = '本次結餘 (Total Balance)';
    totalRow.getCell(8).font = { bold: true };
    totalRow.getCell(12).value = endingBalance;
    totalRow.getCell(12).numFmt = '"$"#,##0';
    totalRow.getCell(12).font = { bold: true, color: { argb: 'FFFF0000' }, underline: 'double' };

    const borderStyle = { style: 'thin', color: { argb: 'FF000000' } };
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber <= 7 || rowNumber >= headerRowIndex) {
        row.eachCell({ includeEmpty: false }, (cell) => {
          cell.border = {
            top: borderStyle,
            left: borderStyle,
            bottom: borderStyle,
            right: borderStyle
          };
        });
      }
    });

    const filenameDate = new Date().toISOString().split('T')[0];
    const filename = `PettyCash_Report_${filenameDate}_v3.xlsx`;
    res.attachment(filename);
    res.contentType('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');

    const buffer = await workbook.xlsx.writeBuffer();
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  }

  /**
   * Export inventory report with embedded photos and status
   */
  async exportInventoryReport(rows, res, isArchivedExport = false) {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Inventory Audit');

    // 1. Meta Data
    let openingBalance = 0;
    const configPath = path.join(__dirname, '..', 'config.json');
    if (fs.existsSync(configPath)) {
      try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        openingBalance = Number(config.opening_balance) || 0;
      } catch (e) { }
    }

    if (!isArchivedExport) {
      try {
        const sumRows = await this._getRows(`SELECT SUM(incoming) as total_in, SUM(outgoing) as total_out FROM expenses WHERE is_archived = 1`);
        if (sumRows && sumRows.length > 0) {
          const archivedIn = Number(sumRows[0].total_in) || 0;
          const archivedOut = Number(sumRows[0].total_out) || 0;
          openingBalance += (archivedIn - archivedOut);
        }
      } catch (err) {
        console.error('Error fetching archived summary for inventory export', err);
      }
    }

    // 2. Header
    const headerValues = [
      'ID', '日期 (Date)', '供應商 (Supplier)', '類別 (Category)', '細目 (Detail)',
      '報帳人 (Personnel)', '收入 (In)', '支出 (Out)', '結餘 (Balance)',
      '付款狀態 (Status)', '照片有無 (Photo V/-)', '實體照片 (Embedded Image)'
    ];
    const headerRow = sheet.getRow(1);
    headerRow.values = headerValues;
    headerRow.font = { bold: true };
    headerRow.height = 30;
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

    // 3. Widths & Row Heights
    const colWidths = [8, 15, 20, 20, 25, 15, 12, 12, 15, 12, 12, 40];
    colWidths.forEach((w, i) => sheet.getColumn(i + 1).width = w);

    // 4. Fill Data
    let currentBalance = openingBalance;
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowIndex = i + 2;
      const r = sheet.getRow(rowIndex);
      r.height = 80; // High enough for thumbnails

      r.getCell(1).value = row.id;
      r.getCell(2).value = row.invoice_date;
      r.getCell(3).value = row.supplier_name;
      r.getCell(4).value = row.category_name;
      r.getCell(5).value = row.detail_zh;
      r.getCell(6).value = row.personnel_name;

      const vIn = Number(row.incoming) || 0;
      const vOut = Number(row.outgoing) || 0;
      currentBalance = currentBalance + vIn - vOut;

      const cIn = r.getCell(7);
      cIn.value = vIn;
      cIn.numFmt = '"$"#,##0';
      cIn.font = { color: { argb: 'FF00B050' } }; // 收入綠色

      const cOut = r.getCell(8);
      cOut.value = vOut;
      cOut.numFmt = '"$"#,##0';
      cOut.font = { color: { argb: 'FFFF0000' } }; // 支出紅色

      const cBal = r.getCell(9);
      cBal.value = currentBalance;
      cBal.numFmt = '"$"#,##0';

      r.getCell(10).value = row.pay_status || 'TO_PAY';
      r.getCell(11).value = row.image_path ? 'V' : '-';
      r.getCell(11).alignment = { horizontal: 'center' };

      // 5. Embedded Image Logic
      if (row.image_path) {
        let primaryPath = row.image_path;
        if (primaryPath.startsWith('[')) {
          try {
            const paths = JSON.parse(primaryPath);
            primaryPath = Array.isArray(paths) ? paths[0] : primaryPath;
          } catch (e) { }
        }

        const fullPath = path.join(__dirname, '..', primaryPath);
        if (fs.existsSync(fullPath) && fs.lstatSync(fullPath).isFile()) {
          try {
            const imageId = workbook.addImage({
              buffer: fs.readFileSync(fullPath),
              extension: path.extname(fullPath).substring(1) || 'png',
            });
            sheet.addImage(imageId, {
              tl: { col: 11.1, row: rowIndex - 1 },
              br: { col: 11.9, row: rowIndex },
              editAs: 'oneCell'
            });
          } catch (e) { }
        }
      }
    }

    // 6. Borders
    const borderStyle = { style: 'thin', color: { argb: 'FF000000' } };
    sheet.eachRow((row) => {
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.border = borderStyle;
        cell.alignment = { vertical: 'middle', ...cell.alignment };
      });
    });

    const filename = `PettyCash_Inventory_${new Date().toISOString().split('T')[0]}.xlsx`;
    res.attachment(filename);
    const buffer = await workbook.xlsx.writeBuffer();
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  }

  /**
   * Import expenses from Excel
   */
  /**
   * Import expenses from Excel or CSV
   */
  async importExpenses(filePath) {
    const isCsv = filePath.toLowerCase().endsWith('.csv');
    const workbook = new ExcelJS.Workbook();
    
    if (isCsv) {
      await workbook.csv.readFile(filePath);
    } else {
      await workbook.xlsx.readFile(filePath);
    }
    
    const sheet = workbook.getWorksheet(1);
    let importCount = 0;

    const formatDate = (val) => {
      if (!val) return null;
      if (val instanceof Date) return val.toISOString().split('T')[0];
      let str = val.toString().trim();
      
      // 處理 2026 03 21 或 2026/03/21 或 2026-03-21
      const standardMatch = str.match(/^(\d{4})[\s\-\/](\d{1,2})[\s\-\/](\d{1,2})$/);
      if (standardMatch) {
        return `${standardMatch[1]}-${standardMatch[2].padStart(2, '0')}-${standardMatch[3].padStart(2, '0')}`;
      }

      // 處理 18 Apr 26 或 18-Apr-26
      const months = { 'jan':'01','feb':'02','mar':'03','apr':'04','may':'05','jun':'06','jul':'07','aug':'08','sep':'09','oct':'10','nov':'11','dec':'12' };
      const alphaMatch = str.match(/^(\d{1,2})[\s\-]([a-zA-Z]{3})[\s\-](\d{2,4})$/);
      if (alphaMatch) {
        const d = alphaMatch[1].padStart(2, '0');
        const m = months[alphaMatch[2].toLowerCase()] || '01';
        const y = alphaMatch[3].length === 2 ? '20' + alphaMatch[3] : alphaMatch[3];
        return `${y}-${m}-${d}`;
      }

      const d = new Date(str);
      return isNaN(d.getTime()) ? null : d.toISOString().split('T')[0];
    };

    const firstRow = sheet.getRow(1).values.map(v => v?.toString().toLowerCase() || '');
    const getCol = (keywords) => {
      const idx = firstRow.findIndex(v => keywords.some(k => v.includes(k.toLowerCase())));
      return idx === -1 ? null : idx;
    };

    // 動態映射欄位 (Dynamic mapping based on keywords)
    const map = {
      invDate: getCol(['發票', 'invoice', 'date']),
      reimDate: getCol(['報帳', 'reimbursement']),
      supplier: getCol(['供應商', 'supplier']),
      cat: getCol(['分類', 'category']),
      detailZh: getCol(['細目', 'detail zh', 'detail(中)']),
      detailEn: getCol(['detail en', 'detail(英)']),
      person: getCol(['報帳人', 'personnel']),
      in: getCol(['收入', 'income', 'in']),
      out: getCol(['支出', 'outgoing', 'out']),
      bill: getCol(['憑證', 'bill']),
      code: getCol(['科目', 'account code'])
    };

    for (let i = 2; i <= sheet.rowCount; i++) {
      const row = sheet.getRow(i);
      const data = {
        invoiceDate: map.invDate ? formatDate(row.getCell(map.invDate).value) : null,
        reimburseDate: map.reimDate ? formatDate(row.getCell(map.reimDate).value) : null,
        supplier: map.supplier ? row.getCell(map.supplier).value?.toString().trim() : null,
        category: map.cat ? row.getCell(map.cat).value?.toString().trim() : null,
        detailZh: map.detailZh ? row.getCell(map.detailZh).value?.toString().trim() : null,
        detailEn: map.detailEn ? row.getCell(map.detailEn).value?.toString().trim() : null,
        personnel: map.person ? row.getCell(map.person).value?.toString().trim() : null,
        incoming: map.in ? parseFloat(row.getCell(map.in).value) || 0 : 0,
        outgoing: map.out ? parseFloat(row.getCell(map.out).value) || 0 : 0,
        hasBill: map.bill ? (row.getCell(map.bill).value?.toString().toLowerCase() === 'yes' ? 1 : 0) : 1,
        accountCode: map.code ? row.getCell(map.code).value?.toString().trim() : null
      };

      if (!data.invoiceDate && !data.reimburseDate) continue;
      // 過濾統計列 (Filter total/summary rows)
      if (data.detailZh?.includes('總額') || data.detailZh?.includes('結餘')) continue;

      await this._insertImportedRow(data);
      importCount++;
    }
    return importCount;
  }

  async _insertImportedRow(d) {
    // 自動翻譯/互補邏輯 (Auto-translation/fallback)
    if (!d.detailZh && d.detailEn) d.detailZh = d.detailEn;
    if (!d.detailEn && d.detailZh) d.detailEn = d.detailZh;

    return new Promise((resolve) => {
      this.db.serialize(() => {
        this.db.get("SELECT id FROM suppliers WHERE name = ?", [d.supplier], (err, s) => {
          this.db.get("SELECT id FROM categories WHERE name_zh = ? OR account_code = ?", [d.category, d.accountCode], (err, c) => {
            // 如果人員為空，預設找 YI CHANG (ID)
            const personName = d.personnel || 'YI CHANG';
            this.db.get("SELECT id FROM personnel WHERE name = ?", [personName], (err, p) => {
              // 如果連 YI CHANG 都不存在 (極端情況)，則插入 YI CHANG 並獲取 ID
              if (!p && personName === 'YI CHANG') {
                this.db.run("INSERT INTO personnel (name) VALUES ('YI CHANG')", function(err) {
                  const newPid = this.lastID;
                  executeInsert(newPid);
                });
              } else {
                executeInsert(p?.id || null);
              }

              function executeInsert(pid) {
                const sql = `INSERT INTO expenses (
                  invoice_date, reimbursement_date, supplier_id, supplier_name, category_id, 
                  detail_zh, detail_en, personnel_id, incoming, outgoing, pay_status, has_bill
                ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`;
                this.db.run(sql, [
                  d.invoiceDate, d.reimburseDate, s?.id || null, d.supplier || '', c?.id || 21, 
                  d.detailZh || '-', d.detailEn || '-', pid, d.incoming, d.outgoing, d.status || 'PAID', d.hasBill || 1
                ], resolve);
              }
            });
          });
        });
      });
    });
  }

  async fixUnknownPersonnel() {
    return new Promise((resolve) => {
      this.db.get("SELECT id FROM personnel WHERE name = 'YI CHANG'", (err, row) => {
        if (row) {
          this.db.run("UPDATE expenses SET personnel_id = ? WHERE personnel_id IS NULL", [row.id], resolve);
        } else {
          resolve();
        }
      });
    });
  }
}

module.exports = ExcelService;
