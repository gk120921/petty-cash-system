import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { ExpenseProvider, useExpenseContext } from './context/ExpenseContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, List, Users, Shield, Settings, Wallet, Search, LogOut, PlusCircle, Building2, Loader2, Receipt, Menu, X, ChevronRight, Archive
} from 'lucide-react';

// Components
import { SidebarItem } from './components/BaseComponents';
import { LedgerModule } from './modules/LedgerModule';
import { DashboardModule } from './modules/DashboardModule';
import { SuppliersModule } from './modules/SuppliersModule';
import { PermissionsModule } from './modules/PermissionsModule';
import { SettingsModule } from './modules/SettingsModule';
import { ExpenseModal } from './modules/ExpenseModal';
import { ArchiveModule } from './modules/ArchiveModule';

const getApiBase = () => {
  const { protocol, hostname } = window.location;
  // 零用金系統後端運行在 3000
  return `${protocol}//${hostname}:3000/api`;
};
const API_BASE = getApiBase();

function AppContent() {
  const { 
    user, handleLogin, handleLogout, stats, fetchData, 
    allConfigs, searchTerm, setSearchTerm, 
    setFormData, runOCR, formData, editingId,
    isAdding, setIsAdding, previewUrls, setPreviewUrls, loading, initialFormData, resetForm,
    getPermissions, hasPermission, expenses, language
  } = useExpenseContext();

  const [activeTab, setActiveTab] = useState('ledger');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);

  useEffect(() => {
    if (user) fetchData();
  }, [user, fetchData]);

  const handleFileChange = useCallback((e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    // Revoke old URLs
    previewUrls.forEach(url => {
      if (url && url.startsWith('blob:')) URL.revokeObjectURL(url);
    });
    
    setSelectedFiles(files);
    if (typeof setPreviewUrls === 'function') {
      setPreviewUrls(files.map(f => URL.createObjectURL(f)));
    }
  }, [previewUrls, setPreviewUrls]);

  const handleAddExpense = async (e) => {
    if (e) e.preventDefault();

    // --- 日期驗證邏輯 (Date Validation) ---
    const dateStr = formData.invoice_date;
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    
    // 1. 格式檢查
    if (!dateRegex.test(dateStr)) {
      alert("發票日期格式不符！請使用 YYYY-MM-DD 格式 (例如: 2026-05-12)");
      return;
    }

    const invoiceDate = new Date(dateStr);
    if (isNaN(invoiceDate.getTime())) {
      alert("無效的發票日期，請重新檢查。");
      return;
    }

    // 2. 超過一個月提醒 (> 1 month threshold)
    const today = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(today.getMonth() - 1);

    if (invoiceDate < oneMonthAgo) {
      const confirmSave = window.confirm(`【日期提醒】\n發票日期 (${dateStr}) 已超過一個月。\n\n確定要繼續儲存這筆逾期紀錄嗎？`);
      if (!confirmSave) return;
    }

    // 3. 重複日期與金額檢查 (Duplicate Date & Amount Warning)
    const hasDuplicate = Array.isArray(expenses) && expenses.some(exp => {
      // 如果是編輯模式且是當前編輯項目，排除 (Exclude current editing item in edit mode)
      if (editingId && String(exp.id) === String(editingId)) return false;

      // 檢查日期是否相同 (Check if invoice date is identical)
      const sameDate = exp.invoice_date === dateStr;
      if (!sameDate) return false;

      // 檢查金額是否相同 (Check if outgoing or incoming amount is identical)
      const currentOutgoing = Number(formData.outgoing) || 0;
      const currentIncoming = Number(formData.incoming) || 0;

      if (currentOutgoing > 0 && Number(exp.outgoing) === currentOutgoing) return true;
      if (currentIncoming > 0 && Number(exp.incoming) === currentIncoming) return true;

      return false;
    });

    if (hasDuplicate) {
      const duplicateMsg = language === 'zh'
        ? `【重複警告】\n系統偵測到已存在相同發票日期 (${dateStr}) 且金額相同的憑證紀錄。\n\n確定要重複儲存嗎？`
        : `【DUPLICATE WARNING】\nThere is already an existing receipt with the same invoice date (${dateStr}) and amount.\n\nAre you sure you want to save it?`;
      if (!window.confirm(duplicateMsg)) {
        return;
      }
    }
    // ------------------------------------

    setIsSubmitting(true);
    try {
      const uploadData = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null && formData[key] !== undefined) {
          uploadData.append(key, formData[key]);
        }
      });
      if (selectedFiles.length > 0) {
        selectedFiles.forEach(file => uploadData.append('receipts', file));
      }

      const url = editingId ? `${API_BASE}/expenses/${editingId}` : `${API_BASE}/expenses`;
      const method = editingId ? 'put' : 'post';
      
      await axios({ method, url, data: uploadData });
      setIsAdding(false);
      setSelectedFiles([]);
      fetchData();
    } catch (err) {
      alert('儲存失敗: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return <LoginView onLogin={handleLogin} API_BASE={API_BASE} />;
  }


  const currentPermissions = getPermissions(user.role, allConfigs || {});

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden font-sans text-slate-900">
      <aside className="w-80 bg-[#0f172a] text-white flex flex-col p-8 shadow-2xl z-30 relative overflow-hidden">
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-brand-600/20 rounded-full blur-[100px]" />
        
        <div className="relative z-10 flex flex-col h-full">
          <a 
            href="http://localhost:5173/dashboard" 
            style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '1rem', transition: 'transform 0.2s' }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
            title="返回 Nexus 主門戶"
          >
            <div className="w-14 h-14 bg-brand-600 rounded-[22px] flex items-center justify-center shadow-2xl border border-white/10 ring-4 ring-brand-600/20">
              <Wallet className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tighter uppercase italic">PettyCash</h1>
              <p className="text-[10px] font-bold text-brand-400 tracking-[0.3em] uppercase mt-1">OPTIMIZATION LAB</p>
            </div>
          </a>

          <nav className="space-y-2 flex-1">
            <p className="px-5 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Main Menu</p>
            {currentPermissions?.modules?.dashboard && <SidebarItem icon={<LayoutDashboard />} label="儀表板 Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />}
            {currentPermissions?.modules?.ledger && <SidebarItem icon={<List />} label="收支帳 Ledger" active={activeTab === 'ledger'} onClick={() => setActiveTab('ledger')} />}
            {currentPermissions?.modules?.suppliers && <SidebarItem icon={<Users />} label="供應商 Suppliers" active={activeTab === 'suppliers'} onClick={() => setActiveTab('suppliers')} />}
            {currentPermissions?.modules?.archive && <SidebarItem icon={<Archive />} label="歸檔紀錄 Archive" active={activeTab === 'archive'} onClick={() => setActiveTab('archive')} />}
            {currentPermissions?.modules?.permissions && <SidebarItem icon={<Shield />} label="人員權限 Access" active={activeTab === 'permissions'} onClick={() => setActiveTab('permissions')} />}
            {currentPermissions?.modules?.settings && <SidebarItem icon={<Settings />} label="系統設定 Settings" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />}
          </nav>

          <div className="pt-8 border-t border-white/10">
            <button onClick={handleLogout} className="w-full flex items-center gap-4 px-5 py-4 text-slate-400 hover:text-white hover:bg-white/5 rounded-2xl transition-all font-bold">
              <LogOut className="w-5 h-5" /> Logout
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-24 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-12 z-20">
          <div className="flex items-center gap-4">
             <div className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
             <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] italic">System Active • India Warehouse</h2>
          </div>
          <div className="flex items-center gap-4">
             <div className="flex flex-col items-end mr-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Balance</span>
                <span className="text-xl font-black text-slate-900 italic">${(stats?.totalBalance || 0).toLocaleString()}</span>
             </div>
             
             <div className="flex gap-2">
                {hasPermission('ledger', 'add') && (
                  <button 
                    onClick={() => {
                      resetForm();
                      setFormData({ ...initialFormData, category_id: '5', has_bill: false, incoming: '' });
                      setIsAdding(true);
                    }} 
                    className="flex items-center gap-2 px-5 py-3 bg-emerald-50 text-emerald-600 rounded-xl font-bold hover:bg-emerald-100 transition-all border border-emerald-100"
                  >
                    <PlusCircle className="w-4 h-4" /> 公司撥款 TOP-UP
                  </button>
                )}
                
                {hasPermission('ledger', 'add') && (
                  <button 
                    onClick={() => {
                      resetForm();
                      setFormData({ ...initialFormData, category_id: '6', has_bill: false, incoming: '' });
                      setIsAdding(true);
                    }} 
                    className="flex items-center gap-2 px-5 py-3 bg-amber-50 text-amber-600 rounded-xl font-bold hover:bg-amber-100 transition-all border border-amber-100"
                  >
                    <PlusCircle className="w-4 h-4" /> 個人代墊 ADVANCE
                  </button>
                )}

                {hasPermission('ledger', 'add') && (
                  <button 
                    onClick={() => { 
                      resetForm(); 
                      setIsAdding(true); 
                    }} 
                    className="flex items-center gap-3 px-8 py-3 bg-brand-600 text-white rounded-xl font-black hover:bg-brand-500 transition-all shadow-xl shadow-brand-600/20 active:scale-95"
                  >
                    <PlusCircle className="w-5 h-5" /> 新增紀錄 NEW ENTRY
                  </button>
                )}
             </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-12 custom-scrollbar relative">
            <AnimatePresence mode="wait">
              <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                {activeTab === 'dashboard' && currentPermissions?.modules?.dashboard && <DashboardModule />}
                {activeTab === 'ledger' && currentPermissions?.modules?.ledger && <LedgerModule permissions={currentPermissions} />}
                {activeTab === 'suppliers' && currentPermissions?.modules?.suppliers && <SuppliersModule permissions={currentPermissions} />}
                {activeTab === 'archive' && currentPermissions?.modules?.archive && <ArchiveModule permissions={currentPermissions} />}
                {activeTab === 'permissions' && currentPermissions?.modules?.permissions && <PermissionsModule permissions={currentPermissions} />}
                {activeTab === 'settings' && currentPermissions?.modules?.settings && <SettingsModule permissions={currentPermissions} />}
                
                {/* Fallback if somehow on an unauthorized tab */}
                {activeTab !== 'ledger' && !currentPermissions?.modules?.[activeTab] && (
                  <div className="p-20 text-center">
                    <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Shield className="w-10 h-10" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-2">權限不足 Restricted Access</h3>
                    <p className="text-slate-400 font-medium">您沒有訪問此模組的權限。You do not have permission to view this module.</p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
        </div>
      </main>

      {isAdding && (
        <ExpenseModal 
          isSubmitting={isSubmitting} 
          onAddExpense={handleAddExpense} 
          onFileChange={handleFileChange} 
          setSelectedFiles={setSelectedFiles} 
          selectedFiles={selectedFiles}
        />
      )}
    </div>
  );
}

