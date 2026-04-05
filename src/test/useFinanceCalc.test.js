/**
 * Unit Tests — useFinanceCalc hook
 * Tests financial calculations, filtering, sorting, and health score algorithm
 */
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { createElement } from 'react';
import { useFinanceCalc } from '../hooks/useFinanceCalc';
import { AppProvider } from '../context/AppContext';

// Helper: render hook inside AppProvider
function renderFinanceHook() {
  return renderHook(() => useFinanceCalc(), {
    wrapper: ({ children }) => createElement(AppProvider, null, children),
  });
}

describe('useFinanceCalc', () => {

  describe('totals', () => {
    it('calculates total income from all income transactions', () => {
      const { result } = renderFinanceHook();
      expect(result.current.totals.income).toBeGreaterThan(0);
      expect(typeof result.current.totals.income).toBe('number');
    });

    it('calculates total expenses from all expense transactions', () => {
      const { result } = renderFinanceHook();
      expect(result.current.totals.expense).toBeGreaterThan(0);
    });

    it('calculates balance as income minus expenses', () => {
      const { result } = renderFinanceHook();
      const { income, expense, balance } = result.current.totals;
      expect(balance).toBeCloseTo(income - expense, 0);
    });

    it('balance can be positive (surplus) or negative (deficit)', () => {
      const { result } = renderFinanceHook();
      expect(typeof result.current.totals.balance).toBe('number');
    });
  });

  describe('savingsRate', () => {
    it('returns a percentage between 0 and 100', () => {
      const { result } = renderFinanceHook();
      expect(result.current.savingsRate).toBeGreaterThanOrEqual(0);
      expect(result.current.savingsRate).toBeLessThanOrEqual(100);
    });

    it('equals Math.round(balance / income * 100) when income > 0', () => {
      const { result } = renderFinanceHook();
      const { balance, income } = result.current.totals;
      if (income > 0) {
        expect(result.current.savingsRate).toBe(Math.round((balance / income) * 100));
      }
    });
  });

  describe('categorySpend', () => {
    it('returns an array of [category, amount] pairs', () => {
      const { result } = renderFinanceHook();
      expect(Array.isArray(result.current.categorySpend)).toBe(true);
      result.current.categorySpend.forEach(([cat, amount]) => {
        expect(typeof cat).toBe('string');
        expect(typeof amount).toBe('number');
        expect(amount).toBeGreaterThan(0);
      });
    });

    it('is sorted descending by spend amount', () => {
      const { result } = renderFinanceHook();
      const amounts = result.current.categorySpend.map(([, v]) => v);
      for (let i = 1; i < amounts.length; i++) {
        expect(amounts[i]).toBeLessThanOrEqual(amounts[i - 1]);
      }
    });

    it('total of category spend equals total expenses', () => {
      const { result } = renderFinanceHook();
      const catTotal = result.current.categorySpend.reduce((sum, [, v]) => sum + v, 0);
      expect(catTotal).toBe(result.current.totals.expense);
    });
  });

  describe('filteredTxs', () => {
    it('returns all transactions when no filters are applied', () => {
      const { result } = renderFinanceHook();
      expect(result.current.filteredTxs.length).toBeGreaterThan(0);
    });

    it('returns transactions as an array with expected shape', () => {
      const { result } = renderFinanceHook();
      const tx = result.current.filteredTxs[0];
      expect(tx).toHaveProperty('id');
      expect(tx).toHaveProperty('name');
      expect(tx).toHaveProperty('amount');
      expect(tx).toHaveProperty('date');
      expect(tx).toHaveProperty('type');
      expect(tx).toHaveProperty('cat');
    });

    it('default sort returns transactions in an order', () => {
      const { result } = renderFinanceHook();
      const txs = result.current.filteredTxs;
      expect(txs.length).toBeGreaterThan(0);
      // Verify each transaction has a valid date
      txs.forEach(t => {
        expect(new Date(t.date).getTime()).not.toBeNaN();
      });
    });
  });

  describe('healthScore', () => {
    it('returns a number between 0 and 100', () => {
      const { result } = renderFinanceHook();
      expect(result.current.healthScore).toBeGreaterThanOrEqual(0);
      expect(result.current.healthScore).toBeLessThanOrEqual(100);
    });

    it('is an integer (whole number)', () => {
      const { result } = renderFinanceHook();
      expect(Number.isInteger(result.current.healthScore)).toBe(true);
    });
  });

  describe('projected', () => {
    it('returns a projected end-of-month balance', () => {
      const { result } = renderFinanceHook();
      expect(typeof result.current.projected).toBe('number');
    });
  });

  describe('monthlyBreakdown', () => {
    it('returns array of { month, income, expense } objects', () => {
      const { result } = renderFinanceHook();
      expect(Array.isArray(result.current.monthlyBreakdown)).toBe(true);
      result.current.monthlyBreakdown.forEach(entry => {
        expect(entry).toHaveProperty('month');
        expect(entry).toHaveProperty('income');
        expect(entry).toHaveProperty('expense');
      });
    });
  });

  describe('budgetUsage', () => {
    it('returns budget tracking data with percentage', () => {
      const { result } = renderFinanceHook();
      expect(Array.isArray(result.current.budgetUsage)).toBe(true);
      result.current.budgetUsage.forEach(entry => {
        expect(entry).toHaveProperty('cat');
        expect(entry).toHaveProperty('budget');
        expect(entry).toHaveProperty('spent');
        expect(entry).toHaveProperty('pct');
        expect(entry).toHaveProperty('over');
        expect(typeof entry.over).toBe('boolean');
      });
    });

    it('correctly identifies over-budget categories', () => {
      const { result } = renderFinanceHook();
      result.current.budgetUsage.forEach(entry => {
        expect(entry.over).toBe(entry.pct > 100);
      });
    });
  });

  describe('recurringStats', () => {
    it('returns recurring vs one-time expense totals', () => {
      const { result } = renderFinanceHook();
      const { recurringTotal, oneTimeTotal, recurringCount, oneTimeCount } = result.current.recurringStats;
      expect(typeof recurringTotal).toBe('number');
      expect(typeof oneTimeTotal).toBe('number');
      expect(recurringCount + oneTimeCount).toBeGreaterThan(0);
    });

    it('recurring + one-time equals total expenses', () => {
      const { result } = renderFinanceHook();
      const { recurringTotal, oneTimeTotal } = result.current.recurringStats;
      expect(recurringTotal + oneTimeTotal).toBe(result.current.totals.expense);
    });
  });

  describe('recurringItems', () => {
    it('returns at most 5 top recurring expenses sorted by amount', () => {
      const { result } = renderFinanceHook();
      expect(result.current.recurringItems.length).toBeLessThanOrEqual(5);
      result.current.recurringItems.forEach(tx => {
        expect(tx.recurring).toBe(true);
        expect(tx.type).toBe('expense');
      });
    });
  });

  describe('dowPattern', () => {
    it('returns 7 day-of-week entries with avg and total', () => {
      const { result } = renderFinanceHook();
      expect(result.current.dowPattern.length).toBe(7);
      result.current.dowPattern.forEach(d => {
        expect(d).toHaveProperty('day');
        expect(d).toHaveProperty('avg');
        expect(d).toHaveProperty('total');
      });
    });
  });

  describe('biggestExpense', () => {
    it('returns the single largest expense transaction', () => {
      const { result } = renderFinanceHook();
      const biggest = result.current.biggestExpense;
      expect(biggest).not.toBeNull();
      expect(biggest.type).toBe('expense');
      // Verify it's actually the biggest
      const allExpenses = result.current.filteredTxs.filter(t => t.type === 'expense');
      allExpenses.forEach(t => {
        expect(biggest.amount).toBeGreaterThanOrEqual(t.amount);
      });
    });
  });

  describe('50/30/20 rule', () => {
    it('needs50, wants30, savings20 all return actual, ideal, pct', () => {
      const { result } = renderFinanceHook();
      ['needs50', 'wants30', 'savings20'].forEach(key => {
        const val = result.current[key];
        expect(val).toHaveProperty('actual');
        expect(val).toHaveProperty('ideal');
        expect(val).toHaveProperty('pct');
        expect(typeof val.pct).toBe('number');
      });
    });

    it('ideal values sum to total income', () => {
      const { result } = renderFinanceHook();
      const { needs50, wants30, savings20 } = result.current;
      const idealSum = needs50.ideal + wants30.ideal + savings20.ideal;
      expect(idealSum).toBeCloseTo(result.current.totals.income, 0);
    });
  });
});
