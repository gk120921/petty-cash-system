import React, { useState } from 'react';
import axios from 'axios';
import { Settings, PlusCircle, X, FileText, CheckCircle, Database, Edit3, Trash2, TrendingUp, Wallet, Download, Upload, AlertCircle } from 'lucide-react';
import { useExpenseContext } from '../context/ExpenseContext';
import { motion, AnimatePresence } from 'framer-motion';

const FormGroup = ({ label, children }) => (
  <div className="space-y-1.5">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
    {children}
  </div>
);

export function SettingsModule() {
  const { 
    categories = [], API_BASE, fetchData, 
    openingBalance, setOpeningBalance, balanceThreshold, setBalanceThreshold, 
    updateConfig, hasPermission 
  } = useExpenseContext();

  const canEditCashLevel = hasPermission('settings', 'edit_cash_level');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ name_zh: '', name_en: '', account_code: '', type: 'EXPENSE' });
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const fileInputRef = React.useRef(null);

  const handleOpenModal = (cat = null) => {
    if (cat) {
      setEditingCategory(cat);
      setFormData({ ...cat });
    } else {
      setEditingCategory(null);
      setFormData({ name_zh: '', name_en: '', account_code: '', type: 'EXPENSE' });
    }
    setIsModalOpen(true);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await axios.put(`${API_BASE}/categories/${editingCategory.id}`, formData);
      } else {
        await axios.post(`${API_BASE}/categories`, formData);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) { alert('操作失敗: ' + err.message); }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('確定要刪除此類別嗎？')) return;
    try {
      await axios.delete(`${API_BASE}/categories/${id}`);
      fetchData();
    } catch (err) { alert('刪除失敗'); }
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const response = await axios({
        url: `${API_BASE}/export_all`,
        method: 'GET',
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `DB_Backup_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert('匯出失敗: ' + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportData = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    setIsImporting(true);
    try {
      const response = await axios.post(`${API_BASE}/expenses/import`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert(`匯入成功！共處理 ${response.data.count} 筆流水帳資料。`);
      fetchData();
    } catch (err) {
      alert('匯入失敗: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-center">
         <div>
            <h3 className="text-3xl font-black tracking-tighter uppercase mb-1">系統設定 Settings</h3>
            <p className="text-slate-400 text-sm font-medium">會計科目與系統參數配置</p>
         </div>
          {hasPermission('settings', 'edit') && (
            <button onClick={() => handleOpenModal()} className="flex items-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-[24px] font-bold shadow-xl hover:bg-slate-800 transition-all active:scale-95">
              <PlusCircle className="w-5 h-5" /> 新增科目
            </button>
          )}
        </div>

        {/* 水位設定區域 (Cash Level Settings) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-[48px] border border-slate-100 shadow-xl overflow-hidden p-10 space-y-6">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center"><Wallet className="w-5 h-5" /></div>
              <div>
                <h4 className="text-xl font-black text-slate-900 italic tracking-tighter">期初餘額設定 INITIAL CAPITAL</h4>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Opening Balance Configuration</p>
              </div>
            </div>
            <div className="bg-slate-50 p-8 rounded-[32px] border border-slate-100">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm font-bold text-slate-600">當前期初餘額:</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-black text-slate-400">USD</span>
                  <input 
                    type="number" 
                    disabled={!canEditCashLevel}
                    className={`bg-white border-2 border-slate-100 rounded-2xl px-6 py-4 font-black text-2xl text-indigo-600 outline-none w-48 text-right focus:border-indigo-500 transition-all ${!canEditCashLevel ? 'opacity-50 cursor-not-allowed bg-slate-100' : ''}`}
                    value={openingBalance}
                    onChange={e => setOpeningBalance(e.target.value)}
                    onBlur={e => updateConfig('opening_balance', e.target.value)}
                  />
                </div>
              </div>
              {!canEditCashLevel && <p className="text-[9px] font-bold text-rose-400 mt-4 italic text-center">※ 您不具備修改此參數的權限 (Permission Required)</p>}
            </div>
          </div>

          <div className="bg-white rounded-[48px] border border-slate-100 shadow-xl overflow-hidden p-10 space-y-6">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center"><TrendingUp className="w-5 h-5" /></div>
              <div>
                <h4 className="text-xl font-black text-slate-900 italic tracking-tighter">警示水位設定 ALERT THRESHOLD</h4>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Low Balance Notification Trigger</p>
              </div>
            </div>
            <div className="bg-rose-50/30 p-8 rounded-[32px] border border-rose-100">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm font-bold text-slate-600">低餘額警示值:</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-black text-slate-400">USD</span>
                  <input 
                    type="number" 
                    disabled={!canEditCashLevel}
                    className={`bg-white border-2 border-rose-100 rounded-2xl px-6 py-4 font-black text-2xl text-rose-600 outline-none w-48 text-right focus:border-rose-500 transition-all ${!canEditCashLevel ? 'opacity-50 cursor-not-allowed bg-slate-100' : ''}`}
                    value={balanceThreshold}
                    onChange={e => setBalanceThreshold(e.target.value)}
                    onBlur={e => updateConfig('balance_threshold', e.target.value)}
                  />
                </div>
              </div>
              {!canEditCashLevel && <p className="text-[9px] font-bold text-rose-400 mt-4 italic text-center">※ 您不具備修改此參數的權限 (Permission Required)</p>}
            </div>
          </div>
        </div>

      <div className="bg-white rounded-[48px] border border-slate-100 shadow-xl overflow-hidden">
         <div className="p-10 border-b border-slate-50 flex items-center gap-4">
            <div className="w-10 h-10 bg-brand-50 text-brand-600 rounded-xl flex items-center justify-center"><Database className="w-5 h-5" /></div>
            <h4 className="text-xl font-black text-slate-900 italic tracking-tighter">會計科目清單 CATEGORIES LIST</h4>
         </div>
         
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                     <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">中文名稱 ZH Name</th>
                     <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">英文名稱 EN Name</th>
                     <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">會計編號 CODE</th>
                     <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">類型 TYPE</th>
                     <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">編輯/刪除 ACTIONS</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {categories.map(c => (
                     <tr key={c.id} className="hover:bg-slate-50 transition-all group">
                        <td className="px-10 py-5 font-bold text-slate-800">{c.name_zh}</td>
                        <td className="px-10 py-5 font-black text-[10px] text-slate-400 uppercase tracking-wider">{c.name_en || '---'}</td>
                        <td className="px-10 py-5 text-center"><span className="bg-slate-100 px-4 py-1.5 rounded-xl font-mono text-xs font-black text-slate-600">{c.account_code || 'N/A'}</span></td>
                        <td className="px-10 py-5 text-center">
                           <div className="flex justify-center">
                              {c.type === 'EXPENSE' ? (
                                <span className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-[10px] font-black bg-rose-600 text-white shadow-lg shadow-rose-600/20">
                                   <TrendingUp className="w-3 h-3 rotate-180" /> 支出 EXPENSE
                                </span>
                              ) : (
                                <span className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-[10px] font-black bg-emerald-600 text-white shadow-lg shadow-emerald-600/20">
                                   <TrendingUp className="w-3 h-3" /> 收入 INCOME
                                </span>
                              )}
                           </div>
                        </td>
                        <td className="px-10 py-5 text-right">
                           <div className="flex items-center justify-end gap-3">
                              {hasPermission('settings', 'edit') && (
                                <button onClick={() => handleOpenModal(c)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-md active:scale-95">
                                   <Edit3 className="w-4 h-4" />
                                   <span className="text-[10px] font-black uppercase tracking-widest">編輯 EDIT</span>
                                </button>
                              )}
                              {hasPermission('settings', 'edit') && (
                                <button onClick={() => handleDeleteCategory(c.id)} className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition-all shadow-md active:scale-95">
                                   <Trash2 className="w-4 h-4" />
                                   <span className="text-[10px] font-black uppercase tracking-widest">刪除 DEL</span>
                                </button>
                              )}
                           </div>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>

      {/* 資料管理區域 (Data Management) */}
      <div className="bg-white rounded-[48px] border border-slate-100 shadow-xl overflow-hidden p-10 space-y-8">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-brand-50 text-brand-600 rounded-xl flex items-center justify-center">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xl font-black text-slate-900 italic tracking-tighter">資料遷移與備份 DATA MIGRATION</h4>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Import / Export Legacy Ledger Data</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-slate-50 p-8 rounded-[32px] border border-slate-100 flex flex-col justify-between">
            <div>
              <h5 className="font-bold text-slate-700 mb-2">舊有資料匯出 (一鍵備份)</h5>
              <p className="text-xs text-slate-400 leading-relaxed mb-6">產出包含所有流水帳、供應商、人員及科目的完整 Excel 備份檔。</p>
            </div>
            <button 
              disabled={isExporting}
              onClick={handleExportData}
              className="w-full flex items-center justify-center gap-3 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all disabled:opacity-50 shadow-lg"
            >
              {isExporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
              {isExporting ? '處理中...' : '開始全域匯出 (Excel)'}
            </button>
          </div>

          <div className="bg-amber-50/50 p-8 rounded-[32px] border border-amber-100 flex flex-col justify-between">
            <div>
              <h5 className="font-bold text-amber-900 mb-2">舊有資料匯入 (一鍵還原)</h5>
              <p className="text-xs text-amber-600/80 leading-relaxed mb-6">支援 CSV 與 Excel 格式。系統會自動解析日期並對接供應商與人員。請謹慎操作。</p>
            </div>
            <input type="file" ref={fileInputRef} onChange={handleImportData} accept=".csv,.xlsx" className="hidden" />
            <button 
              disabled={isImporting}
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-3 py-4 bg-amber-500 text-white rounded-2xl font-bold hover:bg-amber-600 transition-all disabled:opacity-50 shadow-lg shadow-amber-500/20"
            >
              {isImporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
              {isImporting ? '上傳中...' : '選取檔案匯入 (CSV/XLSX)'}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-2xl text-blue-600">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-[10px] font-bold italic">
            提示：建議定期進行匯出備份，以確保資料安全性。匯入舊資料時，系統會自動建立不存在的供應商與類別。
          </p>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-[60px] p-12 w-full max-w-md shadow-2xl">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-3xl font-black tracking-tighter uppercase italic">{editingCategory ? '編輯會計科目 Info' : '新增會計科目 New'}</h3>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="p-3 bg-slate-100 hover:bg-rose-500 hover:text-white rounded-full transition-all"><X className="w-6 h-6" /></button>
                </div>
                <form onSubmit={handleSaveCategory} className="space-y-6">
                  <FormGroup label="中文名稱 ZH Name"><input required className="w-full p-5 bg-slate-50 rounded-[22px] outline-none font-bold focus:ring-4 focus:ring-indigo-500/10 border-2 border-transparent focus:border-indigo-500" value={formData.name_zh} onChange={e => setFormData({...formData, name_zh: e.target.value})} /></FormGroup>
                  <FormGroup label="英文名稱 EN Name"><input required className="w-full p-5 bg-slate-50 rounded-[22px] outline-none font-bold focus:ring-4 focus:ring-indigo-500/10 border-2 border-transparent focus:border-indigo-500" value={formData.name_en} onChange={e => setFormData({...formData, name_en: e.target.value})} /></FormGroup>
                  <FormGroup label="會計編號 Account Code"><input placeholder="e.g. 5101-01" className="w-full p-5 bg-slate-100 rounded-[22px] outline-none font-mono font-black text-brand-600 border-2 border-brand-200 focus:border-brand-600" value={formData.account_code || ''} onChange={e => setFormData({...formData, account_code: e.target.value})} /></FormGroup>
                  <FormGroup label="類型 Type">
                      <select className="w-full p-5 bg-slate-50 rounded-[22px] outline-none font-bold cursor-pointer" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                        <option value="EXPENSE">EXPENSE (支出)</option>
                        <option value="INCOME">INCOME (收入)</option>
                      </select>
                  </FormGroup>
                  <button type="submit" className="w-full py-6 bg-indigo-600 text-white rounded-[32px] font-black text-xl shadow-2xl shadow-indigo-600/30 active:scale-95 transition-all mt-4">儲存變更 SAVE</button>
                </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
