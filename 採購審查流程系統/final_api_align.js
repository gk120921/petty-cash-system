const fs = require('fs');
const path = require('path');

const componentsDir = path.join(__dirname, 'frontend/src/components');
const apiConfigImport = 'import { API_BASE } from \'../apiConfig\';';

// 僅執行 API 調用的結構化替換
const replacements = [
    { old: /const API_BASE = 'http:\/\/127\.0\.0\.1:3001\/api';/g, new: apiConfigImport },
    { old: /const API_BASE = 'http:\/\/localhost:3001\/api';/g, new: apiConfigImport }
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
        console.log(`[Re-Aligned] ${file}`);
    }
});
