import React from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Edit2, Trash2, Loader2, CheckCircle2, Clock, FileText, Camera, RotateCcw, Download } from 'lucide-react';
import { useExpenseContext } from '../context/ExpenseContext';
import { SortHeader } from './SortHeader';

export function LedgerTable({ visibleColumns = {}, permissions = {}, isArchiveMode = false }) {
  const {
    ledgerData = [], filteredExpenses = [], loading, selectedIds = [], setSelectedIds, handleEditRecord,
    togglePayment, deleteExpense, restoreExpenses, openingBalance, sortConfig, setSortConfig, API_BASE, language, categories, hasPermission
  } = useExpenseContext();

  const handleSort = (key) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(ledgerData.map(exp => exp.id));
    } else {
      setSelectedIds([]);
    }
  };

  if (loading && filteredExpenses.length === 0) {
    return (
      <div className="bg-white rounded-[40px] p-20 text-center border border-slate-100 shadow-sm">
        <Loader2 className="w-12 h-12 animate-spin mx-auto text-brand-500 mb-4" />
        <p className="text-slate-400 font-bold">正在讀取流水帳資料...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-6 py-5 text-center">
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded-lg border-slate-300 text-brand-600 focus:ring-brand-500"
                  onChange={handleSelectAll}
                />
              </th>
              {visibleColumns.id && <SortHeader label={language === 'zh' ? '序號 SN' : 'SN'} sortKey="id" currentSort={sortConfig} onSort={handleSort} />}
              {visibleColumns.invoice_date && <SortHeader label={language === 'zh' ? '發票日期 INV. DATE' : 'INV. DATE'} sortKey="invoice_date" currentSort={sortConfig} onSort={handleSort} />}
              {visibleColumns.reimbursement_date && <SortHeader label={language === 'zh' ? '報帳日期 REIMB. DATE' : 'REIMB. DATE'} sortKey="reimbursement_date" currentSort={sortConfig} onSort={handleSort} />}
              {visibleColumns.supplier && <SortHeader label={language === 'zh' ? '供應商 SUPPLIER' : 'SUPPLIER'} sortKey="supplier_name" currentSort={sortConfig} onSort={handleSort} />}
              {(visibleColumns.detail_zh || visibleColumns.detail_en) && (
                <th className="px-6 py-5 text-xs font-bold text-slate-800 uppercase tracking-widest">
                  {language === 'zh' ? '項目細目 DETAIL' : 'ENTRY DETAIL'}
                </th>
              )}
              {visibleColumns.category && <SortHeader label={language === 'zh' ? '類別 CATEGORY' : 'CATEGORY'} sortKey="category_name" currentSort={sortConfig} onSort={handleSort} />}
              {visibleColumns.incoming && <SortHeader label={language === 'zh' ? '收入 IN' : 'IN'} sortKey="incoming" currentSort={sortConfig} onSort={handleSort} align="text-right" />}
              {visibleColumns.outgoing && <SortHeader label={language === 'zh' ? '支出 OUT' : 'OUT'} sortKey="outgoing" currentSort={sortConfig} onSort={handleSort} align="text-right" />}
              <th className="px-6 py-5 text-right text-xs font-bold text-slate-800 uppercase tracking-widest">
                {language === 'zh' ? '結餘 BALANCE' : 'BALANCE'}
              </th>
              {visibleColumns.personnel && <SortHeader label="Personnel" sortKey="personnel_name" currentSort={sortConfig} onSort={handleSort} />}
              {visibleColumns.status && <SortHeader label="Status" sortKey="pay_status" currentSort={sortConfig} onSort={handleSort} />}
              {visibleColumns.receipt_v && <th className="px-6 py-5 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">Bill</th>}
              {visibleColumns.photo_v && <th className="px-6 py-5 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">Photo</th>}
              <th className="px-6 py-5 text-right text-xs font-bold text-slate-800 uppercase tracking-widest">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {/* Opening Balance Row - Precision Aligned */}
            <tr className="bg-slate-100/50 border-b border-slate-200 italic">
              <td className="px-6 py-3" colSpan={7}></td>
              <td className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right" colSpan={2}>Opening Balance (期初餘額)</td>
              <td className="px-6 py-3 text-sm font-black text-slate-900 text-right bg-yellow-50/80">${Number(openingBalance).toLocaleString()}</td>
              <td className="px-6 py-3" colSpan={3}></td>
            </tr>

            {ledgerData.length === 0 ? (
              <tr><td colSpan="13" className="px-6 py-20 text-center text-slate-400 italic font-medium">沒有符合條件的紀錄 No records found.</td></tr>
            ) : ledgerData.map((exp) => (
              <tr key={exp.id} className={`group hover:bg-slate-50/80 transition-all ${selectedIds.includes(exp.id) ? 'bg-brand-50/30' : ''}`}>
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    className="w-5 h-5 rounded-lg border-slate-300 text-brand-600 focus:ring-brand-500 transition-all cursor-pointer"
                    checked={selectedIds.includes(exp.id)}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedIds([...selectedIds, exp.id]);
                      else setSelectedIds(selectedIds.filter(id => id !== exp.id));
                    }}
                  />
                </td>
                {visibleColumns.id && <td className="px-6 py-4 font-mono text-[10px] font-black text-slate-400 tracking-tighter">#{exp.id}</td>}
                {visibleColumns.invoice_date && <td className="px-6 py-4 text-sm font-bold text-slate-700">{exp.invoice_date || '-'}</td>}
                {visibleColumns.reimbursement_date && <td className="px-6 py-4 text-sm font-medium text-slate-400 italic">{exp.reimbursement_date || '-'}</td>}
                {visibleColumns.supplier && <td className="px-6 py-4 text-sm font-black text-slate-900">{exp.supplier_name || '未指定'}</td>}
                {(visibleColumns.detail_zh || visibleColumns.detail_en) && (
                  <td className="px-6 py-4 text-xs font-medium text-slate-500 leading-relaxed max-w-xs truncate">
                    {language === 'en' ? (exp.detail_en || exp.detail_zh || '-') : (exp.detail_zh || '-')}
                  </td>
                )}
                {visibleColumns.category && (
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-bold">
                      {(() => {
                        const cat = categories.find(c => String(c.id) === String(exp.category_id));
                        return language === 'en'
                          ? (cat?.name_en || exp.category_name_en || exp.category_name)
                          : (cat?.name_zh || exp.category_name);
                      })()}
                    </span>
                  </td>
                )}
                {visibleColumns.incoming && <td className="px-6 py-4 text-sm font-black text-green-600 text-right italic">${Number(exp.incoming || 0).toLocaleString()}</td>}
                {visibleColumns.outgoing && <td className="px-6 py-4 text-sm font-black text-rose-600 text-right italic">${Number(exp.outgoing || 0).toLocaleString()}</td>}
                <td className="px-6 py-4 text-sm font-black text-slate-900 text-right bg-yellow-50/50 italic">${Number(exp.runningBalance).toLocaleString()}</td>
                {visibleColumns.personnel && <td className="px-6 py-4 text-sm font-bold text-slate-600">{exp.personnel_name || '-'}</td>}
                {visibleColumns.status && (
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => {
                        if (hasPermission('dashboard', 'payment') || hasPermission('ledger', 'edit')) {
                          togglePayment(exp.id);
                        } else {
                          alert('沒有操作權限 No Permission');
                        }
                      }}
                      className={`px-4 py-1.5 rounded-xl text-[10px] font-black flex items-center gap-2 mx-auto transition-all shadow-sm ${exp.pay_status === 'PAID' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-amber-100 text-amber-700 border border-amber-200'}`}
                    >
                      {exp.pay_status === 'PAID' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      {exp.pay_status === 'PAID' ? '已付款' : '待付款'}
                    </button>
                  </td>
                )}
                {visibleColumns.receipt_v && (
                  <td className="px-6 py-4 text-center">
                    {exp.has_bill === 1 ? <FileText className="w-4 h-4 text-brand-500 mx-auto" /> : <span className="text-slate-300">-</span>}
                  </td>
                )}
                {visibleColumns.photo_v && (
                  <td className="px-6 py-4 text-center">
                    {exp.image_path ? (
                      <Camera
                        className="w-5 h-5 text-indigo-500 mx-auto cursor-pointer hover:scale-125 transition-transform"
                        onDoubleClick={() => {
                          const url = exp.image_path.startsWith('http') ? exp.image_path : `${API_BASE.replace(/\/api$/, '')}${exp.image_path}`;
                          window.open(url, '_blank');
                        }}
                        title="雙擊查看大圖 Double click to view"
                      />
                    ) : <span className="text-slate-300">-</span>}
                  </td>
                )}
                <td className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    {isArchiveMode && hasPermission('archive', 'restore') && (
                      <button
                        onClick={() => restoreExpenses([exp.id])}
                        className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                        title="退回至收支帳 (Restore)"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    )}
                    {hasPermission(isArchiveMode ? 'archive' : 'ledger', 'edit') && (
                      <button onClick={() => handleEditRecord(exp)} className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-all">
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                    {hasPermission(isArchiveMode ? 'archive' : 'ledger', 'delete') && (
                      <button onClick={() => { if (confirm('確定刪除？')) deleteExpense(exp.id); }} className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
                        <Trash2 className="w-4 h-4" />
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
  );
}
