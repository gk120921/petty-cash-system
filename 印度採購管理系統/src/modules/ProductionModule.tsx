// ============================================================
// 生產完工模組 v2.1 — 支援自定義生產批號與資訊連動
// ============================================================

import React, { useState, useMemo, useEffect } from 'react';
import { InventoryDB, LocationDB, ProductDB, IssueDB, QCStatusDB } from '../db';

import { Factory, CheckCircle, Info, Layers, Hash, RotateCcw } from 'lucide-react';

export default function ProductionModule() {
  const [tick, setTick] = useState(0);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [targetProduct, setTargetProduct] = useState('');
  const [targetStorage, setTargetStorage] = useState('WS001-A01'); // 新增：完工入庫目的地
  const [batchNo, setBatchNo] = useState(''); // 恢復：生產批號
  const [producedQty, setProducedQty] = useState('');
  const [operator, setOperator] = useState('System Admin');
  const [sourceBatchSearch, setSourceBatchSearch] = useState(''); // 新增：來源批號搜尋
  const [showAdjustModal, setShowAdjustModal] = useState(false); // 新增：調整彈窗
  const [showReturnModal, setShowReturnModal] = useState(false); // 新增：退料彈窗
  const [adjustQty, setAdjustQty] = useState('');
  const [returnQty, setReturnQty] = useState('');
  const [targetWarehouse, setTargetWarehouse] = useState('WM00'); // 預設原料倉
  const [adjustReason, setAdjustReason] = useState('生產損耗 Yield Loss');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const allInventory = useMemo(() => InventoryDB.getWithRemaining(), [tick, success]);
  const allLocations = useMemo(() => LocationDB.getAll().filter(l => l.isActive), []);
  const processLocations = useMemo(() => allLocations.filter(l => l.warehouseCategory === 'PROCESS'), []);
  const products = useMemo(() => ProductDB.getAll(), []);
  const qcStatuses = useMemo(() => QCStatusDB.getAll(), []);

  // 1. 篩選站點原料
  const availableBatches = useMemo(() => {
    if (!selectedLocation) return [];
    const [wh, shelf] = selectedLocation.split('-');
    return allInventory.filter(i => 
      i.warehouseCode === wh && 
      i.shelfLocation === shelf && 
      (i.category === 'RAW' || i.category === 'SEMI') && 
      i.status !== 'DEPLETED'
    );
  }, [allInventory, selectedLocation]);

  const selectedBatch = useMemo(() => 
    availableBatches.find(b => b.batchId === selectedBatchId),
    [availableBatches, selectedBatchId]
  );

  const prodInfo = useMemo(() => 
    products.find(p => p.productName === targetProduct),
    [targetProduct, products]
  );

  // 當料號或站點改變時，自動建議一個批號 (格式: P + 日期 + 料號簡寫)
  useEffect(() => {
    if (targetProduct) {
      const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '').slice(2);
      setBatchNo(`P${dateStr}-${targetProduct.slice(0, 5)}`);
    }
  }, [targetProduct]);

  const estimatedConsumption = useMemo(() => {
    if (!prodInfo || !producedQty) return 0;
    const qty = parseFloat(producedQty);
    return isNaN(qty) ? 0 : Math.round(qty * prodInfo.conversionRate * 1000000) / 1000000;
  }, [prodInfo, producedQty]);

  // 快速搜尋來源批號並自動帶入資訊
  const handleQuickSearch = () => {
    setError('');
    const match = allInventory.find(i => 
      (i.batchNo === sourceBatchSearch || i.caseNo === sourceBatchSearch || i.orderNo === sourceBatchSearch) && 
      i.status !== 'DEPLETED'
    );

    if (!match) {
      setError('找不到該批號或該批號已領完');
      return;
    }

    // 1. 帶入站點
    setSelectedLocation(`${match.warehouseCode}-${match.shelfLocation}`);
    // 2. 帶入原料批次 ID
    setSelectedBatchId(match.batchId);
    
    // 3. 嘗試推測目標產品 (找尋 BOM 中以此為上游的產品)
    const nextProduct = products.find(p => p.parentProductName === match.productName);
    if (nextProduct) {
      setTargetProduct(nextProduct.productName);
    }
    
    setSuccess(`✓ 已成功帶入批次 ${match.batchNo} 相關資訊`);
  };

  const handleAdjustSubmit = () => {
    if (!selectedBatch || !adjustQty) return;
    try {
      const newQty = parseFloat(adjustQty);
      if (isNaN(newQty) || newQty < 0) throw new Error('請輸入正確的數量');
      
      const currentRemaining = selectedBatch.remainingQty;
      const diff = newQty - currentRemaining;

      // 直接寫入領用/調整紀錄，不再修改原始入庫量，避免觸發資料庫保護機制
      IssueDB.create({
        batchId: selectedBatch.batchId,
        orderNo: 'ADJUST-' + new Date().getTime().toString().slice(-6),
        usageQty: -diff, // 負值代表增加，正值代表扣除
        unit: selectedBatch.unit,
        operator,
        remark: `手動調整庫存: ${adjustReason} (由 ${currentRemaining} 變更為 ${newQty})`,
      });

      setSuccess(`✓ 庫存已手動調整為 ${newQty} kg`);
      setShowAdjustModal(false);
      setTick(t => t + 1);
    } catch (e: any) { alert(e.message); }
  };

  const handleReturnSubmit = () => {
    if (!selectedBatch || !returnQty) return;
    try {
      const qty = parseFloat(returnQty);
      if (isNaN(qty) || qty <= 0) throw new Error('請輸入正確的退回數量');
      if (qty > selectedBatch.remainingQty) throw new Error('退回數量不能大於現有餘料');

      // 1. 扣除站點餘料
      IssueDB.create({
        batchId: selectedBatch.batchId,
        orderNo: 'RETURN-' + new Date().getTime().toString().slice(-6),
        usageQty: qty,
        unit: 'kg',
        operator,
        remark: `餘料退回: 站點 ${selectedLocation.split('-')[0]} -> 倉庫 ${targetWarehouse}`,
      });

      // 2. 增加倉庫入庫 (建立新批次)
      InventoryDB.create({
        category: 'RAW',
        orderNo: selectedBatch.orderNo,
        warehouseCode: targetWarehouse,
        shelfLocation: 'RETURN', // 標記為退回儲位
        productName: selectedBatch.productName,
        batchNo: selectedBatch.batchNo,
        receiveDate: new Date().toISOString().split('T')[0],
        quantity: qty,
        unit: 'kg',
        operator,
        customRemark: `生產退料: 來自站點 ${selectedLocation.split('-')[1]}`,
      });

      setSuccess(`✓ 成功！餘料 ${qty} kg 已退回至倉庫 ${targetWarehouse}`);
      setShowReturnModal(false);
      setTick(t => t + 1);
    } catch (e: any) { alert(e.message); }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');

    try {
      if (!selectedBatch) throw new Error('請選擇投入原料批次');
      const qcStatus = qcStatuses.find(s => s.code === (selectedBatch.qcStatus || 'OK'));
      if (qcStatus && !qcStatus.canProduce) 
        throw new Error(`該批次品質狀態為 [${qcStatus.name}]，禁止投入生產！`);
      if (!prodInfo) throw new Error('請選擇產出半成品料號');
      if (!batchNo.trim()) throw new Error('請輸入生產批號');
      if (estimatedConsumption <= 0) throw new Error('完工數量無效');
      if (estimatedConsumption > selectedBatch.remainingQty) 
        throw new Error(`原料不足！需要 ${estimatedConsumption.toFixed(2)}kg`);

      const [whCode] = selectedLocation.split('-');
      const [targetWh, targetShelf] = targetStorage.split('-');

      // ── 執行 A：原料扣除 ──
      IssueDB.create({
        batchId: selectedBatch.batchId,
        orderNo: selectedBatch.orderNo, // 使用原始 C 計畫單號作為扣料基準
        usageQty: estimatedConsumption,
        unit: 'kg',
        operator,
        remark: `生產扣料: 站點 ${whCode} | 產出 ${targetProduct} | 批次 ${batchNo}`,
      });

      // ── 執行 B：半成品入庫 (帶出所有關聯資訊) ──
      InventoryDB.create({
        category: 'SEMI',
        orderNo: selectedBatch.orderNo, // 繼承原始 C 計畫單號 (核心追溯點)
        warehouseCode: targetWh, 
        shelfLocation: targetShelf || 'A01',   
        productName: targetProduct,
        batchNo: batchNo.trim().toUpperCase(), // 存入新產生的 P 生產批號
        receiveDate: new Date().toISOString().split('T')[0],
        quantity: parseFloat(producedQty),
        unit: 'pcs',
        parentBatchId: selectedBatch.batchId, // 關鍵：記錄血緣關係
        operator,
        customRemark: `完工入庫: [計畫單:${selectedBatch.orderNo}] [站點:${whCode}] [來源:${selectedBatch.batchNo}]`, 
      });

      setSuccess(`✓ 成功！生產批號 ${batchNo} 已建檔。`);
      setProducedQty('');
      setTick(t => t + 1);
    } catch (e: any) { setError(e.message); }
  };

  return (
    <div className="fade-in">
      <div className="page-section-header">
        <div>
          <h2>生產完工匯報 Production Reporting</h2>
          <p>整合站點、原料與產出資訊，建立完整的生產溯源紀錄。</p>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <Factory size={18} color="var(--accent)" />
            <h3>完工回報表單 Reporting Form</h3>
          </div>

          <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--accent-bg)', borderRadius: '8px', border: '1px dashed var(--accent)' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent)', marginBottom: '0.5rem', display: 'block' }}>
              快速帶入來源批號 Quick Link by Batch No.
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input 
                placeholder="輸入來源批號 (e.g. C2026...)" 
                value={sourceBatchSearch} 
                onChange={e => setSourceBatchSearch(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && handleQuickSearch()}
              />
              <button type="button" className="btn btn-primary" onClick={handleQuickSearch}>搜尋</button>
            </div>
            <p style={{ fontSize: '0.7rem', color: 'var(--color-primary-500)', marginTop: '0.5rem' }}>直接輸入沖壓倉/製程倉的批號，可自動填入站點與原料資訊。</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label>1. 選擇生產站點 <span className="label-sub">Process Station</span></label>
              <select value={selectedLocation} onChange={e => setSelectedLocation(e.target.value)}>
                <option value="">-- 請選擇站點 --</option>
                {processLocations.map(l => (
                  <option key={l.locationId} value={`${l.warehouseCode}-${l.shelfLocation}`}>
                    [{l.warehouseCode}] {l.description}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label>2. 投入原料批次 <span className="label-sub">Source Raw Batch</span></label>
              <select value={selectedBatchId} onChange={e => setSelectedBatchId(e.target.value)} disabled={!selectedLocation}>
                <option value="">-- 選擇站點內的原料 --</option>
                {availableBatches.map(b => {
                  const q = qcStatuses.find(s => s.code === (b.qcStatus || 'OK'));
                  return (
                    <option key={b.batchId} value={b.batchId}>
                      {b.productName} (餘 {b.remainingQty} kg) - {b.batchNo} {q && !q.canProduce ? `[⚠️${q.name}]` : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            {selectedBatch && (
              <div style={{ marginBottom: '1.25rem', padding: '0.75rem', background: 'var(--color-primary-100)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--color-primary-200)' }}>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-primary-600)' }}>目前站點餘料:</span>
                  <span style={{ fontWeight: 700, color: 'var(--accent)', marginLeft: '0.5rem' }}>
                    {selectedBatch.remainingQty.toLocaleString()} {selectedBatch.unit.toLowerCase()}
                    {prodInfo && selectedBatch.unit.toLowerCase() === 'kg' && (
                      <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--success)', marginLeft: '0.5rem' }}>
                        (約可產出 {(selectedBatch.remainingQty * prodInfo.conversionRate).toLocaleString()} pcs)
                      </span>
                    )}
                    {prodInfo && selectedBatch.unit.toLowerCase() !== 'kg' && (
                      <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--success)', marginLeft: '0.5rem' }}>
                        (1:1 產出預估)
                      </span>
                    )}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    type="button"
                    className="btn btn-ghost btn-sm" 
                    style={{ fontSize: '0.7rem', padding: '4px 8px', color: 'var(--info)', borderColor: 'var(--info)' }}
                    onClick={() => {
                      setReturnQty(selectedBatch.remainingQty.toString());
                      setShowReturnModal(true);
                    }}
                  >
                    <RotateCcw size={12} style={{ marginRight: '4px' }} /> 餘料退回
                  </button>
                  <button 
                    type="button"
                    className="btn btn-ghost btn-sm" 
                    style={{ fontSize: '0.7rem', padding: '4px 8px', color: 'var(--warning)', borderColor: 'var(--warning)' }}
                    onClick={() => {
                      setAdjustQty(selectedBatch.remainingQty.toString());
                      setShowAdjustModal(true);
                    }}
                  >
                    <Info size={12} style={{ marginRight: '4px' }} /> 手動調整
                  </button>
                </div>
              </div>
            )}

            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label>3. 完工產出料號 <span className="label-sub">Finished Item No.</span></label>
              <input list="bom-list" placeholder="輸入或選擇料號..." value={targetProduct} onChange={e => setTargetProduct(e.target.value)} />
              <datalist id="bom-list">
                {products.map(p => <option key={p.productId} value={p.productName}>{p.spec}</option>)}
              </datalist>
            </div>

            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label>4. 完工入庫目的地 <span className="label-sub">Target Storage Location</span></label>
              <select value={targetStorage} onChange={e => setTargetStorage(e.target.value)}>
                <optgroup label="一般倉庫 General Warehouse">
                  <option value="WS001-A01">WS001 - 中心倉庫 (A01)</option>
                </optgroup>
                <optgroup label="下階段製程倉 Next Process Stations">
                  {processLocations.map(l => (
                    <option key={l.locationId} value={`${l.warehouseCode}-${l.shelfLocation}`}>
                      [{l.warehouseCode}] {l.description}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* 新增：生產批號欄位 */}
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label>5. 生產批號 <span className="label-sub">Production Batch No. (Auto-linked)</span></label>
              <div style={{ position: 'relative' }}>
                <Hash size={14} style={{ position: 'absolute', left: '12px', top: '15px', opacity: 0.5 }} />
                <input 
                  style={{ paddingLeft: '35px', fontWeight: 'bold', color: 'var(--color-primary-700)' }}
                  value={batchNo} 
                  onChange={e => setBatchNo(e.target.value)} 
                  placeholder="輸入生產批號..." 
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label>6. 完工產出數量 <span className="label-sub">Finished Qty (PCS)</span></label>
              <input type="number" placeholder="輸入完工數量..." value={producedQty} onChange={e => setProducedQty(e.target.value)} />
            </div>

            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label>作業者 <span className="label-sub">Operator</span></label>
              <input value={operator} onChange={e => setOperator(e.target.value)} />
            </div>

            {error && <div className="alert alert-error" style={{ margin: '1rem 0' }}>⚠ {error}</div>}
            {success && <div className="alert alert-success" style={{ margin: '1rem 0' }}>{success}</div>}

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
              <CheckCircle size={16} /> 提交完工回報
            </button>
          </form>
        </div>

        {/* 右側：溯源資訊預覽 */}
        <div className="card" style={{ background: 'var(--color-primary-50)', border: '2px solid var(--color-primary-200)' }}>
          <div className="card-header">
            <Layers size={18} color="var(--info)" />
            <h3>生產溯源預覽 Traceability Preview</h3>
          </div>

          {!selectedBatch || !prodInfo ? (
            <div className="empty-state" style={{ height: '300px' }}>
              <p>請完成左側選擇以生成溯源資訊</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ padding: '1.25rem', background: '#fff', borderRadius: '12px', border: '1px solid #eee' }}>
                <div style={{ fontSize: '0.7rem', color: '#999', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>產出批次連結</div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
                  <div style={{ padding: '8px', background: 'var(--color-primary-100)', borderRadius: '8px' }}><Factory size={16} /></div>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>站點: {selectedLocation.split('-')[1]}</div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>Code: {selectedLocation.split('-')[0]}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
                  <div style={{ padding: '8px', background: 'var(--warning-bg)', borderRadius: '8px' }}><Layers size={16} /></div>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>原料批次: {selectedBatch.batchNo}</div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>原始箱號: {selectedBatch.caseNo}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ padding: '8px', background: 'var(--success-bg)', borderRadius: '8px' }}><CheckCircle size={16} /></div>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>半成品: {targetProduct}</div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>換算率: 1kg = {prodInfo.conversionRate}pcs</div>
                  </div>
                </div>
              </div>

              <div style={{ padding: '1.25rem', background: 'var(--color-primary-900)', color: '#fff', borderRadius: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', opacity: 0.6, marginBottom: '0.5rem' }}>預計產出總量</div>
                <div style={{ fontSize: '2rem', fontWeight: 900 }}>{producedQty || '0'} <span style={{ fontSize: '0.8rem' }}>PCS</span></div>
                <div style={{ fontSize: '0.7rem', opacity: 0.6, marginTop: '0.5rem' }}>將自動扣除 {estimatedConsumption.toFixed(6)} KG 原料</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 調整彈窗 */}
      {showAdjustModal && selectedBatch && (
        <div className="modal-overlay">
          <div className="modal-content card" style={{ maxWidth: '400px' }}>
            <div className="card-header">
              <Info size={18} color="var(--warning)" />
              <h3>庫存手動調整</h3>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label>目前系統餘量</label>
                <input disabled value={`${selectedBatch.remainingQty} ${selectedBatch.unit.toLowerCase()}`} />
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label>調整後正確數量 (單位: {selectedBatch.unit.toLowerCase()})</label>
                <input type="number" step="0.000001" value={adjustQty} onChange={e => setAdjustQty(e.target.value)} autoFocus />
              </div>
              <div className="form-group">
                <label>調整原因</label>
                <select value={adjustReason} onChange={e => setAdjustReason(e.target.value)}>
                  <option value="生產損耗 Yield Loss">生產損耗 Yield Loss</option>
                  <option value="盤點修正 Inventory Correction">盤點修正 Inventory Correction</option>
                  <option value="樣品領用 Sample Take">樣品領用 Sample Take</option>
                  <option value="報廢 Scrap">報廢 Scrap</option>
                </select>
              </div>
            </div>
            <div className="card-footer" style={{ textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button className="btn btn-ghost" onClick={() => setShowAdjustModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleAdjustSubmit}>確認調整</button>
            </div>
          </div>
        </div>
      )}

      {/* 退料彈窗 */}
      {showReturnModal && selectedBatch && (
        <div className="modal-overlay">
          <div className="modal-content card" style={{ maxWidth: '400px' }}>
            <div className="card-header">
              <RotateCcw size={18} color="var(--info)" />
              <h3>生產餘料退回倉庫</h3>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label>目前站點餘量</label>
                <input disabled value={`${selectedBatch.remainingQty} ${selectedBatch.unit.toLowerCase()}`} />
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label>退回數量 ({selectedBatch.unit.toUpperCase()})</label>
                <input type="number" step="0.000001" value={returnQty} onChange={e => setReturnQty(e.target.value)} autoFocus />
              </div>
              <div className="form-group">
                <label>退回目標倉庫</label>
                <select value={targetWarehouse} onChange={e => setTargetWarehouse(e.target.value)}>
                  <option value="WM00">WM00 - 原料主倉 Raw Material</option>
                  <option value="WS001">WS001 - 成品/半成品倉 Warehouse</option>
                </select>
              </div>
            </div>
            <div className="card-footer" style={{ textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button className="btn btn-ghost" onClick={() => setShowReturnModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleReturnSubmit}>確認退回</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
      `}</style>
    </div>
  );
}
