import React, { useState, useRef, useEffect } from 'react';
import { useExpenseContext } from '../context/ExpenseContext';
import {
  X, Camera, Check, Loader2, ArrowUpRight, Trash2, ZoomIn, ZoomOut, PlusCircle, Receipt, AlertCircle, Calendar, Sparkles, RotateCw, Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FormGroup = ({ label, children }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{label}</label>
    {children}
  </div>
);

export function ExpenseModal({
  isSubmitting,
  onAddExpense,
  onFileChange,
  setSelectedFiles,
  selectedFiles
}) {
  const {
    formData, setFormData, editingId, categories, suppliers, personnel,
    isOcrLoading, runOCR, handleBlurTranslate,
    isAdding, setIsAdding, previewUrls, setPreviewUrls
  } = useExpenseContext();

  const selectedCategory = Array.isArray(categories) ? categories.find(c => String(c.id) === String(formData.category_id)) : null;
  const isIncomeMode = selectedCategory?.type === 'INCOME';
  const isTopUp = isIncomeMode && selectedCategory?.name_zh?.includes('撥款');
  const isAdvance = isIncomeMode && selectedCategory?.name_zh?.includes('代墊');

  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);

  // 強制同步今天日期
  useEffect(() => {
    if (!editingId && isAdding) {
      const today = new Date().toLocaleDateString('sv-SE');
      setFormData(prev => ({
        ...prev,
        invoice_date: today,
        reimbursement_date: today
      }));
    }
  }, [isAdding, editingId, setFormData]);

  useEffect(() => {
    if (isIncomeMode && formData.has_bill) {
      setFormData(prev => ({ ...prev, has_bill: false }));
    }
  }, [formData.category_id, isIncomeMode, setFormData]);

  const handleMouseMove = (e) => {
    if (!isZoomed) return;
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.pageX - left - window.scrollX) / width) * 100;
    const y = ((e.pageY - top - window.scrollY) / height) * 100;
    setZoomPos({ x, y });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 10 }}
        className="bg-white w-full max-w-7xl h-[1500px] max-h-[98vh] rounded-[40px] shadow-2xl overflow-hidden flex flex-col relative"
      >
        {/* Header */}
        <div className="px-8 py-6 bg-white border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">{editingId ? '修改收支紀錄' : '新增收支紀錄'}</h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">智能收支管理系統 v2.0</p>
          </div>
          <button onClick={() => setIsAdding(false)} className="p-3 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col lg:flex-row">
          {/* Left: Receipt Preview */}
          <div className="w-full lg:w-1/2 p-8 bg-slate-50 border-r border-slate-100 flex flex-col gap-6">
            {/* Receipt Actions Toolbar */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-3">
                {previewUrls && previewUrls.length > 0 && !isOcrLoading && (
                  <button 
                    type="button"
                    onClick={() => runOCR(selectedFiles?.[selectedImageIdx] || selectedFiles?.[0])}
                    className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white rounded-xl font-black shadow-lg shadow-brand-600/20 hover:bg-brand-500 hover:scale-[1.02] transition-all active:scale-95 text-xs"
                  >
                    <Sparkles className="w-4 h-4" />
                    🤖 AI 智能辨識 (START OCR)
                  </button>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {previewUrls && previewUrls.length > 0 && (
                  <>
                    <button 
                      type="button" 
                      onClick={() => setRotation(prev => (prev + 90) % 360)} 
                      className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2 font-bold text-[10px]"
                      title="旋轉照片 Rotate"
                    >
                      <RotateCw className="w-3.5 h-3.5" /> ROTATE
                    </button>
                    <button 
                      type="button" 
                      onClick={() => window.open(previewUrls[selectedImageIdx], '_blank')} 
                      className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2 font-bold text-[10px]"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" /> OPEN
                    </button>
                    <button 
                      type="button" 
                      onClick={() => { 
                        const newPreview = [...previewUrls];
                        const newFiles = [...(selectedFiles || [])];
                        newPreview.splice(selectedImageIdx, 1);
                        if (newFiles.length > selectedImageIdx) newFiles.splice(selectedImageIdx, 1);
                        setPreviewUrls(newPreview);
                        setSelectedFiles(newFiles);
                        if (newPreview.length === 0) {
                          setFormData(prev => ({ ...prev, image_path: null }));
                        }
                        setSelectedImageIdx(0);
                      }} 
                      className="p-2.5 bg-rose-50 text-rose-500 border border-rose-100 rounded-xl shadow-sm hover:bg-rose-100 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Receipt Preview Card */}
            <div className="flex-1 relative bg-white rounded-[40px] overflow-hidden shadow-sm border border-slate-200/60 flex flex-col items-center justify-center group">
              {previewUrls && previewUrls.length > 0 ? (
                <div
                  className={`relative w-full h-full cursor-zoom-in overflow-hidden flex items-center justify-center ${isZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
                  onClick={() => setIsZoomed(!isZoomed)}
                  onMouseMove={handleMouseMove}
                >
                  <img 
                    src={previewUrls[selectedImageIdx]} 
                    alt="Receipt" 
                    style={{ transform: `rotate(${rotation}deg) ${isZoomed ? 'scale(1.5)' : 'scale(1)'}` }}
                    className="max-w-full max-h-full object-contain transition-transform duration-300" 
                  />
                  {isZoomed && (
                    <div
                      className="absolute inset-0 z-10 pointer-events-none"
                      style={{
                        backgroundImage: `url(${previewUrls[selectedImageIdx]})`,
                        backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`,
                        backgroundSize: '250%',
                        backgroundRepeat: 'no-repeat',
                        transform: `rotate(${rotation}deg)`
                      }}
                    />
                  )}
                  {/* Primary Badge */}
                  {selectedImageIdx === 0 && (
                    <div className="absolute top-6 left-6 px-4 py-2 bg-brand-600 text-white rounded-2xl flex items-center gap-2 shadow-2xl z-20 border border-white/20">
                      <Star className="w-4 h-4 fill-white" />
                      <span className="text-[10px] font-black tracking-widest uppercase">Primary Photo (AI Target)</span>
                    </div>
                  )}
                </div>
              ) : (
                <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-all p-12 text-center group">
                  <div className="w-24 h-24 bg-slate-50 text-slate-200 rounded-[32px] flex items-center justify-center mb-8 border-2 border-dashed border-slate-100 group-hover:scale-110 group-hover:border-brand-500 group-hover:text-brand-500 transition-all">
                    <Camera className="w-10 h-10" />
                  </div>
                  <h4 className="text-xl font-black text-slate-900 mb-2 italic">UPLOAD RECEIPT(S)</h4>
                  <p className="text-slate-400 text-xs font-bold leading-relaxed max-w-[240px]">點擊上傳憑證照片（可多選），上傳後以第一張進行 AI 辨識。</p>
                  <input type="file" className="hidden" accept="image/*" multiple onChange={onFileChange} />
                </label>
              )}

              {/* Overlays */}
              {isOcrLoading && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-20">
                  <Loader2 className="w-12 h-12 text-brand-500 animate-spin mb-4" />
                  <p className="text-brand-600 font-black animate-pulse">AI 辨識中 READING...</p>
                </div>
              )}
              {isTopUp && (
                <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center p-12 text-center z-10">
                  <div className="w-24 h-24 bg-green-50 text-green-500 rounded-[32px] flex items-center justify-center mb-8 shadow-inner shadow-green-100"><PlusCircle className="w-12 h-12" /></div>
                  <h4 className="text-3xl font-black text-slate-900 mb-3 italic">公司撥款模式</h4>
                  <p className="text-slate-500 text-sm font-medium leading-relaxed">此模式專用於公司存入資金。系統將自動記為「收入」，不需要憑證。</p>
                </div>
              )}
              {isAdvance && (
                <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center p-12 text-center z-10">
                  <div className="w-24 h-24 bg-amber-50 text-amber-500 rounded-[32px] flex items-center justify-center mb-8 shadow-inner shadow-amber-100"><ArrowUpRight className="w-12 h-12" /></div>
                  <h4 className="text-3xl font-black text-slate-900 mb-3 italic">個人代墊模式</h4>
                  <p className="text-slate-500 text-sm font-medium leading-relaxed">此模式用於記錄個人代墊資金。系統將記為「收入」，不需要憑證。</p>
                </div>
              )}
              {!formData.has_bill && !isTopUp && !isAdvance && (
                <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center p-12 text-center z-20">
                  <div className="w-24 h-24 bg-slate-50 text-slate-300 rounded-[32px] flex items-center justify-center mb-8 shadow-inner shadow-slate-100"><Receipt className="w-12 h-12 opacity-30" /></div>
                  <h4 className="text-3xl font-black text-slate-900 mb-3 italic">無憑證報帳模式</h4>
                  <p className="text-slate-500 text-sm font-medium leading-relaxed">已手動切換為無憑證模式。請於右側欄位說明無憑證之原因。</p>
                  <button type="button" onClick={() => setFormData({ ...formData, has_bill: true })} className="mt-8 text-brand-600 font-bold hover:underline">重新開啟憑證上傳</button>
                </div>
              )}
            </div>

            {/* Thumbnails Navigation */}
            {previewUrls && previewUrls.length > 0 && (
              <div className="bg-white p-5 rounded-[40px] border border-slate-200/60 shadow-sm flex flex-col gap-4">
                <div className="flex items-center justify-between px-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Gallery ({previewUrls.length} Photos)</span>
                  {selectedImageIdx !== 0 && (
                    <button 
                      type="button"
                      onClick={() => {
                        const newPreview = [...previewUrls];
                        const newFiles = [...(selectedFiles || [])];
                        // Swap with index 0
                        const [movedUrl] = newPreview.splice(selectedImageIdx, 1);
                        newPreview.unshift(movedUrl);
                        if (newFiles.length > selectedImageIdx) {
                          const [movedFile] = newFiles.splice(selectedImageIdx, 1);
                          newFiles.unshift(movedFile);
                        }
                        setPreviewUrls(newPreview);
                        setSelectedFiles(newFiles);
                        setSelectedImageIdx(0);
                        setRotation(0);
                      }}
                      className="text-[10px] font-black text-brand-600 hover:text-brand-700 underline uppercase tracking-widest flex items-center gap-1"
                    >
                      <Star className="w-3 h-3" /> 設為首張 Set as Primary
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-3 overflow-x-auto pb-2 custom-scrollbar px-1">
                  {previewUrls.map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setSelectedImageIdx(idx);
                        setRotation(0);
                      }}
                      className={`relative min-w-[100px] h-24 rounded-2xl overflow-hidden border-2 transition-all flex-shrink-0 ${idx === selectedImageIdx ? 'border-brand-500 scale-105 shadow-lg' : 'border-slate-100 hover:border-slate-300'}`}
                    >
                      <img src={url} className="w-full h-full object-cover" alt={`Thumb ${idx}`} />
                      {idx === 0 && (
                        <div className="absolute top-1 right-1 bg-brand-600 rounded-full p-1 shadow-lg">
                          <Star className="w-2.5 h-2.5 fill-white text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                  <label className="min-w-[100px] h-24 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center cursor-pointer hover:bg-slate-100 hover:border-slate-300 transition-all">
                    <PlusCircle className="w-6 h-6 text-slate-400" />
                    <input type="file" className="hidden" accept="image/*" multiple onChange={onFileChange} />
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Right: Form */}
          <form onSubmit={onAddExpense} className="w-full lg:w-1/2 p-10 space-y-8 bg-white">
            <div className="grid grid-cols-2 gap-6">
              <FormGroup label="1.1 發票日期 Invoice Date">
                <div className="relative group">
                  <input 
                    required 
                    type="text" 
                    placeholder="YYYY-MM-DD"
                    className="w-full bg-slate-50 border-none rounded-2xl pl-6 pr-14 py-4 outline-none font-bold focus:ring-2 focus:ring-brand-500/20" 
                    value={formData.invoice_date} 
                    onChange={e => setFormData({...formData, invoice_date: e.target.value})} 
                    onBlur={e => {
                      let val = e.target.value.trim();
                      if (!val) return;
                      // 1. Handle DD-Mon-YY
                      const monMatch = val.match(/^(\d{1,2})-(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)-(\d{2,4})$/i);
                      if (monMatch) {
                        const day = monMatch[1].padStart(2, '0');
                        const months = { jan:'01', feb:'02', mar:'03', apr:'04', may:'05', jun:'06', jul:'07', aug:'08', sep:'09', oct:'10', nov:'11', dec:'12' };
                        const month = months[monMatch[2].toLowerCase()];
                        let year = monMatch[3];
                        if (year.length === 2) year = '20' + year;
                        val = `${year}-${month}-${day}`;
                      }
                      val = val.replace(/[\/\.]/g, '-');
                      const parts = val.split('-');
                      if (parts.length === 3) {
                        const y = parts[0].length === 2 ? '20' + parts[0] : parts[0];
                        const m = parts[1].padStart(2, '0');
                        const d = parts[2].padStart(2, '0');
                        val = `${y}-${m}-${d}`;
                      }
                      setFormData({...formData, invoice_date: val});
                    }}
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center pr-2">
                    <input type="date" className="absolute inset-0 opacity-0 cursor-pointer w-full" onChange={e => setFormData({...formData, invoice_date: e.target.value})} />
                    <Calendar className="w-5 h-5 text-slate-300 group-hover:text-brand-500 transition-colors pointer-events-none" />
                  </div>
                </div>
              </FormGroup>
              <FormGroup label="1.2 建立日期 Created Date">
                <div className="relative group">
                  <input 
                    required 
                    type="text" 
                    placeholder="YYYY-MM-DD"
                    className="w-full bg-slate-50 border-none rounded-2xl pl-6 pr-14 py-4 outline-none font-bold focus:ring-2 focus:ring-brand-500/20" 
                    value={formData.reimbursement_date} 
                    onChange={e => setFormData({...formData, reimbursement_date: e.target.value})} 
                    onBlur={e => {
                      let val = e.target.value.trim();
                      if (!val) return;
                      // 1. Handle DD-Mon-YY
                      const monMatch = val.match(/^(\d{1,2})-(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)-(\d{2,4})$/i);
                      if (monMatch) {
                        const day = monMatch[1].padStart(2, '0');
                        const months = { jan:'01', feb:'02', mar:'03', apr:'04', may:'05', jun:'06', jul:'07', aug:'08', sep:'09', oct:'10', nov:'11', dec:'12' };
                        const month = months[monMatch[2].toLowerCase()];
                        let year = monMatch[3];
                        if (year.length === 2) year = '20' + year;
                        val = `${year}-${month}-${day}`;
                      }
                      val = val.replace(/[\/\.]/g, '-');
                      const parts = val.split('-');
                      if (parts.length === 3) {
                        const y = parts[0].length === 2 ? '20' + parts[0] : parts[0];
                        const m = parts[1].padStart(2, '0');
                        const d = parts[2].padStart(2, '0');
                        val = `${y}-${m}-${d}`;
                      }
                      setFormData({...formData, reimbursement_date: val});
                    }}
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center pr-2">
                    <input type="date" className="absolute inset-0 opacity-0 cursor-pointer w-full" onChange={e => setFormData({...formData, reimbursement_date: e.target.value})} />
                    <Calendar className="w-5 h-5 text-slate-300 group-hover:text-brand-500 transition-colors pointer-events-none" />
                  </div>
                </div>
              </FormGroup>
            </div>

            <FormGroup label="1.3 經辦 Personnel">
              <select required className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 outline-none font-bold focus:ring-2 focus:ring-brand-500/20" value={formData.personnel_id} onChange={e => setFormData({ ...formData, personnel_id: e.target.value })}>
                <option value="">選擇人員 Select...</option>
                {personnel.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </FormGroup>

            <div className="grid grid-cols-2 gap-6">
              <FormGroup label="2.1 類別 Category">
                <select required className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 outline-none font-bold focus:ring-2 focus:ring-brand-500/20" value={formData.category_id} onChange={e => setFormData({ ...formData, category_id: e.target.value })}>
                  <option value="">選擇類別 Select Category...</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name_zh} {c.name_en ? `(${c.name_en})` : ''}
                    </option>
                  ))}
                </select>
              </FormGroup>
              <FormGroup label="2.4 供應商 Supplier">
                <input list="suppliers-list-modal" className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 outline-none font-bold focus:ring-2 focus:ring-brand-500/20" value={formData.supplier_name} onChange={e => setFormData({ ...formData, supplier_name: e.target.value })} placeholder="輸入或選擇..." />
                <datalist id="suppliers-list-modal">
                  {suppliers.map(s => <option key={s.id} value={s.name} />)}
                </datalist>
              </FormGroup>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <FormGroup label="2.2 中文細目 Detail (ZH)">
                <div className="relative group">
                  <input 
                    required 
                    type="text" 
                    className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 outline-none font-bold focus:ring-2 focus:ring-brand-500/20" 
                    value={formData.detail_zh} 
                    onChange={e => setFormData({ ...formData, detail_zh: e.target.value })} 
                    onBlur={() => handleBlurTranslate('detail_zh', 'detail_en')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleBlurTranslate('detail_zh', 'detail_en');
                      }
                    }}
                  />
                </div>
              </FormGroup>
              <FormGroup label="2.3 英文細目 Detail (EN)">
                <div className="relative group">
                  <input 
                    required 
                    type="text" 
                    className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 outline-none font-bold focus:ring-2 focus:ring-brand-500/20" 
                    value={formData.detail_en} 
                    onChange={e => setFormData({ ...formData, detail_en: e.target.value })} 
                    onBlur={() => handleBlurTranslate('detail_en', 'detail_zh')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleBlurTranslate('detail_en', 'detail_zh');
                      }
                    }}
                  />
                </div>
              </FormGroup>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <FormGroup label="3.1 支出 Outgoing (-)">
                <input disabled={isIncomeMode} type="number" className={`w-full bg-rose-50 border-none rounded-2xl px-6 py-4 outline-none font-black text-rose-600 text-xl focus:ring-2 focus:ring-rose-500/20 ${isIncomeMode ? 'opacity-30' : ''}`} value={formData.outgoing} onChange={e => setFormData({ ...formData, outgoing: e.target.value, incoming: '' })} />
              </FormGroup>
              <FormGroup label="3.2 收入 Incoming (+)">
                <input disabled={!isIncomeMode && formData.category_id !== ''} type="number" className={`w-full bg-green-50 border-none rounded-2xl px-6 py-4 outline-none font-black text-green-600 text-xl focus:ring-2 focus:ring-green-500/20 ${(!isIncomeMode && formData.category_id !== '') ? 'opacity-30' : ''}`} value={formData.incoming} onChange={e => setFormData({ ...formData, incoming: e.target.value, outgoing: '' })} />
              </FormGroup>
            </div>

            <div className="flex flex-col gap-6 pt-4">
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${!!formData.has_bill ? 'bg-brand-600 border-brand-600' : 'border-slate-200'}`}>
                    {!!formData.has_bill && <Check className="w-4 h-4 text-white" />}
                  </div>
                  <span className="text-sm font-black text-slate-600">附有憑證 HAS BILL</span>
                  <input type="checkbox" className="hidden" checked={!!formData.has_bill} onChange={e => setFormData({ ...formData, has_bill: e.target.checked })} />
                </label>

                <select className="flex-1 bg-slate-50 border-none rounded-2xl px-6 py-4 outline-none font-bold focus:ring-2 focus:ring-brand-500/20" value={formData.pay_status} onChange={e => setFormData({ ...formData, pay_status: e.target.value })}>
                  <option value="PAID">已付款 PAID</option>
                  <option value="TO_PAY">待付款 TO PAY</option>
                </select>
              </div>

              {!formData.has_bill && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="space-y-4 bg-rose-50/50 p-6 rounded-[32px] border border-rose-100">
                  <div className="flex items-center gap-2 text-rose-600 mb-2">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">請說明無憑證原因 Missing Bill Reason</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      required={!formData.has_bill}
                      placeholder="中文原因 (ZH Reason)..."
                      className="w-full bg-white border-none rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-rose-500/20"
                      value={formData.no_bill_reason_zh}
                      onChange={e => setFormData({ ...formData, no_bill_reason_zh: e.target.value })}
                    />
                    <input
                      placeholder="英文原因 (EN Reason)..."
                      className="w-full bg-white border-none rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-rose-500/20"
                      value={formData.no_bill_reason_en}
                      onChange={e => setFormData({ ...formData, no_bill_reason_en: e.target.value })}
                    />
                  </div>
                </motion.div>
              )}
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">All data is encrypted and stored locally.</p>
          <div className="flex gap-4">
            <button onClick={() => setIsAdding(false)} className="px-8 py-4 text-slate-500 font-bold hover:text-slate-700 transition-all">取消 CANCEL</button>
            <button
              onClick={onAddExpense}
              disabled={isSubmitting}
              className="px-12 py-4 bg-brand-600 text-white rounded-[24px] font-black text-lg shadow-xl shadow-brand-600/20 hover:bg-brand-500 transition-all flex items-center gap-3 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="animate-spin" /> : <><Check className="w-6 h-6" /> 儲存紀錄 SAVE</>}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
