import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { 
  Activity, LayoutDashboard, Shield, LogOut, Package, 
  Search, RefreshCw, Layers, CheckCircle2, AlertCircle, 
  ChevronRight, MapPin, Inbox, BarChart3
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const WMSPage = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('nexus_user');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:3001/api/wms/inventory');
      if (res.data.success) {
        setInventory(res.data.data);
      }
    } catch (err) {
      console.error('讀取庫存失敗:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredInventory = inventory.filter(item => 
    (item.product_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.batch_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.case_no || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden font-sans text-slate-900">
      {/* 1. Nexus Global Sidebar */}
      <aside className="w-80 bg-[#0f172a] text-white flex flex-col p-8 shadow-2xl z-30 relative overflow-hidden">
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-indigo-600/20 rounded-full blur-[100px]" />
        
        <div className="relative z-10 flex flex-col h-full">
          <div className="flex items-center gap-4 mb-16 px-2">
            <div className="w-14 h-14 bg-indigo-600 rounded-[22px] flex items-center justify-center shadow-2xl border border-white/10 ring-4 ring-indigo-600/20">
              <Package className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tighter uppercase italic leading-none">Nexus</h1>
              <p className="text-[10px] font-bold text-indigo-400 tracking-[0.3em] uppercase mt-1">Inventory WMS</p>
            </div>
          </div>

          <nav className="space-y-4 flex-1">
            <p className="px-5 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Master Control / 總體指揮中心</p>
            
            <div 
              onClick={() => navigate('/dashboard')}
              className="group flex items-center gap-4 px-5 py-4 text-slate-400 hover:text-white hover:bg-white/5 rounded-2xl transition-all cursor-pointer"
            >
              <LayoutDashboard size={20} />
              <span className="font-bold tracking-tight text-sm">儀表板 Dashboard</span>
            </div>

            <div className="group flex items-center gap-4 px-5 py-4 bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 rounded-2xl transition-all cursor-pointer">
              <Layers size={20} />
              <span className="font-bold tracking-tight text-sm">庫存管理 Inventory</span>
            </div>

            <div 
              onClick={() => navigate('/admin')}
              className="group flex items-center gap-4 px-5 py-4 text-slate-400 hover:text-white hover:bg-white/5 rounded-2xl transition-all cursor-pointer"
            >
              <Shield size={20} />
              <span className="font-bold tracking-tight text-sm">權限管理 Admin</span>
            </div>
          </nav>

          <div className="pt-8 border-t border-white/10">
            <button 
              onClick={() => { localStorage.removeItem('nexus_user'); navigate('/login'); }}
              className="w-full flex items-center gap-4 px-5 py-4 text-slate-400 hover:text-white hover:bg-white/5 rounded-2xl transition-all font-bold text-sm"
            >
              <LogOut className="w-5 h-5" /> Logout
            </button>
          </div>
        </div>
      </aside>

      {/* 2. Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-24 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-12 z-20">
          <div className="flex items-center gap-4">
             <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_10px_rgba(99,102,241,1)]" />
             <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] italic">Warehouse Ops Active • India Factory</h2>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={fetchInventory}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs hover:bg-indigo-600 transition-all shadow-xl shadow-slate-900/10"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              REFRESH DATA
            </button>
            
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input 
                type="text"
                placeholder="搜尋批次、品名或箱號..."
                className="pl-12 pr-6 py-3 bg-slate-100 border-none rounded-2xl outline-none focus:ring-2 ring-indigo-500/20 w-80 font-bold text-slate-700 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
               <StatCard icon={<Inbox className="text-blue-600" />} label="總批次數 Total Batches" value={inventory.length} />
               <StatCard icon={<CheckCircle2 className="text-emerald-600" />} label="正常品 OK Status" value={inventory.filter(i => i.status === 'OK').length} />
               <StatCard icon={<AlertCircle className="text-rose-600" />} label="待檢驗/預期 Expected" value={inventory.filter(i => i.status === 'EXPECTED').length} />
               <StatCard icon={<BarChart3 className="text-indigo-600" />} label="總件數 Total Qty" value={inventory.reduce((acc, curr) => acc + (curr.quantity || 0), 0).toFixed(0)} />
            </div>

            <div className="bg-white rounded-[40px] shadow-2xl shadow-slate-200/40 border border-slate-50 overflow-hidden">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 uppercase text-[9px] font-black tracking-[0.2em] border-bottom border-slate-100">
                    <th className="px-8 py-6 text-left">Batch ID / Product</th>
                    <th className="px-8 py-6 text-center">Case No</th>
                    <th className="px-8 py-6 text-center">Location</th>
                    <th className="px-8 py-6 text-center">Quantity</th>
                    <th className="px-8 py-6 text-center">Status</th>
                    <th className="px-8 py-6 text-right">Receive Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredInventory.map((item) => (
                    <tr key={item.batch_id} className="hover:bg-slate-50/20 transition-colors group">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 font-black text-sm group-hover:bg-indigo-600 group-hover:text-white transition-all">
                            <Package size={18} />
                          </div>
                          <div>
                            <p className="font-black text-slate-900 text-base leading-tight">{item.product_name}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">ID: {item.batch_id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-center font-bold text-slate-600">#{item.case_no}</td>
                      <td className="px-8 py-6 text-center">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 rounded-lg text-[10px] font-black text-slate-500 border border-slate-100">
                           <MapPin size={10} /> {item.warehouse_code} / {item.shelf_location}
                        </div>
                      </td>
                      <td className="px-8 py-6 text-center">
                         <span className="font-black text-slate-900 text-lg">{item.quantity}</span>
                         <span className="text-[10px] font-bold text-slate-400 ml-1 uppercase">{item.unit}</span>
                      </td>
                      <td className="px-8 py-6 text-center">
                         <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                           item.status === 'OK' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 
                           item.status === 'EXPECTED' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                           'bg-slate-50 text-slate-400 border border-slate-100'
                         }`}>
                           {item.status}
                         </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                         <p className="text-sm font-bold text-slate-600">{item.receive_date}</p>
                         <p className="text-[9px] text-slate-400 uppercase font-black">{item.operator}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {loading && (
                <div className="p-20 text-center text-slate-300 font-black italic animate-pulse tracking-widest text-sm">
                  SCANNING WAREHOUSE BATCHES...
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const StatCard = ({ icon, label, value }) => (
  <div className="bg-white p-8 rounded-[32px] border border-slate-50 shadow-xl shadow-slate-200/20 flex items-center gap-6">
    <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center">
      {icon}
    </div>
    <div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-3xl font-black text-slate-900 tracking-tighter leading-none">{value}</p>
    </div>
  </div>
);

export default WMSPage;
