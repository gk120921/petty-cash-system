// ============================================================
// 庫存監控模組 — 支援進階搜尋、多選倉庫類別與匯出功能
// ============================================================

import React, { useState, useMemo } from 'react';
import { InventoryDB, LocationDB, QCStatusDB } from '../db';
import type { InventoryWithRemaining, InboundCategory, WarehouseCategory } from '../types';
import { Search, Filter, Printer, Trash2, Box, Home, Factory, Shield, Download, CheckSquare, Square, Info, ShieldCheck, AlertCircle, Clock } from 'lucide-react';
import ProductCard from './ProductCard';

const WH_CATEGORIES: { id: WarehouseCategory; label: string; icon: any; color: string }[] = [
  { id: 'NORMAL',  label: '一般倉庫',      icon: Home,    color: 'var(--info)' },
  { id: 'PROCESS', label: '製程倉庫',      icon: Factory, color: 'var(--accent)' },
  { id: 'SUB',     label: '委外倉庫',      icon: Shield,  color: 'var(--warning)' },
];

export default function InventoryModule({ lang = 'ZH' }: { lang?: 'ZH' | 'EN' }) {
  const [tick, setTick] = useState(0);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState<InboundCategory | 'ALL'>('ALL');
  const [whFilters, setWhFilters] = useState<string[]>([]); 
  const [printItem, setPrintItem] = useState<InventoryWithRemaining | null>(null);
  const [qcItem, setQcItem] = useState<InventoryWithRemaining | null>(null);
  const [qcForm, setQcForm] = useState({ status: 'OK', remark: '' });

  const inventory = useMemo(() => InventoryDB.getWithRemaining(), [tick]);
  const locations = useMemo(() => LocationDB.getAll(), []);
  const qcStatuses = useMemo(() => QCStatusDB.getAll(), [tick]);

  // 取得所有唯一的倉庫代碼及其資訊
  const uniqueWarehouses = useMemo(() => {
    const map = new Map<string, { code: string; category: WarehouseCategory; description: string }>();
    
    // 從儲位設定中取得
    locations.forEach(loc => {
      if (!map.has(loc.warehouseCode)) {
        map.set(loc.warehouseCode, {
          code: loc.warehouseCode,
          category: loc.warehouseCategory,
          description: loc.description
        });
      }
    });

    // 額外檢查庫存中是否有不在儲位清單中的代碼 (預防性)
    inventory.forEach(item => {
      if (!map.has(item.warehouseCode)) {
        map.set(item.warehouseCode, {
          code: item.warehouseCode,
          category: 'NORMAL', // 預設歸類
          description: '未定義倉庫'
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => a.code.localeCompare(b.code));
  }, [locations, inventory]);

  // 初始化時預設全選所有代碼 (只在第一次載入或資料改變且篩選為空時執行)
  React.useEffect(() => {
    if (uniqueWarehouses.length > 0 && whFilters.length === 0) {
      setWhFilters(uniqueWarehouses.map(w => w.code));
    }
  }, [uniqueWarehouses]);

  // 核心過濾邏輯
  const filtered = useMemo(() => {
    return inventory.filter(item => {
      // 1. 關鍵字搜尋
      const matchSearch = !search.trim() || 
        item.productName.toLowerCase().includes(search.toLowerCase()) ||
        item.caseNo.toLowerCase().includes(search.toLowerCase()) ||
        item.orderNo.toLowerCase().includes(search.toLowerCase()) ||
        item.batchNo.toLowerCase().includes(search.toLowerCase());
      
      // 2. 入庫類別篩選 (RAW/SEMI/FINISHED)
      const matchCat = catFilter === 'ALL' || item.category === catFilter;

      // 3. 具體倉庫代碼篩選 (多選)
      const matchWh = whFilters.includes(item.warehouseCode);

      return matchSearch && matchCat && matchWh;
    });
  }, [inventory, search, catFilter, whFilters]);

  // 統計數據計算
  const stats = useMemo(() => {
    const totalItems = filtered.length;
    const totalsByUnit: Record<string, number> = {};
    
    filtered.forEach(item => {
      totalsByUnit[item.unit] = (totalsByUnit[item.unit] || 0) + item.remainingQty;
    });

    return { totalItems, totalsByUnit };
  }, [filtered]);

  const toggleWhFilter = (code: string) => {
    setWhFilters(prev => 
      prev.includes(code) ? prev.filter(f => f !== code) : [...prev, code]
    );
  };

  const selectAllWh = () => setWhFilters(uniqueWarehouses.map(w => w.code));
  const clearAllWh = () => setWhFilters([]);

  const selectByCategory = (category: WarehouseCategory) => {
    const codes = uniqueWarehouses.filter(w => w.category === category).map(w => w.code);
    setWhFilters(prev => {
      const otherCodes = prev.filter(p => !uniqueWarehouses.find(u => u.code === p && u.category === category));
      // 如果該分類已經全選了，則切換為取消選取該分類；否則全選該分類
      const isCategoryAllSelected = codes.every(c => prev.includes(c));
      return isCategoryAllSelected ? otherCodes : [...new Set([...otherCodes, ...codes])];
    });
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('確定要刪除此筆庫存記錄嗎？此操作不可逆。')) return;
    try {
      InventoryDB.delete(id);
      setTick(t => t + 1);
    } catch (e: any) { alert(e.message); }
  };
  const handleQCSubmit = () => {
    if (!qcItem) return;
    try {
      InventoryDB.updateQCStatus(qcItem.batchId, qcForm.status, qcForm.remark, 'System Admin');
      setQcItem(null);
      setTick(t => t + 1);
    } catch (e: any) { alert(e.message); }
  };

  const exportToCSV = () => {
    if (filtered.length === 0) {
      alert('目前沒有資料可供匯出');
      return;
    }

    const headers = ['箱號 (Case No)', '類別 (Cat)', '單號 (Order)', '儲位 (Loc)', '產品名稱 (Product)', '批號 (Batch)', '入庫量 (In)', '剩餘量 (Rem)', '單位 (Unit)', '狀態 (Status)'];
    const rows = filtered.map(item => [
      item.caseNo,
      item.category,
      item.orderNo,
      `${item.warehouseCode}-${item.shelfLocation}`,
      item.productName,
      item.batchNo,
      item.quantity,
      item.remainingQty,
      item.unit,
      item.status === 'ACTIVE' ? '可領用' : item.status === 'PARTIAL' ? '部分領用' : '已領完'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Inventory_Report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fade-in">
      <div className="page-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h2>即時庫存監控 Inventory Monitoring</h2>
          <p>即時監控所有批次剩餘量，支援具體倉庫別與多維度篩選</p>
        </div>
        <button className="btn btn-primary" onClick={exportToCSV} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Download size={16} /> 匯出清單明細 (Export CSV)
        </button>
      </div>

      {/* 篩選控制區 */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="form-grid">
          <div className="form-group">
            <label>快速篩選 <span className="label-sub">Search Product / Case / Order</span></label>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--color-primary-400)' }} />
              <input 
                style={{ paddingLeft: '40px' }}
                placeholder="輸入品名、箱號或單號..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="form-group">
            <label>入庫類別 <span className="label-sub">Category Filter</span></label>
            <select value={catFilter} onChange={e => setCatFilter(e.target.value as any)}>
              <option value="ALL">全部類別 (All)</option>
              <option value="RAW">原料 (RAW)</option>
              <option value="SEMI">半成品 (SEMI)</option>
              <option value="FINISHED">成品 (FINISHED)</option>
            </select>
          </div>
        </div>

        {/* 具體倉庫代碼勾選區 */}
        <div style={{ marginTop: '1.25rem', borderTop: '1px solid var(--color-primary-100)', paddingTop: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-primary-500)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Filter size={14} /> 詳細倉庫別篩選 Detailed Warehouse Filter
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={selectAllWh} className="btn-text" style={{ fontSize: '0.75rem' }}>
                <CheckSquare size={14} /> 全部選取
              </button>
              <button onClick={clearAllWh} className="btn-text" style={{ fontSize: '0.75rem', color: 'var(--danger)' }}>
                <Square size={14} /> 全部清空
              </button>
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {WH_CATEGORIES.map(cat => {
              const Icon = cat.icon;
              const warehousesInCat = uniqueWarehouses.filter(w => w.category === cat.id);
              if (warehousesInCat.length === 0) return null;

              return (
                <div key={cat.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', background: 'var(--color-primary-50)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
                  <button 
                    onClick={() => selectByCategory(cat.id)}
                    className="btn-text" 
                    style={{ minWidth: '120px', justifyContent: 'flex-start', color: cat.color }}
                  >
                    <Icon size={16} /> {cat.label}
                  </button>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', flex: 1 }}>
                    {warehousesInCat.map(wh => {
                      const isActive = whFilters.includes(wh.code);
                      return (
                        <button
                          key={wh.code}
                          onClick={() => toggleWhFilter(wh.code)}
                          className={`btn ${isActive ? 'btn-primary' : 'btn-ghost'}`}
                          style={{ 
                            padding: '0.35rem 0.75rem', 
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            minWidth: '80px',
                            border: isActive ? 'none' : '1px solid var(--color-primary-200)',
                            background: isActive ? cat.color : '#fff'
                          }}
                          title={wh.description}
                        >
                          {wh.code}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 統計資訊欄位 */}
      <div className="card" style={{ marginBottom: '1.5rem', background: 'var(--color-primary-50)', border: '1px solid var(--color-primary-200)' }}>
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Info size={18} style={{ color: 'var(--color-primary-500)' }} />
            <span style={{ fontWeight: 600 }}>篩選統計 Summary:</span>
          </div>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <div className="stat-item">
              <span className="label-sub">總箱數 Count:</span> 
              <span style={{ fontSize: '1.1rem', fontWeight: 700, marginLeft: '0.5rem' }}>{stats.totalItems}</span>
            </div>
            {Object.entries(stats.totalsByUnit).map(([unit, total]) => (
              <div key={unit} className="stat-item" style={{ borderLeft: '1px solid var(--color-primary-200)', paddingLeft: '1.5rem' }}>
                <span className="label-sub">總{unit === 'kg' ? '重量' : '數量'} Total {unit.toUpperCase()}:</span> 
                <span style={{ fontSize: '1.1rem', fontWeight: 700, marginLeft: '0.5rem', color: 'var(--color-primary-700)' }}>
                  {total.toLocaleString()} {unit}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 庫存列表 */}
      <div className="card">
        <div className="table-wrap">
          <table className="inventory-table">
            <thead>
              <tr>
                <th>箱號 CASE NO.</th>
                <th>類別 CAT.</th>
                <th>單號 ORDER</th>
                <th>儲位 LOC.</th>
                <th>產品名稱 PRODUCT</th>
                <th>批號 BATCH</th>
                <th>入庫量 IN</th>
                <th>剩餘量 REM.</th>
                <th>品質 QC</th>
                <th>狀態 STATUS</th>
                <th>操作 OPS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => (
                <tr key={item.batchId}>
                  <td className="td-mono" style={{ fontSize: '0.8rem' }}>{item.caseNo}</td>
                  <td><span className={`badge-status ${item.category === 'RAW' ? 'badge-raw' : item.category === 'SEMI' ? 'badge-semi' : 'badge-finished'}`}>{item.category}</span></td>
                  <td className="td-mono">{item.orderNo}</td>
                  <td>
                    <div className="td-bold">{item.warehouseCode}-{item.shelfLocation}</div>
                      {locations.find(l => l.warehouseCode === item.warehouseCode && l.shelfLocation === item.shelfLocation)?.description || '---'}
                  </td>
                  <td className="td-bold">{item.productName}</td>
                  <td className="td-mono">{item.batchNo}</td>
                  <td>{item.quantity} {item.unit}</td>
                  <td className={`td-bold ${item.remainingQty > 0 ? 'text-success' : 'text-muted'}`}>{item.remainingQty.toLocaleString(undefined, { maximumFractionDigits: 6 })}</td>
                  <td>
                    <div 
                      onClick={() => { setQcItem(item); setQcForm({ status: item.qcStatus || 'A', remark: item.qcRemark || '' }); }}
                      style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                      title="點擊變更品質狀態"
                    >
                      <span className="badge-status" style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '4px',
                        background: qcStatuses.find(s => s.code === (item.qcStatus || 'A'))?.color + '22',
                        color: qcStatuses.find(s => s.code === (item.qcStatus || 'A'))?.color,
                        borderColor: qcStatuses.find(s => s.code === (item.qcStatus || 'A'))?.color
                      }}>
                        {['C', 'P'].includes(item.qcStatus || '') && <AlertCircle size={12} />}
                        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1, textAlign: 'left' }}>
                          {lang === 'ZH' ? (
                            <>
                              <div style={{ fontSize: '0.75rem', fontWeight: 700 }}>{qcStatuses.find(s => s.code === (item.qcStatus || 'A'))?.name || item.qcStatus}</div>
                              <div style={{ fontSize: '0.6rem', opacity: 0.8 }}>{qcStatuses.find(s => s.code === (item.qcStatus || 'A'))?.nameEn}</div>
                            </>
                          ) : (
                            <>
                              <div style={{ fontSize: '0.75rem', fontWeight: 700 }}>{qcStatuses.find(s => s.code === (item.qcStatus || 'A'))?.nameEn || item.qcStatus}</div>
                              <div style={{ fontSize: '0.6rem', opacity: 0.8 }}>{qcStatuses.find(s => s.code === (item.qcStatus || 'A'))?.name}</div>
                            </>
                          )}
                        </div>
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className={`badge-status ${
                      item.status === 'ACTIVE' ? 'badge-active' : 
                      item.status === 'PARTIAL' ? 'badge-partial' : 'badge-depleted'
                    }`}>
                      {item.status === 'ACTIVE' ? '可領用' : item.status === 'PARTIAL' ? '部分領用' : '已領完'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button className="btn-icon" onClick={() => setPrintItem(item)} title="列印標示卡"><Printer size={15} /></button>
                      <button className="btn-icon danger" onClick={() => handleDelete(item.batchId)} title="刪除"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    查無符合條件的庫存資料
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {printItem && <ProductCard items={[printItem]} onClose={() => setPrintItem(null)} />}

      {/* 品質狀態變更彈窗 */}
      {qcItem && (
        <div className="modal-overlay">
          <div className="modal-content card" style={{ maxWidth: '450px' }}>
            <div className="card-header">
              <ShieldCheck size={18} color="var(--accent)" />
              <h3>品質狀態判定 QC Status Determination</h3>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <div style={{ marginBottom: '1rem', padding: '0.75rem', background: 'var(--color-primary-50)', borderRadius: '8px', fontSize: '0.85rem' }}>
                <div className="td-bold">{qcItem.productName}</div>
                <div className="td-mono" style={{ opacity: 0.7 }}>箱號: {qcItem.caseNo}</div>
              </div>
              
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label>品質判定結果 <span className="label-sub">QC Status</span></label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '0.5rem', marginTop: '0.5rem' }}>
                  {qcStatuses.map(s => (
                    <button 
                      key={s.code}
                      className={`btn ${qcForm.status === s.code ? 'btn-primary' : 'btn-ghost'}`}
                      style={{ 
                        padding: '0.5rem', 
                        fontSize: '0.8rem',
                        background: qcForm.status === s.code ? s.color : '#fff',
                        borderColor: s.color,
                        color: qcForm.status === s.code ? '#fff' : s.color
                      }}
                      onClick={() => setQcForm(f => ({ ...f, status: s.code }))}
                    >
                      {s.name} ({s.code})
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>判別原因 / 備註 <span className="label-sub">Remarks / Reason</span></label>
                <textarea 
                  rows={3}
                  value={qcForm.remark}
                  onChange={e => setQcForm(f => ({ ...f, remark: e.target.value }))}
                  placeholder="請輸入判定原因 (如：尺寸超差、外觀刮傷...)"
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-primary-200)', marginTop: '0.5rem' }}
                />
              </div>
            </div>
            <div className="card-footer" style={{ textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button className="btn btn-ghost" onClick={() => setQcItem(null)}>取消</button>
              <button className="btn btn-primary" onClick={handleQCSubmit}>確認變更</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .text-success { color: var(--success); }
        .text-muted { color: var(--text-muted); opacity: 0.5; }
      `}</style>
    </div>
  );
}
