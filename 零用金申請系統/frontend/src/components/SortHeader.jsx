import React from 'react';
import { ArrowUpDown } from 'lucide-react';

export function SortHeader({ label, sortKey, currentSort, onSort, align = "text-left", width = "" }) {
  const isActive = currentSort.key === sortKey;
  
  return (
    <th 
      className={`px-6 py-4 text-xs font-bold text-slate-800 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors ${align} ${width}`}
      onClick={() => onSort(sortKey)}
    >
      <div className={`flex items-center gap-1 ${align === 'text-right' ? 'justify-end' : ''}`}>
        {label}
        {isActive ? (
          <span className="text-brand-600">
            {currentSort.direction === 'asc' ? <ArrowUpDown className="w-3 h-3 rotate-180" /> : <ArrowUpDown className="w-3 h-3" />}
          </span>
        ) : (
          <ArrowUpDown className="w-3 h-3 text-slate-300" />
        )}
      </div>
    </th>
  );
}
