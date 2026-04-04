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
    if (state.search.trim()) {
      const q = state.search.toLowerCase();
      txs = txs.filter(t => t.name.toLowerCase().includes(q) || t.cat.toLowerCase().includes(q));
    }
    txs.sort((a, b) => {
      if (state.sortBy === 'date')   return state.sortDir * (new Date(b.date) - new Date(a.date));
      if (state.sortBy === 'amount') return state.sortDir * (b.amount - a.amount);
      if (state.sortBy === 'name')   return state.sortDir * a.name.localeCompare(b.name);
      return 0;
    });
    return txs;
  }, [baseTxs, state.filter, state.catFilter, state.search, state.sortBy, state.sortDir]);

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
    // Savings rate (max 35 pts)
    if (savingsRate >= 30)     score += 35;
    else if (savingsRate >= 20) score += 25;
    else if (savingsRate >= 10) score += 15;
    else if (savingsRate >= 0)  score += 5;
    // Budget adherence (max 25 pts)
    const overCount = budgetUsage.filter(b => b.over && b.budget > 0).length;
    const tracked   = budgetUsage.filter(b => b.budget > 0).length;
    if (tracked > 0) score += Math.round(25 * (1 - overCount / tracked));
    else score += 12;
    // Income diversity (max 20 pts)
    const incomeTypes = new Set(baseTxs.filter(t => t.type === 'income').map(t => t.cat));
    if (incomeTypes.size >= 3) score += 20;
    else if (incomeTypes.size === 2) score += 14;
    else score += 7;
    // Investment habit (max 20 pts)
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

  // Recent 7-month complete chart data
  const fullChartData = useMemo(() => {
    const last = MONTHLY_HISTORY[MONTHLY_HISTORY.length - 1];
    return [
      ...MONTHLY_HISTORY,
      { month: 'Apr', income: totals.income, expense: totals.expense, savings: totals.balance },
    ];
  }, [totals]);

  return {
    totals, savingsRate, categorySpend, filteredTxs,
    monthlyBreakdown, budgetUsage, baseTxs,
    healthScore, projected, fullChartData,
  };
}
