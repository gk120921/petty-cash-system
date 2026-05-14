const express = require('express');
const cors = require('cors');
const config = require('./config');
const dbs = require('./database');
const bcrypt = require('bcryptjs');
const responseHandler = require('./utils/responseHandler');

// 導入模組化服務 (符合命名空間隔離與接口合約)
const WMSService = require('./modules/wmsService');
const ProcurementService = require('./modules/procurementService');

const app = express();
app.use(cors());
app.use(express.json());

// 測試路由
app.get('/api/health', (req, res) => {
  responseHandler.success(res, { status: 'Nexus Gateway is running' });
});

  // 登入路由
  app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    console.log(`[Auth] 收到請求 - User: "${username}", Pass: "${password}"`);

    // 第一性原理：硬編碼管理員特權 (統一為 admin/admin)
    if (String(username).trim() === 'admin' && String(password).trim() === 'admin') {
      const adminData = {
        username: 'admin',
        real_name: '憲法超級管理員',
        dept_name: 'Nexus Core',
        role: 'admin',
        module_permissions: { petty_cash: true, procurement: true, wms: true }
      };
      console.log(`[Auth] 匹配成功：特權帳號進入`);
      return responseHandler.success(res, adminData, '特權登入成功');
    }

    console.log(`[Auth] 匹配失敗：進入資料庫查詢流程`);
    const query = 'SELECT * FROM users WHERE username = ? AND status = "ACTIVE"';
    dbs.nexus.get(query, [username], async (err, user) => {
    if (err) return responseHandler.error(res, '資料庫查詢失敗', err);
    if (!user) return responseHandler.error(res, '使用者不存在或已停用', 404);

    // 使用 bcrypt 進行密碼比較
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return responseHandler.error(res, '密碼錯誤', 401);
    }

    // 格式化回傳資料
    const userData = {
      username: user.username,
      real_name: user.real_name,
      dept_name: user.dept_name,
      role: user.role,
      module_permissions: JSON.parse(user.module_permissions || '{}')
    };

    console.log(`[Auth] 登入成功: ${username}`);
    responseHandler.success(res, userData, '登入成功');
  });
});

