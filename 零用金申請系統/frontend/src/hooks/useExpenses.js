import { useState, useMemo, useCallback, useEffect } from 'react';
import axios from 'axios';

export const useExpenses = (API_BASE) => {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [personnel, setPersonnel] = useState([]);
  const [allConfigs, setAllConfigs] = useState({});
  const [loading, setLoading] = useState(true);
  const [openingBalance, setOpeningBalance] = useState(0);
  const [balanceThreshold, setBalanceThreshold] = useState(15000);
  const [isAdding, setIsAdding] = useState(false);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [archivedSummary, setArchivedSummary] = useState({ archived_in: 0, archived_out: 0 });

  const updateConfig = async (key, value) => {
    try {
      await axios.post(`${API_BASE}/config`, { key, value });
      setAllConfigs(prev => ({ ...prev, [key]: value }));
    } catch (err) {
      console.error('Config update failed:', err);
    }
  };
  
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'desc' });
  const [showArchived, setShowArchived] = useState(false);
  const [filters, setFilters] = useState({
    category: 'all',
    personnel: 'all',
    status: 'all',
    startDate: '',
    endDate: ''
  });
  const [selectedIds, setSelectedIds] = useState([]);

  const initialFormData = {
    invoice_date: new Date().toLocaleDateString('sv-SE'),
    reimbursement_date: new Date().toLocaleDateString('sv-SE'),
    settlement_date: '',
    supplier_name: '',
    category_id: '',
    detail_en: '',
    detail_zh: '',
    personnel_id: '',
<<<<<<< HEAD
    handler_personnel_id: '',
=======
>>>>>>> bbd756e05194dd7d7ea507746d11df41652b91cc
    incoming: '',
    outgoing: '',
    has_bill: true,
    pay_status: 'PAID',
    no_bill_reason_zh: '',
    no_bill_reason_en: '',
  };


  const [formData, setFormData] = useState(initialFormData);
  const [editingId, setEditingId] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        axios.get(`${API_BASE}/expenses`, { params: { is_archived: showArchived ? 'true' : 'false' } }),
        axios.get(`${API_BASE}/categories`),
        axios.get(`${API_BASE}/suppliers`),
        axios.get(`${API_BASE}/personnel`),
        axios.get(`${API_BASE}/config`),
        axios.get(`${API_BASE}/permissions`),
        axios.get(`${API_BASE}/expenses/summary`)
      ]);

      const [expRes, catRes, supRes, perRes, configRes, permRes, sumRes] = results;
      
      if (expRes.status === 'fulfilled') setExpenses(expRes.value.data);
      if (catRes.status === 'fulfilled') setCategories(catRes.value.data);
      if (supRes.status === 'fulfilled') setSuppliers(supRes.value.data);
      if (perRes.status === 'fulfilled') setPersonnel(perRes.value.data);
      
      const combinedConfigs = { 
        ...(configRes.status === 'fulfilled' ? configRes.value.data : {}), 
        ...(permRes.status === 'fulfilled' ? permRes.value.data : {}) 
      };
      setAllConfigs(combinedConfigs);
      if (combinedConfigs.balance_threshold) setBalanceThreshold(Number(combinedConfigs.balance_threshold));
      if (combinedConfigs.opening_balance) setOpeningBalance(Number(combinedConfigs.opening_balance));
      if (sumRes.status === 'fulfilled') setArchivedSummary(sumRes.value.data);
    } catch (err) {
      console.error('Fetch Error:', err);
    } finally {
      setLoading(false);
    }
  }, [API_BASE, showArchived]);

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingId(null);
    setSearchTerm('');
    setFilters({ category: 'all', personnel: 'all', status: 'all', startDate: '', endDate: '' });
    setPreviewUrls([]);
  };

  const handleEditRecord = (exp) => {
    setFormData({
      ...initialFormData,
      ...exp,
      invoice_date: exp.invoice_date || '',
      reimbursement_date: exp.reimbursement_date || '',
    });
    if (exp.image_path) {
      let paths = [];
      try {
        if (typeof exp.image_path === 'string' && exp.image_path.startsWith('[')) {
          paths = JSON.parse(exp.image_path);
        } else {
          paths = Array.isArray(exp.image_path) ? exp.image_path : [exp.image_path];
        }
      } catch (e) { paths = [exp.image_path]; }
      setPreviewUrls(paths.map(p => p.startsWith('http') ? p : `${API_BASE.replace('/api', '')}${p}`));
    } else {
      setPreviewUrls([]);
    }
    setEditingId(exp.id);
    setIsAdding(true);
  };

  const filteredExpenses = useMemo(() => {
    if (!Array.isArray(expenses)) return [];
    return expenses.filter(exp => {
      if (!exp) return false;
      const matchesSearch = (exp.supplier_name || '').toLowerCase().includes(searchTerm.toLowerCase()) || (exp.detail_zh || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filters.category === 'all' || exp.category_id == filters.category;
      const matchesPersonnel = filters.personnel === 'all' || exp.personnel_id == filters.personnel;
      const matchesStatus = filters.status === 'all' || 
                            (filters.status === 'PAID' ? exp.pay_status === 'PAID' : exp.pay_status !== 'PAID');
<<<<<<< HEAD
      const expDate = exp.reimbursement_date || exp.invoice_date || '';
=======
      const expDate = exp.invoice_date || '';
>>>>>>> bbd756e05194dd7d7ea507746d11df41652b91cc
      const matchesStartDate = !filters.startDate || expDate >= filters.startDate;
      const matchesEndDate = !filters.endDate || expDate <= filters.endDate;

      return matchesSearch && matchesCategory && matchesPersonnel && matchesStatus && matchesStartDate && matchesEndDate;
    });
    // Removed sorting here to keep chronological balance logic simpler, or sort by date/id first
  }, [expenses, searchTerm, filters]);

  const ledgerData = useMemo(() => {
    if (!Array.isArray(filteredExpenses)) return [];
    
    // 1. Calculate running balance chronologically first
    // If we are in ARCHIVE mode, we start from the base opening balance.
    // If we are in MAIN mode, we start from Opening Balance + Archived Totals.
    const baseOpening = Number(openingBalance) || 0;
    const offset = showArchived ? 0 : (Number(archivedSummary.archived_in) - Number(archivedSummary.archived_out));
    let balance = baseOpening + offset;

    const chronological = [...filteredExpenses].sort((a, b) => {
<<<<<<< HEAD
      const dateA = new Date(a.reimbursement_date || a.invoice_date || 0);
      const dateB = new Date(b.reimbursement_date || b.invoice_date || 0);
=======
      const dateA = new Date(a.invoice_date || 0);
      const dateB = new Date(b.invoice_date || 0);
>>>>>>> bbd756e05194dd7d7ea507746d11df41652b91cc
      const diff = (isNaN(dateA) ? 0 : dateA) - (isNaN(dateB) ? 0 : dateB);
      return diff !== 0 ? diff : (Number(a.id) || 0) - (Number(b.id) || 0);
    });

    const withBalance = chronological.map(exp => {
      balance = balance + (Number(exp.incoming) || 0) - (Number(exp.outgoing) || 0);
      return { ...exp, runningBalance: balance };
    });

    // 2. Apply user-requested sorting for display
    return withBalance.sort((a, b) => {
      const { key, direction } = sortConfig;
      let valA = a[key];
      let valB = b[key];

      // Handle numeric values
      if (key === 'incoming' || key === 'outgoing' || key === 'runningBalance' || key === 'id') {
        valA = Number(valA) || 0;
        valB = Number(valB) || 0;
      } else {
        valA = String(valA || '').toLowerCase();
        valB = String(valB || '').toLowerCase();
      }

      if (valA < valB) return direction === 'asc' ? -1 : 1;
      if (valA > valB) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredExpenses, openingBalance, sortConfig]);

  const stats = useMemo(() => {
    const baseBalance = Number(openingBalance) || 0;
    const archivedOffset = Number(archivedSummary.archived_in) - Number(archivedSummary.archived_out);
    const calculatedOpening = baseBalance + archivedOffset;
    
    if (!Array.isArray(expenses)) return { totalBalance: calculatedOpening, pendingBalance: 0, actualCash: calculatedOpening, calculatedOpening };
    
    return expenses.reduce((acc, e) => {
      if (!e) return acc;
      const inc = Number(e.incoming) || 0;
      const out = Number(e.outgoing) || 0;
      const isPaid = e.pay_status === 'PAID';
      
      acc.totalBalance += (inc - out);
      if (!isPaid) acc.pendingBalance += (out + inc);
      
      // Actual cash considers paid outgoings and all incomings
      if (isPaid || inc > 0) {
        acc.actualCash += (inc - (isPaid ? out : 0));
      }
      
      return acc;
    }, { totalBalance: calculatedOpening, pendingBalance: 0, actualCash: calculatedOpening, calculatedOpening });
  }, [expenses, openingBalance, archivedSummary, showArchived]);

  const togglePayment = async (id, status) => {
    try {
      // Find current status from local state if not passed
      let currentStatus = status;
      if (!currentStatus) {
        const exp = expenses.find(e => String(e.id) === String(id));
        currentStatus = exp?.pay_status;
      }
      const newStatus = currentStatus === 'PAID' ? 'TO_PAY' : 'PAID';
      // Use PUT which is supported by backend AND allowed by CORS
      await axios.put(`${API_BASE}/expenses/${id}`, { pay_status: newStatus });
      await fetchData();
    } catch (err) {
      console.error('Toggle failed:', err);
    }
  };


  const deleteExpense = async (id, skipConfirm = false) => {
    if (!skipConfirm && !window.confirm('確定要刪除此紀錄嗎？')) return;
    try {
      await axios.delete(`${API_BASE}/expenses/${id}`);
      await fetchData();
    } catch (err) {
      alert('刪除失敗');
    }
  };

  const batchDeleteExpenses = async (ids) => {
    if (!ids || ids.length === 0) return;
    if (!window.confirm(`確定要永久刪除選中的 ${ids.length} 筆紀錄嗎？此動作不可復原。`)) return;
    try {
      await axios.post(`${API_BASE}/expenses/batch-delete`, { ids });
      await fetchData();
      return true;
    } catch (err) {
      alert('批次刪除失敗');
      return false;
    }
  };

  const archiveExpenses = async (ids) => {
    if (!ids || ids.length === 0) return;
    if (!window.confirm(`確定要將選中的 ${ids.length} 筆紀錄存檔嗎？`)) return;
    try {
      await axios.post(`${API_BASE}/expenses/batch-archive`, { ids });
      await fetchData();
      return true;
    } catch (err) {
      alert('存檔失敗');
      return false;
    }
  };

  const restoreExpenses = async (ids) => {
    if (!ids || ids.length === 0) return;
    if (!window.confirm(`確定要將選中的 ${ids.length} 筆紀錄退回至收支帳嗎？`)) return;
    try {
      // We can use the same batch logic but on the backend we might need a separate endpoint or just a loop
      // For now, let's assume we use a loop or a new endpoint. 
      // Let's create a new endpoint /api/expenses/restore on backend or use PUT
      await axios.post(`${API_BASE}/expenses/batch-restore`, { ids });
      await fetchData();
      return true;
    } catch (err) {
      alert('退回失敗');
      return false;
    }
  };

  const handleBlurTranslate = async (sourceField, targetField) => {
    const text = formData[sourceField];
    if (!text || text.trim().length < 2) return;
    
    // Forced update: Always sync translation even if target has content
    // but skip if the content is exactly the same to save API calls
    if (formData[targetField] === text) return;

    try {
      const res = await axios.post(`${API_BASE}/translate`, { text });
      if (res.data.text) {
        setFormData(prev => ({ ...prev, [targetField]: res.data.text }));
      }
    } catch (err) {
      console.error('Translation failed:', err);
    }
  };

  return {
    expenses, categories, suppliers, personnel, allConfigs, loading,
    formData, setFormData, editingId, setEditingId,
    searchTerm, setSearchTerm, sortConfig, setSortConfig, filters, setFilters,
    showArchived, setShowArchived,
    fetchData, resetForm, handleEditRecord, togglePayment, deleteExpense, batchDeleteExpenses, archiveExpenses, restoreExpenses, handleBlurTranslate,
    filteredExpenses, ledgerData, stats, initialFormData, selectedIds, setSelectedIds,
    isAdding, setIsAdding, previewUrls, setPreviewUrls, openingBalance, setOpeningBalance,
    balanceThreshold, setBalanceThreshold, updateConfig
  };
};
