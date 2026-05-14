import React, { useState, useEffect, useMemo } from 'react';
import {
  Shield, PlusCircle, X, User, Key, UserCheck, Trash2, Edit3,
  ChevronRight, Layout, Lock, Eye, CheckCircle2, AlertCircle,
  Database, Archive, Settings, Users, BarChart3, ListChecks
} from 'lucide-react';
import { useExpenseContext } from '../context/ExpenseContext';
import { motion, AnimatePresence } from 'framer-motion';

const FormGroup = ({ label, children }) => (
  <div className="space-y-1.5">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
    {children}
  </div>
);

// 1. 定義 1 對多 的權限對照表 (中英文)
const MODULE_PERMISSIONS = {
  dashboard: {
    label: { zh: '儀表板', en: 'DASHBOARD' },
    icon: BarChart3,
    actions: {
      view: { zh: '查看數據', en: 'VIEW DATA' },
      payment: { zh: '支付核銷', en: 'PAYMENT/SETTLE' }
    }
  },
  ledger: {
    label: { zh: '收支帳管理', en: 'LEDGER MANAGEMENT' },
    icon: ListChecks,
    actions: {
      view: { zh: '查看明細', en: 'VIEW LEDGER' },
      add: { zh: '新增紀錄', en: 'ADD RECORD' },
      edit: { zh: '編輯紀錄', en: 'EDIT RECORD' },
      delete: { zh: '刪除紀錄', en: 'DELETE RECORD' },
      archive: { zh: '批次存檔', en: 'BATCH ARCHIVE' },
      export: { zh: '匯出報表', en: 'EXPORT EXCEL' }
    }
  },
  suppliers: {
    label: { zh: '供應商管理', en: 'SUPPLIER DB' },
    icon: Database,
    actions: {
      view: { zh: '查看資料', en: 'VIEW LIST' },
      add: { zh: '新增供應商', en: 'ADD SUPPLIER' },
      edit: { zh: '編輯資料', en: 'EDIT INFO' },
      delete: { zh: '刪除資料', en: 'DELETE' }
    }
  },
  archive: {
    label: { zh: '歷史存檔區', en: 'ARCHIVE CENTER' },
    icon: Archive,
    actions: {
      view: { zh: '查看歷史', en: 'VIEW HISTORY' },
      restore: { zh: '還原紀錄', en: 'RESTORE RECORD' },
      delete: { zh: '永久刪除', en: 'PERMANENT DELETE' }
    }
  },
  permissions: {
    label: { zh: '權限與人員', en: 'ACCESS CONTROL' },
    icon: Shield,
    actions: {
      view: { zh: '查看人員', en: 'VIEW STAFF' },
      edit_users: { zh: '編輯人員', en: 'EDIT STAFF' },
      edit_roles: { zh: '設定角色', en: 'CONFIG ROLES' }
    }
  },
  settings: {
    label: { zh: '系統設定', en: 'SYSTEM SETTINGS' },
    icon: Settings,
    actions: {
      view: { zh: '查看設定', en: 'VIEW CONFIG' },
      edit: { zh: '修改參數', en: 'EDIT PARAMS' },
      edit_cash_level: { zh: '修改現金水位', en: 'EDIT CASH LEVEL' }
    }
  }
};

