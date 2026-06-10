import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  LayoutDashboard, 
  CreditCard, 
  ShoppingCart, 
  Warehouse, 
  Settings, 
  LogOut, 
  Activity, 
  Bell, 
  User,
  ChevronRight,
  Shield
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('nexus_user');
    return saved ? JSON.parse(saved) : null;
  });

  const navigate = useNavigate();

    const handleEnterModule = (moduleId) => {
        // 定義各模組的目標前端 URL (動態偵測主機 IP)
        const host = window.location.hostname;
        const targetUrl = moduleId === 'petty_cash' ? `http://${host}:5176` : 
                          moduleId === 'procurement' ? `http://${host}:5175` : 
                          moduleId === 'wms' ? `http://${host}:5174` : 
                          `http://${host}:5173`;

    // SSO 橋接：使用穩定的 Base64 編碼，並處理 URL 安全性
    const ssoData = btoa(encodeURIComponent(JSON.stringify({
        employee_id: currentUser.username,
        username: currentUser.username, 
        name: currentUser.real_name,
        real_name: currentUser.real_name,
        role: currentUser.role,
        dept_name: currentUser.dept_name,
        allowed_modules: Object.keys(currentUser.module_permissions || {}).filter(k => currentUser.module_permissions[k]),
        ts: Date.now()
    })));
    
    // 跳轉至子系統並攜帶 Token
    window.open(`${targetUrl}?sso_token=${encodeURIComponent(ssoData)}`, '_blank');
  };

  const modules = [
    { 
      id: 'petty_cash', 
      name: '零用金管理系統', 
      enName: 'Petty Cash', 
      icon: <CreditCard className="w-8 h-8" />, 
      color: 'from-blue-600 to-blue-400',
      shadow: 'shadow-blue-500/30',
      description: '印度工廠日常支出、報帳與自動化對帳系統 / Factory expenses and automated reconciliation'
    },
    { 
      id: 'procurement', 
      name: '採購管理系統', 
      enName: 'Procurement', 
      icon: <ShoppingCart className="w-8 h-8" />, 
      color: 'from-indigo-600 to-indigo-400',
      shadow: 'shadow-indigo-500/30',
      description: '物料採購、合格供應商審核與多級簽核 / Procurement, supplier audit, and multi-stage approvals'
    },
    { 
      id: 'wms', 
      name: '印度倉庫 WMS', 
      enName: 'Warehouse', 
      icon: <Warehouse className="w-8 h-8" />, 
      color: 'from-slate-700 to-slate-500',
      shadow: 'shadow-slate-500/30',
      description: '原物料存量、端子成品批次追蹤與入庫自動化 / Inventory tracking and WMS automation'
    }
  ].filter(m => currentUser?.module_permissions?.[m.id]);

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden font-sans text-slate-900" style={{width: '100vw'}}>
      {/* 1. Deep Navy Sidebar */}
      <aside className="w-80 bg-[#0f172a] text-white flex flex-col p-8 shadow-2xl z-30 relative overflow-hidden">
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-indigo-600/20 rounded-full blur-[100px]" />
        
        <div className="relative z-10 flex flex-col h-full">
          {/* Logo Section */}
          <div className="flex items-center gap-4 mb-16 px-2">
            <div className="w-14 h-14 bg-indigo-600 rounded-[22px] flex items-center justify-center shadow-2xl border border-white/10 ring-4 ring-indigo-600/20">
              <Activity className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tighter uppercase italic">Nexus</h1>
              <p className="text-[10px] font-bold text-indigo-400 tracking-[0.3em] uppercase mt-1">India Factory</p>
            </div>
          </div>

          <nav className="space-y-4 flex-1">
            <p className="px-5 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Operations Center / 指揮中心</p>
            
            <div className="group flex items-center gap-4 px-5 py-4 bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 rounded-2xl transition-all cursor-pointer">
              <LayoutDashboard size={20} />
              <span className="font-bold tracking-tight">儀表板 Dashboard</span>
            </div>

            {modules.map(m => (
              <div 
                key={m.id} 
                onClick={() => handleEnterModule(m.id)}
                className="group flex items-center gap-4 px-5 py-4 text-slate-400 hover:text-white hover:bg-white/5 rounded-2xl transition-all cursor-pointer"
              >
                <div className="group-hover:scale-110 transition-transform">{m.icon}</div>
                <div className="flex flex-col">
                  <span className="font-bold text-lg leading-tight">{m.name}</span>
                  <span className="text-[10px] uppercase tracking-widest opacity-60">{m.enName}</span>
                </div>
                <ChevronRight className="ml-auto w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </nav>

          <div className="pt-8 border-t border-white/10 space-y-4">
            <div 
              onClick={() => navigate('/admin')}
              className="flex items-center gap-4 px-5 py-4 text-slate-400 hover:text-white hover:bg-white/5 rounded-2xl transition-all cursor-pointer group"
            >
              <Shield className="w-6 h-6 group-hover:rotate-90 transition-transform duration-500" /> 
              <div className="flex flex-col">
                <span className="font-bold leading-tight">系統設定</span>
                <span className="text-[10px] uppercase opacity-60">System Admin</span>
              </div>
            </div>
            <button 
                onClick={() => { localStorage.removeItem('nexus_user'); navigate('/login'); }}
                className="w-full flex items-center gap-4 px-5 py-4 text-rose-400 hover:text-white hover:bg-rose-500/20 rounded-2xl transition-all font-bold"
            >
              <LogOut className="w-6 h-6" /> 
              <div className="flex flex-col items-start">
                <span className="leading-tight">登出系統</span>
                <span className="text-[10px] uppercase opacity-60">Logout</span>
              </div>
            </button>
          </div>
        </div>
      </aside>

      {/* 2. Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white/50 backdrop-blur-sm">
        {/* Header */}
        <header className="h-28 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-12 z-20">
          <div className="flex items-center gap-4">
             <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_10px_rgba(99,102,241,1)]" />
             <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] italic">System Active • Master Portal Gateway</h2>
          </div>

          <div className="flex items-center gap-8">
             <div className="flex flex-col items-end mr-4">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Status / 營運狀態</span>
                <span className="text-2xl font-black text-slate-900 italic tracking-tighter uppercase">Operational</span>
             </div>
             
             <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer relative">
                <Bell size={24} />
                <span className="absolute top-2 right-2 w-3 h-3 bg-rose-500 border-2 border-white rounded-full"></span>
             </div>

             <div className="flex items-center gap-4 pl-8 border-l border-slate-100">
                <div className="text-right">
                   <p className="text-sm font-black text-slate-900 leading-none mb-1">{currentUser?.real_name}</p>
                   <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">{currentUser?.role}</p>
                </div>
                <div className="w-14 h-14 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl flex items-center justify-center shadow-xl border border-white/10 overflow-hidden ring-4 ring-slate-100">
                   <User className="text-white w-8 h-8" />
                </div>
             </div>
          </div>
        </header>

        {/* Hero Section */}
        <div className="flex-1 overflow-y-auto p-12 custom-scrollbar relative">
          <div className="max-w-6xl">
            <div className="mb-16">
              <h1 className="text-6xl font-black text-slate-900 uppercase italic tracking-tighter mb-4">India Factory<br/><span className="text-indigo-600">Nexus Portal</span></h1>
              <p className="text-xl text-slate-500 font-medium max-w-2xl leading-relaxed">
                中央集權化 ERP 指揮中心：即時管控零用金、採購與全自動化倉庫系統。
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {modules.map((m, idx) => (
                <div 
                  key={m.id}
                  onClick={() => handleEnterModule(m.id)}
                  className="group relative bg-white rounded-[48px] p-10 cursor-pointer transition-all duration-500 hover:-translate-y-4 hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] border border-slate-50"
                >
                  <div className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${m.color} ${m.shadow} flex items-center justify-center text-white mb-8 group-hover:scale-110 transition-transform duration-500`}>
                    {m.icon}
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-2 uppercase italic tracking-tight">{m.name}</h3>
                  <p className="text-sm text-slate-400 font-bold mb-8 uppercase tracking-widest">{m.enName}</p>
                  <p className="text-slate-500 font-medium leading-relaxed mb-10 min-h-[60px]">
                    {m.description}
                  </p>
                  
                  <div className="flex items-center gap-3 text-indigo-600 font-black text-xs uppercase tracking-[0.2em] group-hover:gap-5 transition-all">
                    Enter System <ChevronRight size={16} />
                  </div>
                  
                  <div className="absolute top-10 right-10 text-slate-100 font-black text-8xl -z-10 group-hover:text-indigo-50/50 transition-colors">
                    0{idx + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
