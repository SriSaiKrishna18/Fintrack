import { useEffect, useState, useCallback } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import ToastContainer from './components/Toast';
import Overview from './pages/Overview';
import Transactions from './pages/Transactions';
import Insights from './pages/Insights';
import Budgets from './pages/Budgets';
import Goals from './pages/Goals';

const PAGE_KEYS = { '1': 'overview', '2': 'transactions', '3': 'insights', '4': 'budgets', '5': 'goals' };
const SHORTCUT_LIST = [
  { key: '1–5', desc: 'Navigate pages' },
  { key: 'T', desc: 'Toggle theme' },
  { key: 'N', desc: 'New transaction (Admin)' },
  { key: '?', desc: 'Show shortcuts' },
  { key: 'Esc', desc: 'Close modals' },
];

function KeyboardShortcutsModal({ onClose }) {
  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 400 }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, borderRadius: 'var(--r-2xl) var(--r-2xl) 0 0', background: 'var(--grad-accent)' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.3px' }}>⌨️ Keyboard Shortcuts</div>
            <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 3 }}>Navigate faster with your keyboard</div>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {SHORTCUT_LIST.map(({ key, desc }) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 4px', borderBottom: '1px solid var(--b-xs)' }}>
              <span style={{ fontSize: 13, color: 'var(--t2)', fontWeight: 500 }}>{desc}</span>
              <kbd style={{
                fontFamily: state.theme === 'light' ? "'DM Mono',monospace" : "'JetBrains Mono',monospace", fontSize: 11, fontWeight: 700,
                padding: '3px 10px', borderRadius: 8,
                background: 'var(--bg-elevated)', border: '1px solid var(--b-md)',
                color: 'var(--accent)', boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
              }}>{key}</kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AppShell() {
  const { state, dispatch, toast } = useApp();
  const [showShortcuts, setShowShortcuts] = useState(false);

  const pages = {
    overview:     Overview,
    transactions: Transactions,
    insights:     Insights,
    budgets:      Budgets,
    goals:        Goals,
  };
  const Page = pages[state.page] || Overview;

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e) => {
    // Don't fire when typing in inputs
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;

    const key = e.key;

    if (key === '?' || (e.shiftKey && key === '/')) {
      e.preventDefault();
      setShowShortcuts(s => !s);
      return;
    }
    if (key === 'Escape') {
      setShowShortcuts(false);
      return;
    }
    if (PAGE_KEYS[key]) {
      e.preventDefault();
      dispatch({ type: 'SET_PAGE', payload: PAGE_KEYS[key] });
      return;
    }
    if (key.toLowerCase() === 't' && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      dispatch({ type: 'TOGGLE_THEME' });
      return;
    }
    if (key.toLowerCase() === 'n' && !e.ctrlKey && !e.metaKey && state.role === 'admin') {
      e.preventDefault();
      dispatch({ type: 'SET_PAGE', payload: 'transactions' });
      toast?.('Press the + Add button to create a transaction', 'info');
      return;
    }
  }, [dispatch, state.role, toast]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="app-shell">
      {/* Background decorations */}
      <div className="bg-mesh" />
      <div className="grid-overlay" />
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      {/* Mobile overlay */}
      {state.sidebarOpen && (
        <div className="mobile-overlay" onClick={() => dispatch({ type: 'CLOSE_SIDEBAR' })} />
      )}

      <Sidebar />

      <div className="main-area">
        <Topbar />
        <main id="main-content" key={state.page} className="page-scroll anim-up d-0">
          <Page />
        </main>
      </div>

      <ToastContainer />

      {/* Keyboard shortcuts modal */}
      {showShortcuts && <KeyboardShortcutsModal onClose={() => setShowShortcuts(false)} />}

      {/* Keyboard hint */}
      <div className="kbd-hint" title="Press ? for shortcuts" onClick={() => setShowShortcuts(true)}>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="1" y="4" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.4"/><path d="M4 4V3a4 4 0 018 0v1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><circle cx="8" cy="9" r="1.5" fill="currentColor"/></svg>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
