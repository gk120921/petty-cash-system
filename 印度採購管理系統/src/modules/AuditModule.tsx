// ============================================================
// 異動日誌模組 — 查看歷史紀錄與執行「退回上一階」
// ============================================================

import { useState, useMemo } from 'react';
import { AuditDB, InventoryDB } from '../db';
import type { AuditLog } from '../types';
import { Search, RotateCcw, User, Tag } from 'lucide-react';

export default function AuditModule() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [tick, setTick] = useState(0);

  const logs = useMemo(() => AuditDB.getAll(), [tick]);
  const inventory = useMemo(() => InventoryDB.getAll(), [tick]);

  // 輔助函式：針對舊資料（無 productName 欄位）進行追溯
  const resolveProductName = (log: AuditLog) => {
    if (log.productName) return log.productName;
    const match = inventory.find(i => i.batchId === log.batchId);
    return match ? match.productName : '---';
  };

  const filtered = useMemo(() => {
    return logs.filter(log => {
      const pName = resolveProductName(log);
      const matchSearch = !search.trim() || 
        pName.toLowerCase().includes(search.toLowerCase()) ||
        log.orderNo.toLowerCase().includes(search.toLowerCase()) ||
        log.operator.toLowerCase().includes(search.toLowerCase()) ||
        log.remark.toLowerCase().includes(search.toLowerCase());
      
      const matchType = typeFilter === 'ALL' || log.transactionType === typeFilter;
      return matchSearch && matchType;
    });
  }, [logs, inventory, search, typeFilter]);

  const activeProduct = useMemo(() => {
    if (!search.trim()) return null;
    const uniqueProds = [...new Set(filtered.map(l => resolveProductName(l)))];
    return uniqueProds.length === 1 ? uniqueProds[0] : null;
  }, [filtered, search]);

  const handleRollback = (log: AuditLog) => {
    if (!window.confirm(`確定要退回此筆異動嗎？\n單號: ${log.orderNo}\n異動量: ${log.qtyChanged}`)) return;
    try {
      const msg = AuditDB.rollback(log.logId, 'System Admin');
      alert(msg);
      setTick(t => t + 1);
    } catch (e: any) {
      alert('退回失敗: ' + e.message);
    }
  };

  return (
    <div className="fade-in">
      <div className="page-section-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div>
            <h2>異動記錄查詢 Audit Log</h2>
            <p>系統所有庫存異動的完整記錄，支援操作退回與單號追溯</p>
          </div>
          {activeProduct && (
            <div style={{ 
              background: 'var(--color-primary-900)', 
              color: '#fff', 
              padding: '10px 20px', 
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-lg)',
              animation: 'slideInRight 0.5s ease-out'
            }}>
              <div style={{ fontSize: '0.7rem', opacity: 0.7, textTransform: 'uppercase' }}>正在查看料號 Viewing Part No.</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{activeProduct}</div>
            </div>
          )}
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="form-grid">
          <div className="form-group">
            <label>關鍵字搜尋 <span className="label-sub">Search by Order / Operator / Remark</span></label>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--color-primary-400)' }} />
              <input 
                style={{ paddingLeft: '40px' }}
                placeholder="搜尋單號、人員或備註..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="form-group">
            <label>異動類型 <span className="label-sub">Filter by Type</span></label>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
              <option value="ALL">全部類型 (All)</option>
              <option value="INBOUND">入庫 IN</option>
              <option value="OUTBOUND_PROCESS">製程出庫</option>
              <option value="OUTBOUND_OUTSOURCE">委外出庫</option>
              <option value="ROLLBACK">操作退回</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <History size={18} color="var(--info)" />
          <h3>歷史異動清單</h3>
          <span style={{ marginLeft: 'auto', fontSize: '0.85rem', opacity: 0.6 }}>共 {filtered.length} 筆記錄</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>時間 TIMESTAMP</th>
                <th>類型 TYPE</th>
                <th>料號 PRODUCT</th>
                <th>單號 ORDER NO.</th>
                <th>異動前 QTY BEFORE</th>
                <th>異動量 CHANGE</th>
                <th>異動後 QTY AFTER</th>
                <th>操作者 OPERATOR</th>
                <th>備註 REMARK</th>
                <th>操作 OPS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(log => (
                <tr key={log.logId}>
                  <td style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td>
                    <span className={`badge-status ${
                      log.transactionType.includes('INBOUND') ? 'badge-active' : 
                      log.transactionType === 'ROLLBACK' ? 'badge-partial' : 'badge-raw'
                    }`}>
                      {log.transactionType === 'INBOUND' ? '入庫 IN' : 
                       log.transactionType === 'OUTBOUND_PROCESS' ? '製程出庫' : 
                       log.transactionType === 'OUTBOUND_OUTSOURCE' ? '委外出庫' : 
                       log.transactionType === 'ROLLBACK' ? '操作退回' : log.transactionType}
                    </span>
                  </td>
                  <td className="td-bold">{resolveProductName(log)}</td>
                  <td className="td-mono">{log.orderNo}</td>
                  <td>{log.qtyBefore.toLocaleString(undefined, { maximumFractionDigits: 6 })}</td>
                  <td className="td-bold" style={{ color: log.qtyChanged > 0 ? 'var(--success)' : 'var(--error)' }}>
                    {log.qtyChanged > 0 
                      ? `+${log.qtyChanged.toLocaleString(undefined, { maximumFractionDigits: 6 })}` 
                      : log.qtyChanged.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                  </td>
                  <td className="td-bold">{log.qtyAfter.toLocaleString(undefined, { maximumFractionDigits: 6 })}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}>
                      <User size={12} /> {log.operator}
                    </div>
                  </td>
                  <td style={{ fontSize: '0.85rem', maxWidth: '200px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Tag size={12} /> {log.remark}
                    </div>
                  </td>
                  <td>
                    {log.transactionType !== 'ROLLBACK' && (
                      <button 
                        className="btn btn-ghost btn-sm" 
                        style={{ color: 'var(--error)', border: '1px solid var(--error-bg)' }}
                        onClick={() => handleRollback(log)}
                        title="退回上一階"
                      >
                        <RotateCcw size={14} style={{ marginRight: '4px' }} /> 退回
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// 修正 lucide-react 的 History 圖示名稱
import { History } from 'lucide-react';
