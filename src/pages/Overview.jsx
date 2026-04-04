import { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useFinanceCalc } from '../hooks/useFinanceCalc';
import { CATEGORIES, MONTHLY_HISTORY } from '../data/mockData';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

const fmt   = (n) => '₹' + Math.abs(Math.round(n)).toLocaleString('en-IN');
const fmtSh = (n) => {
  if (n >= 100000) return '₹' + (n / 100000).toFixed(1) + 'L';
  if (n >= 1000)   return '₹' + (n / 1000).toFixed(0)   + 'k';
  return '₹' + n;
};

/* ── Animated Counter Hook ── */
function useCountUp(target, duration = 900) {
  const [val, setVal] = useState(0);
  const prev = useRef(0);
  useEffect(() => {
    const start = prev.current;
    prev.current = target;
    let startTime = null;
    const step = (ts) => {
      if (!startTime) startTime = ts;
      const p = Math.min((ts - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 4);
      setVal(Math.round(start + (target - start) * ease));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return val;
}

/* ── Chart Tooltip ── */
function ChartTip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--t3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.6px' }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 18, marginBottom: i < payload.length - 1 ? 6 : 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: p.stroke || p.fill, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: 'var(--t2)' }}>{p.name}</span>
          </div>
          <span className="mono" style={{ fontSize: 12, fontWeight: 700, color: 'var(--t1)' }}>{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Financial Health Score Ring ── */
function HealthScoreRing({ score }) {
  const r = 44;
  const circ = 2 * Math.PI * r;
  const dash = circ * (score / 100);
  const color = score >= 70 ? 'var(--green)' : score >= 45 ? 'var(--amber)' : 'var(--red)';
  const label = score >= 70 ? 'Excellent' : score >= 55 ? 'Good' : score >= 40 ? 'Fair' : 'Needs Work';
  const animScore = useCountUp(score, 1200);

  return (
    <div className="health-score-card anim-up d-3" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <svg width={110} height={110} viewBox="0 0 110 110">
          <circle cx={55} cy={55} r={r} className="health-ring-track" />
          <circle
            cx={55} cy={55} r={r}
            className="health-ring-fill"
            stroke={color}
            strokeDasharray={`${dash} ${circ}`}
            strokeDashoffset={0}
            style={{ stroke: color, strokeDasharray: `${circ * (animScore / 100)} ${circ}`, transform: 'rotate(-90deg)', transformOrigin: 'center', transition: 'stroke-dasharray 0.05s linear' }}
          />
          <text x={55} y={50} textAnchor="middle" fill={color} fontSize={20} fontWeight={800} fontFamily="'JetBrains Mono',monospace">
            {animScore}
          </text>
          <text x={55} y={66} textAnchor="middle" fill="var(--t3)" fontSize={9} fontWeight={600} fontFamily="Inter" textTransform="uppercase" letterSpacing="0.5">
            /100
          </text>
        </svg>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.9px', textTransform: 'uppercase', color: 'var(--t3)', marginBottom: 6 }}>Financial Health</div>
        <div style={{ fontSize: 20, fontWeight: 800, color, letterSpacing: '-0.5px', marginBottom: 6 }}>{label}</div>
        <div style={{ fontSize: 11.5, color: 'var(--t3)', lineHeight: 1.6, marginBottom: 10 }}>
          Based on savings rate, budget adherence, income diversity & investment habits.
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            { key: 'Savings', ok: score >= 35 },
            { key: 'Budgets', ok: score >= 25 },
            { key: 'Invest', ok: score >= 15 },
            { key: 'Diversity', ok: score >= 10 },
          ].map(({ key, ok }) => (
            <span key={key} style={{
              fontSize: 10.5, fontWeight: 700, padding: '3px 9px', borderRadius: 99,
              background: ok ? 'var(--income-bg)' : 'var(--expense-bg)',
              color: ok ? 'var(--income)' : 'var(--expense)',
              border: `1px solid ${ok ? 'rgba(0,240,200,0.2)' : 'rgba(255,77,106,0.2)'}`,
            }}>
              {ok ? '✓' : '✗'} {key}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── KPI Card ── */
function KPICard({ label, value, numValue, color, pill, pillUp, sub, icon, delay, glow }) {
  const animated = useCountUp(numValue || 0, 900);
  const displayVal = numValue !== undefined
    ? (label === 'Transactions' ? String(animated) : fmt(animated))
    : value;

  return (
    <div className={`metric-card anim-up d-${delay}`}>
      <div className="accent-bar" style={{ background: color }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <span className="lbl">{label}</span>
        <div className="card-icon" style={{ background: glow || color + '18', border: `1px solid ${color}28` }}>
          {icon}
        </div>
      </div>
      <div className="mono count-anim" style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-1.5px', color, lineHeight: 1, marginBottom: 12 }}>
        {displayVal}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <span style={{
          fontSize: 10.5, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace",
          padding: '3px 8px', borderRadius: 99,
          background: pillUp ? 'var(--income-bg)' : 'var(--expense-bg)',
          color: pillUp ? 'var(--income)' : 'var(--expense)',
        }}>
          {pillUp ? '▲' : '▼'} {pill}
        </span>
        <span style={{ fontSize: 11, color: 'var(--t3)' }}>{sub}</span>
      </div>
    </div>
  );
}

/* ── Projected Balance Card ── */
function ProjectedCard({ projected, delay }) {
  const animated = useCountUp(Math.abs(projected), 900);
  const isPos = projected >= 0;
  return (
    <div className={`metric-card anim-up d-${delay}`}>
      <div className="accent-bar" style={{ background: 'var(--purple)' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <span className="lbl">Projected EOM</span>
        <div className="card-icon" style={{ background: 'var(--purple-bg)', border: '1px solid rgba(196,126,255,0.28)' }}>🔮</div>
      </div>
      <div className="mono count-anim" style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-1.5px', color: isPos ? 'var(--purple)' : 'var(--red)', lineHeight: 1, marginBottom: 12 }}>
        {isPos ? '' : '−'}{fmt(animated)}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <span style={{ fontSize: 10.5, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", padding: '3px 8px', borderRadius: 99, background: 'var(--purple-bg)', color: 'var(--purple)' }}>
          End of Month
        </span>
        <span style={{ fontSize: 11, color: 'var(--t3)' }}>forecast</span>
      </div>
    </div>
  );
}

/* ── Legend Item ── */
function LegBit({ color, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
      <span style={{ fontSize: 11, color: 'var(--t3)', fontWeight: 500 }}>{label}</span>
    </div>
  );
}

export default function Overview() {
  const { state, dispatch } = useApp();
  const { totals, savingsRate, categorySpend, healthScore, projected, fullChartData } = useFinanceCalc();
  const [hoveredSlice, setHoveredSlice] = useState(null);

  // Welcome banner — shows once per user
  const [showWelcome, setShowWelcome] = useState(() => !localStorage.getItem('ft_welcomed'));
  const dismissWelcome = () => { setShowWelcome(false); localStorage.setItem('ft_welcomed', '1'); };

  const netMoM = totals.expense - (MONTHLY_HISTORY[MONTHLY_HISTORY.length - 1].expense);

  const pieData = categorySpend.slice(0, 7).map(([cat, val]) => ({
    name: cat, value: val, color: CATEGORIES[cat]?.color || '#888',
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Welcome Banner ── */}
      {showWelcome && (
        <div className="welcome-banner">
          <button className="dismiss-btn" onClick={dismissWelcome}>✕</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--grad-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0, boxShadow: '0 4px 16px var(--accent-glow)' }}>👋</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--t1)', letterSpacing: '-0.3px', marginBottom: 4 }}>Welcome to FinTrack Pro</div>
              <div style={{ fontSize: 12, color: 'var(--t3)', lineHeight: 1.6 }}>
                Your personal finance dashboard is loaded with 40 demo transactions. Explore all 5 pages, switch between Admin & Viewer roles, toggle dark/light theme, and press <kbd style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, padding: '1px 5px', borderRadius: 4, background: 'var(--bg-elevated)', border: '1px solid var(--b-sm)', color: 'var(--accent)' }}>?</kbd> for keyboard shortcuts.
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ── KPI Strip + Health ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        <KPICard label="Net Balance"    numValue={totals.balance}  color="var(--green)"  pill={`${savingsRate}%`} pillUp sub="savings rate" icon="💰" delay={0} glow="var(--income-bg)" />
        <KPICard label="Total Income"   numValue={totals.income}   color="var(--blue)"   pill="+8.2%" pillUp sub="vs last month" icon="📈" delay={1} glow="var(--blue-bg)" />
        <KPICard label="Total Expenses" numValue={totals.expense}  color="var(--red)"    pill={`${netMoM >= 0 ? '+' : ''}${Math.round(netMoM / 1000)}k`} pillUp={netMoM < 0} sub="vs last month" icon="📉" delay={2} glow="var(--expense-bg)" />
        <ProjectedCard projected={projected} delay={3} />
      </div>

      {/* ── Health Score ── */}
      <HealthScoreRing score={healthScore} />

      {/* ── Charts Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '5fr 3fr', gap: 16 }}>

        {/* Area Chart */}
        <div className="card card-p anim-up d-4">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.3px', color: 'var(--t1)' }}>Income vs Expenses</div>
              <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 3 }}>8-month trend · April 2026</div>
            </div>
            <div style={{ display: 'flex', gap: 14 }}>
              <LegBit color="var(--income)"  label="Income" />
              <LegBit color="var(--expense)" label="Expense" />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={230}>
            <AreaChart data={fullChartData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="gI" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="var(--income)"  stopOpacity={0.28} />
                  <stop offset="100%" stopColor="var(--income)"  stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gE" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="var(--expense)" stopOpacity={0.22} />
                  <stop offset="100%" stopColor="var(--expense)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" stroke="var(--b-xs)" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: 'var(--t3)', fontSize: 10.5, fontFamily: 'Inter' }} axisLine={false} tickLine={false} dy={6} />
              <YAxis tickFormatter={fmtSh} tick={{ fill: 'var(--t3)', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTip />} cursor={{ stroke: 'var(--b-lg)', strokeWidth: 1, strokeDasharray: '4 4' }} />
              <Area type="monotone" dataKey="income"  name="Income"  stroke="var(--income)"  strokeWidth={2.5} fill="url(#gI)" dot={false} activeDot={{ r: 5, fill: 'var(--income)',  strokeWidth: 0 }} />
              <Area type="monotone" dataKey="expense" name="Expense" stroke="var(--expense)" strokeWidth={2.5} fill="url(#gE)" dot={false} activeDot={{ r: 5, fill: 'var(--expense)', strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Donut */}
        <div className="card card-p anim-up d-5" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.3px', marginBottom: 4 }}>Spend Breakdown</div>
          <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 16 }}>By category</div>
          {pieData.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">📭</div><div style={{ fontSize: 13, color: 'var(--t3)' }}>No expenses recorded</div></div>
          ) : (
            <>
              <div style={{ position: 'relative', height: 190, flexShrink: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData} cx="50%" cy="50%"
                      innerRadius={58} outerRadius={84}
                      dataKey="value" paddingAngle={3} strokeWidth={0}
                      onMouseEnter={(_, i) => setHoveredSlice(i)}
                      onMouseLeave={() => setHoveredSlice(null)}
                    >
                      {pieData.map((e, i) => (
                        <Cell
                          key={i} fill={e.color}
                          opacity={hoveredSlice === null || hoveredSlice === i ? 1 : 0.35}
                          style={{ transition: 'opacity 0.2s', cursor: 'pointer', filter: hoveredSlice === i ? `drop-shadow(0 0 10px ${e.color}90)` : 'none' }}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                  {hoveredSlice !== null && pieData[hoveredSlice] ? (
                    <>
                      <div style={{ fontSize: 13, fontWeight: 700, color: pieData[hoveredSlice].color, fontFamily: "'JetBrains Mono',monospace" }}>
                        {fmt(pieData[hoveredSlice].value)}
                      </div>
                      <div style={{ fontSize: 9.5, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: 2, fontWeight: 600 }}>
                        {pieData[hoveredSlice].name}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="mono" style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.8px', color: 'var(--t1)' }}>{fmt(totals.expense)}</div>
                      <div style={{ fontSize: 9, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.6px', marginTop: 2, fontWeight: 600 }}>total spent</div>
                    </>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginTop: 14 }}>
                {pieData.slice(0, 5).map(({ name, value, color }) => {
                  const pct = totals.expense > 0 ? Math.round(value / totals.expense * 100) : 0;
                  return (
                    <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 7, height: 7, borderRadius: 2, background: color, flexShrink: 0 }} />
                      <span style={{ fontSize: 11.5, color: 'var(--t2)', flex: 1 }}>{name}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 50, height: 3, background: 'var(--bg-elevated)', borderRadius: 99, overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 99 }} />
                        </div>
                        <span className="mono" style={{ fontSize: 10.5, color: 'var(--t3)', width: 28, textAlign: 'right' }}>{pct}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Category Breakdown ── */}
      <div className="card card-p anim-up d-6">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.3px' }}>Category Breakdown</div>
            <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 3 }}>Expense allocation by category</div>
          </div>
          <span className="mono" style={{ fontSize: 11, color: 'var(--t3)', background: 'var(--bg-elevated)', border: '1px solid var(--b-sm)', padding: '4px 10px', borderRadius: 'var(--r-sm)' }}>
            {categorySpend.length} categories
          </span>
        </div>
        {categorySpend.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">📭</div><div style={{ fontSize: 13, color: 'var(--t3)' }}>No expenses recorded</div></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
            {categorySpend.map(([cat, val], i) => {
              const { icon, color } = CATEGORIES[cat] || { icon: '💳', color: '#888' };
              const pct = totals.expense > 0 ? Math.round(val / totals.expense * 100) : 0;
              return (
                <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 9, flexShrink: 0, background: color + '18', border: `1px solid ${color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>{icon}</div>
                  <div style={{ width: 90, flexShrink: 0, fontSize: 12, fontWeight: 500, color: 'var(--t2)' }}>{cat}</div>
                  <div style={{ flex: 1 }}>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: `${pct}%`, background: color, animationDelay: `${0.3 + i * 0.04}s`, boxShadow: `0 0 8px ${color}40` }} />
                    </div>
                  </div>
                  <div className="mono" style={{ fontSize: 12, fontWeight: 700, color: 'var(--t1)', width: 84, textAlign: 'right' }}>{fmt(val)}</div>
                  <div className="mono" style={{ fontSize: 10.5, color: 'var(--t3)', width: 32, textAlign: 'right' }}>{pct}%</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Recent Activity ── */}
      <div className="card anim-up d-7">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px 16px' }}>
          <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.3px' }}>Recent Activity</div>
          <button
            onClick={() => dispatch({ type: 'SET_PAGE', payload: 'transactions' })}
            style={{ fontSize: 11.5, color: 'var(--accent)', background: 'none', border: 'none', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, transition: 'opacity 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            View all
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 6h7M6 2.5l3.5 3.5L6 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>
        {state.transactions.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">🧾</div><div style={{ fontSize: 13, color: 'var(--t3)' }}>No transactions yet</div></div>
        ) : (
          <div>
            {state.transactions.slice(0, 8).map((tx, i) => {
              const { icon, color } = CATEGORIES[tx.cat] || { icon: '💳', color: '#888' };
              const isIncome = tx.type === 'income';
              return (
                <div key={tx.id} className="tx-row" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '11px 24px', borderTop: i > 0 ? '1px solid var(--b-xs)' : 'none' }}>
                  <div style={{ width: 38, height: 38, borderRadius: 11, flexShrink: 0, background: color + '18', border: `1px solid ${color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)' }} className="truncate">{tx.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>
                      {tx.cat} · {new Date(tx.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="mono" style={{ fontSize: 13, fontWeight: 700, color: isIncome ? 'var(--income)' : 'var(--t1)' }}>
                      {isIncome ? '+' : '−'}{fmt(tx.amount)}
                    </div>
                    <span className={`badge badge-${isIncome ? 'income' : 'expense'}`} style={{ fontSize: 9.5, marginTop: 3 }}>
                      {isIncome ? 'Income' : 'Expense'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div style={{ padding: '12px 24px', borderTop: '1px solid var(--b-xs)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 11.5, color: 'var(--t3)' }}>Showing latest {Math.min(8, state.transactions.length)} of {state.transactions.length}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div className="live-dot" />
            <span style={{ fontSize: 11, color: 'var(--t3)', fontWeight: 500 }}>Live</span>
          </div>
        </div>
      </div>
    </div>
  );
}
