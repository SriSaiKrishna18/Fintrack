import { useFinanceCalc } from '../hooks/useFinanceCalc';
import { useEffect, useState } from 'react';
import { CATEGORIES, MONTHLY_HISTORY } from '../data/mockData';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LineChart, Line, ReferenceLine,
  ComposedChart, Area,
} from 'recharts';

const fmt   = (n) => '₹' + Math.abs(Math.round(n)).toLocaleString('en-IN');
const fmtSh = (n) => {
  if (n >= 100000) return '₹' + (n / 100000).toFixed(1) + 'L';
  if (n >= 1000)   return '₹' + (n / 1000).toFixed(0) + 'k';
  return '₹' + n;
};

function ChartTip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--t3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.6px' }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 18, marginBottom: i < payload.length - 1 ? 6 : 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: p.fill || p.stroke, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: 'var(--t2)' }}>{p.name}</span>
          </div>
          <span className="mono" style={{ fontSize: 12, fontWeight: 700, color: 'var(--t1)' }}>
            {p.name === 'Savings Rate' ? `${p.value}%` : fmt(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

function ChartSkeleton({ height }) {
  return <div className="skeleton" style={{ height }} aria-hidden="true" />;
}

function ChartMount({ height, children }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setReady(true), 160);
    return () => clearTimeout(id);
  }, []);

  return ready ? children : <ChartSkeleton height={height} />;
}

function StatusGlyph({ color, tag }) {
  const glyph = tag === 'Alert' ? '!' : tag === 'Warning' ? '~' : tag === 'Tip' ? '?' : '+';
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="7" fill={color} fillOpacity="0.18" stroke={color} strokeOpacity="0.38" />
      <path d="M8 4.3v4.7" stroke={color} strokeWidth="1.6" strokeLinecap="round" opacity={glyph === '!' ? 1 : 0} />
      <circle cx="8" cy="11.6" r="0.9" fill={color} opacity={glyph === '!' ? 1 : 0} />
      <path d="M4.4 8h7.2" stroke={color} strokeWidth="1.6" strokeLinecap="round" opacity={glyph === '+' ? 1 : 0} />
      <path d="M8 4.4v7.2" stroke={color} strokeWidth="1.6" strokeLinecap="round" opacity={glyph === '+' ? 1 : 0} />
      <path d="M5 10.8c1.9-1.6 4.1-1.6 6 0" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity={glyph === '~' ? 1 : 0} />
      <path d="M8 5.1c1.3 0 2.3.8 2.3 2 0 1.4-1.4 1.6-2.1 2.6" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" opacity={glyph === '?' ? 1 : 0} />
      <circle cx="8" cy="11.8" r="0.8" fill={color} opacity={glyph === '?' ? 1 : 0} />
    </svg>
  );
}

