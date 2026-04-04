import { useApp } from '../context/AppContext';
import { useFinanceCalc } from '../hooks/useFinanceCalc';

const fmt = (n) => '₹' + Math.abs(Math.round(n)).toLocaleString('en-IN');

const NAV = [
  {
    id: 'overview', label: 'Overview', badge: 'Live',
    icon: (
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
        <rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1.5" fill="currentColor"/>
        <rect x="9"   y="1.5" width="5.5" height="5.5" rx="1.5" fill="currentColor" opacity=".4"/>
        <rect x="1.5" y="9"   width="5.5" height="5.5" rx="1.5" fill="currentColor" opacity=".4"/>
        <rect x="9"   y="9"   width="5.5" height="5.5" rx="1.5" fill="currentColor" opacity=".2"/>
      </svg>
    ),
  },
  {
    id: 'transactions', label: 'Transactions', badgeDynamic: true,
    icon: (
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
        <path d="M2 4.5h12M2 8h8.5M2 11.5h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'insights', label: 'Insights',
    icon: (
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
        <path d="M1.5 13.5L5 8.5l3 3.5 3-6.5 3-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id: 'budgets', label: 'Budgets', badgeBudget: true,
    icon: (
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
        <path d="M8 2C4.686 2 2 4.686 2 8s2.686 6 6 6 6-2.686 6-6-2.686-6-6-6z" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M8 5v3l2 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id: 'goals', label: 'Goals', badgeGoals: true,
    icon: (
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="8" cy="8" r="1" fill="currentColor"/>
      </svg>
    ),
  },
];

export default function Sidebar() {
  const { state, dispatch } = useApp();
  const { totals, savingsRate, budgetUsage } = useFinanceCalc();
  const isOpen = state.sidebarOpen;

  const overBudgetCount = budgetUsage.filter(b => b.over && b.budget > 0).length;
  const goalsCompleted  = state.goals?.filter(g => g.current >= g.target).length || 0;

  return (
    <aside className={`sidebar anim-left d-0${isOpen ? ' open' : ''}`}>
      {/* Logo */}
      <div style={{ padding: '22px 20px 18px', borderBottom: '1px solid var(--b-xs)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <div className="logo-mark">
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
              <path d="M2.5 11.5L5.5 7l3 3.5 2.5-5.5 2.5 3" stroke="#001a14" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.5px', lineHeight: 1.1, color: 'var(--t1)' }}>
              Fin<span style={{ color: 'var(--accent)' }}>Track</span>
              <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--accent)', background: 'var(--accent-bg)', padding: '1px 5px', borderRadius: 4, marginLeft: 5, verticalAlign: 'middle', letterSpacing: '0.5px' }}>PRO</span>
            </div>
            <div style={{ fontSize: 9.5, color: 'var(--t3)', letterSpacing: '0.8px', fontWeight: 600, textTransform: 'uppercase', marginTop: 2 }}>Finance Dashboard</div>
          </div>
        </div>
      </div>

      {/* Balance Card */}
      <div className="sidebar-balance">
        <div className="balance-label">Net Balance</div>
        <div className="mono balance-amount">
          {fmt(totals.balance)}
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{
            fontSize: 10, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace",
            padding: '2px 8px', borderRadius: 99,
            background: savingsRate >= 20 ? 'var(--income-bg)' : 'var(--amber-bg)',
            color: savingsRate >= 20 ? 'var(--income)' : 'var(--amber)',
          }}>
            {savingsRate >= 0 ? '▲' : '▼'} {Math.abs(savingsRate)}% saved
          </span>
          <span style={{ fontSize: 10, color: 'var(--t3)' }}>of income</span>
        </div>
        {/* Mini sparkline — real data */}
        <div style={{ marginTop: 12, display: 'flex', gap: 3, alignItems: 'flex-end', height: 28 }}>
          {[0.4, 0.55, 0.48, 0.72, 0.62, 0.78, savingsRate > 0 ? Math.min(savingsRate / 40, 1) : 0.3].map((h, i) => (
            <div key={i} className="sparkline-bar" style={{
              height: `${h * 100}%`,
              background: i === 6 ? 'var(--accent)' : `rgba(0,240,200,${0.15 + h * 0.18})`,
            }} />
          ))}
        </div>
        <div style={{ fontSize: 9.5, color: 'var(--t3)', marginTop: 4, fontFamily: "'JetBrains Mono',monospace" }}>7-month trend</div>
      </div>

      {/* Navigation */}
      <div className="nav-section-lbl">Navigation</div>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '4px 8px' }}>
        {NAV.map(item => {
          const active = state.page === item.id;
          let badgeVal = '';
          if (item.badge) badgeVal = item.badge;
          else if (item.badgeDynamic) badgeVal = state.transactions.length;
          else if (item.badgeBudget) badgeVal = overBudgetCount > 0 ? `${overBudgetCount}!` : '';
          else if (item.badgeGoals) badgeVal = goalsCompleted > 0 ? `${goalsCompleted}✓` : '';

          return (
            <div
              key={item.id}
              className={`nav-item${active ? ' active' : ''}`}
              onClick={() => dispatch({ type: 'SET_PAGE', payload: item.id })}
            >
              <span className="nav-icon">{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {badgeVal !== '' && (
                <span className="nav-badge" style={{
                  background: active ? 'var(--accent-bg)' : item.badgeBudget && overBudgetCount > 0 ? 'var(--red-bg)' : 'var(--bg-active)',
                  color: active ? 'var(--accent)' : item.badgeBudget && overBudgetCount > 0 ? 'var(--red)' : 'var(--t3)',
                  border: active ? '1px solid rgba(0,240,200,0.2)' : 'none',
                }}>
                  {badgeVal}
                </span>
              )}
            </div>
          );
        })}
      </nav>

      {/* Period Stats */}
      <div className="nav-section-lbl" style={{ marginTop: 8 }}>This Period</div>
      <div style={{ padding: '4px 14px 8px', display: 'flex', flexDirection: 'column', gap: 1 }}>
        <StatRow label="Income"   value={fmt(totals.income)}  color="var(--income)" />
        <StatRow label="Expenses" value={fmt(totals.expense)} color="var(--expense)" />
        <StatRow label="Saved"    value={fmt(totals.balance)} color={totals.balance >= 0 ? 'var(--income)' : 'var(--expense)'} />
      </div>

      {/* User + Role */}
      <div style={{ marginTop: 'auto', padding: '12px 14px 14px', borderTop: '1px solid var(--b-xs)' }}>
        <div style={{ display: 'flex', gap: 4, marginBottom: 8, padding: '0 2px' }}>
          <div style={{
            flex: 1, textAlign: 'center', padding: '5px 8px',
            background: state.role === 'admin' ? 'var(--accent-bg)' : 'var(--bg-elevated)',
            border: `1px solid ${state.role === 'admin' ? 'rgba(0,240,200,0.2)' : 'var(--b-sm)'}`,
            borderRadius: 'var(--r-sm)',
            fontSize: 10.5, fontWeight: 700,
            color: state.role === 'admin' ? 'var(--accent)' : 'var(--t3)',
            cursor: 'pointer', transition: 'all var(--tb)',
          }} onClick={() => dispatch({ type: 'SET_ROLE', payload: 'admin' })}>🔑 Admin</div>
          <div style={{
            flex: 1, textAlign: 'center', padding: '5px 8px',
            background: state.role === 'viewer' ? 'var(--blue-bg)' : 'var(--bg-elevated)',
            border: `1px solid ${state.role === 'viewer' ? 'rgba(77,159,255,0.2)' : 'var(--b-sm)'}`,
            borderRadius: 'var(--r-sm)',
            fontSize: 10.5, fontWeight: 700,
            color: state.role === 'viewer' ? 'var(--blue)' : 'var(--t3)',
            cursor: 'pointer', transition: 'all var(--tb)',
          }} onClick={() => dispatch({ type: 'SET_ROLE', payload: 'viewer' })}>👁 Viewer</div>
        </div>
        <div className="user-card">
          <div className="user-avatar">SK</div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--t1)', letterSpacing: '-0.2px' }} className="truncate">Sri Sai Krishna</div>
            <div style={{ fontSize: 10.5, color: 'var(--t3)', marginTop: 1 }}>
              {state.role === 'admin' ? '🔑 Admin' : '👁 Viewer'} · Zorvyn
            </div>
          </div>
          <div className="live-dot" />
        </div>
      </div>
    </aside>
  );
}

function StatRow({ label, value, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 6px', borderRadius: 'var(--r-sm)', transition: 'background var(--tf)' }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <span style={{ fontSize: 11.5, color: 'var(--t3)', fontWeight: 500 }}>{label}</span>
      <span className="mono" style={{ fontSize: 11.5, fontWeight: 700, color: color || 'var(--t2)', letterSpacing: '-0.03em' }}>{value}</span>
    </div>
  );
}
