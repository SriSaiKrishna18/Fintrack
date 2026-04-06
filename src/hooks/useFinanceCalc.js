import { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { MONTHLY_HISTORY } from '../data/mockData';

function getDateRange(key) {
  const now = new Date();
  const y = now.getFullYear(), m = now.getMonth();
  switch (key) {
    case 'this-month':  return [new Date(y, m, 1),     new Date(y, m + 1, 0)];
    case 'last-month':  return [new Date(y, m - 1, 1), new Date(y, m, 0)];
    case 'last-3m':     return [new Date(y, m - 2, 1), new Date(y, m + 1, 0)];
    default: return null;
  }
}

export function useFinanceCalc() {
  const { state } = useApp();
  const currentMonthLabel = new Date().toLocaleDateString('en-IN', { month: 'short' });

  const baseTxs = useMemo(() => {
    const range = getDateRange(state.dateRange);
    if (!range) return state.transactions;
    const [start, end] = range;
    return state.transactions.filter(t => {
      const d = new Date(t.date);
      return d >= start && d <= end;
    });
  }, [state.transactions, state.dateRange]);

  const totals = useMemo(() => {
    const income  = baseTxs.filter(t => t.type === 'income').reduce((a, t) => a + t.amount, 0);
    const expense = baseTxs.filter(t => t.type === 'expense').reduce((a, t) => a + t.amount, 0);
    return { income, expense, balance: income - expense };
  }, [baseTxs]);

  const savingsRate = totals.income > 0
    ? Math.round((totals.balance / totals.income) * 100)
    : 0;

  const categorySpend = useMemo(() => {
    const map = {};
    baseTxs.filter(t => t.type === 'expense')
      .forEach(t => { map[t.cat] = (map[t.cat] || 0) + t.amount; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [baseTxs]);

  const filteredTxs = useMemo(() => {
    let txs = [...baseTxs];
    if (state.filter !== 'all')    txs = txs.filter(t => t.type === state.filter);
    if (state.catFilter !== 'all') txs = txs.filter(t => t.cat === state.catFilter);
    if (state.recurringFilter === 'recurring')   txs = txs.filter(t => t.recurring);
    if (state.recurringFilter === 'one-time')    txs = txs.filter(t => !t.recurring);
    if (state.search.trim()) {
      const q = state.search.toLowerCase();
      txs = txs.filter(t =>
        t.name.toLowerCase().includes(q) ||
        t.cat.toLowerCase().includes(q) ||
        (t.note || '').toLowerCase().includes(q)
      );
    }
    txs.sort((a, b) => {
      if (state.sortBy === 'date')   return state.sortDir * (new Date(b.date) - new Date(a.date));
      if (state.sortBy === 'amount') return state.sortDir * (b.amount - a.amount);
      if (state.sortBy === 'name')   return state.sortDir * a.name.localeCompare(b.name);
      return 0;
    });
    return txs;
  }, [baseTxs, state.filter, state.catFilter, state.recurringFilter, state.search, state.sortBy, state.sortDir]);

  const monthlyBreakdown = useMemo(() => {
    const map = {};
    state.transactions.forEach(t => {
      const d   = new Date(t.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const lbl = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
      if (!map[key]) map[key] = { month: lbl, income: 0, expense: 0 };
      if (t.type === 'income') map[key].income  += t.amount;
      else                     map[key].expense += t.amount;
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).map(([, v]) => v);
  }, [state.transactions]);

  const budgetUsage = useMemo(() => {
    return Object.entries(state.budgets).map(([cat, budget]) => {
      const spent = categorySpend.find(([c]) => c === cat)?.[1] || 0;
      const pct   = budget > 0 ? Math.round(spent / budget * 100) : 0;
      return { cat, budget, spent, pct, over: pct > 100 };
    }).sort((a, b) => b.pct - a.pct);
  }, [state.budgets, categorySpend]);

  // Financial Health Score (0-100)
  const healthScore = useMemo(() => {
    let score = 0;
    if (savingsRate >= 30)      score += 35;
    else if (savingsRate >= 20) score += 25;
    else if (savingsRate >= 10) score += 15;
    else if (savingsRate >= 0)  score += 5;
    const overCount = budgetUsage.filter(b => b.over && b.budget > 0).length;
    const tracked   = budgetUsage.filter(b => b.budget > 0).length;
    if (tracked > 0) score += Math.round(25 * (1 - overCount / tracked));
    else score += 12;
    const incomeTypes = new Set(baseTxs.filter(t => t.type === 'income').map(t => t.cat));
    if (incomeTypes.size >= 3) score += 20;
    else if (incomeTypes.size === 2) score += 14;
    else score += 7;
    const invSpend = categorySpend.find(([c]) => c === 'Investment')?.[1] || 0;
    const invRate  = totals.income > 0 ? invSpend / totals.income : 0;
    if (invRate >= 0.15) score += 20;
    else if (invRate >= 0.10) score += 14;
    else if (invRate >= 0.05) score += 8;
    return Math.min(score, 100);
  }, [savingsRate, budgetUsage, baseTxs, categorySpend, totals]);

  // Projected end-of-month balance
  const projected = useMemo(() => {
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const dayOfMonth  = now.getDate();
    const avgDailyExpense = totals.expense / dayOfMonth;
    const remainingDays   = daysInMonth - dayOfMonth;
    return Math.round(totals.balance - (avgDailyExpense * remainingDays));
  }, [totals]);

  // Full 8-month chart data
  const fullChartData = useMemo(() => {
    return [
      ...MONTHLY_HISTORY,
      { month: currentMonthLabel, income: totals.income, expense: totals.expense, savings: totals.balance },
    ];
  }, [totals, currentMonthLabel]);

  // ── NEW: Recurring vs One-time breakdown ──
  const recurringStats = useMemo(() => {
    const exp = baseTxs.filter(t => t.type === 'expense');
    const recurringTotal  = exp.filter(t => t.recurring).reduce((a, t) => a + t.amount, 0);
    const oneTimeTotal    = exp.filter(t => !t.recurring).reduce((a, t) => a + t.amount, 0);
    const recurringCount  = exp.filter(t => t.recurring).length;
    const oneTimeCount    = exp.filter(t => !t.recurring).length;
    return { recurringTotal, oneTimeTotal, recurringCount, oneTimeCount };
  }, [baseTxs]);

  // ── NEW: Top recurring subscriptions/bills ──
  const recurringItems = useMemo(() => {
    return baseTxs
      .filter(t => t.type === 'expense' && t.recurring)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [baseTxs]);

  // ── NEW: Weekly spending (last 8 weeks derived from real txs) ──
  const weeklySpend = useMemo(() => {
    const buckets = {};
    state.transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const d = new Date(t.date);
        // ISO week number
        const jan1 = new Date(d.getFullYear(), 0, 1);
        const week = Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7);
        const key  = `${d.getFullYear()}-W${String(week).padStart(2,'0')}`;
        const lbl  = `W${week}`;
        if (!buckets[key]) buckets[key] = { week: lbl, amount: 0, key };
        buckets[key].amount += t.amount;
      });
    return Object.values(buckets).sort((a, b) => a.key.localeCompare(b.key)).slice(-8);
  }, [state.transactions]);

  // ── NEW: Day-of-week spending pattern from actual transactions ──
  const dowPattern = useMemo(() => {
    const labels = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const sums   = [0,0,0,0,0,0,0];
    const counts = [0,0,0,0,0,0,0];
    baseTxs.filter(t => t.type === 'expense').forEach(t => {
      const dow = new Date(t.date).getDay();
      sums[dow]   += t.amount;
      counts[dow] += 1;
    });
    return labels.map((day, i) => ({
      day,
      avg:   counts[i] > 0 ? Math.round(sums[i] / counts[i]) : 0,
      total: sums[i],
    }));
  }, [baseTxs]);

  // ── NEW: Biggest single expense this period ──
  const biggestExpense = useMemo(() => {
    const exp = baseTxs.filter(t => t.type === 'expense');
    return exp.length ? exp.reduce((a, b) => b.amount > a.amount ? b : a, exp[0]) : null;
  }, [baseTxs]);

  // ── NEW: Streak — consecutive days with expense logged ──
  const currentStreak = useMemo(() => {
    const dates = new Set(
      state.transactions
        .filter(t => t.type === 'expense')
        .map(t => t.date)
    );
    let streak = 0;
    const d = new Date();
    while (true) {
      const key = d.toISOString().split('T')[0];
      if (dates.has(key)) { streak++; d.setDate(d.getDate() - 1); }
      else break;
    }
    return streak;
  }, [state.transactions]);

  // ── NEW: Needs / Wants / Savings (50-30-20 actual vs ideal) ──
  const needs50 = useMemo(() => {
    const needsCats = new Set(['Rent','Bills','Groceries','Transport','Health','Insurance']);
    const actual = baseTxs
      .filter(t => t.type === 'expense' && needsCats.has(t.cat))
      .reduce((a, t) => a + t.amount, 0);
    const ideal = totals.income * 0.5;
    return { actual, ideal, pct: totals.income > 0 ? Math.round(actual / totals.income * 100) : 0 };
  }, [baseTxs, totals]);

  const wants30 = useMemo(() => {
    const wantsCats = new Set(['Food','Dining','Entertainment','Shopping','Travel','Education']);
    const actual = baseTxs
      .filter(t => t.type === 'expense' && wantsCats.has(t.cat))
      .reduce((a, t) => a + t.amount, 0);
    const ideal = totals.income * 0.3;
    return { actual, ideal, pct: totals.income > 0 ? Math.round(actual / totals.income * 100) : 0 };
  }, [baseTxs, totals]);

  const savings20 = useMemo(() => {
    const actual = totals.balance;
    const ideal  = totals.income * 0.2;
    return { actual, ideal, pct: savingsRate };
  }, [totals, savingsRate]);

  return {
    totals, savingsRate, categorySpend, filteredTxs,
    monthlyBreakdown, budgetUsage, baseTxs,
    healthScore, projected, fullChartData,
    // new
    recurringStats, recurringItems,
    weeklySpend, dowPattern,
    biggestExpense, currentStreak,
    needs50, wants30, savings20,
  };
}
