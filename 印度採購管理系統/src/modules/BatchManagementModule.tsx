// ============================================================
// 批號管理模組 — 支援溯源圖譜與聯動品質更新
// ============================================================

import React, { useState, useMemo } from 'react';
import { InventoryDB, QCStatusDB } from '../db';
import type { InventoryBatch, QCStatus } from '../types';
import { Search, GitBranch, ArrowUp, ArrowDown, ShieldCheck, AlertCircle, Clock, Info, CheckCircle } from 'lucide-react';

export default function BatchManagementModule({ lang = 'ZH' }: { lang?: 'ZH' | 'EN' }) {
  const [search, setSearch] = useState('');
  const [tick, setTick] = useState(0);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  
  // 品質變更狀態
  const [qcForm, setQcForm] = useState({ status: 'A', remark: '', cascadeUp: false, cascadeDown: true });
  const [success, setSuccess] = useState('');

  const allBatches = useMemo(() => InventoryDB.getAll(), [tick]);
  const qcStatuses = useMemo(() => QCStatusDB.getAll(), [tick]);

  const searchResult = useMemo(() => {
    if (!search.trim()) return null;
    return allBatches.find(b => 
      b.batchNo.toLowerCase().includes(search.toLowerCase()) || 
      b.caseNo.toLowerCase().includes(search.toLowerCase())
    );
  }, [allBatches, search]);

  const findBatchById = (id: string) => allBatches.find(b => b.batchId === id);

  // 取得下游
  const getDownstream = (id: string): InventoryBatch[] => {
    return allBatches.filter(b => b.parentBatchId === id);
  };

  const handleUpdate = () => {
    if (!selectedBatchId) return;
    try {
      InventoryDB.updateQCStatusCascade(
        selectedBatchId, 
        qcForm.status, 
        qcForm.remark, 
        'System Admin', 
        { upstream: qcForm.cascadeUp, downstream: qcForm.cascadeDown }
      );
      setSuccess('✓ 聯動品質判定更新成功！');
      setTick(t => t + 1);
      setTimeout(() => setSuccess(''), 3000);
    } catch (e: any) { alert(e.message); }
  };

  // 遞迴渲染節點
  const renderNode = (batch: InventoryBatch, depth = 0, type: 'UP' | 'DOWN' | 'SELF' = 'SELF') => {
    const qc = qcStatuses.find(s => s.code === (batch.qcStatus || 'A'));
    return (
      <div key={batch.batchId} style={{ 
        marginLeft: depth * 20, 
        padding: '0.75rem', 
        borderLeft: depth > 0 ? '2px solid var(--color-primary-200)' : 'none',
        marginBottom: '0.5rem',
        background: selectedBatchId === batch.batchId ? 'var(--color-primary-100)' : 'transparent',
        borderRadius: '8px',
        cursor: 'pointer'
      }} onClick={() => { setSelectedBatchId(batch.batchId); setQcForm(prev => ({ ...prev, status: batch.qcStatus || 'A' })); }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {type === 'UP' && <ArrowUp size={14} color="var(--warning)" />}
          {type === 'DOWN' && <ArrowDown size={14} color="var(--info)" />}
          {type === 'SELF' && <CheckCircle size={14} color="var(--accent)" />}
          
          <div className="td-bold" style={{ fontSize: '0.9rem' }}>{batch.batchNo}</div>
          <span className="badge-status" style={{ 
            fontSize: '0.65rem', 
            background: (qc?.color || '#ccc') + '22', 
            color: qc?.color, 
            borderColor: qc?.color,
            padding: '2px 8px'
          }}>
            {lang === 'ZH' ? (qc?.name || batch.qcStatus) : (qc?.nameEn || batch.qcStatus)}
          </span>
        </div>
        <div className="td-muted" style={{ fontSize: '0.75rem', marginLeft: '24px' }}>
          {batch.productName} | {batch.quantity} {batch.unit} | {batch.caseNo}
        </div>
      </div>
    );
  };

  // 渲染溯源樹
  const renderTraceabilityTree = (id: string) => {
    const current = findBatchById(id);
    if (!current) return null;

    // 向上追溯 (簡單展示一層，實務上可遞迴)
    const parents: React.ReactNode[] = [];
    let p = current.parentBatchId;
    while (p) {
      const parent = findBatchById(p);
      if (parent) {
        parents.unshift(renderNode(parent, 0, 'UP'));
        p = parent.parentBatchId;
      } else break;
    }

    // 向下探查 (遞迴展示)
    const renderDown = (bid: string, d: number): React.ReactNode => {
      const children = getDownstream(bid);
      return children.map(c => (
        <React.Fragment key={c.batchId}>
          {renderNode(c, d, 'DOWN')}
          {renderDown(c.batchId, d + 1)}
        </React.Fragment>
      ));
    };

    return (
      <div className="trace-tree">
        {parents}
        {renderNode(current, 0, 'SELF')}
        {renderDown(current.batchId, 1)}
      </div>
    );
  };

  return (
    <div className="fade-in">
      <div className="page-section-header">
        <div>
          <h2>批號管理中心 Batch Management</h2>
          <p>輸入批號或箱號，展開上下游生產血緣關係，並進行聯動品質判定。</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="form-group">
          <label>搜尋批號 / 箱號 <span className="label-sub">Search Batch or Case No.</span></label>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--color-primary-400)' }} />
            <input 
              style={{ paddingLeft: '40px' }}
              placeholder="輸入批號關鍵字 (例如: P250505...)"
              value={search}
              onChange={e => { setSearch(e.target.value); setSelectedBatchId(null); }}
            />
          </div>
        </div>
      </div>

      <div className="grid-2">
        {/* 左側：血緣圖譜 */}
        <div className="card">
          <div className="card-header">
            <GitBranch size={18} color="var(--accent)" />
            <h3>生產血緣圖譜 Lineage Map</h3>
          </div>
          <div style={{ padding: '1.5rem', maxHeight: '500px', overflowY: 'auto' }}>
            {searchResult ? (
              renderTraceabilityTree(searchResult.batchId)
            ) : (
              <div className="empty-state">
                <Info size={32} opacity={0.2} />
                <p>請輸入批號進行搜尋</p>
              </div>
            )}
          </div>
        </div>

        {/* 右側：聯動修改面板 */}
        <div className="card">
          <div className="card-header">
            <ShieldCheck size={18} color="var(--success)" />
            <h3>聯動品質判定 Cascade QC Update</h3>
          </div>
          <div style={{ padding: '1.5rem' }}>
            {!selectedBatchId ? (
              <div className="empty-state">
                <p>請從左側點選要修改的批號節點</p>
              </div>
            ) : (
              <div>
                <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--color-primary-50)', borderRadius: '12px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-primary-500)', marginBottom: '0.25rem' }}>當前選取節點:</div>
                  <div className="td-bold" style={{ fontSize: '1.1rem' }}>{findBatchById(selectedBatchId)?.batchNo}</div>
                  <div className="td-muted" style={{ fontSize: '0.8rem' }}>{findBatchById(selectedBatchId)?.productName}</div>
                </div>

                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label>變更品質狀態為 <span className="label-sub">New QC Status</span></label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '0.5rem', marginTop: '0.5rem' }}>
                    {qcStatuses.map(s => (
                      <button 
                        key={s.code}
                        className={`btn ${qcForm.status === s.code ? 'btn-primary' : 'btn-ghost'}`}
                        style={{ 
                          fontSize: '0.75rem', 
                          padding: '0.5rem',
                          background: qcForm.status === s.code ? s.color : '#fff',
                          borderColor: s.color,
                          color: qcForm.status === s.code ? '#fff' : s.color
                        }}
                        onClick={() => setQcForm(prev => ({ ...prev, status: s.code }))}
                      >
                        {s.code}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label>聯動範圍設定 <span className="label-sub">Cascade Options</span></label>
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input type="checkbox" checked={qcForm.cascadeUp} onChange={e => setQcForm(prev => ({ ...prev, cascadeUp: e.target.checked }))} />
                      <span style={{ fontSize: '0.85rem' }}>向上追溯所有原材料 (Upstream)</span>
                    </label>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input type="checkbox" checked={qcForm.cascadeDown} onChange={e => setQcForm(prev => ({ ...prev, cascadeDown: e.target.checked }))} />
                      <span style={{ fontSize: '0.85rem' }}>向下同步所有產成品 (Downstream)</span>
                    </label>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label>判定原因 <span className="label-sub">Reason</span></label>
                  <textarea 
                    rows={3} 
                    value={qcForm.remark} 
                    onChange={e => setQcForm(prev => ({ ...prev, remark: e.target.value }))}
                    placeholder="請輸入判定原因..."
                  />
                </div>

                {success && <div className="alert alert-success" style={{ marginBottom: '1rem' }}>{success}</div>}

                <button className="btn btn-primary" style={{ width: '100%', padding: '1rem' }} onClick={handleUpdate}>
                  <ShieldCheck size={18} /> 執行聯動判定更新
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <style>{`
        .trace-tree { position: relative; }
        .trace-tree::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 2px; background: var(--color-primary-50); z-index: -1; }
      `}</style>
    </div>
  );
}
