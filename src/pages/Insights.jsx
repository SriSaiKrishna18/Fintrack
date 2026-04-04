import { useState } from 'react';
import { useFinanceCalc } from '../hooks/useFinanceCalc';
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

export default function Insights() {
  const { totals, savingsRate, categorySpend, fullChartData } = useFinanceCalc();
  const [activeMonth, setActiveMonth] = useState(null);

  const top    = categorySpend[0] || ['—', 0];
  const second = categorySpend[1] || ['—', 0];
  const prevExp = MONTHLY_HISTORY[MONTHLY_HISTORY.length - 1].expense;
  const expDiff = totals.expense - prevExp;
  const avgSpend = categorySpend.length > 0
    ? Math.round(categorySpend.reduce((s, [, v]) => s + v, 0) / categorySpend.length)
    : 0;

  const monthlyData = fullChartData.slice(-5);

  const savingsTrend = MONTHLY_HISTORY.map(m => ({
    month: m.month,
    rate: Math.round((m.income - m.expense) / m.income * 100),
    savings: m.income - m.expense,
  }));
  savingsTrend.push({ month: 'Apr', rate: savingsRate, savings: totals.balance });

  const catBarData = categorySpend.map(([cat, val]) => ({
    name: cat, value: val, color: CATEGORIES[cat]?.color || '#888',
  }));

  const observations = buildObs(totals, savingsRate, top, second, expDiff);

  // 50/30/20 breakdown
  const needs  = totals.income * 0.5;
  const wants  = totals.income * 0.3;
  const saves  = totals.income * 0.2;

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
        <InsightCard label="Net Balance" value={fmt(totals.balance)} icon="🏦"
          color={totals.balance >= 0 ? 'var(--green)' : 'var(--red)'}
          sub={totals.balance >= 0 ? 'Surplus this period' : 'Deficit this period'}
          progress={totals.income > 0 ? Math.min(Math.abs(Math.round(totals.balance / totals.income * 100)), 100) : 0}
          delay={5}
        />
      </div>

      {/* ── 50/30/20 Rule Card ── */}
      <div className="card card-p anim-up d-6">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.3px' }}>50/30/20 Budget Rule</div>
            <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 3 }}>Ideal allocation based on your income</div>
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 99, background: 'var(--accent-bg)', color: 'var(--accent)', border: '1px solid rgba(0,240,200,0.2)' }}>
            Income: {fmt(totals.income)}
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
          {[
            { label: '50% Needs', budget: needs,  color: 'var(--blue)',   desc: 'Rent, utilities, groceries', icon: '🏠' },
            { label: '30% Wants', budget: wants,  color: 'var(--purple)', desc: 'Dining, entertainment, travel', icon: '🎯' },
            { label: '20% Savings', budget: saves, color: 'var(--green)',  desc: 'Investments, emergency fund', icon: '💰' },
          ].map(({ label, budget, color, desc, icon }) => (
            <div key={label} style={{ background: 'var(--bg-card-alt)', border: '1px solid var(--b-sm)', borderRadius: 'var(--r-lg)', padding: '18px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: color, opacity: 0.5 }} />
              <div style={{ fontSize: 22, marginBottom: 10 }}>{icon}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.7px', marginBottom: 6 }}>{label}</div>
              <div className="mono" style={{ fontSize: 20, fontWeight: 700, color, letterSpacing: '-0.8px', marginBottom: 6 }}>{fmt(budget)}</div>
              <div style={{ fontSize: 11, color: 'var(--t3)', lineHeight: 1.5 }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Charts Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 16 }}>

        {/* Monthly bar comparison */}
        <div className="card card-p anim-up d-7">
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
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthlyData} barCategoryGap="28%" barGap={4} margin={{ top: 4, right: 4, left: -14, bottom: 0 }}>
              <CartesianGrid strokeDasharray="4 4" stroke="var(--b-xs)" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: 'var(--t3)', fontSize: 11, fontFamily: 'Inter' }} axisLine={false} tickLine={false} dy={5} />
              <YAxis tickFormatter={fmtSh} tick={{ fill: 'var(--t3)', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTip />} cursor={{ fill: 'var(--b-xs)', radius: 6 }} />
              <Bar dataKey="income"  fill="var(--income)"  fillOpacity={0.75} radius={[6, 6, 0, 0]} name="Income" />
              <Bar dataKey="expense" fill="var(--expense)" fillOpacity={0.65} radius={[6, 6, 0, 0]} name="Expense" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category horizontal bars */}
        <div className="card card-p anim-up" style={{ animationDelay: '0.42s' }}>
          <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.3px', marginBottom: 4 }}>Category Spend Rank</div>
          <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 18 }}>All expense categories</div>
          {catBarData.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">📭</div><div style={{ fontSize: 13, color: 'var(--t3)' }}>No expenses</div></div>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(220, catBarData.length * 34)}>
              <BarChart data={catBarData} layout="vertical" barCategoryGap="22%" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="var(--b-xs)" horizontal={false} />
                <XAxis type="number" tickFormatter={fmtSh} tick={{ fill: 'var(--t3)', fontSize: 9.5, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fill: 'var(--t2)', fontSize: 11.5, fontFamily: 'Inter' }} axisLine={false} tickLine={false} width={90} />
                <Tooltip content={<ChartTip />} cursor={{ fill: 'var(--b-xs)' }} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} name="Spent">
                  {catBarData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} fillOpacity={0.8} style={{ filter: `drop-shadow(0 0 5px ${entry.color}40)` }} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Savings Rate Trend ── */}
      <div className="card card-p anim-up" style={{ animationDelay: '0.48s' }}>
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
        <ResponsiveContainer width="100%" height={180}>
          <ComposedChart data={savingsTrend} margin={{ top: 4, right: 8, left: -14, bottom: 0 }}>
            <defs>
              <linearGradient id="gSave" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="var(--accent)" stopOpacity={0.2} />
                <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 4" stroke="var(--b-xs)" vertical={false} />
            <XAxis dataKey="month" tick={{ fill: 'var(--t3)', fontSize: 10.5, fontFamily: 'Inter' }} axisLine={false} tickLine={false} dy={6} />
            <YAxis tickFormatter={(v) => `${v}%`} tick={{ fill: 'var(--t3)', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
            <Tooltip content={<ChartTip />} />
            <ReferenceLine y={30} stroke="var(--green)" strokeDasharray="6 3" strokeOpacity={0.5}
              label={{ value: '30% target', position: 'insideTopRight', fill: 'var(--green)', fontSize: 10, fontFamily: 'Inter', fontWeight: 600 }}
            />
            <Area type="monotone" dataKey="rate" fill="url(#gSave)" stroke="none" name="Savings Rate" />
            <Line type="monotone" dataKey="rate" stroke="var(--accent)" strokeWidth={2.5} dot={{ fill: 'var(--accent)', r: 4, strokeWidth: 0 }} activeDot={{ r: 6, fill: 'var(--accent)', strokeWidth: 0 }} name="Savings Rate" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* ── Key Observations ── */}
      <div className="card card-p anim-up" style={{ animationDelay: '0.52s' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <div style={{ width: 40, height: 40, borderRadius: 'var(--r-md)', background: 'linear-gradient(135deg,rgba(0,240,200,0.12),rgba(77,159,255,0.10))', border: '1px solid rgba(0,240,200,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>💡</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.3px' }}>AI-Derived Observations</div>
            <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>Personalized insights from your spending data</div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 10 }}>
          {observations.map((obs, i) => (
            <div key={i} className="obs-card">
              <div style={{ width: 40, height: 40, borderRadius: 'var(--r-md)', flexShrink: 0, background: obs.color + '18', border: `1px solid ${obs.color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{obs.icon}</div>
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
