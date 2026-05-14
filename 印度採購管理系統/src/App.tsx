// ============================================================
// App.tsx v2.0 — 7 模組 Sidebar + Navigation
// ============================================================

import React, { useEffect, useState } from 'react';
import { LocationDB, ProductDB, DatabaseSync } from './db';
import InboundModule from './modules/InboundModule';
import OutboundModule from './modules/OutboundModule';
import InventoryModule from './modules/InventoryModule';
import AuditModule from './modules/AuditModule';
import LocationsModule from './modules/LocationsModule';
import BomModule from './modules/BomModule';
import SettingsModule from './modules/SettingsModule';
import ProductionModule from './modules/ProductionModule';
import QCManagementModule from './modules/QCManagementModule';
import BatchManagementModule from './modules/BatchManagementModule';
import { QCStatusDB } from './db';
import {
  LayoutDashboard,
  PackagePlus,
  PackageSearch,
  ClipboardList,
  ArrowRightLeft,
  MapPin,
  Settings,
  Factory,
  ShieldCheck,
  GitBranch,
} from 'lucide-react';

type Page = 'inbound' | 'inventory' | 'outbound' | 'production' | 'audit' | 'bom' | 'locations' | 'qc' | 'batch' | 'settings';

const NAV_ITEMS: { id: Page; label: string; labelEn: string; icon: React.ReactNode }[] = [
  { id: 'inbound',   label: '倉庫入庫',       labelEn: 'Inbound',            icon: <PackagePlus size={18} /> },
  { id: 'inventory', label: '庫存查詢/異動',   labelEn: 'Inventory',          icon: <ClipboardList size={18} /> },
  { id: 'batch',     label: '批號溯源管理',    labelEn: 'Batch Trace',        icon: <GitBranch size={18} /> },
  { id: 'outbound',  label: '製程/委外出庫',   labelEn: 'Outbound',           icon: <ArrowRightLeft size={18} /> },
  { id: 'production', label: '生產完工',       labelEn: 'Production',         icon: <Factory size={18} /> },
  { id: 'audit',     label: '異動記錄查詢',    labelEn: 'Audit Log',          icon: <PackageSearch size={18} /> },
  { id: 'bom',       label: 'BOM單位換算',     labelEn: 'BOM Conversion',     icon: <LayoutDashboard size={18} /> },
  { id: 'qc',        label: '品檢碼管理',      labelEn: 'QC Management',      icon: <ShieldCheck size={18} /> },
  { id: 'locations', label: '儲位建檔',        labelEn: 'Locations',          icon: <MapPin size={18} /> },
  { id: 'settings',  label: '系統設定',        labelEn: 'Settings',           icon: <Settings size={18} /> },
];

export default function App() {
  const [page, setPage] = useState<Page>('inbound');
  const [lang, setLang] = useState<'ZH' | 'EN'>('ZH');
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        // 0. 先從本地檔案同步資料 (重要)
        await DatabaseSync.pull();

        // 1. 執行標準初始化
        LocationDB.seedDefaults();
        ProductDB.seedDefaults();
        QCStatusDB.seedDefaults();
        
        // 2. 自動修復舊資料
        const locs = LocationDB.getAll();
        let changed = false;
        const fixedLocs = locs.map(l => {
          if (!l.warehouseCategory) {
            changed = true;
            if (l.warehouseCode.startsWith('I')) return { ...l, warehouseCategory: 'PROCESS' as const };
            if (l.warehouseCode.startsWith('SD')) return { ...l, warehouseCategory: 'SUB' as const };
            return { ...l, warehouseCategory: 'NORMAL' as const };
          }
          return l;
        });
        if (changed) {
          localStorage.setItem('wms_locations', JSON.stringify(fixedLocs));
          DatabaseSync.push();
        }
      } catch (e) {
        console.error('Initialization error:', e);
      } finally {
        setInitialized(true);
      }
    };

    init();
  }, []);

  if (!initialized) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh', 
        background: '#0f172a', 
        color: '#38bdf8',
        fontSize: '1.25rem',
        fontWeight: '600'
      }}>
        系統載入中 Loading System...
      </div>
    );
  }

  return (
    <div className="app-shell">

      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h1>KST 健和興</h1>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.7rem' }}>India WMS · v2.1</span>
            
            {/* 語系切換開關 */}
            <div className="lang-toggle" onClick={() => setLang(l => l === 'ZH' ? 'EN' : 'ZH')}>
              <div className={`lang-option ${lang === 'ZH' ? 'active' : ''}`}>中</div>
              <div className={`lang-option ${lang === 'EN' ? 'active' : ''}`}>EN</div>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-title">
            {lang === 'ZH' ? '主要功能 MAIN' : 'MAIN FUNCTIONS 主要功能'}
          </div>
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              className={`nav-item ${page === item.id ? 'active' : ''}`}
              onClick={() => setPage(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.1 }}>
                {lang === 'ZH' ? (
                  <>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{item.label}</div>
                    <div style={{ fontSize: '0.65rem', opacity: 0.5 }}>{item.labelEn}</div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{item.labelEn}</div>
                    <div style={{ fontSize: '0.65rem', opacity: 0.5 }}>{item.label}</div>
                  </>
                )}
              </div>
            </button>
          ))}
        </nav>
      </aside>

      {/* ── Main Content ── */}
      <main className="main-content">
        <header className="top-header">
          <span className="page-title">
            {NAV_ITEMS.find(n => n.id === page)?.label} {NAV_ITEMS.find(n => n.id === page)?.labelEn}
          </span>
          <div className="header-right">
            <span style={{ fontSize: '0.8rem', color: 'var(--color-primary-500)' }}>
              {new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
        </header>

        <div className="page-body">
          {page === 'inbound'   && <InboundModule />}
          {page === 'inventory' && <InventoryModule lang={lang} />}
          {page === 'outbound'  && <OutboundModule />}
          {page === 'production' && <ProductionModule />}
          {page === 'audit'     && <AuditModule />}
          {page === 'bom'       && <BomModule />}
          {page === 'qc'        && <QCManagementModule lang={lang} />}
          {page === 'batch'     && <BatchManagementModule lang={lang} />}
          {page === 'locations' && <LocationsModule />}
          {page === 'settings'  && <SettingsModule />}
        </div>
      </main>

      <style>{`
        .lang-toggle { display: flex; background: rgba(255,255,255,0.1); border-radius: 20px; padding: 2px; cursor: pointer; transition: 0.3s; }
        .lang-option { flex: 1; text-align: center; font-size: 0.6rem; padding: 2px 6px; border-radius: 18px; color: rgba(255,255,255,0.5); font-weight: 700; transition: 0.3s; min-width: 25px; }
        .lang-option.active { background: #38bdf8; color: #fff; }
      `}</style>
    </div>
  );
}
