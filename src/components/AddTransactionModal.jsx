import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CATEGORIES } from '../data/mockData';

const cats = Object.keys(CATEGORIES).filter(c => c !== 'Salary' && c !== 'Freelance' && c !== 'Investment');
const incomes = ['Salary', 'Freelance', 'Investment'];

export default function AddTransactionModal({ onClose, editTx }) {
  const { state, dispatch, toast } = useApp();
  const isEdit = !!editTx;

  const [type,      setType]      = useState(editTx?.type || 'expense');
  const [name,      setName]      = useState(editTx?.name || '');
  const [amount,    setAmount]    = useState(editTx ? String(editTx.amount) : '');
  const [cat,       setCat]       = useState(editTx?.cat || (type === 'income' ? 'Salary' : 'Food'));
  const [date,      setDate]      = useState(editTx?.date || new Date().toISOString().split('T')[0]);
  const [note,      setNote]      = useState(editTx?.note || '');
  const [recurring, setRecurring] = useState(editTx?.recurring ?? false);
  const [err,       setErr]       = useState('');
  const [shaking,   setShaking]   = useState(false);

  const triggerErr = (msg) => {
    setErr(msg);
    setShaking(true);
    setTimeout(() => setShaking(false), 400);
  };

  const availCats = type === 'income' ? incomes : Object.keys(CATEGORIES).filter(c => !incomes.includes(c));

  const handleTypeSwitch = (t) => {
    setType(t);
    setCat(t === 'income' ? 'Salary' : 'Food');
  };

  const submit = () => {
    if (!name.trim())           return triggerErr('Please enter a description.');
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) return triggerErr('Please enter a valid amount > 0.');
    if (!date)                  return triggerErr('Please select a date.');

    const tx = {
      id: editTx?.id || Date.now(),
      name: name.trim().slice(0, 80),
      amount: amt, cat, type, date,
      note: note.trim().slice(0, 120),
      recurring,
    };
    if (isEdit) {
      dispatch({ type: 'EDIT_TX', payload: tx });
      toast?.('Transaction updated!', 'success');
    } else {
      dispatch({ type: 'ADD_TX', payload: tx });
      toast?.('Transaction added!', 'success');
    }
    onClose();
  };

  const { color: catColor } = CATEGORIES[cat] || { color: 'var(--accent)' };

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={`modal${shaking ? ' shake' : ''}`}>
        {/* Top stripe */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, borderRadius: 'var(--r-2xl) var(--r-2xl) 0 0', background: type === 'income' ? 'var(--grad-accent)' : 'linear-gradient(90deg,var(--red),#ff9060)' }} />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.4px' }}>{isEdit ? 'Edit Transaction' : 'Add Transaction'}</div>
            <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 3 }}>{isEdit ? 'Update the transaction details below' : 'Log a new income or expense'}</div>
          </div>
          <button className="btn-icon" onClick={onClose} aria-label="Close modal">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
          </button>
        </div>

        {/* Type toggle */}
        <div className="type-toggle" style={{ marginBottom: 18 }}>
          <button className={`type-opt${type === 'income' ? ' t-income' : ''}`} onClick={() => handleTypeSwitch('income')}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 10V3M3 6.5l3.5-3.5 3.5 3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Income
          </button>
          <button className={`type-opt${type === 'expense' ? ' t-expense' : ''}`} onClick={() => handleTypeSwitch('expense')}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 3v7M3 6.5l3.5 3.5 3.5-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Expense
          </button>
        </div>

        <form onSubmit={e => { e.preventDefault(); submit(); }} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Description */}
          <div className="form-group">
            <label className="form-label">Description *</label>
            <input className="input" placeholder={type === 'income' ? 'e.g. April Salary' : 'e.g. Swiggy Order'} value={name} onChange={e => { setName(e.target.value); setErr(''); }} />
          </div>

          <div className="form-row">
            {/* Amount */}
            <div className="form-group">
              <label className="form-label">Amount (₹) *</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--t3)', fontFamily: "'JetBrains Mono',monospace", fontWeight: 600, fontSize: 14, pointerEvents: 'none' }}>₹</span>
                <input className="input" type="number" min="0.01" step="0.01" placeholder="0.00" value={amount} onChange={e => { setAmount(e.target.value); setErr(''); }} style={{ paddingLeft: 28 }} />
              </div>
            </div>

            {/* Date */}
            <div className="form-group">
              <label className="form-label">Date *</label>
              <input className="input" type="date" value={date} onChange={e => setDate(e.target.value)} max={new Date().toISOString().split('T')[0]} />
            </div>
          </div>

          {/* Category */}
          <div className="form-group">
            <label className="form-label">Category</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {availCats.map(c => {
                const { icon, color } = CATEGORIES[c] || { icon: '💳', color: '#888' };
                const active = cat === c;
                return (
                  <button
                    key={c} type="button"
                    onClick={() => setCat(c)}
                    style={{
                      padding: '6px 12px', borderRadius: 99,
                      border: `1px solid ${active ? color + '60' : 'var(--b-sm)'}`,
                      background: active ? color + '18' : 'var(--bg-elevated)',
                      color: active ? color : 'var(--t2)',
                      fontSize: 12, fontWeight: active ? 700 : 500,
                      fontFamily: 'inherit', cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      display: 'flex', alignItems: 'center', gap: 5,
                    }}
                  >
                    <span style={{ fontSize: 13 }}>{icon}</span>{c}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Note */}
          <div className="form-group">
            <label className="form-label">Note <span style={{ color: 'var(--t4)', fontWeight: 400 }}>(optional)</span></label>
            <input
              className="input"
              placeholder="e.g. Monthly auto-debit, sale price, work expense…"
              value={note}
              onChange={e => setNote(e.target.value)}
              maxLength={120}
            />
          </div>

          {/* Recurring toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 'var(--r-md)', background: recurring ? 'var(--accent-bg)' : 'var(--bg-elevated)', border: `1px solid ${recurring ? 'rgba(0,240,200,0.2)' : 'var(--b-sm)'}`, transition: 'all 0.2s', cursor: 'pointer' }}
            onClick={() => setRecurring(r => !r)}
          >
            <div style={{ width: 36, height: 20, borderRadius: 10, background: recurring ? 'var(--accent)' : 'var(--b-lg)', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
              <div style={{ position: 'absolute', top: 3, left: recurring ? 18 : 3, width: 14, height: 14, borderRadius: '50%', background: 'white', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: recurring ? 'var(--accent)' : 'var(--t2)' }}>Recurring / Auto-debit</div>
              <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 1 }}>Mark this as a subscription, SIP, or scheduled payment</div>
            </div>
          </div>

          {err && (
            <div style={{ padding: '10px 14px', background: 'var(--red-bg)', border: '1px solid rgba(255,77,106,0.25)', borderRadius: 'var(--r-md)', fontSize: 12.5, color: 'var(--red)', display: 'flex', gap: 8, alignItems: 'center' }}>
              <span>⚠️</span>{err}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button type="button" className="btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
            <button className="btn-primary" type="submit" style={{ flex: 1.5 }}>
              {isEdit ? 'Save Changes' : `Add ${type === 'income' ? 'Income' : 'Expense'}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
