// ============================================================
// v2.0 系統設定 — 資料管理與操作者設定
// ============================================================

import React, { useState } from 'react';
import { Settings, Save, RotateCcw, Download, Upload, Trash2 } from 'lucide-react';

export default function SettingsModule() {
  const [success, setSuccess] = useState('');

  const handleExport = () => {
    const data = {
      locations: localStorage.getItem('wms_locations'),
      products: localStorage.getItem('wms_products'),
      inventory: localStorage.getItem('wms_inventory'),
      issues: localStorage.getItem('wms_issues'),
      audit: localStorage.getItem('wms_audit_log'),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wms_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.locations) localStorage.setItem('wms_locations', data.locations);
        if (data.products) localStorage.setItem('wms_products', data.products);
        if (data.inventory) localStorage.setItem('wms_inventory', data.inventory);
        if (data.issues) localStorage.setItem('wms_issues', data.issues);
        if (data.audit) localStorage.setItem('wms_audit_log', data.audit);
        
        showMsg('✓ 資料匯入成功！系統將自動重新整理。');
        setTimeout(() => window.location.reload(), 1500);
      } catch (err) {
        alert('匯入失敗：檔案格式不正確');
      }
    };
    reader.readAsText(file);
  };

  const handleClearAll = () => {
    if (!window.confirm('⚠️ 警告：這將會清除所有庫存、單據與設定資料！此操作不可復原。確定要繼續嗎？')) return;
    localStorage.clear();
    window.location.reload();
  };

  const showMsg = (txt: string) => {
    setSuccess(txt);
    setTimeout(() => setSuccess(''), 3000);
  };

  return (
    <div className="fade-in">
      <div className="page-section-header">
        <div>
          <h2>系統設定 Settings</h2>
          <p>管理系統資料備份、還原與重置</p>
        </div>
      </div>

      <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        
        {/* 資料備份 */}
        <div className="card">
          <div className="card-header">
            <Save size={18} color="var(--accent)" />
            <h3>資料備份與遷移</h3>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-primary-500)', marginBottom: '1.25rem' }}>
            將所有庫存資料、BOM 與儲位設定匯出或匯入 JSON 檔案，可用於資料移轉或備份。
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            <button className="btn btn-primary" onClick={handleExport}>
              <Download size={16} /> 匯出資料備份
            </button>
            <label className="btn btn-ghost" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Upload size={16} /> 匯入資料還原
              <input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
            </label>
          </div>
        </div>

        {/* 系統重置 */}
        <div className="card" style={{ borderLeft: '4px solid var(--danger)' }}>
          <div className="card-header">
            <RotateCcw size={18} color="var(--danger)" />
            <h3>系統重置</h3>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-primary-500)', marginBottom: '1.25rem' }}>
            刪除本地端瀏覽器儲存的所有 WMS 相關資料。執行後系統將回到初始狀態。
          </p>
          <button className="btn btn-ghost" style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={handleClearAll}>
            <Trash2 size={16} /> 清除所有資料並重置
          </button>
        </div>

      </div>

      {success && <div className="alert alert-success" style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 1000 }}>{success}</div>}
    </div>
  );
}
