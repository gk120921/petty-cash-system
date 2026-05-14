import React, { useMemo } from 'react';
import { useExpenseContext } from '../context/ExpenseContext';
import { 
  Wallet, Clock, CheckCircle, ArrowUpRight, AlertTriangle, 
  Users, BarChart3, TrendingUp
} from 'lucide-react';
import { 
  Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, ComposedChart, Line
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

export function DashboardModule() {
  const { 
    expenses = [], stats = {}, categories = [], personnel = [],
    API_BASE, fetchData, balanceThreshold
  } = useExpenseContext();

  const tBalance = stats?.totalBalance || 0;
  const pBalance = stats?.pendingBalance || 0;
  const aCash = stats?.actualCash || 0;
  const isLowBalance = tBalance < balanceThreshold;

  const monthlyData = useMemo(() => {
    const months = {};
    const catMap = {};
    categories.forEach(c => catMap[c.id] = c.name_zh || c.name_en);

    expenses.forEach(e => {
      if (!e.invoice_date || e.is_archived) return;
      const date = new Date(e.invoice_date);
      if (isNaN(date)) return;
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!months[monthKey]) {
        months[monthKey] = { month: monthKey, total: 0, items: [] };
        categories.forEach(c => months[monthKey][catMap[c.id]] = 0);
      }
      
      const out = Number(e.outgoing) || 0;
      if (out <= 0) return;

      const catName = catMap[e.category_id] || 'Other';
      months[monthKey][catName] = (months[monthKey][catName] || 0) + out;
      months[monthKey].total += out;
      months[monthKey].items.push({
        detail: e.detail_zh || e.supplier_name || '未命名項目',
        amount: out
      });
    });

    return Object.values(months)
      .sort((a, b) => a.month.localeCompare(b.month))
      .map(m => ({
        ...m,
        top3: m.items.sort((a, b) => b.amount - a.amount).slice(0, 3)
      }))
      .slice(-8);
  }, [expenses, categories]);

  const toPayByPersonnel = useMemo(() => {
    const summary = {};
    const pMap = {};
    personnel.forEach(p => pMap[p.id] = p.name);

    expenses.forEach(e => {
      if (e.pay_status !== 'PAID' && !e.is_archived) {
        const pId = e.personnel_id;
        if (!summary[pId]) summary[pId] = { name: pMap[pId] || 'Unknown', amount: 0, id: pId };
        summary[pId].amount += (Number(e.outgoing) || 0);
      }
    });
    return Object.values(summary).sort((a, b) => b.amount - a.amount);
  }, [expenses, personnel]);

  const handlePayAll = async (pId, pName) => {
    if (!window.confirm(`確定已支付給 ${pName} 的所有待領款項嗎？`)) return;
    try {
      const axios = (await import('axios')).default;
      await axios.post(`${API_BASE}/expenses/batch-pay-personnel`, { personnel_id: pId });
      fetchData();
    } catch (err) {
      alert('支付更新失敗');
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-6 rounded-[32px] shadow-2xl border border-white/10 backdrop-blur-xl min-w-[280px]">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 border-b border-white/10 pb-2">{label} 開支分析</p>
          <div className="flex justify-between items-end mb-6">
             <span className="text-xs font-bold text-slate-400">當月總計 Total</span>
             <span className="text-2xl font-black text-emerald-400 italic">${data.total.toLocaleString()}</span>
          </div>
          <div className="space-y-3">
            <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Top 3 大額支出</p>
            {data.top3.map((item, i) => (
              <div key={i} className="flex justify-between items-center bg-white/5 p-3 rounded-2xl">
                <span className="text-xs font-bold text-slate-200 truncate pr-4 max-w-[160px]">{item.detail}</span>
                <span className="text-xs font-black text-white">${item.amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
           <h3 className="text-3xl font-black tracking-tighter uppercase mb-2">管理儀表板 Dashboard</h3>
           <p className="text-slate-400 font-medium text-sm">數據分析與財務水位監控</p>
        </div>
      </div>

      <AnimatePresence>
        {isLowBalance && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="bg-rose-600 text-white py-4 px-10 rounded-[32px] shadow-2xl shadow-rose-500/40 flex items-center relative overflow-hidden group">
               <div className="absolute inset-0 bg-white/10 animate-pulse" />
               <AlertTriangle className="w-6 h-6 mr-6 shrink-0 relative z-10" />
               <div className="flex-1 overflow-hidden relative z-10">
                  <div className="whitespace-nowrap animate-marquee inline-block font-black text-lg italic tracking-wider">
                     🚨 [CRITICAL ALERT] LOW BALANCE DETECTED: ${tBalance.toLocaleString()} • PLEASE TOP UP IMMEDIATELY • THRESHOLD SET AT: ${balanceThreshold.toLocaleString()} • CONTACT FINANCE DEPARTMENT 🚨
                  </div>
               </div>
               <style dangerouslySetInnerHTML={{ __html: `
                 @keyframes marquee { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }
                 .animate-marquee { animation: marquee 20s linear infinite; }
               `}} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <motion.div whileHover={{ y: -5 }} className={`p-10 rounded-[48px] border shadow-sm transition-all ${isLowBalance ? 'bg-rose-50 border-rose-100' : 'bg-white border-slate-100'}`}>
          <div className="flex items-center gap-4 mb-4">
             <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isLowBalance ? 'bg-rose-600 text-white' : 'bg-slate-900 text-white'}`}><Wallet className="w-5 h-5" /></div>
             <div className="flex flex-col">
               <p className={`text-lg font-black uppercase tracking-wider ${isLowBalance ? 'text-rose-600' : 'text-slate-400'}`}>Total Balance 總餘額</p>
               <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase italic">(Initial + In - Out) / (期初 + 收入 - 支出)</p>
             </div>
          </div>
          <h3 className={`text-4xl font-black tracking-tighter ${isLowBalance ? 'text-rose-700' : 'text-slate-900'}`}>${tBalance.toLocaleString()}</h3>
        </motion.div>
        <div className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
             <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600"><Clock className="w-5 h-5" /></div>
             <div className="flex flex-col">
               <p className="text-lg font-black text-slate-400 uppercase tracking-wider">Pending 待核銷</p>
               <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase italic">(Unpaid Total) / (待支付總額)</p>
             </div>
          </div>
          <h3 className="text-4xl font-black text-amber-600 tracking-tighter">${pBalance.toLocaleString()}</h3>
        </div>
        <div className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
             <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600"><CheckCircle className="w-5 h-5" /></div>
             <div className="flex flex-col">
               <p className="text-lg font-black text-slate-400 uppercase tracking-wider">Cash On Hand 現金</p>
               <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase italic">(Initial + In - Paid) / (期初 + 收入 - 已支付)</p>
             </div>
          </div>
          <h3 className="text-4xl font-black text-emerald-600 tracking-tighter">${aCash.toLocaleString()}</h3>
        </div>
      </div>

      <div className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-xl overflow-hidden">
         <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4 text-sm font-bold">
            <div className="flex items-center gap-4">
               <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><BarChart3 className="w-6 h-6" /></div>
               <div><h4 className="text-xl font-black text-slate-900">月度支出分析與總趨勢</h4><p className="text-xs text-slate-400">Monthly Category Stacked Bar & Total Trend</p></div>
            </div>
            <div className="flex gap-6 bg-slate-50 px-6 py-3 rounded-2xl">
               <div className="flex items-center gap-2"><div className="w-3 h-3 bg-indigo-500 rounded-full" /><span>CATEGORY</span></div>
               <div className="flex items-center gap-2"><div className="w-8 h-1 bg-emerald-500 rounded-full" /><span>TOTAL</span></div>
            </div>
         </div>
         <div className="h-[450px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                {categories.map((c, index) => (
                  <Bar key={c.id} dataKey={c.name_zh || c.name_en} stackId="a" fill={COLORS[index % COLORS.length]} barSize={60} />
                ))}
                <Line type="monotone" dataKey="total" stroke="#10b981" strokeWidth={4} dot={{ r: 6, fill: '#10b981', strokeWidth: 3, stroke: '#fff' }} />
              </ComposedChart>
            </ResponsiveContainer>
         </div>
      </div>

      <div className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-xl">
         <div className="flex items-center gap-4 mb-10">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl"><Users className="w-6 h-6" /></div>
            <h4 className="text-xl font-black text-slate-900">各人員待領款明細 (TO PAY)</h4>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {toPayByPersonnel.map((p, idx) => (
              <div key={idx} className="bg-slate-50 p-6 rounded-[32px] border border-slate-100 flex flex-col gap-4 group hover:bg-slate-900 hover:text-white transition-all cursor-default">
                 <div className="flex justify-between items-start">
                    <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Personnel</p><p className="text-lg font-black">{p.name}</p></div>
                    <div className="text-right"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">To Pay</p><p className="text-xl font-black text-amber-600 group-hover:text-amber-400">${p.amount.toLocaleString()}</p></div>
                 </div>
                 <button onClick={() => handlePayAll(p.id, p.name)} className="w-full py-3 bg-white border border-slate-200 text-slate-900 text-xs font-black rounded-2xl hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all flex items-center justify-center gap-2">
                   <CheckCircle className="w-4 h-4" /> 一鍵支付 Pay All
                 </button>
              </div>
            ))}
            {toPayByPersonnel.length === 0 && <div className="col-span-full py-10 text-center text-slate-400 font-bold italic border-2 border-dashed border-slate-100 rounded-[32px]">目前沒有待付款項 All cleared!</div>}
         </div>
      </div>
      
      <div className="p-16 rounded-[60px] bg-slate-900 text-white flex items-center justify-between relative overflow-hidden">
         <div className="relative z-10">
            <h3 className="text-4xl font-black mb-4 tracking-tighter uppercase italic">System Operational</h3>
            <p className="text-slate-400 text-lg font-medium">India Warehouse PettyCash v2.1 • Smart Analytics Enabled</p>
         </div>
         <ArrowUpRight className="w-40 h-40 absolute -right-10 -bottom-10 text-white/5" />
      </div>
    </div>
  );
}
