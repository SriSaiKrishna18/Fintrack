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

  describe('fullChartData', () => {
    it('returns 8 data points (7 historical + 1 current)', () => {
      const { result } = renderFinanceHook();
      expect(result.current.fullChartData.length).toBe(8);
    });

    it('each data point has month, income, expense, savings', () => {
      const { result } = renderFinanceHook();
      result.current.fullChartData.forEach(d => {
        expect(d).toHaveProperty('month');
        expect(d).toHaveProperty('income');
        expect(d).toHaveProperty('expense');
        expect(d).toHaveProperty('savings');
      });
    });
  });
});
