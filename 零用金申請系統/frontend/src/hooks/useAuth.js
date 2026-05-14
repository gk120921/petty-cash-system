import { useState } from 'react';
import axios from 'axios';

export const useAuth = (API_BASE) => {
  const [user, setUser] = useState(() => {
    // SSO 支援：偵測來自門戶的身份憑證
    const urlParams = new URLSearchParams(window.location.search);
    const ssoToken = urlParams.get('sso_token');
    
    if (ssoToken) {
      try {
        // 使用現代且穩定的解碼方式
        const decodedData = JSON.parse(decodeURIComponent(atob(ssoToken)));
        
        // 憲法級相容性映射：確保所有必要欄位都有值，防止前端白屏
        const ssoUser = {
          employee_id: decodedData.username || decodedData.employee_id || 'unknown',
          name: decodedData.real_name || decodedData.name || 'User',
          role: (decodedData.role || 'user').toLowerCase(),
          dept_name: decodedData.dept_name || 'N/A',
          // 補齊零用金系統預期的模組權限格式
          modules: decodedData.allowed_modules || { ledger: true, dashboard: true }
        };
        
        // 存儲會話並清理網址
        localStorage.setItem('petty_cash_user', JSON.stringify(ssoUser));
        window.history.replaceState({}, document.title, window.location.pathname);
        console.log('Petty Cash SSO 整合成功 (相容模式):', ssoUser.name);
        return ssoUser;
      } catch (e) {
        console.error('Petty Cash SSO 解析崩潰，已攔截防止白屏:', e);
        return null;
      }
    }

    const saved = localStorage.getItem('petty_cash_user');
    return saved ? JSON.parse(saved) : null;
  });

  const handleLogin = async (employee_id, password) => {
    try {
      const res = await axios.post(`${API_BASE}/login`, { employee_id, password });
      if (res.data.success) {
        setUser(res.data.user);
        localStorage.setItem('petty_cash_user', JSON.stringify(res.data.user));
        return { success: true, user: res.data.user };
      }
    } catch (err) {
      console.error('Login Failed:', err.response?.data || err.message);
      localStorage.removeItem('petty_cash_user'); // 確保失敗時清除
      return { success: false, error: err.response?.data?.error || '登入失敗' };
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('petty_cash_user');
  };

  const getPermissions = (roleId, allConfigs) => {
    // Standardize role ID: take only the first word and lowercase it (e.g., "Finance (財務)" -> "finance")
    const cleanRole = (roleId || '').split(' ')[0].toLowerCase();
    const key = `perms_${cleanRole}`;
    
    try {
      if (allConfigs[key]) {
        const raw = typeof allConfigs[key] === 'string' ? JSON.parse(allConfigs[key]) : allConfigs[key];
        
        // If it's the granular structure { module: { action: boolean } }
        if (raw && typeof raw === 'object' && !raw.modules) {
          const synthesized = { modules: {}, actions: {} };
          Object.keys(raw).forEach(modId => {
            // A module is visible if any of its actions are true
            synthesized.modules[modId] = Object.values(raw[modId]).some(v => v === true);
            // Flatten actions for global compatibility
            synthesized.actions = { ...synthesized.actions, ...raw[modId] };
          });
          return synthesized;
        }
        
        if (raw && raw.modules) return raw;
      }
    } catch (e) {
      console.warn('Failed to parse permissions', e);
    }
    
    // Default Fallbacks if no custom config found
    const r = cleanRole;
    if (r === 'admin') return { modules: { dashboard: true, ledger: true, suppliers: true, settings: true, permissions: true, archive: true }, actions: { add: true, edit: true, delete: true, payment: true, archive: true } };
    if (r === 'manager') return { modules: { dashboard: true, ledger: true, suppliers: true }, actions: { add: true, edit: true } };
    if (r === 'finance') return { modules: { dashboard: true, ledger: true, suppliers: true }, actions: { add: true, edit: true, payment: true } };
    return { modules: { ledger: true, dashboard: true }, actions: { add: true } };
  };

  return {
    user,
    handleLogin,
    handleLogout,
    getPermissions
  };
};
