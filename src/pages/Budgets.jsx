import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useFinanceCalc } from '../hooks/useFinanceCalc';
import { CATEGORIES } from '../data/mockData';

const fmt = (n) => '₹' + Math.abs(Math.round(n)).toLocaleString('en-IN');

function BudgetEditModal({ cat, current, onSave, onClose }) {
  const [val, setVal] = useState(String(current || ''));
  const { icon, color } = CATEGORIES[cat] || { icon: '💳', color: 'var(--accent)' };

  const submit = () => {
    const n = parseFloat(val);
    if (!isNaN(n) && n >= 0) { onSave(n); onClose(); }
  };

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 380 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div style={{ width: 44, height: 44, borderRadius: 'var(--r-md)', background: color + '18', border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{icon}</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--t1)' }}>Set Budget</div>
            <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 2 }}>{cat} · Monthly limit</div>
          </div>
          <button className="btn-icon" style={{ marginLeft: 'auto' }} onClick={onClose}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
          </button>
        </div>
        <div className="form-group" style={{ marginBottom: 8 }}>
          <label className="form-label">Monthly Budget (₹)</label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--t3)', fontSize: 14, fontWeight: 600, fontFamily: "'JetBrains Mono',monospace", pointerEvents: 'none' }}>₹</span>
            <input className="input" type="number" min="0" step="100" value={val} onChange={e => setVal(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} style={{ paddingLeft: 28 }} autoFocus />
          </div>
        </div>
        <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 22 }}>Set to 0 to disable tracking for this category</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button className="btn-primary" style={{ flex: 1 }} onClick={submit}>Save Budget</button>
        </div>
      </div>
    </div>
  );
}

