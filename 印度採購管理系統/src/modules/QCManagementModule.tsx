// ============================================================
// 品檢碼管理模組 — 支援自定義名稱、顏色與管制權限
// ============================================================

import React, { useState, useMemo } from 'react';
import { QCStatusDB } from '../db';
import type { QCStatus } from '../types';
import { ShieldCheck, Plus, Trash2, Edit3, Save, X, Lock, Unlock, Palette } from 'lucide-react';

export default function QCManagementModule({ lang = 'ZH' }: { lang?: 'ZH' | 'EN' }) {
  const [tick, setTick] = useState(0);
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<QCStatus, 'isActive'>>({
    code: '',
    name: '',
    nameEn: '',
    color: '#3b82f6',
    canOutbound: false,
    canProduce: false,
    restrictedCustomers: '',
    prohibitedCustomers: '',
    description: '',
  });

  const allStatus = useMemo(() => QCStatusDB.getAll(), [tick]);

  const TRANSLATIONS: Record<string, string> = {
    '合格品': 'Approved/Pass',
    '重工品': 'Rework',
    '不合格品': 'Reject/NC',
    '特採品': 'Concession',
    '全檢': '100% Inspection',
    '長時間驗證': 'Validation',
    '報廢品': 'Scrap',
    '待檢驗品': 'Pending Inspection',
    '生管課專用': 'Planning Only',
    '裝運課專用': 'Logistics Only',
  };

  const handleNameChange = (name: string) => {
    setForm(prev => ({
      ...prev,
      name,
      nameEn: TRANSLATIONS[name] || prev.nameEn
    }));
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!form.code.trim()) throw new Error('請輸入品檢碼');
      QCStatusDB.create(form);
      setForm({ code: '', name: '', nameEn: '', color: '#3b82f6', canOutbound: false, canProduce: false, restrictedCustomers: '', prohibitedCustomers: '', description: '' });
      setTick(t => t + 1);
    } catch (e: any) { alert(e.message); }
  };

  const handleUpdate = (code: string) => {
    try {
      QCStatusDB.update(code, form);
      setEditingCode(null);
      setTick(t => t + 1);
    } catch (e: any) { alert(e.message); }
  };

  const handleDelete = (code: string) => {
    if (!window.confirm(`確定要刪除品檢碼 "${code}" 嗎？`)) return;
    try {
      QCStatusDB.delete(code);
      setTick(t => t + 1);
    } catch (e: any) { alert(e.message); }
  };

  const startEdit = (q: QCStatus) => {
    setEditingCode(q.code);
    setForm(q);
  };

  return (
    <div className="fade-in">
      <div className="page-section-header">
        <div>
          <h2>品檢碼管理 QC Code Management</h2>
          <p>自定義品質狀態、顏色顯示以及對應的出庫/生產管制權限。</p>
        </div>
      </div>

      <div className="grid-2">
        {/* 左側：新增表單 */}
        <div className="card">
          <div className="card-header">
            <Plus size={18} color="var(--accent)" />
            <h3>{editingCode ? '修改品檢碼' : '新增品檢碼'}</h3>
          </div>
          <form onSubmit={editingCode ? (e) => { e.preventDefault(); handleUpdate(editingCode); } : handleCreate}>
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label>品檢碼 <span className="label-sub">Unique Code (e.g. OK, NG)</span></label>
              <input 
                disabled={!!editingCode}
                value={form.code} 
                onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} 
                placeholder="輸入代碼..." 
                required 
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
              <div className="form-group">
                <label>名稱 <span className="label-sub">Name (CH)</span></label>
                <input 
                  value={form.name} 
                  onChange={e => handleNameChange(e.target.value)} 
                  placeholder="輸入名稱 (如：合格品)" 
                  required 
                />
              </div>
              <div className="form-group">
                <label>英文名稱 <span className="label-sub">Name (EN)</span></label>
                <input 
                  value={form.nameEn} 
                  onChange={e => setForm({ ...form, nameEn: e.target.value })} 
                  placeholder="Auto-translated or manual input..." 
                  required 
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label>顏色 <span className="label-sub">Display Color</span></label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input 
                  type="color" 
                  value={form.color} 
                  onChange={e => setForm({ ...form, color: e.target.value })} 
                  style={{ width: '40px', height: '40px', padding: '2px', borderRadius: '4px', cursor: 'pointer' }} 
                />
                <input 
                  value={form.color} 
                  onChange={e => setForm({ ...form, color: e.target.value })} 
                  placeholder="#000000" 
                  style={{ flex: 1 }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
              <div className="form-group">
                <label>出庫管制 <span className="label-sub">Outbound</span></label>
                <button 
                  type="button"
                  className={`btn ${form.canOutbound ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ width: '100%', borderColor: form.canOutbound ? 'var(--success)' : 'var(--error)', color: form.canOutbound ? '#fff' : 'var(--error)' }}
                  onClick={() => setForm({ ...form, canOutbound: !form.canOutbound })}
                >
                  {form.canOutbound ? <Unlock size={14} style={{ marginRight: '4px' }} /> : <Lock size={14} style={{ marginRight: '4px' }} />}
                  {form.canOutbound ? '允許出庫' : '禁止出庫'}
                </button>
              </div>
              <div className="form-group">
                <label>生產管制 <span className="label-sub">Produce</span></label>
                <button 
                  type="button"
                  className={`btn ${form.canProduce ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ width: '100%', borderColor: form.canProduce ? 'var(--success)' : 'var(--error)', color: form.canProduce ? '#fff' : 'var(--error)' }}
                  onClick={() => setForm({ ...form, canProduce: !form.canProduce })}
                >
                  {form.canProduce ? <Unlock size={14} style={{ marginRight: '4px' }} /> : <Lock size={14} style={{ marginRight: '4px' }} />}
                  {form.canProduce ? '允許生產' : '禁止生產'}
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
              <div className="form-group">
                <label>限定出給特定客戶 <span className="label-sub">Restricted to Customers</span></label>
                <input 
                  value={form.restrictedCustomers} 
                  onChange={e => setForm({ ...form, restrictedCustomers: e.target.value.toUpperCase() })} 
                  placeholder="e.g. T08AY, CUST001" 
                />
              </div>
              <div className="form-group">
                <label>禁止出給特定客戶 <span className="label-sub">Prohibited Customers</span></label>
                <input 
                  value={form.prohibitedCustomers} 
                  onChange={e => setForm({ ...form, prohibitedCustomers: e.target.value.toUpperCase() })} 
                  placeholder="e.g. CUST002" 
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label>說明 <span className="label-sub">Description</span></label>
              <textarea 
                value={form.description} 
                onChange={e => setForm({ ...form, description: e.target.value })} 
                placeholder="輸入該狀態的詳細定義..." 
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {editingCode && (
                <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => { setEditingCode(null); setForm({ code: '', name: '', color: '#3b82f6', canOutbound: false, canProduce: false, description: '' }); }}>
                  取消
                </button>
              )}
              <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>
                {editingCode ? <Save size={16} /> : <Plus size={16} />}
                {editingCode ? '儲存修改' : '建立品檢碼'}
              </button>
            </div>
          </form>
        </div>

        {/* 右側：清單視圖 */}
        <div className="card">
          <div className="card-header">
            <ShieldCheck size={18} color="var(--info)" />
            <h3>目前品檢碼列表</h3>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>代碼 CODE</th>
                  <th>名稱 NAME</th>
                  <th>管制權限 RULES</th>
                  <th>操作 OPS</th>
                </tr>
              </thead>
              <tbody>
                {allStatus.map(q => (
                  <tr key={q.code}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: q.color }}></div>
                        <span className="td-mono">{q.code}</span>
                      </div>
                    </td>
                    <td>
                      {lang === 'ZH' ? (
                        <>
                          <div className="td-bold">{q.name}</div>
                          <div className="td-muted" style={{ fontSize: '0.7rem' }}>{q.nameEn}</div>
                        </>
                      ) : (
                        <>
                          <div className="td-bold">{q.nameEn}</div>
                          <div className="td-muted" style={{ fontSize: '0.7rem' }}>{q.name}</div>
                        </>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <span className={`badge-status ${q.canOutbound ? 'badge-active' : 'badge-raw'}`} style={{ fontSize: '0.6rem', padding: '2px 6px' }}>
                          {q.canOutbound ? '可出庫' : '禁出'}
                        </span>
                        <span className={`badge-status ${q.canProduce ? 'badge-active' : 'badge-finished'}`} style={{ fontSize: '0.6rem', padding: '2px 6px' }}>
                          {q.canProduce ? '可生產' : '禁產'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <button className="btn-icon" onClick={() => startEdit(q)}><Edit3 size={14} /></button>
                        {q.code !== 'OK' && (
                          <button className="btn-icon danger" onClick={() => handleDelete(q.code)}><Trash2 size={14} /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
