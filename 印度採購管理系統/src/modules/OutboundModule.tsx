// ============================================================
// 製程/委外出庫模組 v2.2 — 支援料號顯示切換與 FIFO 強化
// ============================================================

import { useState, useMemo } from 'react';
import { InventoryDB, IssueDB, ProductDB, LocationDB, QCStatusDB } from '../db';
import type { InventoryWithRemaining } from '../types';
import { Search, ArrowRight, Layers, Eye, EyeOff } from 'lucide-react';

export default function OutboundModule() {
  const [search, setSearch] = useState('');
  const [orderNo, setOrderNo] = useState('');
  const [targetProduct, setTargetProduct] = useState('');
  const [targetLocation, setTargetLocation] = useState('');
  const [customer, setCustomer] = useState(''); // 新增：客代
  const [showProductName, setShowProductName] = useState(false); // 控制料號顯示
  const [issueQtys, setIssueQtys] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const allInventory = useMemo(() => InventoryDB.getWithRemaining(), [success]);
  const products = useMemo(() => ProductDB.getAll(), []);
  const qcStatuses = useMemo(() => QCStatusDB.getAll(), []);
  
  const processLocations = useMemo(() => 
    LocationDB.getAll().filter(l => l.warehouseCategory === 'PROCESS' && l.isActive), 
  []);

  const filtered = useMemo(() => {
    if (!search.trim()) return [];
    return allInventory
      .filter(i => 
        (i.category === 'RAW' || i.category === 'SEMI') && 
        (i.productName.toLowerCase().includes(search.toLowerCase()) || 
         i.batchNo.toLowerCase().includes(search.toLowerCase())) &&
        i.status !== 'DEPLETED'
      )
      .sort((a, b) => new Date(a.receiveDate).getTime() - new Date(b.receiveDate).getTime());
  }, [allInventory, search]);

  const totalRemaining = filtered.reduce((sum, i) => sum + i.remainingQty, 0);

  const prodInfo = useMemo(() => {
    if (!targetProduct) return null;
    return products.find(p => p.productName === targetProduct);
  }, [targetProduct, products]);

  const currentTotalIssuePotential = useMemo(() => {
    if (!prodInfo) return 0;
    return filtered.reduce((sum, item) => {
      const qty = parseFloat(issueQtys[item.batchId] || '0');
      return sum + (qty / prodInfo.conversionRate);
    }, 0);
  }, [filtered, issueQtys, prodInfo]);

  const handleIssue = (item: InventoryWithRemaining) => {
    setError(''); setSuccess('');
    try {
      const qty = parseFloat(issueQtys[item.batchId] || '0');
      if (qty <= 0) throw new Error('請輸入領用量');
      if (!orderNo.trim()) throw new Error('請輸入出庫單號');
      if (!targetLocation) throw new Error('請選擇目標製程倉儲位');

      IssueDB.create({
        batchId: item.batchId,
        orderNo: orderNo.trim().toUpperCase(),
        usageQty: qty,
        unit: item.unit,
        operator: 'System Admin',
        remark: `移往製程儲位: ${targetLocation}`,
      });

      const parts = targetLocation.split('-');
      const wh = parts[0];
      const shelf = parts.slice(1).join('-');

      InventoryDB.create({
        category: item.category,
        orderNo: orderNo.trim().toUpperCase(),
        warehouseCode: wh,
        shelfLocation: shelf,
        productName: item.productName,
        batchNo: item.batchNo,
        receiveDate: new Date().toISOString().split('T')[0],
        quantity: qty,
        unit: item.unit,
        conversionRate: item.conversionRate,
        operator: 'System Admin',
        customRemark: `撥補入庫: 來自 ${item.caseNo}`,
      });

      setSuccess(`✓ 成功將 ${qty} ${item.unit} 移往 ${targetLocation}`);
      setIssueQtys(prev => ({ ...prev, [item.batchId]: '0' }));
      setTimeout(() => { window.dispatchEvent(new Event('storage')); }, 100);
    } catch (e: any) { setError(e.message); }
  };

  return (
    <div className="fade-in">
      <div className="page-section-header">
        <div>
          <h2>製程/委外出庫 Process / Outsource Outbound</h2>
          <p>搜尋原料並設定目標半成品與製程倉位。支援即時生產量試算。</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
          <label>產品名稱搜尋 <span className="label-sub">Search Product</span></label>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--color-primary-400)' }} />
            <input 
              style={{ paddingLeft: '40px' }}
              placeholder="輸入原料名稱 (如: 銅板)"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label>出庫單號 <span className="label-sub">B=托工, C=製程</span></label>
            <input value={orderNo} onChange={e => setOrderNo(e.target.value.toUpperCase())} placeholder="e.g. B20250505001" />
          </div>
          <div className="form-group">
            <label>預計生產半成品料號 <span className="label-sub">Simulation Target</span></label>
            <input list="bom-list" value={targetProduct} onChange={e => setTargetProduct(e.target.value)} placeholder="選擇料號..." />
            <datalist id="bom-list">
              {products.map(p => <option key={p.productId} value={p.productName}>{p.spec}</option>)}
            </datalist>
          </div>
          <div className="form-group">
            <label>目標製程倉儲位 <span className="label-sub">Target Process Location</span></label>
            <select value={targetLocation} onChange={e => setTargetLocation(e.target.value)}>
              <option value="">-- 請選擇製程儲位 --</option>
              {processLocations.map(l => (
                <option key={l.locationId} value={`${l.warehouseCode}-${l.shelfLocation}`}>
                  [{l.warehouseCode}] {l.description}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>客戶代碼 <span className="label-sub">Customer Code (e.g. T08AY)</span></label>
            <input 
              value={customer} 
              onChange={e => setCustomer(e.target.value.toUpperCase())} 
              placeholder="輸入客戶代碼以校驗權限..." 
            />
          </div>
        </div>

        {error && <div className="alert alert-error" style={{ marginTop: '1rem' }}>⚠ {error}</div>}
        {success && <div className="alert alert-success" style={{ marginTop: '1rem' }}>{success}</div>}
      </div>

      {/* 試算卡片... (略) */}
      {search && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
          <div className="card" style={{ padding: '1.25rem', background: 'var(--color-primary-900)', color: '#fff', border: 'none' }}>
            <div style={{ fontSize: '0.75rem', opacity: 0.8, marginBottom: '0.25rem' }}>「{search}」全倉剩餘總重</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900 }}>{totalRemaining.toLocaleString()} <span style={{ fontSize: '0.9rem' }}>KG</span></div>
          </div>
          <div className="card" style={{ padding: '1.25rem', background: 'var(--success)', color: '#fff', border: 'none' }}>
            <div style={{ fontSize: '0.75rem', opacity: 0.8, marginBottom: '0.25rem' }}>全倉總重預計可做</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900 }}>
              {prodInfo ? (totalRemaining / prodInfo.conversionRate).toLocaleString() : '0'} 
              <span style={{ fontSize: '0.9rem' }}> {prodInfo?.baseUnit.toUpperCase() || 'PCS'}</span>
            </div>
          </div>
          <div className="card" style={{ padding: '1.25rem', background: 'var(--accent)', color: '#fff', border: 'none' }}>
            <div style={{ fontSize: '0.75rem', opacity: 0.8, marginBottom: '0.25rem' }}>⭐ 本次領用預計產出</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900 }}>
              {currentTotalIssuePotential.toLocaleString()} 
              <span style={{ fontSize: '0.9rem' }}> {prodInfo?.baseUnit.toUpperCase() || 'PCS'}</span>
            </div>
          </div>
        </div>
      )}

      {/* FIFO 列表 */}
      {filtered.length > 0 && (
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Layers size={18} color="var(--warning)" />
              <h3>FIFO 批次清單</h3>
            </div>
            
            {/* 料號顯示切換按鈕 */}
            <button 
              className={`btn btn-sm ${showProductName ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setShowProductName(!showProductName)}
              style={{ padding: '4px 12px', fontSize: '0.75rem', borderRadius: '4px' }}
            >
              {showProductName ? <EyeOff size={14} style={{ marginRight: '4px' }} /> : <Eye size={14} style={{ marginRight: '4px' }} />}
              {showProductName ? '隱藏料號' : '顯示料號'}
            </button>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  {showProductName && <th>料號 PRODUCT</th>}
                  <th>箱號 / 儲位</th>
                  <th>批號</th>
                  <th>收料日期</th>
                  <th>剩餘重量</th>
                  <th style={{ color: 'var(--accent)' }}>最大產出</th>
                  <th style={{ width: '150px' }}>本次領用量 (KG)</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, idx) => {
                  const maxOut = prodInfo ? (item.remainingQty / prodInfo.conversionRate) : 0;
                  const qcStatus = qcStatuses.find(s => s.code === (item.qcStatus || 'A')); // 預設改為 A
                  
                  // 管制邏輯
                  let isBlocked = qcStatus ? !qcStatus.canOutbound : false;
                  let blockReason = isBlocked ? `品質管制禁出 (${qcStatus?.name || item.qcStatus})` : '';

                  if (!isBlocked && qcStatus) {
                    // 檢查限定客戶
                    if (qcStatus.restrictedCustomers) {
                      const allowed = qcStatus.restrictedCustomers.split(',').map(s => s.trim().toUpperCase());
                      if (!customer || !allowed.includes(customer)) {
                        isBlocked = true;
                        blockReason = `限出特定客戶: ${qcStatus.restrictedCustomers}`;
                      }
                    }
                    // 檢查禁出客戶
                    if (qcStatus.prohibitedCustomers) {
                      const banned = qcStatus.prohibitedCustomers.split(',').map(s => s.trim().toUpperCase());
                      if (customer && banned.includes(customer)) {
                        isBlocked = true;
                        blockReason = `禁出特定客戶: ${qcStatus.prohibitedCustomers}`;
                      }
                    }
                  }
                  
                  return (
                    <tr key={item.batchId} style={{ opacity: isBlocked ? 0.7 : 1, background: isBlocked ? 'var(--color-primary-50)' : 'transparent' }}>
                      <td>{idx === 0 ? '⭐' : idx + 1}</td>
                      {showProductName && <td className="td-bold">{item.productName}</td>}
                      <td>
                        <div className="td-mono" style={{ fontSize: '0.85rem' }}>{item.caseNo}</div>
                        <div className="td-muted" style={{ fontSize: '0.75rem' }}>儲位: {item.shelfLocation}</div>
                      </td>
                      <td className="td-mono">{item.batchNo}</td>
                      <td>{item.receiveDate}</td>
                      <td className="td-bold" style={{ color: 'var(--success)' }}>
                        {item.remainingQty} {item.unit.toLowerCase()}
                        {isBlocked && (
                          <div style={{ fontSize: '0.65rem', color: 'var(--error)', marginTop: '4px', fontWeight: 700 }}>
                            ⚠️ {blockReason}
                          </div>
                        )}
                      </td>
                      <td className="td-mono" style={{ color: 'var(--accent)', fontWeight: 600 }}>
                        {maxOut > 0 ? maxOut.toLocaleString() : '—'}
                      </td>
                      <td>
                        <input 
                          type="number" 
                          className="td-input"
                          value={issueQtys[item.batchId] || ''}
                          onChange={e => setIssueQtys(prev => ({ ...prev, [item.batchId]: e.target.value }))}
                          placeholder="0"
                        />
                        <div className="td-muted" style={{ fontSize: '0.65rem', textAlign: 'center' }}>
                          ({item.unit.toUpperCase()})
                        </div>
                      </td>
                      <td>
                        <button 
                          className={`btn btn-sm ${isBlocked ? 'btn-ghost' : 'btn-primary'}`} 
                          onClick={() => !isBlocked && handleIssue(item)}
                          disabled={isBlocked}
                          style={{ borderColor: isBlocked ? 'var(--error)' : undefined, color: isBlocked ? 'var(--error)' : undefined }}
                        >
                          {isBlocked ? '禁止出庫' : '確認領料'} <ArrowRight size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
