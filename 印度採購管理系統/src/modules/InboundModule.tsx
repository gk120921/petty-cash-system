// ============================================================
// v2.0 入庫模組 — 3 分頁 + 多箱號批次 + 個別箱重修改
// ============================================================

import React, { useState, useMemo, useEffect } from 'react';
import { InventoryDB, LocationDB, ProductDB } from '../db';
import type { InventoryBatch, InboundCategory, Unit } from '../types';
import { Package, Printer, Boxes, Sparkles } from 'lucide-react';
import ProductCard from './ProductCard';

const TABS: { id: InboundCategory; label: string; labelEn: string; prefix: string }[] = [
  { id: 'RAW',      label: '原料入庫',   labelEn: 'Raw Material',      prefix: 'A' },
  { id: 'SEMI',     label: '半成品入庫', labelEn: 'Semi-finished',     prefix: 'B' },
  { id: 'FINISHED', label: '成品入庫',   labelEn: 'Finished Product',  prefix: 'C' },
];

const OPERATORS = ['System Admin', 'Operator A', 'Operator B', 'Operator C'];

interface FormState {
  warehouseCode: string;
  shelfLocation: string;
  productName: string;
  orderNo: string;
  batchNo: string;
  receiveDate: string;
  quantity: string; // 預設單箱量
  unit: Unit;
  conversionRate: string;
  operator: string;
  boxCount: string;
}

const INITIAL: FormState = {
  warehouseCode: '',
  shelfLocation: '',
  productName: '',
  orderNo: '',
  batchNo: '',
  receiveDate: new Date().toISOString().split('T')[0],
  quantity: '',
  unit: 'pcs',
  conversionRate: '',
  operator: 'System Admin',
  boxCount: '1',
};

