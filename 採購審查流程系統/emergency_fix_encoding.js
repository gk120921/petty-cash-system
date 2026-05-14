const fs = require('fs');
const path = require('path');

const componentsDir = path.join(__dirname, 'frontend/src/components');
const apiConfigPath = 'import { API_BASE } from \'../apiConfig\';';

// 擴展映射：涵蓋目前發現的所有亂碼模式
const replacements = [
    // API 替換
    { old: /const API_BASE = 'http:\/\/127\.0\.0\.1:3001\/api';/g, new: apiConfigPath },
    { old: /const API_BASE = 'http:\/\/localhost:3001\/api';/g, new: apiConfigPath },
    
    // 狀態與按鈕
    { old: /已核\?\?\(Approved\)/g, new: '已核准 (Approved)' },
    { old: /已核\?\?\(APPROVED\)/g, new: '已核准 (APPROVED)' },
    { old: /已\?\?購 \(Converted\)/g, new: '已轉採購 (Converted)' },
    { old: /已\?\?\?\(Rejected\)/g, new: '已退件 (Rejected)' },
    { old: /已退\?\?\(REJECTED\)/g, new: '已退件 (REJECTED)' },
    { old: /已\??\(Closed\)/g, new: '已結案 (Closed)' },
    { old: /待簽\?\?\(PENDING\)/g, new: '待簽核 (PENDING)' },
    { old: /\?稿 \(DRAFT\)/g, new: '草稿 (DRAFT)' },
    { old: /\?部 \(ALL\)/g, new: '全部 (ALL)' },
    
    // 標題與文字
    { old: /審查歷史紀\?\?/g, new: '審查歷史紀錄' },
    { old: /\?購總表\?出中\?/g, new: '採購總表匯出中心' },
    { old: /檢\?\?\?尋\?管\?\?\?已結\?\?\?購單\?採購單/g, new: '檢視、搜尋與管理所有已結案的請購單與採購單' },
    { old: /\?購汇总导\?\?/g, new: '採購匯總導出' },
    { old: /\?\?\?\?\?人\?、部\?\.\.\./g, new: '搜尋單號、申請人、部門...' },
    { old: /\?詢 Query/g, new: '查詢 Query' },
    { old: /起\?\?\? Start Date/g, new: '起始日期 Start Date' },
    { old: /結\?\?\? End Date/g, new: '結束日期 End Date' },
    { old: /訂單\?\?\?Status Filter/g, new: '訂單狀態 Status Filter' },
    { old: /立即\?出總表/g, new: '立即導出總表' },
    { old: /\?設導出\?\?說\?\?\?/g, new: '預設導出說明事項' },
    { old: /\?含\?\?\?\?細\?\?\?\?/g, new: '包含採購明細' },
    { old: /\?根據\?\?\?\?篩選條件\?\?\?\?/g, new: '根據日期與狀態篩選條件自動過濾' },
    { old: /\?已\?齊公\?\?準\?計報表格式\?/g, new: '符合公司標準採購報表格式' },
    { old: /\?\?\?\?\?\(S\.No, Date, PO\/PR No, Supplier, Details, Qty, Price, Account Subject, etc\.\)/g, new: '(S.No, Date, PO/PR No, Supplier, Details, Qty, Price, Account Subject, etc.)' },
    
    // 表頭
    { old: /類\? Type/g, new: '類型 Type' },
    { old: /\?\? Number/g, new: '單號 Number' },
    { old: /\?\?\?\?\? Requester\/Dept/g, new: '申請人/部門 Requester/Dept' },
    { old: /總\?\?Amount/g, new: '總金額 Amount' },
    { old: /簽核\?\? Date/g, new: '簽核日期 Date' },
    { old: /\?\?\?Status/g, new: '狀態 Status' },
    { old: /\?\? Actions/g, new: '操作 Actions' },
    { old: /供\?\?\?\?\?Name/g, new: '供應商名稱 Name' },
    { old: /供\?\?\?代\?Supplies Code/g, new: '供應商代碼 Supplier Code' },
    { old: /PO 建\? Date/g, new: 'PO 建立日期 Date' },
    { old: /\?價/g, new: '單價' },
    { old: /科目\?\?\? \(Code\)/g, new: '科目代碼 (Code)' },
    
    // 提示與按鈕功能
    { old: /此篩\?\?件\?\?\?\?\?可\?出/g, new: '此篩選條件下無資料可導出' },
    { old: /\?出失\?\?/g, new: '導出失敗' },
    { old: /讀\?中\.\.\./g, new: '讀取中...' },
    { old: /尚無結\?紀\?\?/g, new: '尚無紀錄' },
    { old: /\?\?詳\?/g, new: '查看詳情' },
    { old: /\?\?至待簽\?\?/g, new: '退回至待簽核' },
    { old: /永\?\?\?除/g, new: '永久刪除' },
    { old: /\?\?\?\?Processing\.\.\./g, new: '處理中... Processing...' }
];

const files = fs.readdirSync(componentsDir).filter(f => f.endsWith('.jsx'));

files.forEach(file => {
    const filePath = path.join(componentsDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    let changed = false;
    replacements.forEach(r => {
        if (content.match(r.old)) {
            content = content.replace(r.old, r.new);
            changed = true;
        }
    });

    if (changed) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`[Fixed] ${file}`);
    }
});
