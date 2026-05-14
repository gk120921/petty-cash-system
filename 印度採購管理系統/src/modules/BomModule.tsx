// ============================================================
// BOM 階規劃模組 v2.7 — 全製程一鍵建檔 (Full Process Wizard)
// ============================================================

import React, { useState, useMemo } from 'react';
import { ProductDB, LocationDB } from '../db';
import type { Product } from '../types';
import { 
  Trash2, Repeat, Save, Sparkles, X, Edit2, Download, Upload
} from 'lucide-react';
import * as XLSX from 'xlsx';

export default function BomModule() {
  const [tick, setTick] = useState(0);
  const [showWizard, setShowWizard] = useState(false); // 控制全製程視窗
  
  // 全製程精靈的狀態
  const [wizardData, setWizardData] = useState({
    finalName: '',    // 最終品名
    rawName: '',      // 原料名稱
    commonRate: 0.000020, // 預設換算率 (1pcs = ?kg)
  });

  const [newRow, setNewRow] = useState<Partial<Product>>({
    productName: '', spec: '', baseUnit: 'pcs', altUnit: 'kg', conversionRate: 1000, parentProductName: '', defaultLocation: '',
  });

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [standardRate, setStandardRate] = useState(0.000020); // 標準換算率 (kg/pcs)


  const products = useMemo(() => ProductDB.getAll(), [tick]);
  const locations = useMemo(() => LocationDB.getAll(), []);


  // 執行全製程批量儲存
  const handleWizardSubmit = () => {
    try {
      const { finalName, rawName, commonRate } = wizardData;
      if (!finalName || !rawName) throw new Error('請輸入最終品名與原料名稱');

      // 定義標準五階段流程
      const steps = [
        { name: rawName,   parent: '',          loc: 'WM00', rate: 1,      spec: '原始規格' },
        { name: 'RO1-' + finalName.split('-')[1] || finalName, parent: rawName, loc: 'I311', rate: commonRate, spec: '沖壓階段' },
        { name: 'ROB1-' + finalName.split('-')[1] || finalName, parent: 'RO1-' + finalName.split('-')[1], loc: 'I312', rate: 1, spec: '焊接階段' },
        { name: finalName, parent: 'ROB1-' + finalName.split('-')[1], loc: 'SD001', rate: commonRate, spec: '委外電鍍' },
        { name: finalName, parent: finalName, loc: 'WS001', rate: 1, spec: '成品入庫' },
      ];

      steps.forEach(s => {
        ProductDB.create({
          productName: s.name,
          parentProductName: s.parent,
          defaultLocation: s.loc,
          conversionRate: s.rate,
          spec: s.spec,
          baseUnit: 'pcs',
          altUnit: 'kg',
        } as any);
      });

      alert('✓ 全製程 5 筆資料已成功建立！');
      setShowWizard(false);
      setTick(t => t + 1);
    } catch (e: any) { alert(e.message); }
  };

  const handleSaveRow = () => {
    try {
      if (!newRow.productName) throw new Error('請輸入料號名稱');
      ProductDB.create(newRow as any);
      setNewRow({ ...newRow, productName: '', spec: '', parentProductName: '' });
      setTick(t => t + 1);
    } catch (e: any) { alert(e.message); }
  };

  const handleUpdateRow = () => {
    try {
      if (!editingProduct) return;
      if (!editingProduct.productName) throw new Error('請輸入料號名稱');
      ProductDB.update(editingProduct.productId, editingProduct);
      setEditingProduct(null);
      setTick(t => t + 1);
      alert('✓ 更新成功');
    } catch (e: any) { alert(e.message); }
  };

  const handleExportExcel = () => {
    try {
      const data = products.map(p => ({
        '料號名稱 (Part Number)': p.productName,
        '站點 (Location)': p.defaultLocation,
        '規格描述 (Specification)': p.spec,
        '上游來源 (Parent Product)': p.parentProductName || '',
        '換算率 (Rate)': p.conversionRate,
        '基本單位 (Unit)': p.baseUnit,
        '輔助單位 (Alt Unit)': p.altUnit,
      }));
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'BOM_Data');
      XLSX.writeFile(workbook, `BOM_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (e: any) { alert('匯出失敗: ' + e.message); }
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        let count = 0;
        data.forEach(row => {
          const productName = row['料號名稱 (Part Number)'] || row['料號名稱'] || row['productName'];
          if (!productName) return;

          const productData = {
            productName,
            defaultLocation: row['站點 (Location)'] || row['站點'] || row['defaultLocation'] || '',
            spec: row['規格描述 (Specification)'] || row['規格描述'] || row['spec'] || '',
            parentProductName: row['上游來源 (Parent Product)'] || row['上游來源'] || row['parentProductName'] || '',
            conversionRate: parseFloat(row['換算率 (Rate)'] || row['換算率'] || row['conversionRate'] || '1'),
            baseUnit: row['基本單位 (Unit)'] || row['基本單位'] || row['baseUnit'] || 'pcs',
            altUnit: row['輔助單位 (Alt Unit)'] || row['輔助單位'] || row['altUnit'] || 'kg',
          };

          const existing = ProductDB.findByName(productName);
          if (existing) {
            ProductDB.update(existing.productId, productData);
          } else {
            ProductDB.create(productData as any);
          }
          count++;
        });

        alert(`✓ 匯入完成，共處理 ${count} 筆資料`);
        setTick(t => t + 1);
        e.target.value = ''; // Reset input
      } catch (err: any) {
        alert('匯入出錯: ' + err.message);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('確定要刪除？')) return;
    ProductDB.delete(id);
    setTick(t => t + 1);
  };

  const getCategoryLabel = (p: Product) => {
    if (!p.parentProductName) return { zh: '原料', color: '#e3f2fd', textColor: '#1976d2' };
    const hasChild = products.some(child => child.parentProductName === p.productName && child.productId !== p.productId);
    if (hasChild) return { zh: '製程/半成品', color: '#f1f8e9', textColor: '#388e3c' };
    return { zh: '成品/委外', color: '#fff3e0', textColor: '#f57c00' };
  };

  return (
    <div className="fade-in">
      <div className="page-section-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
          <div>
            <h2>BOM 階規劃管理 BOM Hierarchy</h2>
            <p>管理產品製程階層，支援「全製程一鍵快速建檔」。</p>
          </div>
          <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
            <div style={{ display: 'flex', background: 'var(--color-primary-50)', padding: '4px', borderRadius: 'var(--radius-md)', gap: '4px' }}>
              <button className="btn btn-ghost" onClick={handleExportExcel} title="匯出 Excel" style={{ padding: '6px 12px' }}>
                <Download size={15} /> 匯出
              </button>
              <label className="btn btn-ghost" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '6px 12px' }} title="匯入 Excel">
                <Upload size={15} /> 匯入
                <input type="file" accept=".xlsx, .xls" style={{ display: 'none' }} onChange={handleImportExcel} />
              </label>
            </div>
            <div style={{ width: '1px', height: '24px', background: 'var(--color-primary-200)', margin: '0 4px' }}></div>
            <button className="btn btn-primary" onClick={() => setShowWizard(true)}>
              <Sparkles size={16} /> 全製程一鍵建檔 (Wizard)
            </button>
          </div>
        </div>
      </div>

      {/* 標準換算率設置 */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem', background: 'var(--accent-bg)', padding: '12px 20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--accent-light)', boxShadow: 'var(--shadow-sm)' }}>
        <Repeat size={18} color="var(--accent)" />
        <label style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--color-primary-800)' }}>目標基準換算率 Standard Yield Rate:</label>
        <div style={{ position: 'relative', width: '130px' }}>
          <input 
            type="number" 
            style={{ paddingRight: '2.5rem', fontWeight: 'bold', color: 'var(--accent)', background: '#fff', border: '1px solid var(--accent-light)' }} 
            value={standardRate} 
            onChange={e => setStandardRate(parseFloat(e.target.value) || 1)} 
          />
          <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.7rem', color: 'var(--color-primary-400)' }}>kg/pcs</span>
        </div>
        <div style={{ height: '24px', width: '1px', background: 'var(--accent-light)', opacity: 0.3, margin: '0 0.5rem' }}></div>
        <span style={{ fontSize: '0.8rem', color: 'var(--color-primary-600)' }}>
          系統將以此基準計算各工序的 <b style={{ color: 'var(--danger)' }}>產出率差異 (+/- %)</b> 並自動警示。
        </span>
      </div>

      {/* 全製程彈窗 精靈 */}
      {showWizard && (
        <div className="modal-overlay">
          <div className="modal-content card" style={{ maxWidth: '800px', width: '90%' }}>
            <div className="card-header">
              <Sparkles size={18} color="var(--accent)" />
              <h3>全製程快速規劃精靈</h3>
              <button className="btn-icon" onClick={() => setShowWizard(false)} style={{ marginLeft: 'auto' }}><X size={18} /></button>
            </div>
            
            <div className="form-grid" style={{ padding: '1rem' }}>
              <div className="form-group">
                <label>最終品名 (e.g. RNB1-3.2)</label>
                <input value={wizardData.finalName} onChange={e => setWizardData({...wizardData, finalName: e.target.value})} placeholder="輸入成品料號" />
              </div>
              <div className="form-group">
                <label>原料名稱 (e.g. c0.75*24H/2)</label>
                <input value={wizardData.rawName} onChange={e => setWizardData({...wizardData, rawName: e.target.value})} placeholder="輸入銅板規格" />
              </div>
              <div className="form-group">
                <label>預設換算率 (1 pcs = ? kg)</label>
                <input type="number" value={wizardData.commonRate} onChange={e => setWizardData({...wizardData, commonRate: parseFloat(e.target.value)})} />
              </div>
            </div>

            <div style={{ padding: '0 1rem 1rem' }}>
              <div style={{ fontSize: '0.8rem', color: '#666', background: '#f8f9fa', padding: '1rem', borderRadius: '8px' }}>
                <b>預覽產出流程 (Preview):</b>
                <ul style={{ marginTop: '0.5rem' }}>
                  <li>1. 原料倉 (WM00) - {wizardData.rawName || '(未填)'}</li>
                  <li>2. 沖壓站 (I311) - RO1-{(wizardData.finalName.split('-')[1]) || '...'} (率: {wizardData.commonRate})</li>
                  <li>3. 焊接站 (I312) - ROB1-{(wizardData.finalName.split('-')[1]) || '...'}</li>
                  <li>4. 委外電鍍 (SD001) - {wizardData.finalName || '...'} (率: {wizardData.commonRate})</li>
                  <li>5. 成品主倉 (WS001) - {wizardData.finalName || '...'}</li>
                </ul>
              </div>
            </div>

            <div className="card-footer" style={{ textAlign: 'right' }}>
              <button className="btn btn-ghost" onClick={() => setShowWizard(false)}>取消 Cancel</button>
              <button className="btn btn-primary" onClick={handleWizardSubmit}>
                確認一次建立 5 筆紀錄 Confirm & Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 編輯彈窗 */}
      {editingProduct && (
        <div className="modal-overlay">
          <div className="modal-content card" style={{ maxWidth: '600px', width: '90%' }}>
            <div className="card-header">
              <Edit2 size={18} color="var(--accent)" />
              <h3>修改 BOM 內容 Edit BOM</h3>
              <button className="btn-icon" onClick={() => setEditingProduct(null)} style={{ marginLeft: 'auto' }}><X size={18} /></button>
            </div>
            
            <div className="form-grid" style={{ padding: '1.5rem', gap: '1rem' }}>
              <div className="form-group">
                <label>料號名稱 Part Number</label>
                <input value={editingProduct.productName} onChange={e => setEditingProduct({...editingProduct, productName: e.target.value})} />
              </div>
              <div className="form-group">
                <label>站點 Location</label>
                <select value={editingProduct.defaultLocation} onChange={e => setEditingProduct({...editingProduct, defaultLocation: e.target.value})}>
                  <option value="">-- 選擇 --</option>
                  {locations.map(l => <option key={l.locationId} value={l.shelfLocation}>[{l.warehouseCode}] {l.description}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>規格描述 Specification</label>
                <input value={editingProduct.spec} onChange={e => setEditingProduct({...editingProduct, spec: e.target.value})} />
              </div>
              <div className="form-group">
                <label>上游來源 Parent Product</label>
                <input list="parent-list" value={editingProduct.parentProductName} onChange={e => setEditingProduct({...editingProduct, parentProductName: e.target.value})} />
              </div>
              <div className="form-group">
                <label>換算率 Conversion Rate</label>
                <input type="number" value={editingProduct.conversionRate} onChange={e => setEditingProduct({...editingProduct, conversionRate: parseFloat(e.target.value)})} />
              </div>
            </div>

            <div className="card-footer" style={{ textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button className="btn btn-ghost" onClick={() => setEditingProduct(null)}>取消 Cancel</button>
              <button className="btn btn-primary" onClick={handleUpdateRow}>
                <Save size={16} /> 儲存修改 Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 原本的表格輸入介面 (略) */}
      <div className="card">
        <div className="table-wrap">
          <table className="excel-table">
            <thead>
              <tr style={{ background: '#f8f9fa' }}>
                <th style={{ width: '130px' }}>分類</th>
                <th style={{ width: '200px' }}>料號名稱</th>
                <th style={{ width: '150px' }}>站點</th>
                <th>規格描述</th>
                <th style={{ width: '150px' }}>上游來源</th>
                <th style={{ width: '100px' }}>換算率</th>
                <th style={{ width: '100px' }}>差異 Variance %</th>
                <th style={{ width: '100px' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {/* 輸入列 */}
              <tr style={{ background: '#f0f7ff' }}>
                <td><span style={{ fontSize: '0.7rem', opacity: 0.5 }}>單筆輸入</span></td>
                <td><input className="td-input" value={newRow.productName} onChange={e => setNewRow({...newRow, productName: e.target.value})} /></td>
                <td>
                  <select className="td-input" value={newRow.defaultLocation} onChange={e => setNewRow({...newRow, defaultLocation: e.target.value})}>
                    <option value="">-- 選擇 --</option>
                    {locations.map(l => <option key={l.locationId} value={l.shelfLocation}>[{l.warehouseCode}] {l.description}</option>)}
                  </select>
                </td>
                <td><input className="td-input" value={newRow.spec} onChange={e => setNewRow({...newRow, spec: e.target.value})} /></td>
                <td><input className="td-input" list="parent-list" value={newRow.parentProductName} onChange={e => setNewRow({...newRow, parentProductName: e.target.value})} /></td>
                <td><input className="td-input" type="number" value={newRow.conversionRate} onChange={e => setNewRow({...newRow, conversionRate: parseFloat(e.target.value)})} /></td>
                <td style={{ background: '#f8f9fa' }}></td>
                <td><button className="btn btn-primary btn-sm" onClick={handleSaveRow}><Save size={14} /></button></td>
              </tr>
              {/* 資料列 */}
              {products.map(p => {
                const cat = getCategoryLabel(p);
                return (
                  <tr key={p.productId}>
                    <td><span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold', background: cat.color, color: cat.textColor }}>{cat.zh}</span></td>
                    <td className="td-bold">{p.productName}</td>
                    <td>{p.defaultLocation || '原料倉'}</td>
                    <td style={{ fontSize: '0.85rem' }}>{p.spec}</td>
                    <td style={{ color: 'var(--accent)', fontSize: '0.85rem' }}>{p.parentProductName ? `└ ${p.parentProductName}` : '—'}</td>
                    <td className="td-mono" style={{ textAlign: 'right', fontWeight: 'bold' }}>{p.conversionRate.toLocaleString()}</td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                      {p.conversionRate > 0 && p.parentProductName ? (() => {
                        const variance = ((p.conversionRate - standardRate) / standardRate) * 100;
                        const color = variance < 0 ? 'var(--danger)' : (variance > 0 ? 'var(--success)' : 'var(--color-primary-400)');
                        return (
                          <span style={{ 
                            color, 
                            background: variance < 0 ? 'var(--danger-bg)' : (variance > 0 ? 'var(--success-bg)' : 'transparent'),
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '0.8rem'
                          }}>
                            {variance > 0 ? '+' : ''}{variance.toFixed(1)}%
                          </span>
                        );
                      })() : <span style={{ color: '#ccc' }}>—</span>}
                    </td>
                    <td style={{ textAlign: 'center', display: 'flex', gap: '4px', justifyContent: 'center' }}>
                      <button className="btn-icon" style={{ color: 'var(--accent)' }} onClick={() => setEditingProduct(p)}><Edit2 size={14} /></button>
                      <button className="btn-icon danger" onClick={() => handleDelete(p.productId)}><Trash2 size={14} /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .excel-table { width: 100%; border-collapse: collapse; }
        .excel-table th, .excel-table td { border: 1px solid #dee2e6; padding: 10px; }
        .excel-table .td-input { width: 100%; border: 1px solid #ddd; padding: 4px; border-radius: 4px; }
      `}</style>
      <datalist id="parent-list">{products.map(p => <option key={p.productId} value={p.productName} />)}</datalist>
    </div>
  );
}