export default function InboundModule() {
  const [tab, setTab] = useState<InboundCategory>('RAW');
  const [form, setForm] = useState<FormState>({ ...INITIAL, unit: 'kg' });
  const [customQuantities, setCustomQuantities] = useState<string[]>(['']);
  const [error, setError] = useState('');
  const [printItems, setPrintItems] = useState<InventoryBatch[]>([]);
  const [recentItems, setRecentItems] = useState<InventoryBatch[]>([]);

  const locations = useMemo(() => LocationDB.getActive(), []);
  const bomProducts = useMemo(() => ProductDB.getAll(), []);
  
  const warehouseCodes = useMemo(() => [...new Set(locations.map(l => l.warehouseCode))], [locations]);


  // 新增：獲取待收料清單 (還在製程倉的生產批次)
  const pendingProduction = useMemo(() => {
    if (tab === 'RAW') return [];
    const allInv = InventoryDB.getWithRemaining();
    const processWhs = LocationDB.getAll().filter(l => l.warehouseCategory === 'PROCESS').map(l => l.warehouseCode);
    
    // 找出在製程倉且數量 > 0 的生產批次 (P開頭)
    return allInv.filter(i => 
      processWhs.includes(i.warehouseCode) && 
      i.remainingQty > 0 && 
      (i.batchNo.startsWith('P') || i.category === 'SEMI' || i.category === 'FINISHED')
    ).sort((a, b) => new Date(b.updatedAt || b.receiveDate).getTime() - new Date(a.updatedAt || a.receiveDate).getTime());
  }, [tab, recentItems]);

  // 當預設數量或箱數改變時，重新初始化個別箱重
  useEffect(() => {
    const count = Math.max(1, parseInt(form.boxCount) || 1);
    // 如果是原料入庫，不自動帶入頂部的預設數量，讓欄位保持空白待填
    if (tab === 'RAW') {
      setCustomQuantities(prev => {
        const next = [...prev];
        if (next.length === count) return next;
        if (next.length > count) return next.slice(0, count);
        return [...next, ...Array(count - next.length).fill('')];
      });
    } else {
      // 半成品/成品則維持同步預設值
      const newQuants = Array.from({ length: count }, () => form.quantity);
      setCustomQuantities(newQuants);
    }
  }, [form.quantity, form.boxCount, tab]);

  const handleProductNameChange = (val: string) => {
    set('productName', val);
    const match = bomProducts.find(p => p.productName === val);
    if (match) {
      setForm(f => ({
        ...f,
        productName: val,
        unit: match.altUnit,
        conversionRate: match.conversionRate.toString(),
      }));
    }
  };

  const handleCustomQtyChange = (index: number, val: string) => {
    const next = [...customQuantities];
    next[index] = val;
    setCustomQuantities(next);
  };

  // 一鍵填入待收紀錄
  const handleUsePending = (item: any) => {
    const productMatch = bomProducts.find(p => p.productName === item.productName);
    setForm(f => ({
      ...f,
      orderNo: item.orderNo,
      productName: item.productName,
      unit: item.unit,
      batchNo: item.batchNo,
      quantity: item.remainingQty.toString(),
      conversionRate: productMatch ? productMatch.conversionRate.toString() : f.conversionRate,
      boxCount: '1',
    }));
    setError('');
  };

  const set = (field: keyof FormState, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleOrderNoChange = (val: string) => {
    set('orderNo', val);
    if (!val.trim()) return;

    // 嘗試在庫存紀錄中搜尋同單號的資訊
    const allInv = InventoryDB.getAll();
    const match = allInv.find(i => i.orderNo === val.toUpperCase());

    if (match) {
      // 找到匹配單號，自動帶入相關資訊
      const productMatch = bomProducts.find(p => p.productName === match.productName);
      
      setForm(f => ({
        ...f,
        orderNo: val.toUpperCase(),
        productName: match.productName,
        unit: match.unit,
        batchNo: match.batchNo,
        warehouseCode: match.warehouseCode,
        shelfLocation: match.shelfLocation,
        conversionRate: productMatch ? productMatch.conversionRate.toString() : f.conversionRate,
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (!form.productName.trim()) throw new Error('請輸入產品名稱');
      if (!form.orderNo.trim()) throw new Error('請輸入單號');
      
      // 原料入庫時，批號自動帶入單號，其餘分頁則檢查必填
      const finalBatchNo = tab === 'RAW' ? form.orderNo.trim() : form.batchNo.trim();
      if (!finalBatchNo) throw new Error('請輸入批號');

      // 驗證個別數量
      const qties = customQuantities.map(q => parseFloat(q));
      if (qties.some(q => isNaN(q) || q <= 0)) throw new Error('所有箱子的數量必須大於 0');

      // 換算率：原料入庫不檢查
      const convRate = (tab !== 'RAW' && form.unit === 'kg') ? parseFloat(form.conversionRate) : undefined;
      if (tab !== 'RAW' && form.unit === 'kg' && (!convRate || convRate <= 0))
        throw new Error('單位為 kg 時，必須輸入換算率');

      const items = InventoryDB.createBatch({
        category: tab,
        orderNo: form.orderNo.trim().toUpperCase(),
        warehouseCode: form.warehouseCode,
        shelfLocation: form.shelfLocation,
        productName: form.productName.trim(),
        batchNo: finalBatchNo.toUpperCase(),
        receiveDate: form.receiveDate,
        quantities: qties,
        unit: form.unit,
        conversionRate: convRate,
        operator: form.operator,
      });

      setRecentItems(prev => [...items, ...prev].slice(0, 20));
      setPrintItems(items); // 一次傳入整批
      setForm(f => ({ ...INITIAL, warehouseCode: f.warehouseCode, shelfLocation: f.shelfLocation, operator: f.operator }));
    } catch (err: any) {
      setError(err.message || '入庫失敗');
    }
  };

  return (
    <div className="fade-in">
      <div className="page-section-header">
        <div>
          <h2>倉庫入庫 Inbound Entry</h2>
          <p>輸入產品資訊與單箱重量，系統自動產生箱號。可手動微調每箱數值。</p>
        </div>
      </div>

      {/* 新增：待收料清單區塊 */}
      {tab !== 'RAW' && pendingProduction.length > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem', border: '1px solid var(--info-light)', background: 'var(--info-bg)' }}>
          <div className="card-header" style={{ borderBottomColor: 'rgba(var(--info-rgb), 0.1)' }}>
            <Sparkles size={18} color="var(--info)" />
            <h3 style={{ color: 'var(--info)' }}>待收料清單 <span className="label-sub" style={{ color: 'var(--info)', opacity: 0.8 }}>Pending from Production</span></h3>
          </div>
          <div className="table-wrap">
            <table className="table-sm">
              <thead>
                <tr>
                  <th>來源站點</th>
                  <th>料號 PRODUCT</th>
                  <th>單號 ORDER</th>
                  <th>生產批號 BATCH</th>
                  <th>待收數量</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {pendingProduction.map(item => (
                  <tr key={item.batchId}>
                    <td>[{item.warehouseCode}] {item.shelfLocation}</td>
                    <td className="td-bold">{item.productName}</td>
                    <td className="td-mono">{item.orderNo}</td>
                    <td className="td-mono" style={{ color: 'var(--accent)', fontWeight: 600 }}>{item.batchNo}</td>
                    <td className="td-bold">{item.remainingQty.toLocaleString()} {item.unit}</td>
                    <td>
                      <button 
                        className="btn btn-primary btn-sm" 
                        onClick={() => handleUsePending(item)}
                        style={{ padding: '4px 12px', fontSize: '0.75rem' }}
                      >
                        使用此資訊 <Sparkles size={12} style={{ marginLeft: '4px' }} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ padding: '0.75rem', fontSize: '0.7rem', color: 'var(--info)', margin: 0, opacity: 0.8 }}>
            💡 以上列出目前還在生產站點、尚未正式入庫至中心倉庫的產品。
          </p>
        </div>
      )}

      <div className="tab-bar">
        {TABS.map(t => (
          <button 
            key={t.id} 
            className={`tab-btn ${tab === t.id ? 'active' : ''}`} 
            onClick={() => {
              setTab(t.id);
              setForm({ ...INITIAL, unit: t.id === 'RAW' ? 'kg' : 'pcs' });
              setCustomQuantities(['']);
            }}
          >
            {t.label}<span className="tab-sub">{t.labelEn}</span>
          </button>
        ))}
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <Package size={18} color="var(--accent)" />
          <h3>{TABS.find(t => t.id === tab)?.label} / 入庫資訊</h3>
        </div>

        {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>⚠ {error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>產品名稱 <span className="label-sub">Product Name</span></label>
              <div style={{ position: 'relative' }}>
                <input required list="bom-products" value={form.productName} onChange={e => handleProductNameChange(e.target.value)} placeholder="e.g. ROB1-4" />
                <datalist id="bom-products">
                  {bomProducts.map(p => <option key={p.productId} value={p.productName}>{p.spec}</option>)}
                </datalist>
                {bomProducts.some(p => p.productName === form.productName) && (
                  <Sparkles size={14} style={{ position: 'absolute', right: '10px', top: '12px', color: 'var(--success)' }} />
                )}
              </div>
            </div>
            <div className="form-group">
              <label>單號 <span className="label-sub">Order No.</span></label>
              <div style={{ position: 'relative' }}>
                <input required value={form.orderNo} onChange={e => handleOrderNoChange(e.target.value)} placeholder="A/B/C 開頭" />
                {InventoryDB.getAll().some(i => i.orderNo === form.orderNo.toUpperCase()) && (
                  <Sparkles size={14} style={{ position: 'absolute', right: '10px', top: '12px', color: 'var(--accent)' }} />
                )}
              </div>
            </div>
            <div className="form-group">
              <label>收料日期 <span className="label-sub">Receiving Date</span></label>
              <input type="date" required value={form.receiveDate} onChange={e => set('receiveDate', e.target.value)} />
            </div>
            
            {/* 數量/重量 (每箱)：原料入庫時隱藏，改由下方個別輸入 */}
            {tab !== 'RAW' && (
              <div className="form-group">
                <label>
                  {form.unit === 'kg' ? '重量 (每箱)' : '數量 (每箱)'} 
                  <span className="label-sub"> Qty per Box ({form.unit})</span>
                </label>
                <input 
                  type="number" 
                  required 
                  min="0.000001" 
                  step="0.000001" 
                  value={form.quantity} 
                  onChange={e => set('quantity', e.target.value)} 
                  placeholder="0" 
                />
              </div>
            )}

            <div className="form-group">
              <label>單位 <span className="label-sub">Unit</span></label>
              <select value={form.unit} onChange={e => set('unit', e.target.value as Unit)}>
                <option value="pcs">PCS (個)</option>
                <option value="kg">KG (公斤)</option>
                <option value="g">G (公克)</option>
                <option value="set">SET (組)</option>
              </select>
            </div>

            {/* 換算率：原料入庫時隱藏 */}
            {tab !== 'RAW' && (
              <div className="form-group">
                <label>換算率 <span className="label-sub">1 pcs = ? {form.unit}</span></label>
                <input 
                  type="number" 
                  min="0.000001" 
                  step="0.000001" 
                  value={form.conversionRate} 
                  onChange={e => set('conversionRate', e.target.value)} 
                  disabled={form.unit === 'pcs'} 
                  placeholder="1000" 
                />
              </div>
            )}

            {/* 批號：原料入庫時隱藏 */}
            {tab !== 'RAW' && (
              <div className="form-group">
                <label>批號 <span className="label-sub">Batch / Lot No.</span></label>
                <input 
                  required 
                  value={form.batchNo} 
                  onChange={e => set('batchNo', e.target.value)} 
                  placeholder="20250426001" 
                />
              </div>
            )}
            <div className="form-group">
              <label>箱數 <span className="label-sub">Number of Boxes</span></label>
              <input type="number" min="1" max="100" value={form.boxCount} onChange={e => set('boxCount', e.target.value)} />
            </div>
            <div className="form-group">
              <label>倉庫 <span className="label-sub">Warehouse</span></label>
              <input 
                list="warehouse-list"
                value={form.warehouseCode} 
                onChange={e => set('warehouseCode', e.target.value.toUpperCase())} 
                placeholder="e.g. WS001"
              />
              <datalist id="warehouse-list">
                {warehouseCodes.map(c => {
                  const loc = locations.find(l => l.warehouseCode === c);
                  return <option key={c} value={c}>{loc?.description}</option>;
                })}
              </datalist>
            </div>
            <div className="form-group">
              <label>儲位 <span className="label-sub">Shelf Location</span></label>
              <input 
                list="shelf-list"
                value={form.shelfLocation} 
                onChange={e => set('shelfLocation', e.target.value.toUpperCase())} 
                placeholder="e.g. A01"
              />
              <datalist id="shelf-list">
                {locations.filter(l => l.warehouseCode === form.warehouseCode).map(l => (
                  <option key={l.locationId} value={l.shelfLocation}>{l.description}</option>
                ))}
              </datalist>
            </div>
            <div className="form-group">
              <label>作業者 <span className="label-sub">Operator</span></label>
              <select value={form.operator} onChange={e => set('operator', e.target.value)}>
                {OPERATORS.map(op => <option key={op} value={op}>{op}</option>)}
              </select>
            </div>
          </div>

          {/* 每一箱數量個別修改區 */}
          {customQuantities.length > 0 && (
            <div style={{ marginTop: '1.5rem', padding: '1.25rem', background: 'var(--accent-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-primary-100)' }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--accent)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Boxes size={18} /> 個別箱號預覽與{form.unit === 'kg' ? '重量' : '數量'}微調 (共 {customQuantities.length} 箱)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
                {customQuantities.map((qty, i) => (
                  <div key={i} style={{ background: '#fff', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-primary-100)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-primary-500)', fontWeight: 600 }} className="td-mono">
                      #{i + 1} 箱號預定: {form.shelfLocation || '???'}-{new Date().toISOString().split('T')[0].replace(/-/g, '')}-{(i+1).toString().padStart(4, '0')}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input 
                        type="number" 
                        step="0.000001"
                        value={qty} 
                        onChange={e => handleCustomQtyChange(i, e.target.value)}
                        style={{ fontSize: '0.9rem', padding: '0.375rem', border: '1px solid var(--accent-light)' }} 
                        placeholder="輸入重量..."
                      />
                      <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{form.unit.toUpperCase()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
            <button type="button" className="btn btn-ghost" style={{ marginRight: '0.75rem' }} onClick={() => setForm(INITIAL)}>清除</button>
            <button type="submit" className="btn btn-primary">
              <Package size={16} /> 確認入庫 &amp; 產出標示卡
            </button>
          </div>
        </form>
      </div>

      {recentItems.length > 0 && (
        <div className="card">
          <div className="card-header">
            <Printer size={18} color="var(--info)" />
            <h3>本次入庫記錄 (可補印)</h3>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>箱號</th><th>單號</th><th>產品名稱</th><th>重量/數量</th><th>操作</th></tr>
              </thead>
              <tbody>
                {recentItems.map(item => (
                  <tr key={item.batchId}>
                    <td className="td-mono">{item.caseNo}</td>
                    <td className="td-mono">{item.orderNo}</td>
                    <td className="td-bold">{item.productName}</td>
                    <td>{item.quantity.toLocaleString()} {item.unit}</td>
                    <td>
                      <button className="btn-icon print" onClick={() => setPrintItems([item])}><Printer size={15} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {printItems.length > 0 && <ProductCard items={printItems} onClose={() => setPrintItems([])} />}
    </div>
  );
}
