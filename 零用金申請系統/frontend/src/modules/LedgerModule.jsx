import React, { useState } from 'react';
import axios from 'axios';
import {
  Plus, Search, Filter, Download, Archive,
  Settings, Loader2, PlusCircle, Wallet, Calendar, TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useExpenseContext } from '../context/ExpenseContext';
import { LedgerTable } from '../components/LedgerTable';
import { BatchActionBar } from '../components/BatchActionBar';

export function LedgerModule({ permissions }) {
  const {
    expenses, ledgerData, stats, fetchData, searchTerm, setSearchTerm, filters, setFilters,
    selectedIds, setSelectedIds, archiveExpenses,
    openingBalance, setOpeningBalance, balanceThreshold, setBalanceThreshold, updateConfig,
    formData, setFormData, initialFormData,
    categories = [], suppliers = [], personnel = [], handleBlurTranslate, loading,
    API_BASE, language, toggleLanguage, user, hasPermission
  } = useExpenseContext();

  const canEditCashLevel = hasPermission('settings', 'edit_cash_level');
  const storageKey = `pettycash_cols_${user?.employee_id || 'guest'}`;

  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState(() => {
    const saved = localStorage.getItem(storageKey);
    return saved ? JSON.parse(saved) : {
      id: true, invoice_date: true, reimbursement_date: true, supplier: true, detail_zh: true, detail_en: false, category: true, incoming: true, outgoing: true, personnel: true, status: true, receipt_v: true, photo_v: true
    };
  });

  const toggleColumn = (col) => {
    const newCols = { ...visibleColumns, [col]: !visibleColumns[col] };
    setVisibleColumns(newCols);
    localStorage.setItem(storageKey, JSON.stringify(newCols));
  };
  const [isSubmitting, setIsSubmitting] = useState(false);



  const handleQuickSave = async (e) => {
    e.preventDefault();
    if (!formData.category_id || (!formData.outgoing && !formData.incoming)) {
      alert('請填寫類別與金額');
      return;
    }
    setIsSubmitting(true);
    try {
      await axios.post(`${API_BASE}/expenses`, formData);
      setFormData(initialFormData);
      fetchData();
    } catch (err) {
      alert('儲存失敗: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBatchPrint = () => {
    const printItems = ledgerData.filter(item => selectedIds.includes(item.id));
    const printWindow = window.open('', '_blank');
    const html = `
      <html>
        <head>
          <title>Print Records</title>
          <style>
            body { font-family: sans-serif; padding: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { bg-color: #f8f9fa; }
          </style>
        </head>
        <body>
          <h2>零用金支用明細表 Report</h2>
          <table>
            <thead><tr><th>SN</th><th>日期</th><th>供應商</th><th>類別</th><th>細目</th><th>支出</th></tr></thead>
            <tbody>
              ${printItems.map(item => `<tr><td>#${item.id}</td><td>${item.invoice_date}</td><td>${item.supplier_name}</td><td>${item.category_name}</td><td>${item.detail_zh}</td><td>${item.outgoing}</td></tr>`).join('')}
            </tbody>
          </table>
          <script>window.onload=()=>{window.print();}</script>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 pb-20">
      {/* 1. Opening Balance Section */}
      <section className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-xl shadow-slate-200/40 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-lg">
            <Wallet className="w-6 h-6" />
          </div>
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div>
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Initial Capital</h4>
              <div className="flex items-center gap-3">
                <span className="text-sm font-black text-slate-900 italic">期初餘額:</span>
                <div className="bg-slate-100 rounded-xl px-5 py-2 font-black text-xl text-brand-600 min-w-[140px] text-center border border-slate-200/50">
                  ${Number(openingBalance).toLocaleString()}
                </div>
              </div>
            </div>
            <div className="h-10 w-[1px] bg-slate-100 hidden md:block" />
            <div>
              <h4 className="text-[10px] font-black text-rose-400 uppercase tracking-[0.2em] mb-2">Alert System</h4>
              <div className="flex items-center gap-3">
                <span className="text-sm font-black text-slate-900 italic">警示水位 Threshold:</span>
                <div className="bg-rose-50 rounded-xl px-5 py-2 font-black text-xl text-rose-600 min-w-[140px] text-center border border-rose-100/50">
                  ${Number(balanceThreshold).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-4">
          <button onClick={() => fetchData()} className="p-4 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-200 transition-all">
            <Loader2 className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={toggleLanguage}
            className="flex items-center gap-3 px-6 py-4 bg-indigo-50 text-indigo-600 rounded-2xl font-black hover:bg-indigo-100 transition-all border border-indigo-100"
          >
            <TrendingUp className="w-5 h-5" />
            {language === 'zh' ? '切換英文 (Switch to EN)' : '切換中文 (Switch to ZH)'}
          </button>

          <button
            disabled={loading}
            onClick={async (e) => {
              const btn = e.currentTarget;
              const originalContent = btn.innerHTML;
              btn.disabled = true;
              btn.innerHTML = '<span class="flex items-center gap-2"><svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> ⏳ 報表產生中...</span>';

              try {
                const response = await axios({
                  url: `${API_BASE}/export_v2`,
                  method: 'GET',
                  responseType: 'blob'
                });

                const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
                const link = document.createElement('a');
                link.href = url;
                const filename = `PettyCash_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
                link.setAttribute('download', filename);
                document.body.appendChild(link);
                link.click();

                // 延長釋放時間至 30 秒，確保 Chrome 寫入硬碟成功
                setTimeout(() => {
                  document.body.removeChild(link);
                  window.URL.revokeObjectURL(url);
                }, 30000);
              } catch (err) {
                alert('匯出失敗: ' + err.message);
              } finally {
                btn.disabled = false;
                btn.innerHTML = originalContent;
              }
            }}
            className="flex items-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg disabled:opacity-50 min-w-[220px]"
          >
            <Download className="w-5 h-5" /> 🚀 點此下載最新報表 (v3)
          </button>

          <button
            disabled={loading}
            onClick={async (e) => {
              const btn = e.currentTarget;
              const originalContent = btn.innerHTML;
              btn.disabled = true;
              btn.innerHTML = '⏳ 盤點報表產生中...';

              try {
                const response = await axios({
                  url: `${API_BASE}/export_inventory`,
                  method: 'GET',
                  responseType: 'blob'
                });

                const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `PettyCash_Inventory_${new Date().toISOString().split('T')[0]}.xlsx`);
                document.body.appendChild(link);
                link.click();
                setTimeout(() => { document.body.removeChild(link); window.URL.revokeObjectURL(url); }, 30000);
              } catch (err) {
                alert('匯出失敗: ' + err.message);
              } finally {
                btn.disabled = false;
                btn.innerHTML = originalContent;
              }
            }}
            className="flex items-center gap-3 px-8 py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg disabled:opacity-50 min-w-[220px]"
          >
            <Archive className="w-5 h-5" /> 📦 零用金盤點下載
          </button>
        </div>
      </section>


      {/* 3. Filter & Table Section */}
      <section className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-xl shadow-slate-200/40">
        {/* Month Quick Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 bg-slate-50/50 p-2 rounded-2xl border border-slate-100">
          <button
            onClick={() => setFilters({ ...filters, startDate: '', endDate: '' })}
            className={`px-6 py-2.5 rounded-xl font-black text-xs transition-all ${(!filters.startDate && !filters.endDate) ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/20' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            全部 ALL
          </button>
          {(() => {
            const months = [];
            expenses.forEach(e => {
              if (!e.invoice_date) return;
              const date = new Date(e.invoice_date);
              if (isNaN(date)) return;
              const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
              const label = `${date.getFullYear()}年 ${date.getMonth() + 1}月`;
              if (!months.find(m => m.key === key)) months.push({ key, label, year: date.getFullYear(), month: date.getMonth() });
            });

            return months.sort((a, b) => b.key.localeCompare(a.key)).map(m => {
              const isActive = filters.startDate === `${m.key}-01`;
              return (
                <button
                  key={m.key}
                  onClick={() => {
                    const start = `${m.key}-01`;
                    const end = new Date(m.year, m.month + 1, 0).toISOString().split('T')[0];
                    setFilters({ ...filters, startDate: start, endDate: end });
                  }}
                  className={`px-6 py-2.5 rounded-xl font-black text-xs transition-all ${isActive ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/20' : 'text-slate-500 hover:bg-slate-100'}`}
                >
                  {m.label}
                </button>
              );
            });
          })()}
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-4">
            <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-bold transition-all ${showFilters ? 'bg-brand-600 text-white shadow-lg' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              <Filter className="w-4 h-4" /> 篩選器 FILTERS
            </button>

            <div className="relative group">
              <button className="p-3 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-200 transition-all">
                <Settings className="w-5 h-5" />
              </button>
              <div className="absolute left-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">顯示欄位 Columns</p>
                <div className="space-y-2">
                  {[
                    { id: 'id', label: '序號 SN' },
                    { id: 'invoice_date', label: '發票日期 Inv. Date' },
                    { id: 'reimbursement_date', label: '報帳日期 Reimb. Date' },
                    { id: 'supplier', label: '供應商 Supplier' },
                    { id: 'detail_zh', label: '細目 Detail (ZH)' },
                    { id: 'detail_en', label: '細目 Detail (EN)' },
                    { id: 'category', label: '類別 Category' },
                    { id: 'incoming', label: '收入 In' },
                    { id: 'outgoing', label: '支出 Out' },
                    { id: 'personnel', label: '經辦 Personnel' },
                    { id: 'status', label: '狀態 Status' },
                    { id: 'receipt_v', label: '憑證 Bill' },
                    { id: 'photo_v', label: '照片 Photo' }
                  ].map(col => (
                    <label key={col.id} className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition-all">
                      <input type="checkbox" checked={visibleColumns[col.id] !== false} onChange={() => toggleColumn(col.id)} className="w-4 h-4 rounded text-brand-600" />
                      <span className="text-xs font-bold text-slate-600">{col.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            {selectedIds.length > 0 && (
              <button onClick={() => archiveExpenses(selectedIds)} className="flex items-center gap-3 px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg">
                <Archive className="w-4 h-4" /> 批次存檔 ({selectedIds.length})
              </button>
            )}
          </div>
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-72">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" placeholder="搜尋 Search..." className="w-full pl-12 pr-6 py-3 bg-slate-100 rounded-2xl outline-none text-sm font-bold focus:ring-2 focus:ring-brand-500/20 transition-all" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <button onClick={() => setShowColumnSettings(!showColumnSettings)} className="p-3 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-200 transition-all"><Settings className="w-5 h-5" /></button>
          </div>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-6 border-t border-slate-100">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">類別 Category</label>
                  <select className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 outline-none font-bold text-sm" value={filters.category} onChange={e => setFilters({ ...filters, category: e.target.value })}>
                    <option value="all">所有類別</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>
                        {language === 'zh' ? c.name_zh : (c.name_en || c.name_zh)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">經辦 Personnel</label>
                  <select className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 outline-none font-bold text-sm" value={filters.personnel} onChange={e => setFilters({ ...filters, personnel: e.target.value })}>
                    <option value="all">所有人員</option>
                    {personnel.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">狀態 Status</label>
                  <select className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 outline-none font-bold text-sm" value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}>
                    <option value="all">所有狀態</option>
                    <option value="PAID">已付款</option>
                    <option value="TO_PAY">待付款</option>
                  </select>
                </div>
                <div className="space-y-2 col-span-1 md:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">發票日期區間 Invoice Period</label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <select
                      className="bg-slate-50 border-none rounded-xl px-4 py-3 text-xs font-bold outline-none focus:ring-2 focus:ring-brand-500/20"
                      onChange={(e) => {
                        const val = e.target.value;
                        const now = new Date();
                        let start = '', end = '';

                        if (val === 'this_month') {
                          start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
                          end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
                        } else if (val === 'last_month') {
                          start = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
                          end = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
                        } else if (val === 'this_year') {
                          start = `${now.getFullYear()}-01-01`;
                          end = `${now.getFullYear()}-12-31`;
                        } else if (val === 'today') {
                          start = end = now.toISOString().split('T')[0];
                        }

                        if (val !== 'custom') {
                          setFilters({ ...filters, startDate: start, endDate: end });
                        }
                      }}
                    >
                      <option value="custom">自定義區知 Custom...</option>
                      <option value="today">今日 Today</option>
                      <option value="this_month">本月 This Month</option>
                      <option value="last_month">上個月 Last Month</option>
                      <option value="this_year">本年度 This Year</option>
                    </select>
                    <div className="flex gap-2 flex-1">
                      <input type="date" className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-xs font-bold" value={filters.startDate} onChange={e => setFilters({ ...filters, startDate: e.target.value })} />
                      <input type="date" className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-xs font-bold" value={filters.endDate} onChange={e => setFilters({ ...filters, endDate: e.target.value })} />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <LedgerTable visibleColumns={visibleColumns} permissions={permissions} />
      </section>

      <BatchActionBar handleBatchPrint={handleBatchPrint} permissions={permissions} />
    </motion.div>
  );
}
