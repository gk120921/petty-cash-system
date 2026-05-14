import React from 'react';

export const SidebarItem = ({ icon, label, active, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-5 py-4 rounded-[20px] transition-all duration-300 group ${
        active 
          ? 'bg-brand-600 text-white shadow-xl shadow-brand-500/20 translate-x-1' 
          : 'text-slate-400 hover:bg-white/5 hover:text-white'
      }`}
    >
      <div className={`transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>
        {icon}
      </div>
      <span className="text-sm font-bold tracking-tight">{label}</span>
    </button>
  );
};

export const SortHeader = ({ label, field, sortConfig, onSort }) => {
  const isActive = sortConfig.key === field;
  return (
    <th 
      className="px-6 py-5 cursor-pointer group hover:bg-slate-100/50 transition-colors"
      onClick={() => onSort(field)}
    >
      <div className="flex items-center gap-2">
        <span className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-brand-600' : 'text-slate-400'}`}>
          {label}
        </span>
        <div className={`flex flex-col text-[8px] transition-opacity ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`}>
          <span className={isActive && sortConfig.direction === 'asc' ? 'text-brand-600' : 'text-slate-300'}>▲</span>
          <span className={isActive && sortConfig.direction === 'desc' ? 'text-brand-600' : 'text-slate-300'}>▼</span>
        </div>
      </div>
    </th>
  );
};