function InsightCard({ label, value, color, sub, progress, icon, delay }) {
  return (
    <div className={`metric-card anim-up d-${delay}`}>
      <div className="accent-bar" style={{ background: color }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <span className="lbl">{label}</span>
        <div className="card-icon" style={{ background: color + '18', border: `1px solid ${color}28` }}>{icon}</div>
      </div>
      <div className="mono anim-num" style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-1px', color, lineHeight: 1, marginBottom: 8 }}>
        {value}
      </div>
      <div style={{ fontSize: 11.5, color: 'var(--t3)', lineHeight: 1.5, marginBottom: progress !== undefined ? 12 : 0 }}>{sub}</div>
      {progress !== undefined && (
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${Math.min(progress, 100)}%`, background: color, boxShadow: `0 0 8px ${color}50` }} />
        </div>
      )}
    </div>
  );
}

function buildObs(totals, savingsRate, top, second, expDiff) {
  const obs = [];
  obs.push(savingsRate >= 30
    ? { icon: '🎯', title: 'Savings goal achieved', desc: `You're saving ${savingsRate}% of income — above the recommended 30%. Excellent financial discipline!`, color: 'var(--green)', tag: 'Positive' }
    : savingsRate >= 15
    ? { icon: '📈', title: 'Savings rate improving', desc: `${savingsRate}% savings rate is moderate. You're ${30 - savingsRate}% away from the 30% target. Cut discretionary spend to reach it.`, color: 'var(--amber)', tag: 'Warning' }
    : { icon: '⚠️', title: 'Low savings rate alert', desc: `Only ${savingsRate}% savings rate. Review your top expense categories for quick wins. Aim for 15% minimum.`, color: 'var(--red)', tag: 'Alert' }
  );
  if (top[0] !== '—') {
    obs.push({ icon: '🔥', title: `Top spend: ${top[0]}`, desc: `${fmt(top[1])} spent — ${totals.expense > 0 ? Math.round(top[1] / totals.expense * 100) : 0}% of total expenses. Consider setting a monthly budget cap for this category.`, color: 'var(--amber)', tag: 'Insight' });
  }
  obs.push(expDiff > 0
    ? { icon: '📊', title: 'Spending increased vs last month', desc: `Expenses rose by ${fmt(expDiff)}. Review recent transactions to identify the largest contributors to this increase.`, color: 'var(--red)', tag: 'Alert' }
    : { icon: '✅', title: 'Spending reduced vs last month', desc: `Expenses dropped by ${fmt(Math.abs(expDiff))}. Great progress! Keep this momentum going into next month.`, color: 'var(--green)', tag: 'Positive' }
  );
  if (totals.income > 0) {
    const ratio = Math.round(totals.expense / totals.income * 100);
    obs.push(ratio > 80
      ? { icon: '💸', title: 'High expense-to-income ratio', desc: `Spending ${ratio}% of income is risky. Experts recommend staying below 70% for financial safety and emergency fund growth.`, color: 'var(--red)', tag: 'Alert' }
      : { icon: '👍', title: 'Healthy expense ratio', desc: `Spending ${ratio}% of income gives you a solid buffer for savings and unexpected expenses. Well balanced!`, color: 'var(--green)', tag: 'Positive' }
    );
  }
  obs.push({ icon: '💡', title: '50/30/20 Rule Analysis', desc: totals.income > 0
    ? `Based on your ₹${(totals.income/1000).toFixed(0)}k income: Needs (50%) = ${fmtSh(totals.income * 0.5)}, Wants (30%) = ${fmtSh(totals.income * 0.3)}, Savings (20%) = ${fmtSh(totals.income * 0.2)}.`
    : 'Add income transactions to see your 50/30/20 budget breakdown.',
    color: 'var(--blue)', tag: 'Tip'
  });
  return obs;
}

// ── Day-of-week spending heatmap bar ──
function DOWChart({ data }) {
  const max = Math.max(...data.map(d => d.avg), 1);
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const todayDow = new Date().getDay();

  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 80, padding: '0 4px' }}>
      {data.map((d, i) => {
        const h = Math.max((d.avg / max) * 100, 4);
        const isToday = days[i] === days[todayDow];
        const isWeekend = i === 0 || i === 6;
        const barColor = isToday ? 'var(--accent)' : isWeekend ? 'var(--amber)' : 'var(--blue)';
        return (
          <div key={d.day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div
              title={`${d.day}: avg ${fmt(d.avg)}`}
              style={{
                width: '100%', height: `${h}%`, borderRadius: '4px 4px 0 0',
                background: barColor,
                opacity: isToday ? 1 : 0.55,
                transition: 'opacity 0.2s',
                cursor: 'default',
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '1'; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = isToday ? '1' : '0.55'; }}
            />
            <span style={{ fontSize: 9.5, color: isToday ? 'var(--accent)' : 'var(--t3)', fontWeight: isToday ? 700 : 500, fontFamily: 'var(--font-mono, monospace)' }}>{d.day}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Recurring vs One-time doughnut ──
function RecurringRing({ recurring, oneTime }) {
  const total = recurring + oneTime || 1;
  const rPct  = Math.round(recurring / total * 100);
  const r = 32, circ = 2 * Math.PI * r;
  const rDash = circ * (rPct / 100);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <svg width={80} height={80} viewBox="0 0 80 80">
          <circle cx={40} cy={40} r={r} fill="none" stroke="var(--bg-elevated)" strokeWidth={8}/>
          <circle cx={40} cy={40} r={r} fill="none" stroke="var(--accent)" strokeWidth={8}
            strokeLinecap="round"
            strokeDasharray={`${rDash} ${circ}`}
            transform="rotate(-90 40 40)"
            style={{ transition: 'stroke-dasharray 1s ease' }}
          />
          <circle cx={40} cy={40} r={r} fill="none" stroke="var(--amber)" strokeWidth={8}
            strokeLinecap="round"
            strokeDasharray={`${circ * ((100-rPct)/100)} ${circ}`}
            strokeDashoffset={-rDash}
            transform="rotate(-90 40 40)"
            style={{ transition: 'all 1s ease' }}
          />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <span className="mono" style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)' }}>{rPct}%</span>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--accent)', flexShrink: 0 }}/>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--t1)' }}>Recurring</div>
            <div className="mono" style={{ fontSize: 11, color: 'var(--t3)' }}>{fmt(recurring)}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--amber)', flexShrink: 0 }}/>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--t1)' }}>One-time</div>
            <div className="mono" style={{ fontSize: 11, color: 'var(--t3)' }}>{fmt(oneTime)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 50/30/20 actual vs ideal visual ──
function RuleBar({ label, actual, ideal, color, pct }) {
  const overIdeal = actual > ideal;
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <div>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--t1)' }}>{label}</span>
          <span style={{ fontSize: 11, color: 'var(--t3)', marginLeft: 6 }}>actual: {fmt(actual)}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="mono" style={{ fontSize: 11, color: overIdeal ? 'var(--red)' : 'var(--green)', fontWeight: 700 }}>{pct}%</span>
          {overIdeal && <span style={{ fontSize: 9.5, fontWeight: 700, padding: '1px 6px', borderRadius: 99, background: 'var(--red-bg)', color: 'var(--red)' }}>over</span>}
          {!overIdeal && <span style={{ fontSize: 9.5, fontWeight: 700, padding: '1px 6px', borderRadius: 99, background: 'var(--green-bg)', color: 'var(--green)' }}>ok</span>}
        </div>
      </div>
      {/* Two-layer track: ideal zone + actual fill */}
      <div style={{ position: 'relative', height: 8, background: 'var(--bg-elevated)', borderRadius: 99, overflow: 'hidden' }}>
        {/* ideal marker */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', borderRadius: 99, background: color + '14' }} />
        <div style={{
          position: 'absolute', top: 0, left: 0, height: '100%', borderRadius: 99,
          background: overIdeal ? 'var(--red)' : color,
          width: `${Math.min(pct, 100)}%`,
          transition: 'width 0.8s cubic-bezier(.4,0,.2,1)',
          boxShadow: `0 0 8px ${overIdeal ? 'var(--red-glow)' : color + '50'}`,
        }}/>
      </div>
      <div style={{ fontSize: 10, color: 'var(--t4)', marginTop: 4 }}>Target: {fmt(ideal)} (ideal)</div>
    </div>
  );
}

export default function Insights() {
  const {
    totals, savingsRate, categorySpend, fullChartData,
    recurringStats, recurringItems, weeklySpend, dowPattern,
    biggestExpense, needs50, wants30, savings20,
  } = useFinanceCalc();

  const top    = categorySpend[0] || ['—', 0];
  const second = categorySpend[1] || ['—', 0];
  const prevExp = MONTHLY_HISTORY[MONTHLY_HISTORY.length - 1].expense;
  const expDiff = totals.expense - prevExp;
  const avgSpend = categorySpend.length > 0
    ? Math.round(categorySpend.reduce((s, [, v]) => s + v, 0) / categorySpend.length)
    : 0;

  const monthlyData = fullChartData.slice(-5);

  const currentMonthLabel = new Date().toLocaleDateString('en-IN', { month: 'short' });

  const savingsTrend = MONTHLY_HISTORY.map(m => ({
    month: m.month,
    rate: Math.round((m.income - m.expense) / m.income * 100),
    savings: m.income - m.expense,
  }));
  savingsTrend.push({ month: currentMonthLabel, rate: savingsRate, savings: totals.balance });

  const catBarData = categorySpend.map(([cat, val]) => ({
    name: cat, value: val, color: CATEGORIES[cat]?.color || '#888',
  }));

  const observations = buildObs(totals, savingsRate, top, second, expDiff);

  const peakDow = dowPattern.reduce((a, b) => b.avg > a.avg ? b : a, dowPattern[0] || { day: '—', avg: 0 });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── KPI Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14 }}>
        <InsightCard label="Top Spend Category" value={top[0]} icon="🏆"
          color="var(--amber)"
          sub={`${fmt(top[1])} · ${totals.expense > 0 ? Math.round(top[1] / totals.expense * 100) : 0}% of total`}
          progress={totals.expense > 0 ? Math.round(top[1] / totals.expense * 100) : 0}
          delay={0}
        />
        <InsightCard label="Savings Rate" value={`${savingsRate}%`} icon="💹"
          color={savingsRate >= 30 ? 'var(--green)' : savingsRate >= 15 ? 'var(--amber)' : 'var(--red)'}
          sub={savingsRate >= 30 ? '✓ Above 30% target' : savingsRate >= 15 ? '↗ Approaching 30% goal' : '↙ Below 15% — needs attention'}
          progress={Math.min(savingsRate, 100)}
          delay={1}
        />
        <InsightCard label="MoM Expense Change" icon="📊"
          value={`${expDiff >= 0 ? '+' : ''}${fmt(expDiff)}`}
          color={expDiff <= 0 ? 'var(--green)' : 'var(--red)'}
          sub={expDiff > 0 ? '↑ More spent vs last month' : '↓ Less spent vs last month'}
          delay={2}
        />
        <InsightCard label="2nd Highest Category" value={second[0]} icon="🥈"
          color="var(--blue)"
          sub={`${fmt(second[1])} · ${totals.expense > 0 ? Math.round(second[1] / totals.expense * 100) : 0}% of total`}
          delay={3}
        />
        <InsightCard label="Avg Category Spend" value={fmt(avgSpend)} icon="📐"
          color="var(--purple)"
          sub={`Across ${categorySpend.length} active categories`}
          delay={4}
        />
        <InsightCard label="Peak Spending Day" value={peakDow.day} icon="📅"
          color="var(--amber)"
          sub={`Avg ${fmt(peakDow.avg)} per ${peakDow.day} transaction`}
          delay={5}
        />
      </div>

      {/* ── NEW: 50/30/20 Actual vs Ideal ── */}
      <div className="card card-p anim-up d-5">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.3px' }}>50/30/20 Rule — Actual vs Ideal</div>
            <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 3 }}>How your real spending compares to the recommended split</div>
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 99, background: 'var(--accent-bg)', color: 'var(--accent)', border: '1px solid rgba(0,240,200,0.2)' }}>
            Income: {fmt(totals.income)}
          </span>
        </div>
        <RuleBar label="50% Needs" actual={needs50.actual} ideal={needs50.ideal} color="var(--blue)" pct={needs50.pct} />
        <RuleBar label="30% Wants" actual={wants30.actual} ideal={wants30.ideal} color="var(--purple)" pct={wants30.pct} />
        <RuleBar label="20% Savings" actual={Math.max(savings20.actual, 0)} ideal={savings20.ideal} color="var(--green)" pct={Math.max(savings20.pct, 0)} />
        <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 'var(--r-md)', background: 'var(--bg-card-alt)', border: '1px solid var(--b-sm)', fontSize: 11.5, color: 'var(--t3)', lineHeight: 1.7 }}>
          💡 <strong style={{ color: 'var(--t2)' }}>Needs</strong> include rent, bills, groceries, transport, health & insurance.&nbsp;
          <strong style={{ color: 'var(--t2)' }}>Wants</strong> cover food, dining, entertainment, shopping, travel & education.
        </div>
      </div>

      {/* ── NEW: Recurring vs One-time + Weekly Spend ── */}
      <div className="charts-row">
        {/* Recurring breakdown */}
        <div className="card card-p anim-up d-6">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.3px' }}>Recurring vs One-time</div>
              <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 3 }}>Auto-debits & subscriptions vs individual spends</div>
            </div>
          </div>
          <RecurringRing recurring={recurringStats.recurringTotal} oneTime={recurringStats.oneTimeTotal} />
          <div style={{ marginTop: 18, borderTop: '1px solid var(--b-xs)', paddingTop: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 10 }}>Top Recurring</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {recurringItems.map(tx => {
                const { icon, color } = CATEGORIES[tx.cat] || {};
                return (
                  <div key={tx.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 7, background: (color || '#888') + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0 }}>{icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--t1)' }} className="truncate">{tx.name}</div>
                      <div style={{ fontSize: 10.5, color: 'var(--t3)' }}>{tx.cat}</div>
                    </div>
                    <span className="mono" style={{ fontSize: 12, fontWeight: 700, color: 'var(--t2)', flexShrink: 0 }}>{fmt(tx.amount)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Weekly spend trend */}
        <div className="card card-p anim-up d-7">
          <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.3px', marginBottom: 4 }}>Weekly Spend Trend</div>
          <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 18 }}>Rolling 8-week expense total</div>
          <ChartMount height={180}>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={weeklySpend} barCategoryGap="30%" margin={{ top: 4, right: 4, left: -14, bottom: 0 }}>
              <CartesianGrid strokeDasharray="4 4" stroke="var(--b-xs)" vertical={false} />
                <XAxis dataKey="week" tick={{ fill: 'var(--t2)', fontSize: 11.5, fontFamily: 'Inter' }} axisLine={false} tickLine={false} dy={5} />
                <YAxis tickFormatter={fmtSh} tick={{ fill: 'var(--t2)', fontSize: 11.5 }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTip />} cursor={{ fill: 'var(--b-xs)' }} />
              <Bar dataKey="amount" name="Spent" radius={[5, 5, 0, 0]}>
                {weeklySpend.map((_, i) => (
                  <Cell key={i} fill="var(--blue)" fillOpacity={0.55 + (i / weeklySpend.length) * 0.4} />
                ))}
              </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartMount>
        </div>
      </div>

      {/* ── NEW: Day-of-week pattern ── */}
      <div className="card card-p anim-up" style={{ animationDelay: '0.38s' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.3px' }}>When Do You Spend Most?</div>
            <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 3 }}>Average spend per transaction by day of week</div>
          </div>
          <div style={{ display: 'flex', gap: 12, fontSize: 10.5, color: 'var(--t3)', alignItems: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--accent)', display: 'inline-block' }}/> Today</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--amber)', display: 'inline-block' }}/> Weekend</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--blue)', display: 'inline-block' }}/> Weekday</span>
          </div>
        </div>
        <DOWChart data={dowPattern} />
        <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          <div style={{ padding: '10px 14px', borderRadius: 'var(--r-md)', background: 'var(--bg-card-alt)', border: '1px solid var(--b-sm)', textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 4 }}>Highest day</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--amber)' }}>{peakDow.day}</div>
            <div className="mono" style={{ fontSize: 11, color: 'var(--t3)' }}>{fmt(peakDow.avg)} avg</div>
          </div>
          <div style={{ padding: '10px 14px', borderRadius: 'var(--r-md)', background: 'var(--bg-card-alt)', border: '1px solid var(--b-sm)', textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 4 }}>Recurring/month</div>
            <div className="mono" style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent)' }}>{fmt(recurringStats.recurringTotal)}</div>
            <div style={{ fontSize: 11, color: 'var(--t3)' }}>{recurringStats.recurringCount} auto-debits</div>
          </div>
          <div style={{ padding: '10px 14px', borderRadius: 'var(--r-md)', background: 'var(--bg-card-alt)', border: '1px solid var(--b-sm)', textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 4 }}>One-time spends</div>
            <div className="mono" style={{ fontSize: 14, fontWeight: 700, color: 'var(--blue)' }}>{fmt(recurringStats.oneTimeTotal)}</div>
            <div style={{ fontSize: 11, color: 'var(--t3)' }}>{recurringStats.oneTimeCount} transactions</div>
          </div>
        </div>
      </div>

      {/* ── Monthly comparison chart ── */}
      <div className="charts-row-alt">
        <div className="card card-p anim-up" style={{ animationDelay: '0.44s' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.3px' }}>Monthly Comparison</div>
              <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 3 }}>Income vs Expenses · last 5 months</div>
            </div>
            <div style={{ display: 'flex', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--income)' }} />
                <span style={{ fontSize: 11, color: 'var(--t3)', fontWeight: 500 }}>Income</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--expense)' }} />
                <span style={{ fontSize: 11, color: 'var(--t3)', fontWeight: 500 }}>Expense</span>
              </div>
            </div>
          </div>
          <ChartMount height={250}>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyData} barCategoryGap="28%" barGap={4} margin={{ top: 4, right: 4, left: -14, bottom: 0 }}>
              <CartesianGrid strokeDasharray="4 4" stroke="var(--b-xs)" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: 'var(--t2)', fontSize: 11.5, fontFamily: 'Inter' }} axisLine={false} tickLine={false} dy={5} />
                <YAxis tickFormatter={fmtSh} tick={{ fill: 'var(--t2)', fontSize: 11.5, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTip />} cursor={{ fill: 'var(--b-xs)', radius: 6 }} />
              <Bar dataKey="income"  fill="var(--income)"  fillOpacity={0.75} radius={[6, 6, 0, 0]} name="Income" />
              <Bar dataKey="expense" fill="var(--expense)" fillOpacity={0.65} radius={[6, 6, 0, 0]} name="Expense" />
              </BarChart>
            </ResponsiveContainer>
          </ChartMount>
        </div>

        {/* Category horizontal bars */}
        <div className="card card-p anim-up" style={{ animationDelay: '0.48s' }}>
          <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.3px', marginBottom: 4 }}>Category Spend Rank</div>
          <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 18 }}>All expense categories</div>
          {catBarData.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">📭</div><div style={{ fontSize: 13, color: 'var(--t3)' }}>No expenses</div></div>
          ) : (
            <ChartMount height={Math.max(220, catBarData.length * 34)}>
              <ResponsiveContainer width="100%" height={Math.max(220, catBarData.length * 34)}>
                <BarChart data={catBarData} layout="vertical" barCategoryGap="22%" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="var(--b-xs)" horizontal={false} />
                  <XAxis type="number" tickFormatter={fmtSh} tick={{ fill: 'var(--t2)', fontSize: 11.5, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" tick={{ fill: 'var(--t2)', fontSize: 11.5, fontFamily: 'Inter' }} axisLine={false} tickLine={false} width={90} />
                <Tooltip content={<ChartTip />} cursor={{ fill: 'var(--b-xs)' }} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} name="Spent">
                  {catBarData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} fillOpacity={0.8} style={{ filter: `drop-shadow(0 0 5px ${entry.color}40)` }} />
                  ))}
                </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartMount>
          )}
        </div>
      </div>

      {/* ── Savings Rate Trend ── */}
      <div className="card card-p anim-up" style={{ animationDelay: '0.52s' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.3px' }}>Savings Rate Trend</div>
            <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 3 }}>% of income saved each month · 8-month view</div>
          </div>
          <div style={{
            fontSize: 11, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace",
            padding: '4px 10px', borderRadius: 99,
            background: savingsRate >= 30 ? 'var(--income-bg)' : savingsRate >= 15 ? 'var(--amber-bg)' : 'var(--expense-bg)',
            color: savingsRate >= 30 ? 'var(--income)' : savingsRate >= 15 ? 'var(--amber)' : 'var(--expense)',
          }}>
            Now: {savingsRate}%
          </div>
        </div>
        <ChartMount height={180}>
          <ResponsiveContainer width="100%" height={180}>
            <ComposedChart data={savingsTrend} margin={{ top: 4, right: 8, left: -14, bottom: 0 }}>
            <defs>
              <linearGradient id="gSave" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="var(--accent)" stopOpacity={0.2} />
                <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
              </linearGradient>
            </defs>
              <CartesianGrid strokeDasharray="4 4" stroke="var(--b-xs)" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: 'var(--t2)', fontSize: 11.5, fontFamily: 'Inter' }} axisLine={false} tickLine={false} dy={6} />
              <YAxis tickFormatter={(v) => `${v}%`} tick={{ fill: 'var(--t2)', fontSize: 11.5, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
            <Tooltip content={<ChartTip />} />
            <ReferenceLine y={30} stroke="var(--green)" strokeDasharray="6 3" strokeOpacity={0.5}
              label={{ value: '30% target', position: 'insideTopRight', fill: 'var(--green)', fontSize: 10, fontFamily: 'Inter', fontWeight: 600 }}
            />
            <Area type="monotone" dataKey="rate" fill="url(#gSave)" stroke="none" name="Savings Rate" />
            <Line type="monotone" dataKey="rate" stroke="var(--accent)" strokeWidth={2.5} dot={{ fill: 'var(--accent)', r: 4, strokeWidth: 0 }} activeDot={{ r: 6, fill: 'var(--accent)', strokeWidth: 0 }} name="Savings Rate" />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartMount>
      </div>

      {/* ── Key Observations ── */}
      <div className="card card-p anim-up" style={{ animationDelay: '0.56s' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <div style={{ width: 40, height: 40, borderRadius: 'var(--r-md)', background: 'linear-gradient(135deg,rgba(0,240,200,0.12),rgba(77,159,255,0.10))', border: '1px solid rgba(0,240,200,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>💡</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.3px' }}>Smart Observations</div>
            <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>Derived from your spending patterns this period</div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 10 }}>
          {observations.map((obs, i) => (
            <div key={i} className="obs-card">
              <div style={{ width: 40, height: 40, borderRadius: 'var(--r-md)', flexShrink: 0, background: obs.color + '18', border: `1px solid ${obs.color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <StatusGlyph color={obs.color} tag={obs.tag} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)' }}>{obs.title}</div>
                  {obs.tag && (
                    <span style={{ fontSize: 9.5, fontWeight: 700, padding: '2px 7px', borderRadius: 99, background: obs.color + '18', color: obs.color, flexShrink: 0 }}>{obs.tag}</span>
                  )}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--t3)', lineHeight: 1.6 }}>{obs.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
