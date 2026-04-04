import { useState } from 'react';
import { useApp } from '../context/AppContext';

const fmt = (n) => '₹' + Math.abs(Math.round(n)).toLocaleString('en-IN');

const ICON_OPTIONS = ['🏠','✈️','💻','🚗','🎓','💍','🏋️','📱','🛡️','💰','🌴','🎯','🎸','📚'];
const COLOR_OPTIONS = ['#00f0c8','#4d9fff','#c47eff','#ffb340','#ff7c6e','#ff5c7a','#00d4ff','#a0c040'];

function GoalModal({ goal, onSave, onClose }) {
  const [name, setName]       = useState(goal?.name || '');
  const [target, setTarget]   = useState(String(goal?.target || ''));
  const [current, setCurrent] = useState(String(goal?.current || ''));
  const [icon, setIcon]       = useState(goal?.icon || '🎯');
  const [color, setColor]     = useState(goal?.color || '#00f0c8');

  const submit = () => {
    const t = parseFloat(target), c = parseFloat(current || 0);
    if (!name.trim() || isNaN(t) || t <= 0) return;
    onSave({ name: name.trim(), target: t, current: Math.min(c, t), icon, color });
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ fontSize: 16, fontWeight: 800 }}>{goal ? 'Edit Goal' : 'New Savings Goal'}</div>
          <button className="btn-icon" onClick={onClose}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Goal Name</label>
            <input className="input" placeholder="e.g. Emergency Fund" value={name} onChange={e => setName(e.target.value)} />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Target Amount (₹)</label>
              <input className="input" type="number" min="0" placeholder="0" value={target} onChange={e => setTarget(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Amount Saved So Far (₹)</label>
              <input className="input" type="number" min="0" placeholder="0" value={current} onChange={e => setCurrent(e.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Icon</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {ICON_OPTIONS.map(ic => (
                <button key={ic} onClick={() => setIcon(ic)} style={{
                  width: 40, height: 40, borderRadius: 10, border: `2px solid ${ic === icon ? color : 'var(--b-sm)'}`,
                  background: ic === icon ? color + '20' : 'var(--bg-elevated)',
                  fontSize: 18, cursor: 'pointer', transition: 'all 0.15s',
                }}>{ic}</button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Color</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {COLOR_OPTIONS.map(c => (
                <button key={c} onClick={() => setColor(c)} style={{
                  width: 28, height: 28, borderRadius: '50%', background: c, cursor: 'pointer',
                  border: `3px solid ${c === color ? 'var(--t1)' : 'transparent'}`,
                  boxShadow: c === color ? `0 0 10px ${c}80` : 'none',
                  transition: 'all 0.15s',
                }} />
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button className="btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
            <button className="btn-primary" style={{ flex: 1 }} onClick={submit}>{goal ? 'Save Changes' : 'Create Goal'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function GoalCard({ goal, isAdmin, onEdit, onDelete, onDeposit }) {
  const pct = goal.target > 0 ? Math.min(Math.round(goal.current / goal.target * 100), 100) : 0;
  const remaining = goal.target - goal.current;
  const months = remaining > 0 && goal.current > 0 ? Math.ceil(remaining / (goal.current / 3)) : null;

  return (
    <div className="goal-card" style={{ '--goal-color': goal.color }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16 }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: goal.color + '18', border: `1px solid ${goal.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{goal.icon}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)', marginBottom: 3 }}>{goal.name}</div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span className="mono" style={{ fontSize: 12, color: 'var(--t3)' }}>{pct}% complete</span>
            {months && <span style={{ fontSize: 11, color: 'var(--t3)' }}>· ~{months} mo at current pace</span>}
          </div>
        </div>
        {isAdmin && (
          <div style={{ display: 'flex', gap: 4 }}>
            <button className="btn-icon" style={{ width: 30, height: 30, fontSize: 13 }} onClick={() => onEdit(goal)} title="Edit">✏️</button>
            <button className="btn-icon" style={{ width: 30, height: 30, fontSize: 13 }} onClick={() => onDelete(goal.id)} title="Delete">🗑️</button>
          </div>
        )}
      </div>

      {/* Progress ring + bar */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
          <span className="mono" style={{ fontSize: 20, fontWeight: 700, color: goal.color, letterSpacing: '-0.8px' }}>{fmt(goal.current)}</span>
          <span className="mono" style={{ fontSize: 12, color: 'var(--t3)' }}>of {fmt(goal.target)}</span>
        </div>
        <div style={{ height: 8, background: 'var(--bg-elevated)', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{
            width: `${pct}%`, height: '100%', background: goal.color, borderRadius: 99,
            boxShadow: `0 0 12px ${goal.color}60`,
            animation: 'fillBar 0.9s cubic-bezier(.4,0,.2,1) both',
            transition: 'width 0.6s cubic-bezier(.4,0,.2,1)',
          }} />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11.5, color: 'var(--t3)' }}>
          {remaining > 0 ? `${fmt(remaining)} remaining` : '🎉 Goal reached!'}
        </span>
        {isAdmin && remaining > 0 && (
          <button
            className="btn-ghost"
            style={{ fontSize: 11.5, padding: '5px 12px', color: goal.color, borderColor: goal.color + '40' }}
            onClick={() => onDeposit(goal)}
          >
            + Add funds
          </button>
        )}
      </div>
    </div>
  );
}

function DepositModal({ goal, onSave, onClose }) {
  const [amount, setAmount] = useState('');
  const submit = () => {
    const a = parseFloat(amount);
    if (!isNaN(a) && a > 0) { onSave(goal.id, Math.min(a, goal.target - goal.current)); onClose(); }
  };
  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>{goal.icon}</div>
          <div style={{ fontSize: 16, fontWeight: 800 }}>Add to {goal.name}</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 4 }}>Current: {fmt(goal.current)} / {fmt(goal.target)}</div>
        </div>
        <div className="form-group" style={{ marginBottom: 20 }}>
          <label className="form-label">Amount to Add (₹)</label>
          <input className="input" type="number" min="1" max={goal.target - goal.current} placeholder="Enter amount" value={amount} onChange={e => setAmount(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} autoFocus />
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button className="btn-primary" style={{ flex: 1, background: `linear-gradient(135deg,${goal.color},${goal.color}cc)` }} onClick={submit}>Add Funds</button>
        </div>
      </div>
    </div>
  );
}

export default function Goals() {
  const { state, dispatch, toast } = useApp();
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [editGoal, setEditGoal]           = useState(null);
  const [depositGoal, setDepositGoal]     = useState(null);
  const isAdmin = state.role === 'admin';

  const totalTarget  = state.goals.reduce((a, g) => a + g.target, 0);
  const totalSaved   = state.goals.reduce((a, g) => a + g.current, 0);
  const overallPct   = totalTarget > 0 ? Math.round(totalSaved / totalTarget * 100) : 0;
  const completed    = state.goals.filter(g => g.current >= g.target).length;

  const handleSave = (data) => {
    if (editGoal) {
      dispatch({ type: 'UPDATE_GOAL', payload: { ...editGoal, ...data } });
      toast('Goal updated!', 'success');
    } else {
      dispatch({ type: 'ADD_GOAL', payload: { id: Date.now(), ...data } });
      toast('Goal created!', 'success');
    }
    setEditGoal(null);
  };

  const handleDelete = (id) => {
    dispatch({ type: 'DELETE_GOAL', payload: id });
    toast('Goal removed', 'error');
  };

  const handleDeposit = (id, amount) => {
    const goal = state.goals.find(g => g.id === id);
    dispatch({ type: 'UPDATE_GOAL', payload: { id, current: goal.current + amount } });
    toast(`${fmt(amount)} added to ${goal.name}!`, 'success');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Modals */}
      {(showGoalModal || editGoal) && (
        <GoalModal
          goal={editGoal}
          onSave={handleSave}
          onClose={() => { setShowGoalModal(false); setEditGoal(null); }}
        />
      )}
      {depositGoal && (
        <DepositModal
          goal={depositGoal}
          onSave={handleDeposit}
          onClose={() => setDepositGoal(null)}
        />
      )}

      {/* ── Summary ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
        {[
          { label: 'Total Goal Target', value: fmt(totalTarget), color: 'var(--blue)', icon: '🎯', sub: `${state.goals.length} active goals` },
          { label: 'Total Saved', value: fmt(totalSaved), color: 'var(--green)', icon: '💰', sub: `${overallPct}% of target` },
          { label: 'Goals Completed', value: String(completed), color: 'var(--purple)', icon: '🏆', sub: `of ${state.goals.length} total` },
          { label: 'Still Needed', value: fmt(Math.max(totalTarget - totalSaved, 0)), color: 'var(--amber)', icon: '🔜', sub: 'to reach all goals' },
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

      {/* Overall progress */}
      <div className="card card-p anim-up d-4">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>Overall Progress</div>
          <span className="mono" style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>{overallPct}%</span>
        </div>
        <div style={{ height: 10, background: 'var(--bg-elevated)', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{
            width: `${overallPct}%`, height: '100%', borderRadius: 99,
            background: 'var(--grad-accent)',
            boxShadow: '0 0 14px var(--accent-glow)',
            animation: 'fillBar 1s cubic-bezier(.4,0,.2,1) both',
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
          <span style={{ fontSize: 11.5, color: 'var(--t3)' }}>{fmt(totalSaved)} saved</span>
          <span style={{ fontSize: 11.5, color: 'var(--t3)' }}>{fmt(totalTarget)} target</span>
        </div>
      </div>

      {/* Goals header + add */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700 }}>Your Savings Goals</div>
          <div style={{ fontSize: 11.5, color: 'var(--t3)', marginTop: 2 }}>{state.goals.length} goals · {completed} completed</div>
        </div>
        {isAdmin && (
          <button className="btn-primary" onClick={() => setShowGoalModal(true)}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 1v11M1 6.5h11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            New Goal
          </button>
        )}
      </div>

      {state.goals.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">🎯</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--t2)', marginBottom: 6 }}>No goals yet</div>
            <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 280, lineHeight: 1.6, marginBottom: 20 }}>
              Set savings goals to track your financial milestones — emergency fund, travel, big purchases.
            </div>
            {isAdmin && <button className="btn-primary" onClick={() => setShowGoalModal(true)}>Create First Goal</button>}
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
          {state.goals.map((goal, i) => (
            <div key={goal.id} className={`anim-up d-${Math.min(i, 8)}`}>
              <GoalCard
                goal={goal}
                isAdmin={isAdmin}
                onEdit={setEditGoal}
                onDelete={handleDelete}
                onDeposit={setDepositGoal}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