function BudgetRow({ item, isAdmin, onEdit }) {
  const { icon, color } = CATEGORIES[item.cat] || { icon: '💳', color: '#888' };
  const barColor = item.over ? 'var(--red)' : item.pct > 80 ? 'var(--amber)' : color;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0', borderBottom: '1px solid var(--b-xs)' }}>
      <div style={{ width: 38, height: 38, borderRadius: 11, flexShrink: 0, background: color + '18', border: `1px solid ${color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{icon}</div>
      <div style={{ width: 100, flexShrink: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>{item.cat}</div>
        <div style={{ fontSize: 10.5, color: 'var(--t3)', marginTop: 1, fontFamily: "'JetBrains Mono',monospace" }}>
          {fmt(item.spent)} / {item.budget > 0 ? fmt(item.budget) : 'No limit'}
        </div>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
          <span className="mono" style={{ fontSize: 10.5, color: item.over ? 'var(--red)' : item.pct > 80 ? 'var(--amber)' : 'var(--t3)' }}>
            {item.budget > 0 ? `${Math.min(item.pct, 200)}%` : '—'}
          </span>
          {item.over && <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--red)', background: 'var(--red-bg)', padding: '2px 7px', borderRadius: 99, border: '1px solid rgba(255,77,106,0.2)' }}>OVER BUDGET</span>}
          {!item.over && item.pct > 80 && item.budget > 0 && <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--amber)', background: 'var(--amber-bg)', padding: '2px 7px', borderRadius: 99 }}>NEAR LIMIT</span>}
        </div>
        {item.budget > 0 && (
          <div style={{ height: 6, background: 'var(--bg-elevated)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{
              width: `${Math.min(item.pct, 100)}%`, height: '100%', borderRadius: 99,
              background: barColor,
              boxShadow: `0 0 8px ${barColor}50`,
              animation: 'fillBar 0.7s cubic-bezier(.4,0,.2,1) both',
              transition: 'width 0.5s ease',
            }} />
          </div>
        )}
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0, minWidth: 80 }}>
        <div className="mono" style={{ fontSize: 12, fontWeight: 700, color: item.over ? 'var(--red)' : item.pct === 0 ? 'var(--t4)' : 'var(--t2)' }}>
          {item.budget > 0 ? (item.over ? `−${fmt(item.spent - item.budget)}` : `+${fmt(item.budget - item.spent)}`) : fmt(item.spent)}
        </div>
        <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 2 }}>
          {item.budget > 0 ? (item.over ? 'over limit' : 'remaining') : 'spent'}
        </div>
      </div>
      {isAdmin && (
        <button className="btn-ghost" style={{ fontSize: 11.5, padding: '5px 12px', flexShrink: 0 }} onClick={() => onEdit(item.cat)}>
          Edit
        </button>
      )}
    </div>
  );
}

export default function Budgets() {
  const { state, dispatch, toast } = useApp();
  const { budgetUsage } = useFinanceCalc();
  const isAdmin = state.role === 'admin';
  const [editCat, setEditCat] = useState(null);

  const totalBudget = Object.values(state.budgets).reduce((a, b) => a + b, 0);
  const totalSpent  = budgetUsage.reduce((a, b) => a + b.spent, 0);
  const overBudget  = budgetUsage.filter(b => b.over && b.budget > 0).length;
  const nearLimit   = budgetUsage.filter(b => !b.over && b.pct > 80 && b.budget > 0).length;
  const onTrack     = budgetUsage.filter(b => !b.over && b.pct <= 80 && b.budget > 0).length;
  const overallPct  = totalBudget > 0 ? Math.min(Math.round(totalSpent / totalBudget * 100), 200) : 0;

  const handleSave = (cat, amount) => {
    dispatch({ type: 'SET_BUDGET', payload: { cat, amount } });
    toast?.(`${cat} budget set to ${fmt(amount)}`, 'success');
  };

  const resetAll = () => {
    localStorage.removeItem('ft_budgets');
    toast?.('Budgets reset to defaults', 'success');
    window.location.reload();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {editCat && (
        <BudgetEditModal
          cat={editCat}
          current={state.budgets[editCat] || 0}
          onSave={(amount) => handleSave(editCat, amount)}
          onClose={() => setEditCat(null)}
        />
      )}

      {/* ── Summary Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14 }}>
        {[
          { label: 'Total Budget', value: fmt(totalBudget), color: 'var(--blue)',   icon: '📋', sub: 'across all categories' },
          { label: 'Total Spent',  value: fmt(totalSpent),  color: 'var(--amber)',  icon: '💳', sub: `${overallPct}% of budget` },
          { label: 'Over Budget',  value: String(overBudget), color: 'var(--red)',  icon: '⚠️', sub: `${overBudget > 0 ? 'categories exceeded' : 'All clear!'}` },
          { label: 'On Track',     value: String(onTrack),  color: 'var(--green)',  icon: '✅', sub: `${nearLimit} near limit` },
        ].map(({ label, value, color, icon, sub }, i) => (
          <div key={label} className={`metric-card anim-up d-${i}`}>
            <div className="accent-bar" style={{ background: color }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <span className="lbl">{label}</span>
              <div className="card-icon" style={{ background: color + '18', border: `1px solid ${color}28` }}>{icon}</div>
            </div>
            <div className="mono" style={{ fontSize: 24, fontWeight: 700, color, letterSpacing: '-1px', marginBottom: 8 }}>{value}</div>
            <div style={{ fontSize: 11.5, color: 'var(--t3)' }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* ── Overall progress ── */}
      <div className="card card-p anim-up d-4">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>Overall Budget Usage</div>
            <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 3 }}>{fmt(totalSpent)} of {fmt(totalBudget)}</div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span className="mono" style={{
              fontSize: 14, fontWeight: 700,
              color: overallPct > 100 ? 'var(--red)' : overallPct > 80 ? 'var(--amber)' : 'var(--green)',
            }}>{overallPct}%</span>
            {isAdmin && (
              <button className="btn-ghost" style={{ fontSize: 11, padding: '5px 10px' }} onClick={resetAll}>Reset</button>
            )}
          </div>
        </div>
        <div style={{ height: 10, background: 'var(--bg-elevated)', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{
            width: `${Math.min(overallPct, 100)}%`, height: '100%', borderRadius: 99,
            background: overallPct > 100 ? 'var(--red)' : overallPct > 80 ? 'var(--amber)' : 'var(--grad-accent)',
            boxShadow: overallPct > 100 ? '0 0 14px var(--red-glow)' : '0 0 14px var(--accent-glow)',
            animation: 'fillBar 0.9s cubic-bezier(.4,0,.2,1) both',
          }} />
        </div>
        {overBudget > 0 && (
          <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--red-bg)', border: '1px solid rgba(255,77,106,0.2)', borderRadius: 'var(--r-md)', fontSize: 12, color: 'var(--red)', display: 'flex', gap: 8, alignItems: 'center' }}>
            <span>⚠️</span>
            <span><strong>{overBudget} {overBudget === 1 ? 'category has' : 'categories have'} exceeded</strong> their budget this period. Review and adjust.</span>
          </div>
        )}
      </div>

      {/* ── Budget rows ── */}
      <div className="card card-p anim-up d-5">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>Category Budgets</div>
            <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 3 }}>Sorted by usage percentage</div>
          </div>
          {!isAdmin && (
            <span style={{ fontSize: 11, color: 'var(--t3)', background: 'var(--bg-elevated)', padding: '4px 10px', borderRadius: 99, border: '1px solid var(--b-sm)' }}>👁 View only</span>
          )}
        </div>
        <div>
          {budgetUsage.map(item => (
            <BudgetRow key={item.cat} item={item} isAdmin={isAdmin} onEdit={setEditCat} />
          ))}
        </div>
      </div>

      {/* ── 50/30/20 Tips ── */}
      <div className="card card-p anim-up d-6">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <div style={{ width: 40, height: 40, borderRadius: 'var(--r-md)', background: 'linear-gradient(135deg,rgba(0,240,200,0.12),rgba(77,159,255,0.10))', border: '1px solid rgba(0,240,200,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>💡</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>Budgeting Best Practices</div>
            <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>Tips to optimize your spending</div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 10 }}>
          {[
            { icon: '🏠', title: '50% Rule — Needs', desc: 'Keep essential expenses (rent, groceries, bills, transport) under 50% of income. Reduce if over.' },
            { icon: '🎯', title: '30% Rule — Wants', desc: 'Discretionary spend like dining, entertainment, shopping should stay under 30% of income.' },
            { icon: '💰', title: '20% Rule — Savings', desc: 'Aim to save and invest at least 20% of income. Automate this transfer on payday.' },
            { icon: '📊', title: 'Track Everything', desc: 'Even small expenses add up. Logging every transaction helps identify where money quietly disappears.' },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="obs-card">
              <div style={{ fontSize: 22, flexShrink: 0 }}>{icon}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)', marginBottom: 4 }}>{title}</div>
                <div style={{ fontSize: 11.5, color: 'var(--t3)', lineHeight: 1.6 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