export function PermissionsModule() {
  const {
    personnel = [], permissions = {}, fetchAccessData, saveUser, deleteUser, saveRolePermissions
  } = useExpenseContext();

  const [activeSubTab, setActiveSubTab] = useState('list');
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState({ employee_id: '', name: '', role: 'Employee', password: '', status: 'ACTIVE' });
  const [selectedRole, setSelectedRole] = useState(null);

  // 當前選中的角色權限數據 (1對多 巢狀結構)
  const [rolePerms, setRolePerms] = useState({});
  const [activeModule, setActiveModule] = useState('ledger');

  useEffect(() => {
    fetchAccessData();
  }, [fetchAccessData]);

  const handleOpenEdit = (user = null) => {
    if (user) {
      setCurrentUser(user);
      setFormData({ ...user, password: '' });
    } else {
      setCurrentUser(null);
      setFormData({ employee_id: '', name: '', role: 'Employee', password: '', status: 'ACTIVE' });
    }
    setIsEditingUser(true);
  };

  const handleSubmitUser = async (e) => {
    e.preventDefault();
    const res = await saveUser({ ...formData, id: currentUser?.id });
    if (res.success) setIsEditingUser(false);
    else alert('儲存失敗: ' + res.error);
  };

  const handleOpenRoleSettings = (roleName) => {
    setSelectedRole(roleName);
    const existing = permissions[`perms_${roleName.toLowerCase()}`] || {};
    setRolePerms(existing);
    setActiveSubTab('roles');
  };

  const toggleAction = (mod, act) => {
    setRolePerms(prev => ({
      ...prev,
      [mod]: {
        ...prev[mod],
        [act]: !prev[mod]?.[act]
      }
    }));
  };

  const toggleAllActions = (mod) => {
    const allOn = Object.keys(MODULE_PERMISSIONS[mod].actions).every(act => rolePerms[mod]?.[act]);
    const newState = {};
    Object.keys(MODULE_PERMISSIONS[mod].actions).forEach(act => {
      newState[act] = !allOn;
    });
    setRolePerms(prev => ({ ...prev, [mod]: newState }));
  };

  const handleSaveRole = async () => {
    const res = await saveRolePermissions(selectedRole, rolePerms);
    if (res.success) alert('權限已更新');
    else alert('儲存失敗: ' + res.error);
  };

  const rolesList = ['Admin', 'Manager', 'Finance', 'Employee'];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h3 className="text-3xl font-black tracking-tighter uppercase mb-2">權限與人員 ACCESS CONTROL</h3>
          <div className="flex gap-4">
            <button onClick={() => setActiveSubTab('list')} className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeSubTab === 'list' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:bg-slate-100'}`}>人員清單 List</button>
            <button onClick={() => setActiveSubTab('roles')} className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeSubTab === 'roles' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:bg-slate-100'}`}>角色權限 Roles</button>
          </div>
        </div>
        {activeSubTab === 'list' && (
          <button onClick={() => handleOpenEdit()} className="flex items-center gap-2 px-8 py-4 bg-brand-600 text-white rounded-[24px] font-bold shadow-xl shadow-brand-600/20 hover:bg-brand-500 transition-all active:scale-95">
            <PlusCircle className="w-5 h-5" /> 新增人員 ADD STAFF
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {activeSubTab === 'list' ? (
          <motion.div key="list" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="bg-white rounded-[48px] border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">ID</th>
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Name</th>
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Role (英文/中)</th>
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {personnel.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-all group">
                    <td className="px-10 py-5 font-mono text-xs font-black text-slate-400 uppercase">#{p.employee_id}</td>
                    <td className="px-10 py-5 font-bold text-slate-800">{p.name}</td>
                    <td className="px-10 py-5">
                      <button onClick={() => handleOpenRoleSettings(p.role)} className={`px-4 py-1.5 rounded-xl text-[10px] font-black transition-all hover:scale-105 ${p.role?.toLowerCase() === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-brand-100 text-brand-700'}`}>
                        {p.role.toUpperCase()} {p.role?.toLowerCase() === 'admin' ? '(管理員)' : p.role?.toLowerCase() === 'manager' ? '(經理)' : p.role?.toLowerCase() === 'finance' ? '(財務)' : '(員工)'}
                      </button>
                    </td>
                    <td className="px-10 py-5"><div className="flex items-center justify-center gap-2"><div className={`w-2 h-2 rounded-full ${p.status === 'ACTIVE' ? 'bg-green-500' : 'bg-slate-300'}`} /><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{p.status}</span></div></td>
                    <td className="px-10 py-5 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button onClick={() => handleOpenEdit(p)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-md active:scale-95">
                          <Edit3 className="w-4 h-4" />
                          <span className="text-[10px] font-black uppercase">編輯 EDIT</span>
                        </button>
                        <button onClick={() => deleteUser(p.id)} className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition-all shadow-md active:scale-95">
                          <Trash2 className="w-4 h-4" />
                          <span className="text-[10px] font-black uppercase">刪除 DEL</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        ) : (
          <motion.div key="roles" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1 space-y-3">
              {rolesList.map(role => (
                <button key={role} onClick={() => handleOpenRoleSettings(role)} className={`w-full flex items-center justify-between p-6 rounded-[32px] border transition-all ${selectedRole === role ? 'bg-brand-600 border-brand-600 text-white shadow-xl' : 'bg-white border-slate-100 text-slate-600 hover:border-brand-300'}`}>
                  <span className="font-black uppercase italic tracking-tighter text-lg">{role}</span>
                  <ChevronRight className={`w-5 h-5 transition-transform ${selectedRole === role ? 'rotate-90' : ''}`} />
                </button>
              ))}
            </div>

            <div className="lg:col-span-3">
              {selectedRole ? (
                <div className="bg-white rounded-[48px] border border-slate-100 overflow-hidden shadow-sm flex flex-col min-h-[600px]">
                  <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div>
                      <h4 className="text-2xl font-black text-brand-600 uppercase italic italic tracking-tighter">{selectedRole} • 1對多權限管理</h4>
                      <p className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-widest">English / Chinese Bilingual Actions Mapping</p>
                    </div>
                    <button onClick={handleSaveRole} className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-brand-600 transition-all shadow-lg">儲存更新 SAVE</button>
                  </div>

                  <div className="flex flex-1">
                    {/* Left: Modules List */}
                    <div className="w-1/3 bg-slate-50/30 border-r border-slate-100 p-6 space-y-2">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 ml-2">Modules 模組清單</p>
                      {Object.entries(MODULE_PERMISSIONS).map(([id, mod]) => {
                        const Icon = mod.icon;
                        const isActive = activeModule === id;
                        return (
                          <button
                            key={id} onClick={() => setActiveModule(id)}
                            className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${isActive ? 'bg-white text-brand-600 shadow-md border border-brand-100' : 'text-slate-500 hover:bg-slate-100'}`}
                          >
                            <div className={`p-2 rounded-xl ${isActive ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-400'}`}><Icon className="w-4 h-4" /></div>
                            <div className="text-left">
                              <p className="text-[10px] font-black uppercase leading-tight">{mod.label.en}</p>
                              <p className="text-xs font-bold leading-tight">{mod.label.zh}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Right: Actions List (1-to-Many) */}
                    <div className="flex-1 p-10 bg-white">
                      <div className="flex items-center justify-between mb-8">
                        <div>
                          <h5 className="text-lg font-black text-slate-900 uppercase italic tracking-tighter">{MODULE_PERMISSIONS[activeModule].label.en} 操作權限</h5>
                          <p className="text-xs font-bold text-slate-400">Available actions for this module</p>
                        </div>
                        <button onClick={() => toggleAllActions(activeModule)} className="text-[10px] font-black text-brand-600 uppercase border-b-2 border-brand-600 pb-1">全選 Toggle All</button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(MODULE_PERMISSIONS[activeModule].actions).map(([actId, act]) => (
                          <button
                            key={actId}
                            onClick={() => toggleAction(activeModule, actId)}
                            className={`flex items-center justify-between p-5 rounded-3xl border transition-all ${rolePerms[activeModule]?.[actId] ? 'bg-brand-600 border-brand-600 text-white shadow-lg' : 'bg-slate-50 border-slate-100 text-slate-500 hover:border-brand-200'}`}
                          >
                            <div className="text-left">
                              <p className="text-[10px] font-black uppercase leading-tight">{act.en}</p>
                              <p className="text-sm font-bold leading-tight">{act.zh}</p>
                            </div>
                            {rolePerms[activeModule]?.[actId] ? <CheckCircle2 className="w-5 h-5" /> : <div className="w-5 h-5 rounded-full border-2 border-slate-200" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full min-h-[400px] bg-slate-50/50 rounded-[48px] border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
                  <Shield className="w-16 h-16 mb-4 opacity-20" /><p className="font-bold text-sm uppercase tracking-widest">請從左側選擇一個角色進行設定</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal remains the same but with zh labels */}
      {isEditingUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-md">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[60px] p-12 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-8"><h3 className="text-3xl font-black tracking-tighter">{currentUser ? '編輯人員' : '新增人員'}</h3><button type="button" onClick={() => setIsEditingUser(false)} className="p-2 hover:bg-slate-100 rounded-full"><X className="w-6 h-6" /></button></div>
            <form onSubmit={handleSubmitUser} className="space-y-6">
              <FormGroup label="工號 ID"><input required className="w-full p-5 bg-slate-50 rounded-[22px] outline-none font-bold" value={formData.employee_id} onChange={e => setFormData({ ...formData, employee_id: e.target.value })} /></FormGroup>
              <FormGroup label="姓名 Name"><input required className="w-full p-5 bg-slate-50 rounded-[22px] outline-none font-bold" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} /></FormGroup>
              {currentUser && (
                <FormGroup label="原始密碼 ORIGINAL PASSWORD (唯讀)">
                  <div className="w-full p-5 bg-slate-100 rounded-[22px] font-mono font-black text-slate-400 border border-slate-200 cursor-not-allowed">
                    {currentUser.password ? "已加密隱藏 (Encrypted)" : "未設定密碼"}
                  </div>
                  <p className="text-[9px] text-slate-400 mt-1 italic">基於安全因素，系統僅顯示加密狀態</p>
                </FormGroup>
              )}
              <FormGroup label={currentUser ? "設定新密碼 SET NEW PASSWORD (明文顯示)" : "登入密碼 SET PASSWORD (明文顯示)"}>
                <input type="text" placeholder="請輸入新密碼" required={!currentUser} className="w-full p-5 bg-slate-100 rounded-[22px] outline-none font-mono font-black text-lg text-brand-600 border-2 border-brand-100 focus:border-brand-600" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
              </FormGroup>
              <div className="grid grid-cols-2 gap-4">
                <FormGroup label="角色 Role"><select className="w-full p-5 bg-slate-50 rounded-[22px] outline-none font-bold" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>{rolesList.map(r => <option key={r} value={r}>{r}</option>)}</select></FormGroup>
                <FormGroup label="狀態 Status"><select className="w-full p-5 bg-slate-50 rounded-[22px] outline-none font-bold" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}><option value="ACTIVE">ACTIVE</option><option value="INACTIVE">INACTIVE</option></select></FormGroup>
              </div>
              <button type="submit" className="w-full py-6 bg-brand-600 text-white rounded-[32px] font-black text-xl shadow-2xl active:scale-95 transition-all mt-4">{currentUser ? '更新資料' : '儲存人員'}</button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
