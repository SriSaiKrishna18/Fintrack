import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';

const ICONS = {
  success: { icon: '✓', bg: 'var(--income-bg)', border: 'rgba(0,240,200,0.25)', color: 'var(--income)' },
  error:   { icon: '✕', bg: 'var(--expense-bg)', border: 'rgba(255,77,106,0.25)', color: 'var(--expense)' },
  info:    { icon: 'ℹ', bg: 'var(--blue-bg)',    border: 'rgba(77,159,255,0.25)', color: 'var(--blue)'    },
  warning: { icon: '⚠', bg: 'var(--amber-bg)',   border: 'rgba(255,179,64,0.25)', color: 'var(--amber)'   },
};

function Toast({ toast }) {
  const { dispatch } = useApp();
  const [out, setOut] = useState(false);
  const meta = ICONS[toast.kind] || ICONS.success;

  useEffect(() => {
    const hide = setTimeout(() => setOut(true), 3200);
    const remove = setTimeout(() => dispatch({ type: 'REMOVE_TOAST', payload: toast.id }), 3500);
    return () => { clearTimeout(hide); clearTimeout(remove); };
  }, [toast.id]);

  return (
    <div className={`toast${out ? ' out' : ''}`} style={{ borderColor: meta.border }}>
      <div style={{ width: 26, height: 26, borderRadius: 8, background: meta.bg, border: `1px solid ${meta.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: meta.color, fontSize: 12, fontWeight: 800, flexShrink: 0 }}>{meta.icon}</div>
      <span style={{ fontSize: 13, fontWeight: 500, flex: 1 }}>{toast.msg}</span>
      <button onClick={() => { setOut(true); setTimeout(() => dispatch({ type: 'REMOVE_TOAST', payload: toast.id }), 250); }}
        style={{ background: 'none', border: 'none', color: 'var(--t3)', cursor: 'pointer', padding: 4, lineHeight: 1, fontSize: 12 }}>✕</button>
    </div>
  );
}

export default function ToastContainer() {
  const { state } = useApp();
  return (
    <div className="toast-wrap">
      {state.toasts.map(t => <Toast key={t.id} toast={t} />)}
    </div>
  );
}
