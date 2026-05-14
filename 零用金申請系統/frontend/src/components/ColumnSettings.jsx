import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings } from 'lucide-react';

export function ColumnSettings({ showColumnSettings, setShowColumnSettings, visibleColumns, toggleColumn, columns }) {
  return (
    <div className="relative ml-auto">
      <button
        onClick={() => setShowColumnSettings(!showColumnSettings)}
        className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-bold hover:bg-slate-700 transition-all shadow-md"
      >
        <Settings className="w-4 h-4" /> 欄位顯示 Column Settings
      </button>

      <AnimatePresence>
        {showColumnSettings && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            // 這裡將 z-index 設為最高，確保不被下方內容遮擋
            className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-2xl border border-slate-200 p-4 z-[9999]"
          >
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 pb-2 border-b border-slate-100">選擇顯示欄位</p>
            <div className="space-y-2">
              {columns.map(col => (
                <label key={col.id} className="flex items-center gap-3 cursor-pointer group hover:bg-slate-50 p-1 rounded-md transition-colors">
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-slate-300 checked:bg-brand-500 checked:border-brand-500 transition-all"
                      checked={visibleColumns[col.id]}
                      onChange={() => toggleColumn(col.id)}
                    />
                    <div className="pointer-events-none absolute top-2/4 left-2/4 -translate-y-2/4 -translate-x-2/4 text-white opacity-0 peer-checked:opacity-100">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5" viewBox="0 0 20 20" fill="currentColor" stroke="currentColor" strokeWidth="1">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                      </svg>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-slate-700 group-hover:text-brand-600">{col.label}</span>
                </label>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