function LoginView({ onLogin, API_BASE }) {
  const [empId, setEmpId] = useState('');
  const [pass, setPass] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await onLogin(empId, pass);
      if (res && !res.success) setError(res.error || '身分驗證失敗 Identity Verification Failed');
    } catch (err) {
      setError('連線異常 Connection Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-950 font-sans">
      {/* Dynamic Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-[10000ms] scale-110 animate-slow-zoom"
        style={{ backgroundImage: "url('/homepge-pc.png')" }}
      />
      
      {/* High-End Overlays */}
      <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-900/60 to-brand-950/40" />
      <div className="absolute inset-0 backdrop-blur-[2px]" />

      {/* Decorative Light Orbs */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-brand-600/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-emerald-600/10 rounded-full blur-[120px] animate-pulse delay-700" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 30 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 w-full max-w-xl px-6"
      >
        <div className="text-center mb-12">
          <motion.div 
            initial={{ rotate: -10, scale: 0.8 }}
            animate={{ rotate: 3, scale: 1 }}
            className="w-24 h-24 bg-gradient-to-br from-brand-500 to-brand-700 rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-[0_20px_50px_rgba(99,102,241,0.4)] border border-white/20"
          >
            <Wallet className="w-12 h-12 text-white" />
          </motion.div>
          <h2 className="text-6xl font-black text-white tracking-tighter uppercase italic leading-none">
            PettyCash <span className="text-brand-500 font-light block text-2xl tracking-[0.3em] mt-3 not-italic">Optimization Lab</span>
          </h2>
          <div className="h-1 w-24 bg-brand-500 mx-auto mt-8 rounded-full shadow-[0_0_20px_rgba(99,102,241,0.8)]" />
        </div>

        <form 
          onSubmit={handleSubmit} 
          className="bg-white/10 backdrop-blur-3xl border border-white/20 p-12 rounded-[60px] shadow-[0_40px_100px_rgba(0,0,0,0.5)] space-y-8"
        >
          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }} 
              animate={{ opacity: 1, x: 0 }}
              className="bg-rose-500/20 border border-rose-500/50 p-4 rounded-2xl text-rose-200 text-xs font-bold text-center flex items-center justify-center gap-2"
            >
              <X className="w-4 h-4" /> {error}
            </motion.div>
          )}

          <div className="space-y-3">
            <label className="text-[11px] font-black text-slate-300 uppercase tracking-[0.2em] ml-6">工號 Employee ID</label>
            <div className="relative">
              <Users className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                required type="text" 
                className="w-full bg-white/5 border border-white/10 rounded-[28px] pl-16 pr-8 py-5 text-white outline-none focus:ring-4 focus:ring-brand-500/20 focus:border-brand-500/50 font-bold transition-all text-lg placeholder:text-slate-600" 
                placeholder="Enter Employee ID"
                value={empId} onChange={e => setEmpId(e.target.value)} 
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[11px] font-black text-slate-300 uppercase tracking-[0.2em] ml-6">訪問金鑰 Access Key</label>
            <div className="relative">
              <Receipt className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                required type="password" 
                className="w-full bg-white/5 border border-white/10 rounded-[28px] pl-16 pr-8 py-5 text-white outline-none focus:ring-4 focus:ring-brand-500/20 focus:border-brand-500/50 font-bold transition-all text-lg placeholder:text-slate-600" 
                placeholder="••••••••"
                value={pass} onChange={e => setPass(e.target.value)} 
              />
            </div>
          </div>

          <button 
            disabled={loading} 
            type="submit" 
            className="w-full py-6 bg-gradient-to-r from-brand-600 to-brand-500 text-white rounded-[28px] font-black text-xl shadow-2xl hover:shadow-brand-600/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-4 group"
          >
            {loading ? (
              <Loader2 className="animate-spin w-6 h-6" />
            ) : (
              <>
                <span className="tracking-tight italic uppercase">進入系統 SIGN IN</span>
                <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>

          <p className="text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-4">
            Security Protocol Active • India Warehouse v2.1
          </p>
        </form>
      </motion.div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slow-zoom {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        .animate-slow-zoom {
          animation: slow-zoom 30s ease-in-out infinite;
        }
      `}} />
    </div>
  );
}

function App() {
  return (
    <ExpenseProvider API_BASE={API_BASE}>
      <AppContent />
    </ExpenseProvider>
  );
}

export default App;
