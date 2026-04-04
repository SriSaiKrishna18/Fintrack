import { useState } from 'react';
import { useApp } from '../context/AppContext';

const PAGE_META = {
  overview:     { title: 'Overview',     icon: '◼', sub: 'Financial summary · April 2026'     },
  transactions: { title: 'Transactions', icon: '⟷', sub: 'All records · filter & sort'        },
  insights:     { title: 'Insights',     icon: '↗', sub: 'Spending patterns & analytics'       },
  budgets:      { title: 'Budgets',      icon: '◎', sub: 'Category budget tracker'             },
  goals:        { title: 'Goals',        icon: '🎯', sub: 'Savings milestones & progress'      },
};

function exportCSV(transactions) {
  const rows = [
    ['ID', 'Date', 'Description', 'Category', 'Type', 'Amount (INR)'],
    ...transactions.map(t => [t.id, t.date, `"${t.name}"`, t.cat, t.type, t.amount]),
  ];
  const blob = new Blob([rows.map(r => r.join(',')).join('\n')], { type: 'text/csv' });
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'fintrack_export.csv' });
  a.click(); URL.revokeObjectURL(a.href);
}

function exportJSON(transactions) {
  const blob = new Blob([JSON.stringify(transactions, null, 2)], { type: 'application/json' });
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'fintrack_export.json' });
  a.click(); URL.revokeObjectURL(a.href);
}

export default function Topbar() {
  const { state, dispatch, toast } = useApp();
  const meta = PAGE_META[state.page] || PAGE_META.overview;
  const isDark = state.theme === 'dark';
  const isLight = state.theme === 'light';
  const [showExport, setShowExport] = useState(false);

  return (
    <header className="topbar">
      {/* Left */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
        <button
          className="hamburger btn-icon"
          aria-label="Toggle navigation menu"
          onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
          style={{ flexDirection: 'column', gap: 4, padding: 8 }}
        >
          <span style={{ width: 16, height: 1.5, background: 'var(--t2)', borderRadius: 2, display: 'block' }} />
          <span style={{ width: 11, height: 1.5, background: 'var(--t2)', borderRadius: 2, display: 'block' }} />
          <span style={{ width: 16, height: 1.5, background: 'var(--t2)', borderRadius: 2, display: 'block' }} />
        </button>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--accent-bg)', border: '1px solid rgba(0,240,200,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'var(--accent)', fontWeight: 800, flexShrink: 0 }}>{meta.icon}</div>
            <h1 style={{ fontSize: 15, fontWeight: isLight ? 600 : 800, letterSpacing: '-0.4px', color: 'var(--t1)', fontFamily: isLight ? "'DM Sans', sans-serif" : "'Inter', sans-serif" }}>{meta.title}</h1>
          </div>
          <p style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2, fontWeight: 500, marginLeft: 36 }}>{meta.sub}</p>
        </div>
      </div>

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        {/* Date range */}
        <select
          className="input"
          value={state.dateRange}
          onChange={e => dispatch({ type: 'SET_DATE_RANGE', payload: e.target.value })}
          style={{ width: 'auto', padding: '7px 32px 7px 12px', fontSize: 12, borderRadius: 10 }}
        >
          <option value="all">All Time</option>
          <option value="this-month">This Month</option>
          <option value="last-month">Last Month</option>
          <option value="last-3m">Last 3 Months</option>
        </select>

        {/* Theme toggle */}
        <button
          className="btn-icon"
          aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          onClick={() => dispatch({ type: 'TOGGLE_THEME' })}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          onMouseEnter={e => e.currentTarget.style.transform = 'rotate(22deg)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'rotate(0)'}
          style={{ transition: 'transform 0.3s ease' }}
        >
          {isDark ? (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="5"/>
              <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          )}
        </button>

        {/* Export dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            className="btn-ghost"
            style={{ fontSize: 12.5, padding: '7px 14px' }}
            onClick={() => setShowExport(v => !v)}
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M8 2v9M5 8l3 3 3-3M2 13h12"/></svg>
            Export
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
          </button>
          {showExport && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 49 }} onClick={() => setShowExport(false)} />
              <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, background: isLight ? 'rgba(255,255,255,0.97)' : 'var(--bg-elevated)', border: `1px solid ${isLight ? 'rgba(180,165,148,0.38)' : 'var(--b-md)'}`, borderRadius: 'var(--r-md)', boxShadow: 'var(--shadow-md)', zIndex: 50, minWidth: 160, overflow: 'hidden', animation: 'fadeIn 0.1s ease', backdropFilter: isLight ? 'blur(16px)' : 'none' }}>
                {[
                  { label: 'Export CSV', action: () => { exportCSV(state.transactions); toast?.('Exported as CSV', 'success'); setShowExport(false); } },
                  { label: 'Export JSON', action: () => { exportJSON(state.transactions); toast?.('Exported as JSON', 'success'); setShowExport(false); } },
                ].map(({ label, action }) => (
                  <button key={label} onClick={action} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 16px', background: 'none', border: 'none', color: 'var(--t2)', fontSize: 12.5, fontWeight: 500, fontFamily: 'Inter,sans-serif', cursor: 'pointer', transition: 'all var(--tf)' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--t1)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--t2)'; }}
                  >{label}</button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Role switcher */}
        <div className="role-switcher">
          <button
            className={`role-btn${state.role === 'admin' ? ' r-admin' : ''}`}
            onClick={() => { dispatch({ type: 'SET_ROLE', payload: 'admin' }); toast?.('Admin mode active', 'success'); }}
          >
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
              <path d="M8 2a3 3 0 100 6 3 3 0 000-6zM3 12c0-2.76 2.24-4 5-4s5 1.24 5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Admin
          </button>
          <button
            className={`role-btn${state.role === 'viewer' ? ' r-viewer' : ''}`}
            onClick={() => { dispatch({ type: 'SET_ROLE', payload: 'viewer' }); toast?.('Viewer mode active', 'info'); }}
          >
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
              <ellipse cx="8" cy="8" rx="7" ry="5" stroke="currentColor" strokeWidth="1.5"/>
              <circle cx="8" cy="8" r="2" fill="currentColor"/>
            </svg>
            Viewer
          </button>
        </div>
      </div>
    </header>
  );
}
