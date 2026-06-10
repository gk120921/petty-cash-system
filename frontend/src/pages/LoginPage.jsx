import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Factory, Lock, Users, ChevronRight, Loader2, ShieldCheck, Receipt } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 呼叫 Nexus Gateway 登入介面 (動態抓取主機 IP)
      const apiEndpoint = `${window.location.protocol}//${window.location.hostname}:3001/api/auth/login`;
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      const result = await response.json();
      
      if (result.success) {
        localStorage.setItem('nexus_user', JSON.stringify(result.data));
        navigate('/dashboard');
      } else {
        alert(result.message || '登入失敗');
      }
    } catch (err) {
      console.error('Login Error:', err);
      alert('無法連線至認證伺服器');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-950 font-sans" style={{ width: '100vw' }}>
      {/* 1. Video Background Layer */}
      <div className="absolute inset-0 overflow-hidden">
        <video 
          autoPlay 
          muted 
          loop 
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-60 scale-110 animate-slow-zoom"
        >
          <source src="/homepge-pc.mp4" type="video/mp4" />
        </video>
      </div>
      
      {/* 2. High-End Overlays (直接套用零用金系統漸層) */}
      <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-900/60 to-indigo-950/40" />
      <div className="absolute inset-0 backdrop-blur-[2px]" />

      {/* 3. Decorative Light Orbs */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] animate-pulse delay-700" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 30 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 w-full max-w-xl px-6 mx-auto"
      >
        <div className="text-center mb-12">
          <motion.div 
            initial={{ rotate: -10, scale: 0.8 }}
            animate={{ rotate: 3, scale: 1 }}
            className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-[0_20px_50px_rgba(99,102,241,0.4)] border border-white/20"
          >
            <Factory className="w-12 h-12 text-white" />
          </motion.div>
          <h2 className="text-6xl font-black text-white tracking-tighter uppercase italic leading-none">
            Nexus <span className="text-indigo-500 font-light block text-2xl tracking-[0.3em] mt-3 not-italic">India Terminal Factory</span>
          </h2>
          <div className="h-1 w-24 bg-indigo-500 mx-auto mt-8 rounded-full shadow-[0_0_20px_rgba(99,102,241,0.8)]" />
        </div>

        <form 
          onSubmit={handleLogin} 
          className="bg-white/10 backdrop-blur-3xl border border-white/20 p-12 rounded-[60px] shadow-[0_40px_100px_rgba(0,0,0,0.5)] space-y-8 flex flex-col"
        >
          <div className="space-y-3">
            <label className="text-[11px] font-black text-slate-300 uppercase tracking-[0.2em] ml-6">
              員工帳號 <span className="text-indigo-400">Employee ID</span>
            </label>
            <div className="relative">
              <Users className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                required type="text" 
                className="w-full bg-white/5 border border-white/10 rounded-[28px] pl-16 pr-8 py-5 text-white outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500/50 font-bold transition-all text-lg placeholder:text-slate-600" 
                placeholder="Enter Employee ID"
                value={username} onChange={e => setUsername(e.target.value)} 
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[11px] font-black text-slate-300 uppercase tracking-[0.2em] ml-6">
              認證金鑰 <span className="text-indigo-400">Access Key</span>
            </label>
            <div className="relative">
              <Receipt className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                required type="password" 
                className="w-full bg-white/5 border border-white/10 rounded-[28px] pl-16 pr-8 py-5 text-white outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500/50 font-bold transition-all text-lg placeholder:text-slate-600" 
                placeholder="••••••••"
                value={password} onChange={e => setPassword(e.target.value)} 
              />
            </div>
          </div>

          <button 
            disabled={loading} 
            type="submit" 
            className="w-full py-6 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-[28px] font-black text-xl shadow-2xl hover:shadow-indigo-600/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-4 group"
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
            Security Protocol Active • Nexus Gateway v1.0
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
};

export default LoginPage;
