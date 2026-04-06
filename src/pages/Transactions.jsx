import { useEffect, useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useFinanceCalc } from '../hooks/useFinanceCalc';
import { CATEGORIES } from '../data/mockData';
import TransactionModal from '../components/AddTransactionModal';

const fmt = (n) => '₹' + Math.abs(Math.round(n)).toLocaleString('en-IN');
const csvEscape = (value) => {
  const str = String(value ?? '');
  return `"${str.replace(/"/g, '""')}"`;
};

function SortArrow({ active, dir }) {
  return (
    <svg width="9" height="9" viewBox="0 0 10 10" fill="none"
      style={{ opacity: active ? 1 : 0.25, flexShrink: 0, marginLeft: 3 }}>
      {dir === -1
        ? <path d="M5 1l4 7H1l4-7z" fill="currentColor" />
        : <path d="M5 9L1 2h8L5 9z" fill="currentColor" />}
    </svg>
  );
}

function Empty({ icon, title, sub, action }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--t2)', marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 280, lineHeight: 1.6 }}>{sub}</div>
      {action}
    </div>
  );
}

// Inline note editor — shows a small pencil, click to expand into a text input
function InlineNote({ tx, isAdmin, dispatch, toast }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(tx.note || '');
  const inputRef = useRef(null);

  const save = () => {
    if (val.trim() !== (tx.note || '').trim()) {
      dispatch({ type: 'SET_TX_NOTE', payload: { id: tx.id, note: val.trim() } });
      if (val.trim()) toast?.('Note saved', 'success');
    }
    setEditing(false);
  };

  if (!isAdmin && !tx.note) return null;

  if (editing) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
        <input
          ref={inputRef}
          autoFocus
          value={val}
          onChange={e => setVal(e.target.value)}
          onBlur={save}
          onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') { setVal(tx.note||''); setEditing(false); } }}
          placeholder="Add a note…"
          style={{
            fontSize: 10.5, padding: '2px 7px', borderRadius: 5,
            border: '1px solid var(--b-focus)', background: 'var(--bg-input)',
            color: 'var(--t2)', fontFamily: 'inherit', outline: 'none',
            width: 180, transition: 'all 0.15s',
          }}
        />
        <button onClick={save} style={{ fontSize: 10, padding: '2px 7px', borderRadius: 5, border: '1px solid var(--b-md)', background: 'var(--bg-elevated)', color: 'var(--accent)', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>Save</button>
      </div>
    );
  }

  if (tx.note) {
    return (
      <div
        onClick={() => isAdmin && setEditing(true)}
        title={isAdmin ? 'Click to edit note' : tx.note}
        style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3, cursor: isAdmin ? 'pointer' : 'default', maxWidth: 220 }}
      >
        <span style={{ fontSize: 9.5, opacity: 0.55 }}>📌</span>
        <span style={{ fontSize: 10.5, color: 'var(--t3)', fontStyle: 'italic' }} className="truncate">{tx.note}</span>
      </div>
    );
  }

  // Admin, no note yet — show ghost add button
  return (
    <button
      onClick={() => setEditing(true)}
      style={{ marginTop: 3, fontSize: 10, color: 'var(--t4)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 3, transition: 'color 0.15s' }}
      onMouseEnter={e => e.currentTarget.style.color = 'var(--t3)'}
      onMouseLeave={e => e.currentTarget.style.color = 'var(--t4)'}
    >
      + add note
    </button>
  );
}

export default function Transactions() {
  const { state, dispatch, toast } = useApp();
  const { filteredTxs } = useFinanceCalc();
  const [showModal, setShowModal]     = useState(false);
  const [editTx, setEditTx]           = useState(null);
  const [delConfirm, setDelConfirm]   = useState(null);
  const [page, setPage]               = useState(1);
  const [selected, setSelected]       = useState(new Set());   // bulk select
  const [bulkConfirm, setBulkConfirm] = useState(false);
  const PER_PAGE = 15;

  const isAdmin    = state.role === 'admin';
  const cats       = Object.keys(CATEGORIES);
  const netFiltered = filteredTxs.reduce((s, t) => s + (t.type === 'income' ? t.amount : -t.amount), 0);
  const hasFilters  = state.search || state.filter !== 'all' || state.catFilter !== 'all' || state.recurringFilter !== 'all';

  const totalPages = Math.ceil(filteredTxs.length / PER_PAGE);
  const pageTxs    = filteredTxs.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  useEffect(() => {
    setPage(prev => {
      const safeTotal = Math.max(1, totalPages);
      return prev > safeTotal ? safeTotal : prev;
    });
  }, [totalPages]);

  const sort     = (key) => { dispatch({ type: 'SET_SORT', payload: key }); setPage(1); };
  const clearAll = () => {
    dispatch({ type: 'SET_SEARCH',           payload: '' });
    dispatch({ type: 'SET_FILTER',           payload: 'all' });
    dispatch({ type: 'SET_CAT_FILTER',       payload: 'all' });
    dispatch({ type: 'SET_RECURRING_FILTER', payload: 'all' });
    setPage(1); setSelected(new Set());
  };
  const openEdit = (tx) => { setEditTx(tx); setShowModal(true); };
  const openAdd  = () => { setEditTx(null); setShowModal(true); };

  const confirmDelete = (id) => {
    dispatch({ type: 'DELETE_TX', payload: id });
    toast?.('Transaction deleted', 'error');
    setDelConfirm(null);
  };

  // Bulk select helpers
  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const toggleSelectAll = () => {
    if (selected.size === pageTxs.length) setSelected(new Set());
    else setSelected(new Set(pageTxs.map(t => t.id)));
  };
  const confirmBulkDelete = () => {
    dispatch({ type: 'BULK_DELETE_TX', payload: [...selected] });
    toast?.(`${selected.size} transactions deleted`, 'error');
    setSelected(new Set()); setBulkConfirm(false);
  };

  const exportCSV = () => {
    const rows = [
      ['ID','Date','Description','Category','Type','Amount (INR)','Recurring','Note'],
      ...filteredTxs.map(t => [t.id, t.date, csvEscape(t.name), t.cat, t.type, t.amount, t.recurring ? 'Yes':'No', csvEscape(t.note || '')]),
    ];
    const blob = new Blob([rows.map(r => r.join(',')).join('\n')], { type: 'text/csv' });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'fintrack_transactions.csv' });
    a.click(); URL.revokeObjectURL(a.href);
    toast?.('Exported as CSV', 'success');
  };

  const exportJSON = () => {
    const data = filteredTxs.map(({ id, date, name, cat, type, amount, recurring, note }) => ({ id, date, description: name, category: cat, type, amount, recurring, note }));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'fintrack_transactions.json' });
    a.click(); URL.revokeObjectURL(a.href);
    toast?.(`Exported ${data.length} transactions as JSON`, 'success');
  };

  const COLS = [
    { label: '',            key: null,     span: isAdmin ? '32px' : '0px'  },  // checkbox
    { label: 'Description', key: 'name',   span: '2.2fr' },
    { label: 'Date',        key: 'date',   span: '0.9fr' },
    { label: 'Category',    key: null,     span: '1.1fr' },
    { label: 'Type',        key: null,     span: '0.75fr'},
    { label: 'Amount',      key: 'amount', span: '1fr'   },
    { label: '',            key: null,     span: isAdmin ? '96px' : '0px' },
  ];
  const gridCols = COLS.map(c => c.span).join(' ');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {showModal && (
        <TransactionModal
          onClose={() => { setShowModal(false); setEditTx(null); }}
          editTx={editTx}
        />
      )}

      {/* Delete confirm */}
      {delConfirm && (
        <div className="modal-backdrop" onClick={() => setDelConfirm(null)}>
          <div className="modal" style={{ maxWidth: 360 }} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', padding: '8px 0 20px' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🗑️</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--t1)', marginBottom: 8 }}>Delete transaction?</div>
              <div style={{ fontSize: 13, color: 'var(--t3)', lineHeight: 1.6 }}>
                "<strong style={{ color: 'var(--t2)' }}>{delConfirm.name}</strong>" will be permanently removed.
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn-ghost" style={{ flex: 1 }} onClick={() => setDelConfirm(null)}>Cancel</button>
              <button
                onClick={() => confirmDelete(delConfirm.id)}
                style={{ flex: 1, padding: '9px', borderRadius: 'var(--r-md)', background: 'var(--expense-bg)', border: '1px solid rgba(255,77,106,0.3)', color: 'var(--expense)', fontWeight: 700, fontSize: 13, fontFamily: 'inherit', cursor: 'pointer', transition: 'all var(--tb)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,77,106,0.15)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--expense-bg)'}
              >Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk delete confirm */}
      {bulkConfirm && (
        <div className="modal-backdrop" onClick={() => setBulkConfirm(false)}>
          <div className="modal" style={{ maxWidth: 360 }} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', padding: '8px 0 20px' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🗑️</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--t1)', marginBottom: 8 }}>Delete {selected.size} transactions?</div>
              <div style={{ fontSize: 13, color: 'var(--t3)', lineHeight: 1.6 }}>This action cannot be undone.</div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn-ghost" style={{ flex: 1 }} onClick={() => setBulkConfirm(false)}>Cancel</button>
              <button onClick={confirmBulkDelete} style={{ flex: 1, padding: '9px', borderRadius: 'var(--r-md)', background: 'var(--expense-bg)', border: '1px solid rgba(255,77,106,0.3)', color: 'var(--expense)', fontWeight: 700, fontSize: 13, fontFamily: 'inherit', cursor: 'pointer' }}>
                Delete All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Summary strip ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12 }}>
        {[
          { label: 'Showing', value: String(filteredTxs.length), sub: 'transactions', color: 'var(--accent)' },
          { label: 'Net (filtered)', value: netFiltered >= 0 ? fmt(netFiltered) : `−${fmt(Math.abs(netFiltered))}`, sub: netFiltered >= 0 ? 'surplus' : 'deficit', color: netFiltered >= 0 ? 'var(--income)' : 'var(--expense)' },
          { label: 'Total Income', value: fmt(filteredTxs.filter(t => t.type === 'income').reduce((a, t) => a + t.amount, 0)), sub: 'in filter', color: 'var(--blue)' },
          { label: 'Total Expenses', value: fmt(filteredTxs.filter(t => t.type === 'expense').reduce((a, t) => a + t.amount, 0)), sub: 'in filter', color: 'var(--red)' },
        ].map(({ label, value, sub, color }, i) => (
          <div key={label} className={`metric-card anim-up d-${i}`} style={{ padding: '16px 18px' }}>
            <div className="accent-bar" style={{ background: color }} />
            <div className="lbl" style={{ marginBottom: 6 }}>{label}</div>
            <div className="mono" style={{ fontSize: 18, fontWeight: 700, color, letterSpacing: '-0.8px' }}>{value}</div>
            <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 4 }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* ── Filters + Search ── */}
      <div className="card card-p anim-up d-4" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
          {/* Search */}
          <div className="search-wrap" style={{ flex: '1 1 220px', minWidth: 180 }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <input
              className="input"
              aria-label="Search transactions"
              placeholder="Search by name, category, or note…"
              value={state.search}
              onChange={e => { dispatch({ type: 'SET_SEARCH', payload: e.target.value }); setPage(1); }}
            />
            {state.search && (
              <button onClick={() => dispatch({ type: 'SET_SEARCH', payload: '' })} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--t3)', cursor: 'pointer', fontSize: 14, lineHeight: 1 }}>✕</button>
            )}
          </div>

          {/* Type filter */}
          <div className="segment">
            {['all','income','expense'].map(f => (
              <button key={f} className={`seg-btn${state.filter === f ? ' active' : ''}`}
                onClick={() => { dispatch({ type: 'SET_FILTER', payload: f }); setPage(1); }}>
                {f === 'all' ? 'All' : f === 'income' ? '▲ Income' : '▼ Expense'}
              </button>
            ))}
          </div>

          {/* Recurring filter — NEW */}
          <div className="segment">
            {[['all','All'],['recurring','🔄 Recurring'],['one-time','✦ One-time']].map(([v, label]) => (
              <button key={v} className={`seg-btn${state.recurringFilter === v ? ' active' : ''}`}
                onClick={() => { dispatch({ type: 'SET_RECURRING_FILTER', payload: v }); setPage(1); }}>
                {label}
              </button>
            ))}
          </div>

          {/* Category filter */}
          <select className="input" style={{ width: 'auto', padding: '7px 34px 7px 12px', fontSize: 12 }}
            value={state.catFilter}
            onChange={e => { dispatch({ type: 'SET_CAT_FILTER', payload: e.target.value }); setPage(1); }}>
            <option value="all">All Categories</option>
            {cats.map(c => <option key={c} value={c}>{CATEGORIES[c]?.icon} {c}</option>)}
          </select>

          {hasFilters && (
            <button className="btn-ghost" style={{ fontSize: 12, padding: '7px 12px', color: 'var(--red)', borderColor: 'rgba(255,77,106,0.3)' }} onClick={clearAll}>
              ✕ Clear
            </button>
          )}

          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {/* Bulk delete — only show when items selected */}
            {isAdmin && selected.size > 0 && (
              <button
                className="btn-ghost"
                style={{ fontSize: 12, padding: '7px 12px', color: 'var(--red)', borderColor: 'rgba(255,77,106,0.3)' }}
                onClick={() => setBulkConfirm(true)}
              >
                🗑️ Delete {selected.size}
              </button>
            )}
            <button className="btn-ghost" style={{ fontSize: 12, padding: '7px 12px' }} onClick={exportCSV}>
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M8 2v9M5 8l3 3 3-3M2 13h12"/></svg>
              CSV
            </button>
            <button className="btn-ghost" style={{ fontSize: 12, padding: '7px 12px' }} onClick={exportJSON}>
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M4 2v3c0 1-1 2-2 2s2 1 2 2v3M12 2v3c0 1 1 2 2 2s-2 1-2 2v3"/></svg>
              JSON
            </button>
            {isAdmin && (
              <>
                <button className="btn-ghost" style={{ fontSize: 12, padding: '7px 12px', color: 'var(--amber)', borderColor: 'rgba(255,179,64,0.3)' }}
                  onClick={() => { dispatch({ type: 'RESET_TXS' }); toast?.('Demo data restored', 'info'); setSelected(new Set()); }}
                >
                  ↺ Reset Demo
                </button>
                <button className="btn-primary" style={{ padding: '7px 16px', fontSize: 13 }} onClick={openAdd}>
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 1v11M1 6.5h11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                  Add
                </button>
              </>
            )}
          </div>
        </div>

        {!isAdmin && (
          <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'var(--blue-bg)', border: '1px solid rgba(77,159,255,0.2)', borderRadius: 'var(--r-md)' }}>
            <span style={{ fontSize: 13 }}>👁</span>
            <span style={{ fontSize: 12, color: 'var(--blue)', fontWeight: 500 }}>Viewer mode — switch to Admin to add, edit, delete, or annotate transactions.</span>
          </div>
        )}
      </div>

      {/* ── Table ── */}
      <div className="card anim-up d-5">
        {/* Header */}
        <div className="tx-header" style={{ display: 'grid', gridTemplateColumns: gridCols, padding: '12px 20px', borderBottom: '1px solid var(--b-sm)', gap: 8, alignItems: 'center' }}>
          {/* Select-all checkbox */}
          {isAdmin && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <input
                type="checkbox"
                aria-label="Select all transactions on current page"
                checked={pageTxs.length > 0 && selected.size === pageTxs.length}
                onChange={toggleSelectAll}
                style={{ width: 14, height: 14, cursor: 'pointer', accentColor: 'var(--accent)' }}
              />
            </div>
          )}
          {COLS.slice(isAdmin ? 1 : 0).map(col => (
            <div
              key={col.label || 'actions'}
              style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.8px', textTransform: 'uppercase', color: 'var(--t3)', display: 'flex', alignItems: 'center', cursor: col.key ? 'pointer' : 'default', userSelect: 'none', gap: 3 }}
              onClick={() => col.key && sort(col.key)}
            >
              {col.label}
              {col.key && <SortArrow active={state.sortBy === col.key} dir={state.sortDir} />}
            </div>
          ))}
        </div>

        {pageTxs.length === 0 ? (
          <Empty
            icon={hasFilters ? '🔍' : '🧾'}
            title={hasFilters ? 'No matching transactions' : 'No transactions yet'}
            sub={hasFilters ? 'Try adjusting your search or filters.' : 'Add your first transaction to get started.'}
            action={isAdmin && !hasFilters ? (
              <button className="btn-primary" style={{ marginTop: 8 }} onClick={openAdd}>Add Transaction</button>
            ) : hasFilters ? (
              <button className="btn-ghost" style={{ marginTop: 8 }} onClick={clearAll}>Clear Filters</button>
            ) : null}
          />
        ) : (
          pageTxs.map((tx, i) => {
            const { icon, color } = CATEGORIES[tx.cat] || { icon: '💳', color: '#888' };
            const isIncome  = tx.type === 'income';
            const isSelected = selected.has(tx.id);
            return (
              <div
                key={tx.id}
                className="tx-row"
                style={{
                  display: 'grid', gridTemplateColumns: gridCols, alignItems: 'center',
                  gap: 8, padding: '11px 20px', borderTop: '1px solid var(--b-xs)',
                  background: isSelected ? 'var(--accent-bg)' : undefined,
                }}
              >
                {/* Checkbox */}
                {isAdmin && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <input
                      type="checkbox"
                      aria-label={`Select transaction ${tx.name}`}
                      checked={isSelected}
                      onChange={() => toggleSelect(tx.id)}
                      style={{ width: 14, height: 14, cursor: 'pointer', accentColor: 'var(--accent)' }}
                    />
                  </div>
                )}
                {/* Description + inline note */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11, minWidth: 0 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: color + '18', border: `1px solid ${color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, marginTop: 2 }}>{icon}</div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)' }} className="truncate">{tx.name}</span>
                      {tx.recurring && (
                        <span title="Recurring / Auto-debit" style={{ fontSize: 9.5, fontWeight: 700, padding: '1px 6px', borderRadius: 99, background: 'var(--accent-bg)', color: 'var(--accent)', border: '1px solid rgba(0,240,200,0.18)', flexShrink: 0, whiteSpace: 'nowrap' }}>🔄 auto</span>
                      )}
                    </div>
                    <InlineNote tx={tx} isAdmin={isAdmin} dispatch={dispatch} toast={toast} />
                  </div>
                </div>
                {/* Date */}
                <div style={{ fontSize: 12, color: 'var(--t2)', fontFamily: "'JetBrains Mono',monospace" }}>
                  {new Date(tx.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                </div>
                {/* Category */}
                <div>
                  <span style={{ fontSize: 11.5, fontWeight: 600, padding: '3px 9px', borderRadius: 99, background: color + '15', color }}>
                    {CATEGORIES[tx.cat]?.icon} {tx.cat}
                  </span>
                </div>
                {/* Type */}
                <div>
                  <span className={`badge badge-${isIncome ? 'income' : 'expense'}`}>
                    {isIncome ? '▲ Income' : '▼ Expense'}
                  </span>
                </div>
                {/* Amount */}
                <div className="mono" style={{ fontSize: 13.5, fontWeight: 700, color: isIncome ? 'var(--income)' : 'var(--t1)', textAlign: 'right' }}>
                  {isIncome ? '+' : '−'}{fmt(tx.amount)}
                </div>
                {/* Actions */}
                {isAdmin && (
                  <div className="tx-actions" style={{ justifyContent: 'flex-end', gap: 4 }}>
                    {/* Toggle recurring */}
                    <button
                      className="btn-icon"
                      style={{ width: 30, height: 30, opacity: tx.recurring ? 1 : 0.45, color: tx.recurring ? 'var(--accent)' : 'var(--t3)' }}
                      onClick={() => { dispatch({ type: 'TOGGLE_TX_RECURRING', payload: tx.id }); toast?.(tx.recurring ? 'Marked as one-time' : 'Marked as recurring', 'info'); }}
                      title={tx.recurring ? 'Mark as one-time' : 'Mark as recurring'}
                      aria-label={tx.recurring ? 'Remove recurring flag' : 'Mark as recurring'}
                    >
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                        <path d="M1 4h10a4 4 0 110 8H1M1 4l3-3M1 4l3 3"/>
                      </svg>
                    </button>
                    <button className="btn-icon" style={{ width: 30, height: 30 }} onClick={() => openEdit(tx)} title="Edit" aria-label={`Edit ${tx.name}`}>
                      <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                        <path d="M11.5 2.5a1.5 1.5 0 012.12 2.12l-9 9L2 14.5l.88-2.62 9-9z"/>
                      </svg>
                    </button>
                    <button className="btn-icon" style={{ width: 30, height: 30, color: 'var(--red)' }} onClick={() => setDelConfirm(tx)} title="Delete" aria-label={`Delete ${tx.name}`}>
                      <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                        <path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 10h8l1-10"/>
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Footer + Pagination */}
        {filteredTxs.length > 0 && (
          <div style={{ padding: '12px 20px', borderTop: '1px solid var(--b-xs)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <span style={{ fontSize: 11.5, color: 'var(--t3)' }}>
              Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filteredTxs.length)} of {filteredTxs.length}
              {selected.size > 0 && <span style={{ color: 'var(--accent)', marginLeft: 8, fontWeight: 700 }}>· {selected.size} selected</span>}
            </span>
            {totalPages > 1 && (
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                  style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--r-sm)', border: '1px solid var(--b-sm)', background: page <= 1 ? 'transparent' : 'var(--bg-elevated)', color: page <= 1 ? 'var(--t4)' : 'var(--t2)', cursor: page <= 1 ? 'not-allowed' : 'pointer', opacity: page <= 1 ? 0.35 : 1, pointerEvents: page <= 1 ? 'none' : 'auto' }}
                  aria-label="Previous page"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M8 2L4 6l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).filter(p => Math.abs(p - page) <= 2 || p === 1 || p === totalPages).map((p, idx, arr) => (
                  <span key={p}>
                    {idx > 0 && arr[idx - 1] !== p - 1 && <span style={{ color: 'var(--t4)', fontSize: 11 }}>…</span>}
                    <button
                      onClick={() => setPage(p)}
                      style={{ width: 30, height: 30, borderRadius: 'var(--r-sm)', border: p === page ? '1px solid rgba(0,240,200,0.3)' : '1px solid var(--b-sm)', background: p === page ? 'var(--accent-bg)' : 'transparent', color: p === page ? 'var(--accent)' : 'var(--t3)', fontWeight: p === page ? 700 : 500, fontSize: 12, cursor: 'pointer', transition: 'all var(--tb)' }}
                    >{p}</button>
                  </span>
                ))}
                <button
                  onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}
                  style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--r-sm)', border: '1px solid var(--b-sm)', background: page >= totalPages ? 'transparent' : 'var(--bg-elevated)', color: page >= totalPages ? 'var(--t4)' : 'var(--t2)', cursor: page >= totalPages ? 'not-allowed' : 'pointer', opacity: page >= totalPages ? 0.35 : 1, pointerEvents: page >= totalPages ? 'none' : 'auto' }}
                  aria-label="Next page"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div className="live-dot" />
              <span style={{ fontSize: 11, color: 'var(--t3)', fontWeight: 500 }}>Live data</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
