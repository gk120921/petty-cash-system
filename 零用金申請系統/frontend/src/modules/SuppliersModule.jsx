import React, { useState } from 'react';
import axios from 'axios';
import { 
  Plus, Search, Trash2, Building2, 
  MapPin, Phone, User as UserIcon, PlusCircle, X, Edit2, ChevronDown, ChevronUp, CheckCircle2
} from 'lucide-react';
import { useExpenseContext } from '../context/ExpenseContext';
import { motion, AnimatePresence } from 'framer-motion';

const FormGroup = ({ label, children }) => (
  <div className="space-y-1.5">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
    {children}
  </div>
);

export function SuppliersModule() {
  const { suppliers = [], fetchData, API_BASE, hasPermission } = useExpenseContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  
  const [formData, setFormData] = useState({
    name: '', tax_id: '', phone: '', address: '', contact_person: ''
  });

  const filteredSuppliers = (suppliers || []).filter(s => 
    (s.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.tax_id || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenEdit = (s = null) => {
    if (s) {
      setEditingId(s.id);
      setFormData({ ...s });
    } else {
      setEditingId(null);
      setFormData({ name: '', tax_id: '', phone: '', address: '', contact_person: '' });
    }
    setIsEditing(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`${API_BASE}/suppliers/${editingId}`, formData);
      } else {
        await axios.post(`${API_BASE}/suppliers`, formData);
      }
      setIsEditing(false);
      fetchData();
    } catch (err) {
      alert('儲存失敗: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('確定要刪除此供應商嗎？')) return;
    try {
      await axios.delete(`${API_BASE}/suppliers/${id}`);
      fetchData();
    } catch (err) {
      alert('刪除失敗');
    }
  };

  const handleBatchDelete = async () => {
    if (!window.confirm(`確定要刪除選中的 ${selectedIds.length} 個供應商嗎？`)) return;
    try {
      const res = await axios.post(`${API_BASE}/suppliers/batch-delete`, { ids: selectedIds });
      if (res.data.success) {
        setSelectedIds([]);
        fetchData();
      }
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message;
      alert('批量刪除失敗: ' + errMsg);
    }
  };

  const toggleSelectAll = (e) => {
    if (e.target.checked) setSelectedIds(filteredSuppliers.map(s => s.id));
    else setSelectedIds([]);
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
         <div>
            <h3 className="text-3xl font-black tracking-tighter uppercase mb-2">供應商管理 Suppliers</h3>
            <p className="text-slate-400 font-medium text-sm">管理常用的供應商資料，方便快速報帳</p>
         </div>
         <div className="flex gap-3">
           {selectedIds.length > 0 && hasPermission('suppliers', 'delete') && (
             <button onClick={handleBatchDelete} className="flex items-center gap-2 px-6 py-4 bg-rose-50 text-rose-600 rounded-[24px] font-bold border border-rose-100 hover:bg-rose-100 transition-all">
                <Trash2 className="w-5 h-5" /> 批量刪除 ({selectedIds.length})
             </button>
           )}
           {hasPermission('suppliers', 'add') && (
             <button onClick={() => handleOpenEdit()} className="flex items-center gap-2 px-8 py-4 bg-brand-600 text-white rounded-[24px] font-bold shadow-xl shadow-brand-600/20 hover:bg-brand-500 transition-all active:scale-95">
                <PlusCircle className="w-5 h-5" /> 新增供應商
             </button>
           )}
         </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm relative">
         <Search className="absolute left-10 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
         <input 
            type="text" 
            placeholder="搜尋供應商名稱或統編..." 
            className="w-full pl-14 pr-8 py-4 bg-slate-50 rounded-[24px] border-none outline-none text-sm font-bold focus:ring-2 focus:ring-brand-500/20 transition-all"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
         />
      </div>

      {/* List View */}
      <div className="bg-white rounded-[40px] border border-slate-100 shadow-xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-8 py-6 w-16 text-center">
                <input type="checkbox" onChange={toggleSelectAll} checked={selectedIds.length > 0 && selectedIds.length === filteredSuppliers.length} className="w-5 h-5 rounded-lg border-slate-300 text-brand-600" />
              </th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">供應商名稱 Name</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">統一編號 Tax ID</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">操作 Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredSuppliers.map(s => (
              <React.Fragment key={s.id}>
                <tr 
                  className={`group hover:bg-slate-50 transition-all cursor-pointer ${selectedIds.includes(s.id) ? 'bg-brand-50/30' : ''}`}
                  onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
                >
                  <td className="px-8 py-5 text-center" onClick={(e) => e.stopPropagation()}>
                    <input 
                      type="checkbox" 
                      checked={selectedIds.includes(s.id)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedIds([...selectedIds, s.id]);
                        else setSelectedIds(selectedIds.filter(id => id !== s.id));
                      }}
                      className="w-5 h-5 rounded-lg border-slate-300 text-brand-600"
                    />
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg">
                        <Building2 className="w-5 h-5 text-white" />
                      </div>
                      <span className="font-bold text-slate-900">{s.name}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest font-mono">{s.tax_id || '-'}</span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                      {hasPermission('suppliers', 'edit') && <button onClick={() => handleOpenEdit(s)} className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-all"><Edit2 className="w-4 h-4" /></button>}
                      {hasPermission('suppliers', 'delete') && <button onClick={() => handleDelete(s.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"><Trash2 className="w-4 h-4" /></button>}
                      <div className="p-2 text-slate-300">{expandedId === s.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}</div>
                    </div>
                  </td>
                </tr>
                {/* Expandable Details */}
                <AnimatePresence>
                  {expandedId === s.id && (
                    <motion.tr 
                      initial={{ height: 0, opacity: 0 }} 
                      animate={{ height: 'auto', opacity: 1 }} 
                      exit={{ height: 0, opacity: 0 }}
                      className="bg-slate-50/50"
                    >
                      <td colSpan={4} className="px-20 py-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                          <div className="space-y-2">
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Phone className="w-3 h-3" /> 電話 Phone</p>
                             <p className="font-bold text-slate-700">{s.phone || '無資料 No data'}</p>
                          </div>
                          <div className="space-y-2">
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><MapPin className="w-3 h-3" /> 地址 Address</p>
                             <p className="font-bold text-slate-700">{s.address || '無資料 No data'}</p>
                          </div>
                          <div className="space-y-2">
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><UserIcon className="w-3 h-3" /> 聯絡人 Contact</p>
                             <p className="font-bold text-slate-700">{s.contact_person || '無資料 No data'}</p>
                          </div>
                        </div>
                      </td>
                    </motion.tr>
                  )}
                </AnimatePresence>
              </React.Fragment>
            ))}
            {filteredSuppliers.length === 0 && (
              <tr><td colSpan={4} className="px-8 py-20 text-center text-slate-400 italic">查無供應商資料 No suppliers found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Editor Modal */}
      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-md">
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-[60px] p-12 w-full max-w-md shadow-2xl border border-white/20 overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8">
                  <button type="button" onClick={() => setIsEditing(false)} className="p-3 bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600 rounded-full transition-all"><X className="w-6 h-6" /></button>
                </div>
                
                <div className="mb-10">
                  <h3 className="text-3xl font-black tracking-tighter">{editingId ? '編輯供應商' : '新增供應商'}</h3>
                  <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">{editingId ? 'Update supplier info' : 'Create a new supplier profile'}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <FormGroup label="公司名稱 Name"><input required className="w-full p-5 bg-slate-50 border border-slate-100 rounded-[22px] outline-none font-bold focus:ring-4 focus:ring-brand-500/10 transition-all" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></FormGroup>
                    <div className="grid grid-cols-2 gap-4">
                      <FormGroup label="統一編號 Tax ID"><input className="w-full p-5 bg-slate-50 border border-slate-100 rounded-[22px] outline-none font-bold" value={formData.tax_id} onChange={e => setFormData({...formData, tax_id: e.target.value})} /></FormGroup>
                      <FormGroup label="聯絡人 Contact"><input className="w-full p-5 bg-slate-50 border border-slate-100 rounded-[22px] outline-none font-bold" value={formData.contact_person} onChange={e => setFormData({...formData, contact_person: e.target.value})} /></FormGroup>
                    </div>
                    <FormGroup label="聯絡電話 Phone"><input className="w-full p-5 bg-slate-50 border border-slate-100 rounded-[22px] outline-none font-bold" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /></FormGroup>
                    <FormGroup label="詳細地址 Address"><textarea className="w-full p-5 bg-slate-50 border border-slate-100 rounded-[22px] outline-none font-bold h-24 resize-none" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} /></FormGroup>
                    
                    <button type="submit" className="w-full py-6 bg-brand-600 text-white rounded-[32px] font-black text-xl shadow-2xl shadow-brand-600/40 active:scale-95 transition-all mt-4 flex items-center justify-center gap-3">
                      <CheckCircle2 className="w-6 h-6" /> 儲存變更 SAVE
                    </button>
                </form>
              </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
