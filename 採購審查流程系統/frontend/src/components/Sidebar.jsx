import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  ClipboardList, 
  ShoppingBag, 
  Database, 
  Box, 
  Users, 
  Settings, 
  LogOut, 
  ChevronRight,
  Menu,
  User as UserIcon,
  ShieldCheck,
  FileClock,
  GitMerge,
  Languages
} from 'lucide-react';

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  user, 
  sidebarCollapsed, 
  setSidebarCollapsed,
  openCategories,
  toggleCategory, 
  handleLogout 
}) {
  const [lang, setLang] = useState('ZH'); // ZH or EN

  const t = (zh, en) => {
    return lang === 'ZH' ? (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.1 }}>
        <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{zh}</span>
        <span style={{ fontSize: '0.65rem', opacity: 0.5, letterSpacing: '0.05em' }}>{en}</span>
      </div>
    ) : (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.1 }}>
        <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{en}</span>
        <span style={{ fontSize: '0.65rem', opacity: 0.5, letterSpacing: '0.02em' }}>{zh}</span>
      </div>
    );
  };

  return (
    <div className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`} style={{ transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}>
      <div style={{ 
        padding: '1.25rem 1rem', 
        display: 'flex', 
        flexDirection: sidebarCollapsed ? 'column' : 'row',
        alignItems: 'center', 
        justifyContent: sidebarCollapsed ? 'center' : 'space-between', 
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        gap: sidebarCollapsed ? '1rem' : '0'
      }}>
        {/* Logo Section */}
        <a 
          href="http://localhost:5173/dashboard" 
          style={{ 
            textDecoration: 'none', 
            color: 'inherit', 
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            transition: 'transform 0.2s'
          }}
          title="返回 Nexus 主門戶"
        >
          {sidebarCollapsed ? (
            <div style={{ background: 'var(--secondary)', color: '#000', fontWeight: '900', padding: '4px 6px', borderRadius: '6px', fontSize: '0.7rem' }}>KST</div>
          ) : (
            <h1 style={{ margin: 0, fontSize: '1.2rem' }}>
              KST <span style={{ color: 'var(--secondary)', fontWeight: '900' }}>PR/PO</span>
            </h1>
          )}
        </a>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            onClick={() => setLang(lang === 'ZH' ? 'EN' : 'ZH')}
            style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: lang === 'ZH' ? 'var(--secondary)' : '#94a3b8', cursor: 'pointer', padding: '0.6rem', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 'bold' }}
          >
            {lang}
          </button>
          <button 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.6rem', borderRadius: '10px' }}
          >
            <Menu size={18} />
          </button>
        </div>
      </div>

      {/* User Info */}
      <div style={{ padding: '1.25rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: sidebarCollapsed ? 'center' : 'flex-start', gap: '0.75rem' }}>
          <div style={{ background: 'linear-gradient(135deg, var(--primary), #6366f1)', minWidth: '36px', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <UserIcon size={20} color="#fff" />
          </div>
          {!sidebarCollapsed && (
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 'bold' }}>{user.name}</div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{lang === 'ZH' ? user.dept_name || user.role : 'Authorized User'}</div>
            </div>
          )}
        </div>
      </div>

      <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', overflowY: 'auto', flex: 1 }}>
        {user.allowed_modules?.includes('dashboard') && (
          <div className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
            <LayoutDashboard size={20} /> {!sidebarCollapsed && t('儀表板', 'Dashboard')}
          </div>
        )}

        <div className="nav-group" style={{ marginTop: '0.75rem' }}>
          {!sidebarCollapsed && (
            <div className="nav-group-header" onClick={() => toggleCategory('requisition')} style={{ padding: '0.5rem 0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
               <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#64748b' }}>{t('單據管理', 'REQUISITION')}</span>
               <ChevronRight size={14} style={{ transform: openCategories.requisition ? 'rotate(90deg)' : 'none', transition: '0.2s', color: '#64748b' }} />
            </div>
          )}
          {(openCategories.requisition || sidebarCollapsed) && (
            <div className="nav-group-content" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {user.allowed_modules?.includes('pr') && (
                <div className={`nav-item ${activeTab === 'pr' ? 'active' : ''}`} onClick={() => setActiveTab('pr')}>
                  <ClipboardList size={20} /> {!sidebarCollapsed && t('請購管理', 'PR Management')}
                </div>
              )}
              {user.allowed_modules?.includes('approvals') && (
                <div className={`nav-item ${activeTab === 'approvals' ? 'active' : ''}`} onClick={() => setActiveTab('approvals')}>
                  <ShieldCheck size={20} /> {!sidebarCollapsed && t('待簽核佇列', 'Approvals')}
                </div>
              )}
              {user.allowed_modules?.includes('po') && (
                <div className={`nav-item ${activeTab === 'po' ? 'active' : ''}`} onClick={() => setActiveTab('po')}>
                  <ShoppingBag size={20} /> {!sidebarCollapsed && t('採購訂單', 'PO Management')}
                </div>
              )}
              {user.allowed_modules?.includes('history') && (
                <div className={`nav-item ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
                  <FileClock size={20} /> {!sidebarCollapsed && t('審查歷史', 'Review History')}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="nav-group" style={{ marginTop: '0.75rem' }}>
          {!sidebarCollapsed && (
            <div className="nav-group-header" onClick={() => toggleCategory('database')} style={{ padding: '0.5rem 0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
               <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#64748b' }}>{t('資料庫', 'DATABASE')}</span>
               <ChevronRight size={14} style={{ transform: openCategories.database ? 'rotate(90deg)' : 'none', transition: '0.2s', color: '#64748b' }} />
            </div>
          )}
          {(openCategories.database || sidebarCollapsed) && (
            <div className="nav-group-content" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {user.allowed_modules?.includes('subjects') && (
                <div className={`nav-item ${activeTab === 'subjects' ? 'active' : ''}`} onClick={() => setActiveTab('subjects')}>
                  <Database size={20} /> {!sidebarCollapsed && t('會計科目', 'Subjects')}
                </div>
              )}
              {user.allowed_modules?.includes('materials') && (
                <div className={`nav-item ${activeTab === 'materials' ? 'active' : ''}`} onClick={() => setActiveTab('materials')}>
                  <Box size={20} /> {!sidebarCollapsed && t('物料清單', 'BOM / Materials')}
                </div>
              )}
              {user.allowed_modules?.includes('departments') && (
                <div className={`nav-item ${activeTab === 'departments' ? 'active' : ''}`} onClick={() => setActiveTab('departments')}>
                  <GitMerge size={20} /> {!sidebarCollapsed && t('組織架構', 'Hierarchy')}
                </div>
              )}
              {user.allowed_modules?.includes('suppliers') && (
                <div className={`nav-item ${activeTab === 'suppliers' ? 'active' : ''}`} onClick={() => setActiveTab('suppliers')}>
                  <Users size={20} /> {!sidebarCollapsed && t('供應商名冊', 'Suppliers')}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="nav-item" onClick={handleLogout} style={{ color: '#fb7185' }}>
          <LogOut size={20} /> {!sidebarCollapsed && t('登出系統', 'Logout')}
        </div>
      </div>
    </div>
  );
}
