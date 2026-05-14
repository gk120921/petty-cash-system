import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Printer, Download, Archive } from 'lucide-react';
import axios from 'axios';
import { useExpenseContext } from '../context/ExpenseContext';

export function BatchActionBar({ handleBatchPrint, permissions = {} }) {
  const { 
    selectedIds = [], setSelectedIds, API_BASE, fetchData, showArchived 
  } = useExpenseContext();

  if (!selectedIds || selectedIds.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-8 border border-slate-700"
      >
        <div className="flex items-center gap-3 pr-8 border-r border-slate-700">
          <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center font-bold">
            {selectedIds.length}
          </div>
          <span className="text-sm font-medium">項目已選取</span>
        </div>

        <div className="flex items-center gap-4">
          {permissions?.actions?.payment && (
            <>
              <button
                onClick={async () => {
                  try {
                    await axios.post(`${API_BASE}/expenses/batch-update`, { ids: selectedIds, pay_status: 'PAID' });
                    setSelectedIds([]);
                    fetchData();
                  } catch (err) {
                    alert('批次更新失敗: ' + err.message);
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-xs font-bold transition-colors"
              >
                全部設為已付款
              </button>
              <button
                onClick={async () => {
                  try {
                    await axios.post(`${API_BASE}/expenses/batch-update`, { ids: selectedIds, pay_status: 'TO_PAY' });
                    setSelectedIds([]);
                    fetchData();
                  } catch (err) {
                    alert('批次更新失敗: ' + err.message);
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 rounded-lg text-xs font-bold transition-colors"
              >
                全部設為待付款
              </button>
            </>
          )}

          <button
            onClick={handleBatchPrint}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-all text-xs font-bold"
          >
            <Printer className="w-4 h-4" /> 批次列印
          </button>
          
          <button
            onClick={() => {
              const params = new URLSearchParams({ ids: selectedIds.join(',') });
              window.open(`${API_BASE}/export_v2?${params.toString()}`);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-all text-xs font-bold"
          >
            <Download className="w-4 h-4" /> 批次匯出
          </button>

          {permissions?.actions?.archive && (
            <button
              onClick={async () => {
                const isRestore = showArchived;
                const endpoint = isRestore ? 'batch-restore' : 'batch-archive';
                if (confirm(`確定要執行批次歸檔嗎？`)) {
                  try {
                    await axios.post(`${API_BASE}/expenses/${endpoint}`, { ids: selectedIds });
                    setSelectedIds([]);
                    fetchData();
                  } catch (err) {
                    alert('歸檔失敗: ' + err.message);
                  }
                }
              }}
              className={`flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-all text-xs font-bold shadow-lg ${showArchived ? 'bg-emerald-600' : 'bg-indigo-600'}`}
            >
              <Archive className="w-4 h-4" /> {showArchived ? '還原至流水帳' : '歸檔結案 Archive'}
            </button>
          )}

          {permissions?.actions?.delete && (
            <button
              onClick={async () => {
                if (confirm(`確定要批次刪除這 ${selectedIds.length} 筆紀錄嗎？`)) {
                  try {
                    await axios.post(`${API_BASE}/expenses/batch-delete`, { ids: selectedIds });
                    setSelectedIds([]);
                    fetchData();
                  } catch (err) {
                    alert('批次刪除失敗: ' + err.message);
                  }
                }
              }}
              className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-all text-xs font-bold"
            >
              <Trash2 className="w-4 h-4" /> 批次刪除
            </button>
          )}
        </div>

        <button onClick={() => setSelectedIds([])} className="p-2 text-slate-400 hover:text-white">取消</button>
      </motion.div>
    </AnimatePresence>
  );
}
