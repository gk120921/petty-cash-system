import React, { useEffect, useState } from 'react';
import { useExpenseContext } from '../context/ExpenseContext';
import { 
  Archive, RotateCcw, Edit2, Trash2, Search, Filter, Calendar, 
  ChevronDown, FileSpreadsheet, Download, RefreshCw, Settings
} from 'lucide-react';
import { LedgerTable } from '../components/LedgerTable';
import { motion, AnimatePresence } from 'framer-motion';

export function ArchiveModule({ permissions }) {
  const { 
    expenses, ledgerData, stats, fetchData, searchTerm, setSearchTerm, filters, setFilters,
    selectedIds, setSelectedIds, restoreExpenses, deleteExpense, batchDeleteExpenses, handleEditRecord,
    categories = [], personnel = [], setShowArchived, loading, API_BASE, hasPermission
  } = useExpenseContext();

  const [showFilters, setShowFilters] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    id: true, invoice_date: true, reimbursement_date: true, supplier: true, detail_zh: true, category: true, incoming: true, outgoing: true, personnel: true, status: true, receipt_v: true, photo_v: true
  });

  const toggleColumn = (col) => {
    setVisibleColumns(prev => ({ ...prev, [col]: !prev[col] }));
  };

  // Set showArchived to true when entering this module
  useEffect(() => {
    setShowArchived(true);
    fetchData();
    // Cleanup: set back to false when leaving
    return () => setShowArchived(false);
  }, [setShowArchived]);

  const handleBatchRestore = async () => {
    const success = await restoreExpenses(selectedIds);
    if (success) setSelectedIds([]);
  };

  return (
    <div className="space-y-10 pb-20">
      {/* 1. Header & Stats */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <Archive className="w-5 h-5 text-indigo-600" />
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">歸檔紀錄 Archive</h1>
          </div>
          <p className="text-slate-400 font-medium text-sm">檢視並管理已結案或存檔的收支紀錄</p>
        </div>

        <div className="flex items-center gap-4">
           <div className="bg-white px-6 py-4 rounded-[24px] border border-slate-100 shadow-sm flex flex-col items-end">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Archived Total</span>
              <span className="text-xl font-black text-indigo-600 italic">
                ${ledgerData.reduce((sum, item) => sum + (Number(item.outgoing) || 0), 0).toLocaleString()}
              </span>
           </div>
        </div>
      </header>

      {/* 2. Month Quick Navigation */}
      <div className="flex flex-wrap gap-2 mb-8 bg-white p-3 rounded-[24px] border border-slate-100 shadow-sm">
        <button 
          onClick={() => setFilters({ ...filters, startDate: '', endDate: '' })}
          className={`px-6 py-2.5 rounded-xl font-black text-xs transition-all ${(!filters.startDate && !filters.endDate) ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-100'}`}
        >
          全部 ALL
        </button>
        {(() => {
          const months = [];
          (expenses || []).forEach(e => {
            if (!e.invoice_date) return;
            const date = new Date(e.invoice_date);
            if (isNaN(date.getTime())) return;
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
                className={`px-6 py-2.5 rounded-xl font-black text-xs transition-all ${isActive ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-100'}`}
              >
                {m.label}
              </button>
            );
          });
        })()}
      </div>

      {/* 3. Action Bar */}
      <section className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-xl shadow-slate-200/40">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
           <div className="flex items-center gap-4">
              <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-bold transition-all ${showFilters ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
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
                      { id: 'detail_zh', label: '細目 Detail' },
                      { id: 'category', label: '類別 Category' },
                      { id: 'incoming', label: '收入 In' },
                      { id: 'outgoing', label: '支出 Out' },
                      { id: 'personnel', label: '經辦 Personnel' },
                      { id: 'status', label: '狀態 Status' },
                      { id: 'receipt_v', label: '憑證 Bill' },
                      { id: 'photo_v', label: '照片 Photo' }
                    ].map(col => (
                      <label key={col.id} className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition-all">
                        <input type="checkbox" checked={visibleColumns[col.id] !== false} onChange={() => toggleColumn(col.id)} className="w-4 h-4 rounded text-indigo-600" />
                        <span className="text-xs font-bold text-slate-600">{col.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              {selectedIds.length > 0 && (
                <div className="flex gap-2">
                   {hasPermission('archive', 'restore') && (
                    <button onClick={handleBatchRestore} className="flex items-center gap-3 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg">
                      <RotateCcw className="w-4 h-4" /> 批次退回 ({selectedIds.length})
                    </button>
                   )}
                   {hasPermission('archive', 'delete') && (
                    <button onClick={() => batchDeleteExpenses(selectedIds)} className="p-3 bg-rose-50 text-rose-600 rounded-2xl hover:bg-rose-100 transition-all">
                      <Trash2 className="w-5 h-5" />
                    </button>
                   )}
                </div>
              )}
           </div>
           
           <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="relative flex-1 md:w-72">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" placeholder="搜尋 Search..." className="w-full pl-12 pr-6 py-3 bg-slate-100 rounded-2xl outline-none text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 transition-all" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              </div>
              <button onClick={() => fetchData()} className="p-3 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-200 transition-all">
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
           </div>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-8 mt-8 border-t border-slate-100">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">類別 Category</label>
                    <select className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 outline-none font-bold text-sm" value={filters.category} onChange={e => setFilters({...filters, category: e.target.value})}>
                      <option value="all">所有類別</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name_zh}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">經辦 Personnel</label>
                    <select className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 outline-none font-bold text-sm" value={filters.personnel} onChange={e => setFilters({...filters, personnel: e.target.value})}>
                      <option value="all">所有人員</option>
                      {personnel.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">開始日期 From</label>
                    <input type="date" className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 outline-none font-bold text-sm" value={filters.startDate} onChange={e => setFilters({...filters, startDate: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">結束日期 To</label>
                    <input type="date" className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 outline-none font-bold text-sm" value={filters.endDate} onChange={e => setFilters({...filters, endDate: e.target.value})} />
                  </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-10 overflow-hidden rounded-[24px] border border-slate-100">
          <LedgerTable 
            visibleColumns={visibleColumns} 
            permissions={{
              ...permissions,
              actions: { 
                ...permissions.actions, 
                archive: false, 
                restore: hasPermission('archive', 'restore'),
                delete: hasPermission('archive', 'delete'),
                edit: hasPermission('archive', 'edit')
              }
            }}
            isArchiveMode={true}
          />
        </div>
      </section>
    </div>
  );
}
