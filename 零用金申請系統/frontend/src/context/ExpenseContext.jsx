import React, { createContext, useContext, useMemo } from 'react';
import { useExpenses } from '../hooks/useExpenses';
import { useOCR } from '../hooks/useOCR';
import { useAuth } from '../hooks/useAuth';
import { useAccessControl } from '../hooks/useAccessControl';

const ExpenseContext = createContext();

export const ExpenseProvider = ({ children, API_BASE }) => {
  // 1. 核心狀態邏輯
  const expenseLogic = useExpenses(API_BASE);
  const authLogic = useAuth(API_BASE);

  const [language, setLanguage] = React.useState(localStorage.getItem('pettycash_lang') || 'zh');

  const toggleLanguage = () => {
    const newLang = language === 'zh' ? 'en' : 'zh';
    setLanguage(newLang);
    localStorage.setItem('pettycash_lang', newLang);
  };

  const ocrLogic = useOCR(API_BASE, expenseLogic.formData, expenseLogic.setFormData);
  const accessLogic = useAccessControl(API_BASE);

  const hasPermission = (module, action) => {
    if (!authLogic.user) return false;
    const role = authLogic.user.role;
    if (!role) return false;
    if (role.toLowerCase() === 'admin') return true; // 超級管理員擁有所有權限

    const key = `perms_${role.toLowerCase()}`;
    const perms = accessLogic.permissions?.[key];
    if (!perms) return false;

    try {
      const parsed = typeof perms === 'string' ? JSON.parse(perms) : perms;
      return !!parsed?.[module]?.[action];
    } catch (e) {
      return false;
    }
  };

  // 3. 使用 useMemo 確保 value 穩定，避免無限渲染
  const value = useMemo(() => ({
    // 展開所有邏輯
    ...expenseLogic,
    ...authLogic,
    ...ocrLogic,
    language,
    setLanguage,
    toggleLanguage,
    hasPermission,

    // 覆蓋 AccessControl 邏輯，確保人員名單與權限同步
    personnel: (Array.isArray(accessLogic?.personnel) && accessLogic.personnel.length > 0) ? accessLogic.personnel : (expenseLogic?.personnel || []),
    permissions: accessLogic.permissions,
    fetchAccessData: accessLogic.fetchAccessData,
    saveUser: accessLogic.saveUser,
    deleteUser: accessLogic.deleteUser,
    saveRolePermissions: accessLogic.saveRolePermissions,

    loading: expenseLogic.loading, // Prioritize expense loading for main UI
    isAccessLoading: accessLogic.loading,
    isAuthLoading: authLogic.loading,
    isDataLoading: expenseLogic.loading,
    openingBalance: expenseLogic.openingBalance,
    setOpeningBalance: expenseLogic.setOpeningBalance,
    balanceThreshold: expenseLogic.balanceThreshold,
    setBalanceThreshold: expenseLogic.setBalanceThreshold,
    updateConfig: expenseLogic.updateConfig,
    API_BASE,
  }), [expenseLogic, authLogic, ocrLogic, accessLogic, language, API_BASE]);

  return (
    <ExpenseContext.Provider value={value}>
      {children}
    </ExpenseContext.Provider>
  );
};

export const useExpenseContext = () => {
  const context = useContext(ExpenseContext);
  if (!context) {
    throw new Error('useExpenseContext must be used within an ExpenseProvider');
  }
  return context;
};
