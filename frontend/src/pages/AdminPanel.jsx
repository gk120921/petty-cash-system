import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, User, Check, X, Save, Search, Settings, Activity, LayoutDashboard, LogOut, RefreshCw, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [savingId, setSavingId] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('nexus_user');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const apiBase = `${window.location.protocol}//${window.location.hostname}:3001`;
      const res = await axios.get(`${apiBase}/api/users`);
      if (res.data.success) {
        setUsers(res.data.data);
      }
    } catch (err) {
      console.error('讀取使用者失敗:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGlobalSync = async () => {
    setIsSyncing(true);
    try {
      const apiBase = `${window.location.protocol}//${window.location.hostname}:3001`;
      await axios.post(`${apiBase}/api/auth/sync-initial`);
      await fetchUsers();
      alert('全域帳號同步完成！ / Global Sync Complete!');
    } catch (err) {
      alert('同步失敗: ' + err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const togglePermission = (username, module) => {
    setUsers(users.map(user => {
      if (user.username === username) {
        const currentPerms = user.module_permissions || {};
        return {
          ...user,
          module_permissions: {
            ...currentPerms,
            [module]: !currentPerms[module]
          }
        };
      }
      return user;
    }));
  };

  const updateRole = (username, newRole) => {
    setUsers(users.map(user => {
      if (user.username === username) {
        return { ...user, role: newRole };
      }
      return user;
    }));
  };

  const savePermissions = async (user) => {
    setSavingId(user.username);
    try {
      const apiBase = `${window.location.protocol}//${window.location.hostname}:3001`;
      const res = await axios.post(`${apiBase}/api/users/${user.id}/permissions`, {
        module_permissions: user.module_permissions,
        role: user.role
      });
      if (res.data.success) {
        setTimeout(() => setSavingId(null), 800);
      }
    } catch (err) {
      console.error('儲存權限失敗:', err);
      setSavingId(null);
    }
  };

  const filteredUsers = users.filter(u => 
    (u.real_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden font-sans text-slate-900">
      {/* 1. Nexus Global Sidebar */}
      <aside className="w-80 bg-[#0f172a] text-white flex flex-col p-8 shadow-2xl z-30 relative overflow-hidden">
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-indigo-600/20 rounded-full blur-[100px]" />
        
        <div className="relative z-10 flex flex-col h-full">
          <div className="flex items-center gap-4 mb-16 px-2">
            <div className="w-14 h-14 bg-indigo-600 rounded-[22px] flex items-center justify-center shadow-2xl border border-white/10 ring-4 ring-indigo-600/20">
              <Activity className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tighter uppercase italic">Nexus</h1>
              <p className="text-[10px] font-bold text-indigo-400 tracking-[0.3em] uppercase mt-1">Security Core</p>
            </div>
          </div>

          <nav className="space-y-4 flex-1">
            <p className="px-5 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Security Center / 權限中心</p>
            
            <div 
              onClick={() => navigate('/dashboard')}
              className="group flex items-center gap-4 px-5 py-4 text-slate-400 hover:text-white hover:bg-white/5 rounded-2xl transition-all cursor-pointer"
            >
              <LayoutDashboard size={20} />
              <span className="font-bold tracking-tight">儀表板 Dashboard</span>
            </div>

            <div 
              className="group flex items-center gap-4 px-5 py-4 bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 rounded-2xl transition-all cursor-pointer"
            >
              <Shield size={20} />
              <span className="font-bold tracking-tight">系統管理 Admin</span>
            </div>
          </nav>

          <div className="pt-8 border-t border-white/10">
            <button 
              onClick={() => { localStorage.removeItem('nexus_user'); navigate('/login'); }}
              className="w-full flex items-center gap-4 px-5 py-4 text-slate-400 hover:text-white hover:bg-white/5 rounded-2xl transition-all font-bold"
            >
              <LogOut className="w-5 h-5" /> Logout
            </button>
          </div>
        </div>
      </aside>

      {/* 2. Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-24 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-12 z-20">
          <div className="flex items-center gap-4">
             <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
             <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] italic tracking-widest">Global Security Protocol Active</h2>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={handleGlobalSync}
              disabled={isSyncing}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-xs transition-all ${
                isSyncing ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-900 text-white shadow-xl shadow-slate-900/10 hover:bg-indigo-600'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'SYNCING...' : 'GLOBAL ACCOUNT SYNC'}
            </button>
            
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input 
                type="text"
                placeholder="搜尋工號或姓名..."
                className="pl-12 pr-6 py-3 bg-slate-100 border-none rounded-2xl outline-none focus:ring-2 ring-indigo-500/20 w-80 font-bold text-slate-700 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
          <div className="max-w-6xl">
            <div className="mb-8">
              <h1 className="text-4xl font-black text-slate-900 uppercase italic tracking-tighter mb-2">Security Matrix</h1>
              <p className="text-slate-400 font-bold tracking-wide text-sm">控制跨系統訪問層級與身分 / Unified RBAC Management Matrix</p>
            </div>

            <div className="bg-white rounded-[40px] shadow-2xl shadow-slate-200/40 border border-slate-50 overflow-hidden">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 uppercase text-[9px] font-black tracking-[0.2em] border-bottom border-slate-100">
                    <th className="px-8 py-6 text-left">Entity</th>
                    <th className="px-8 py-6 text-center">System Role</th>
                    <th className="px-8 py-6 text-center">Petty Cash</th>
                    <th className="px-8 py-6 text-center">Procurement</th>
                    <th className="px-8 py-6 text-center">WMS</th>
                    <th className="px-8 py-6 text-right">Commit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50/20 transition-colors group">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-lg group-hover:scale-110 transition-transform">
                            {user.real_name?.[0] || user.username[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-black text-slate-900 text-base leading-tight">{user.real_name || 'Unnamed'}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{user.username} • {user.dept_name || 'N/A'}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-8 py-6 text-center">
                        <select 
                          value={user.role}
                          onChange={(e) => updateRole(user.username, e.target.value)}
                          className="bg-slate-100 border-none rounded-xl px-4 py-2 font-black text-[10px] text-slate-700 outline-none focus:ring-2 ring-indigo-500/20 appearance-none text-center"
                        >
                          <option value="admin">ADMIN</option>
                          <option value="manager">MANAGER</option>
                          <option value="user">USER</option>
                        </select>
                      </td>
                      
                      {['petty_cash', 'procurement', 'wms'].map(module => (
                        <td key={module} className="px-8 py-6 text-center">
                          <button 
                            onClick={() => togglePermission(user.username, module)}
                            className={`w-10 h-5 rounded-full relative transition-all duration-300 ${
                              user.module_permissions?.[module] ? 'bg-indigo-500' : 'bg-slate-200'
                            }`}
                          >
                            <motion.div 
                              animate={{ x: user.module_permissions?.[module] ? 22 : 4 }}
                              className="absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm"
                            />
                          </button>
                        </td>
                      ))}

                      <td className="px-8 py-6 text-right">
                        <button 
                          onClick={() => savePermissions(user)}
                          className={`px-6 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${
                            savingId === user.username 
                              ? 'bg-emerald-500 text-white' 
                              : 'bg-slate-900 text-white hover:bg-indigo-600 shadow-md hover:shadow-indigo-100'
                          }`}
                        >
                          {savingId === user.username ? <Check size={10} /> : 'Save'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {loading && (
                <div className="p-20 text-center text-slate-300 font-black italic animate-pulse tracking-widest text-sm">
                  LOADING SYSTEM MATRIX...
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminPanel;
