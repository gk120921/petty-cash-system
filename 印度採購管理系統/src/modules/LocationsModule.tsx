// ============================================================
// 儲位建檔 — CRUD 管理 (含倉庫類別分類)
// ============================================================

import React, { useState, useMemo } from 'react';
import { LocationDB } from '../db';
import type { StorageLocation, WarehouseCategory } from '../types';
import { MapPin, Plus, Trash2, Edit3, Check, X, Shield, Package, Factory } from 'lucide-react';

const CATEGORIES: { value: WarehouseCategory; label: string; icon: any; color: string }[] = [
  { value: 'NORMAL',  label: '一般倉庫', icon: Package, color: 'var(--info)' },
  { value: 'SUB',     label: '委外倉庫', icon: Shield,  color: 'var(--warning)' },
  { value: 'PROCESS', label: '製程倉庫', icon: Factory, color: 'var(--accent)' },
];

export default function LocationsModule() {
  const [tick, setTick] = useState(0);
  const [form, setForm] = useState({ 
    warehouseCode: '', 
    warehouseCategory: 'NORMAL' as WarehouseCategory,
    shelfLocation: '', 
    description: '' 
  });
  const [editId, setEditId] = useState<string | null>(null);
  const [editDesc, setEditDesc] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const locations = useMemo(() => LocationDB.getAll(), [tick]);

  const handleAdd = () => {
    setError(''); setSuccess('');
    try {
      if (!form.warehouseCode.trim()) throw new Error('請輸入倉庫代號');
      if (!form.shelfLocation.trim()) throw new Error('請輸入儲位代號');
      LocationDB.create({
        warehouseCode: form.warehouseCode.trim().toUpperCase(),
        warehouseCategory: form.warehouseCategory,
        shelfLocation: form.shelfLocation.trim().toUpperCase(),
        description: form.description.trim(),
      });
      setForm({ ...form, warehouseCode: '', shelfLocation: '', description: '' });
      setSuccess('✓ 儲位新增成功');
      setTick(t => t + 1);
    } catch (e: any) { setError(e.message); }
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('確定要刪除此儲位嗎？')) return;
    setError(''); setSuccess('');
    try {
      LocationDB.delete(id);
      setSuccess('✓ 儲位已刪除');
      setTick(t => t + 1);
    } catch (e: any) { setError(e.message); }
  };

  const handleUpdate = (id: string) => {
    try {
      LocationDB.update(id, { description: editDesc });
      setEditId(null);
      setTick(t => t + 1);
    } catch (e: any) { setError(e.message); }
  };

  const handleToggle = (loc: StorageLocation) => {
    try {
      LocationDB.update(loc.locationId, { isActive: !loc.isActive });
      setTick(t => t + 1);
    } catch (e: any) { setError(e.message); }
  };

  // 依倉庫分組
  const grouped = useMemo(() => {
    const map = new Map<string, StorageLocation[]>();
    locations.forEach(l => {
      const arr = map.get(l.warehouseCode) || [];
      arr.push(l);
      map.set(l.warehouseCode, arr);
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [locations]);

  return (
    <div className="fade-in">
      <div className="page-section-header">
        <div>
          <h2>儲位建檔 Storage Locations</h2>
          <p>管理倉庫代號與儲位，支援「製程/委外/一般」分類控制</p>
        </div>
      </div>

      {/* 新增表單 */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <Plus size={18} color="var(--accent)" />
          <h3>新增儲位 Add Location</h3>
        </div>

        {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>⚠ {error}</div>}
        {success && <div className="alert alert-success" style={{ marginBottom: '1rem' }}>{success}</div>}

        <div className="form-grid">
          <div className="form-group">
            <label>倉庫類別 <span className="label-sub">Category</span></label>
            <select 
              value={form.warehouseCategory}
              onChange={e => setForm(f => ({ ...f, warehouseCategory: e.target.value as WarehouseCategory }))}
            >
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>倉庫代號 <span className="label-sub">Warehouse Code</span></label>
            <input
              placeholder="e.g. WS001"
              value={form.warehouseCode}
              onChange={e => setForm(f => ({ ...f, warehouseCode: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label>儲位代號 <span className="label-sub">Shelf Location</span></label>
            <input
              placeholder="e.g. A01"
              value={form.shelfLocation}
              onChange={e => setForm(f => ({ ...f, shelfLocation: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label>說明 <span className="label-sub">Description</span></label>
            <input
              placeholder="e.g. 主倉 A 區 1 排"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
          </div>
        </div>
        <div style={{ marginTop: '1rem', textAlign: 'right' }}>
          <button className="btn btn-primary" onClick={handleAdd}>
            <Plus size={16} /> 新增儲位
          </button>
        </div>
      </div>

      {/* 儲位列表 (依倉庫分組) */}
      {grouped.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">📍</div>
            <p>尚無儲位資料，請先新增</p>
          </div>
        </div>
      ) : (
        grouped.map(([whCode, locs]) => {
          const category = CATEGORIES.find(c => c.value === locs[0].warehouseCategory);
          const Icon = category?.icon || MapPin;
          return (
            <div className="card" key={whCode} style={{ marginBottom: '1rem' }}>
              <div className="card-header">
                <Icon size={18} color={category?.color || 'var(--accent)'} />
                <h3>倉庫 {whCode}</h3>
                <span className="badge-status" style={{ marginLeft: '10px', background: category?.color, color: '#fff', fontSize: '0.7rem' }}>
                  {category?.label}
                </span>
                <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--color-primary-500)' }}>
                  {locs.length} 個儲位
                </span>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>儲位代號</th>
                      <th>說明</th>
                      <th>狀態</th>
                      <th>建立時間</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {locs.map(loc => (
                      <tr key={loc.locationId} style={{ opacity: loc.isActive ? 1 : 0.5 }}>
                        <td className="td-mono td-bold">{loc.shelfLocation}</td>
                        <td>
                          {editId === loc.locationId ? (
                            <input
                              value={editDesc}
                              onChange={e => setEditDesc(e.target.value)}
                              style={{ width: '200px' }}
                            />
                          ) : (
                            loc.description || <span className="td-muted">—</span>
                          )}
                        </td>
                        <td>
                          <button
                            className={`badge-status ${loc.isActive ? 'badge-active' : 'badge-depleted'}`}
                            style={{ cursor: 'pointer', border: 'none' }}
                            onClick={() => handleToggle(loc)}
                          >
                            {loc.isActive ? '啟用' : '停用'}
                          </button>
                        </td>
                        <td style={{ fontSize: '0.8rem' }}>
                          {new Date(loc.createdAt).toLocaleDateString('zh-TW')}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.375rem' }}>
                            {editId === loc.locationId ? (
                              <>
                                <button className="btn-icon print" onClick={() => handleUpdate(loc.locationId)} title="儲存">
                                  <Check size={15} />
                                </button>
                                <button className="btn-icon" onClick={() => setEditId(null)} title="取消">
                                  <X size={15} />
                                </button>
                              </>
                            ) : (
                              <button
                                className="btn-icon"
                                onClick={() => { setEditId(loc.locationId); setEditDesc(loc.description); }}
                                title="編輯"
                              >
                                <Edit3 size={15} />
                              </button>
                            )}
                            <button className="btn-icon danger" onClick={() => handleDelete(loc.locationId)} title="刪除">
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