// 初始化帳號中心：從零用金與採購系統深度整合
app.post('/api/auth/sync-initial', async (req, res) => {
  console.log('[Sync] 開始初始化同步流程...');
  try {
    // 1. 取得零用金系統的所有人員 (作為基礎)
    dbs.petty_cash.all("SELECT * FROM personnel", [], async (err, pcUsers) => {
      if (err) {
        console.error('[Sync] 讀取零用金資料失敗:', err.message);
        return responseHandler.error(res, '讀取零用金資料失敗', err);
      }

      console.log(`[Sync] 從零用金系統讀取到 ${pcUsers ? pcUsers.length : 0} 名人員`);

      // 2. 取得採購系統的所有人員 (用於補全資訊)
      dbs.procurement.all("SELECT * FROM users", [], async (err, procUsers) => {
        if (err) {
          console.error('[Sync] 讀取採購系統資料失敗:', err.message);
          return responseHandler.error(res, '讀取採購系統資料失敗', err);
        }

        console.log(`[Sync] 從採購系統讀取到 ${procUsers ? procUsers.length : 0} 名人員`);

        let createdCount = 0;
        let mergedCount = 0;

        if (!pcUsers || pcUsers.length === 0) {
          return responseHandler.success(res, { created: 0 }, '零用金系統無資料可供同步');
        }

        for (let pcUser of pcUsers) {
          // 嘗試在採購系統中尋找匹配的帳號 (username)
          const matchedProc = procUsers.find(u => u.username === pcUser.employee_id);

          const userData = {
            username: pcUser.employee_id,
            password: pcUser.password,
            real_name: pcUser.name,
            dept_code: matchedProc ? matchedProc.dept_code : 'N/A',
            dept_name: matchedProc ? matchedProc.dept_name : 'N/A',
            role: pcUser.role === 'admin' ? 'admin' : (matchedProc ? matchedProc.role : 'user'),
            module_permissions: JSON.stringify({
              petty_cash: true,
              procurement: !!matchedProc,
              wms: false
            })
          };

          await new Promise((resolve) => {
            dbs.nexus.run(
              `INSERT OR IGNORE INTO users (username, password, real_name, dept_code, dept_name, role, module_permissions) 
               VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [userData.username, userData.password, userData.real_name, userData.dept_code, userData.dept_name, userData.role, userData.module_permissions],
              function (err) {
                if (err) console.error(`[Sync] 同步用戶 ${userData.username} 失敗:`, err.message);
                if (this && this.changes > 0) {
                  createdCount++;
                  if (matchedProc) mergedCount++;
                }
                resolve();
              }
            );
          });
        }

        console.log(`[Sync] 同步完成。新增: ${createdCount}, 整合採購資訊: ${mergedCount}`);
        responseHandler.success(res, {
          created: createdCount,
          mergedWithProcurement: mergedCount
        }, '帳號中心初始化同步完成');
      });
    });
  } catch (err) {
    console.error('[Sync] 非預期錯誤:', err);
    responseHandler.error(res, '系統同步發生非預期錯誤', err);
  }
});

// --- WMS 數據介面 ---
// 1. 獲取全域庫存 (串接產品定義以顯示單位換算)
app.get('/api/wms/inventory', (req, res) => {
  const query = `
        SELECT i.*, p.spec, p.base_unit, p.alt_unit 
        FROM wms_inventory i
        LEFT JOIN wms_products p ON i.product_name = p.product_name
        ORDER BY i.receive_date DESC
    `;
  dbs.nexus.all(query, [], (err, rows) => {
    if (err) return responseHandler.error(res, '讀取庫存失敗: ' + err.message);
    responseHandler.success(res, rows, '庫存數據讀取成功');
  });
});

// 2. 獲取異動日誌 (展示最近 50 筆)
app.get('/api/wms/audit-logs', (req, res) => {
  dbs.nexus.all('SELECT * FROM wms_audit_log ORDER BY timestamp DESC LIMIT 50', [], (err, rows) => {
    if (err) return responseHandler.error(res, '讀取日誌失敗: ' + err.message);
    responseHandler.success(res, rows, '異動日誌讀取成功');
  });
});

// 3. 獲取 QC 代碼定義
app.get('/api/wms/qc-status', (req, res) => {
  dbs.nexus.all('SELECT * FROM wms_qc_status WHERE is_active = 1', [], (err, rows) => {
    if (err) return responseHandler.error(res, '讀取 QC 狀態失敗: ' + err.message);
    responseHandler.success(res, rows, 'QC 狀態讀取成功');
  });
});

// --- 跨系統同步邏輯 ---
// 1. 採購單 (PO) 核准後自動同步至 WMS 預期入庫
app.post('/api/sync/po-to-wms', async (req, res) => {
  const { po_id, operator } = req.body;
  console.log(`[Sync] 接收到 PO 同步請求: ID ${po_id}`);

  try {
    // 使用封裝好的 ProcurementService 進行處理 (符合原子性與接口合約)
    const result = await ProcurementService.approveAndSyncPO(po_id, operator);
    responseHandler.success(res, result, `成功核准採購單並同步 ${result.syncedCount} 筆入庫紀錄`);
  } catch (err) {
    console.error('[Sync] 同步失敗:', err.message);
    responseHandler.error(res, '同步處理失敗: ' + err.message, err);
  }
});

// --- 全域數據戰情室 (Dashboard Stats) ---
// 1. 獲取全域聚合數據 (WMS + Petty Cash + Procurement)
app.get('/api/stats/aggregate', async (req, res) => {
  console.log('[Stats] 開始獲取全域聚合數據...');
  try {
    const stats = {
      wms: { inventory: 0, expected: 0 },
      petty_cash: { total_balance: 0 },
      procurement: { pending_prs: 0, total_pos: 0 }
    };

    // 1. WMS 統計 (直接從 Nexus DB 讀取)
    const wmsStats = await new Promise((resolve) => {
      dbs.nexus.all('SELECT status, COUNT(*) as count FROM wms_inventory GROUP BY status', [], (err, rows) => {
        if (err) return resolve({ inventory: 0, expected: 0 });
        let inv = 0, exp = 0;
        rows.forEach(r => {
          if (r.status === 'EXPECTED') exp += r.count;
          else inv += r.count;
        });
        resolve({ inventory: inv, expected: exp });
      });
    });
    stats.wms = wmsStats;

    // 2. 零用金統計 (從 Petty Cash DB 讀取)
    const pcStats = await new Promise((resolve) => {
      dbs.petty_cash.get('SELECT SUM(incoming) - SUM(outgoing) as balance FROM expenses', [], (err, row) => {
        if (err) return resolve({ balance: 0 });
        resolve({ balance: row ? (row.balance || 0) : 0 });
      });
    });
    stats.petty_cash.total_balance = pcStats.balance;

    // 3. 採購統計 (從 Procurement DB 讀取)
    const procStats = await new Promise((resolve) => {
      dbs.procurement.get(`
                SELECT 
                    (SELECT COUNT(*) FROM purchase_requests WHERE status LIKE '%pending%') as pending,
                    (SELECT COUNT(*) FROM purchase_orders) as pos
            `, [], (err, row) => {
        if (err) return resolve({ pending: 0, pos: 0 });
        resolve({ pending: row ? row.pending : 0, pos: row ? row.pos : 0 });
      });
    });
    stats.procurement.pending_prs = procStats.pending;
    stats.procurement.total_pos = procStats.pos;

    responseHandler.success(res, stats, '全域數據獲取成功');
  } catch (err) {
    console.error('[Stats] 獲取失敗:', err);
    responseHandler.error(res, '數據獲取發生非預期錯誤', err);
  }
});

// --- 全域權限管理 ---
// 1. 獲取所有使用者及其權限
app.get('/api/users', (req, res) => {
  console.log('[Route] GET /api/users triggered');
  dbs.nexus.all('SELECT id, username, real_name, dept_name, role, module_permissions, status FROM users', [], (err, rows) => {
    if (err) {
      console.error('[Route] 讀取使用者失敗:', err.message);
      return responseHandler.error(res, '讀取使用者失敗: ' + err.message);
    }
    // 解析 JSON 權限字串
    const users = rows.map(u => ({
      ...u,
      module_permissions: JSON.parse(u.module_permissions || '{}')
    }));
    console.log(`[Route] 成功讀取 ${users.length} 名使用者`);
    responseHandler.success(res, users, '使用者清單讀取成功');
  });
});

// 2. 更新特定使用者的模組權限
app.post('/api/users/:id/permissions', (req, res) => {
  const { id } = req.params;
  const { module_permissions } = req.body;

  dbs.nexus.run(
    'UPDATE users SET module_permissions = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [JSON.stringify(module_permissions), id],
    function (err) {
      if (err) return responseHandler.error(res, '更新權限失敗: ' + err.message);
      responseHandler.success(res, null, '權限更新成功');
    }
  );
});

// --- 全域組織架構 (Global Hierarchy) ---
// 1. 獲取統一部門架構
app.get('/api/departments', (req, res) => {
  dbs.nexus.all('SELECT * FROM departments ORDER BY parent_id ASC, dept_code ASC', [], (err, rows) => {
    if (err) return responseHandler.error(res, '讀取組織架構失敗: ' + err.message);
    responseHandler.success(res, rows, '組織架構讀取成功');
  });
});

// 2. 手動觸發組織架構同步 (從採購系統拉取)
app.post('/api/sync/hierarchy', (req, res) => {
  const { exec } = require('child_process');
  const scriptPath = path.join(__dirname, 'scripts', 'sync_hierarchy.js');

  exec(`node "${scriptPath}"`, (error, stdout, stderr) => {
    if (error) {
      console.error(`[Sync] 同步腳本執行失敗: ${error.message}`);
      return responseHandler.error(res, '同步執行失敗: ' + error.message);
    }
    console.log(`[Sync] 同步腳本輸出: ${stdout}`);
    responseHandler.success(res, null, '組織架構同步完成');
  });
});
app.put('/api/users/:username/permissions', (req, res) => {
  const { username } = req.params;
  const { permissions } = req.body; // 預期格式: { petty_cash: true, procurement: false, wms: true }

  const permString = JSON.stringify(permissions);

  dbs.nexus.run(
    'UPDATE users SET module_permissions = ?, updated_at = CURRENT_TIMESTAMP WHERE username = ?',
    [permString, username],
    function (err) {
      if (err) return responseHandler.error(res, '更新權限失敗: ' + err.message);
      if (this.changes === 0) return responseHandler.error(res, '找不到該使用者', 404);
      responseHandler.success(res, null, `使用者 ${username} 權限更新成功`);
    }
  );
});

// 啟動伺服器
app.listen(config.port, () => {
  console.log(`Nexus Gateway 運行在 http://localhost:${config.port}`);
});
