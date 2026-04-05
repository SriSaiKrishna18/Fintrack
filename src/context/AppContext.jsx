import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { INITIAL_TRANSACTIONS } from '../data/mockData';

const AppContext = createContext(null);

const savedTheme   = localStorage.getItem('ft_theme')   || 'dark';
const savedTxs     = JSON.parse(localStorage.getItem('ft_txs')     || 'null');
const savedBudgets = JSON.parse(localStorage.getItem('ft_budgets') || 'null');
const savedGoals   = JSON.parse(localStorage.getItem('ft_goals')   || 'null');

const DEFAULT_BUDGETS = {
  Food: 5000, Shopping: 6000, Transport: 2000,
  Bills: 3500, Entertainment: 2000, Health: 3000,
  Groceries: 3000, Education: 1500, Investment: 15000,
  Dining: 4000, Travel: 10000, Insurance: 5000, Rent: 20000,
};

const DEFAULT_GOALS = [
  { id: 1, name: 'Emergency Fund', target: 300000, current: 125000, icon: '🛡️', color: '#00f0c8' },
  { id: 2, name: 'Vacation — Europe', target: 150000, current: 42000, icon: '✈️', color: '#4d9fff' },
  { id: 3, name: 'MacBook Pro', target: 180000, current: 60000, icon: '💻', color: '#c47eff' },
];

export const initialState = {
  role:            'admin',
  page:            'overview',
  filter:          'all',
  catFilter:       'all',
  recurringFilter: 'all',   // 'all' | 'recurring' | 'one-time'
  search:          '',
  sortBy:          'date',
  sortDir:         -1,
  theme:           savedTheme,
  sidebarOpen:     false,
  dateRange:       'all',
  transactions:    savedTxs || INITIAL_TRANSACTIONS,
  budgets:         savedBudgets || DEFAULT_BUDGETS,
  goals:           savedGoals  || DEFAULT_GOALS,
  toasts:          [],
};

let toastId = 0;

function reducer(state, action) {
  switch (action.type) {
    case 'SET_ROLE':             return { ...state, role: action.payload };
    case 'SET_PAGE':             return { ...state, page: action.payload, sidebarOpen: false };
    case 'SET_FILTER':           return { ...state, filter: action.payload };
    case 'SET_CAT_FILTER':       return { ...state, catFilter: action.payload };
    case 'SET_RECURRING_FILTER': return { ...state, recurringFilter: action.payload };
    case 'SET_SEARCH':           return { ...state, search: action.payload };
    case 'SET_DATE_RANGE':       return { ...state, dateRange: action.payload };
    case 'TOGGLE_SIDEBAR':       return { ...state, sidebarOpen: !state.sidebarOpen };
    case 'CLOSE_SIDEBAR':        return { ...state, sidebarOpen: false };
    case 'TOGGLE_THEME': {
      const next = state.theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('ft_theme', next);
      return { ...state, theme: next };
    }
    case 'SET_SORT':
      return {
        ...state,
        sortBy:  action.payload,
        sortDir: state.sortBy === action.payload ? state.sortDir * -1 : -1,
      };
    case 'ADD_TX': {
      const txs = [action.payload, ...state.transactions];
      localStorage.setItem('ft_txs', JSON.stringify(txs));
      return { ...state, transactions: txs };
    }
    case 'EDIT_TX': {
      const txs = state.transactions.map(t =>
        t.id === action.payload.id ? { ...t, ...action.payload } : t
      );
      localStorage.setItem('ft_txs', JSON.stringify(txs));
      return { ...state, transactions: txs };
    }
    // Inline note edit without opening full modal
    case 'SET_TX_NOTE': {
      const txs = state.transactions.map(t =>
        t.id === action.payload.id ? { ...t, note: action.payload.note } : t
      );
      localStorage.setItem('ft_txs', JSON.stringify(txs));
      return { ...state, transactions: txs };
    }
    // Toggle recurring flag inline
    case 'TOGGLE_TX_RECURRING': {
      const txs = state.transactions.map(t =>
        t.id === action.payload ? { ...t, recurring: !t.recurring } : t
      );
      localStorage.setItem('ft_txs', JSON.stringify(txs));
      return { ...state, transactions: txs };
    }
    // Bulk delete selected transaction IDs
    case 'BULK_DELETE_TX': {
      const ids = new Set(action.payload);
      const txs = state.transactions.filter(t => !ids.has(t.id));
      localStorage.setItem('ft_txs', JSON.stringify(txs));
      return { ...state, transactions: txs };
    }
    case 'DELETE_TX': {
      const txs = state.transactions.filter(t => t.id !== action.payload);
      localStorage.setItem('ft_txs', JSON.stringify(txs));
      return { ...state, transactions: txs };
    }
    case 'RESET_TXS':
      localStorage.removeItem('ft_txs');
      return { ...state, transactions: INITIAL_TRANSACTIONS };
    case 'SET_BUDGET': {
      const budgets = { ...state.budgets, [action.payload.cat]: action.payload.amount };
      localStorage.setItem('ft_budgets', JSON.stringify(budgets));
      return { ...state, budgets };
    }
    case 'UPDATE_GOAL': {
      const goals = state.goals.map(g =>
        g.id === action.payload.id ? { ...g, ...action.payload } : g
      );
      localStorage.setItem('ft_goals', JSON.stringify(goals));
      return { ...state, goals };
    }
    case 'ADD_GOAL': {
      const goals = [...state.goals, action.payload];
      localStorage.setItem('ft_goals', JSON.stringify(goals));
      return { ...state, goals };
    }
    case 'DELETE_GOAL': {
      const goals = state.goals.filter(g => g.id !== action.payload);
      localStorage.setItem('ft_goals', JSON.stringify(goals));
      return { ...state, goals };
    }
    case 'ADD_TOAST': {
      const toast = { id: ++toastId, ...action.payload };
      return { ...state, toasts: [...state.toasts, toast] };
    }
    case 'REMOVE_TOAST':
      return { ...state, toasts: state.toasts.filter(t => t.id !== action.payload) };
    default: return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const root = document.documentElement;
    if (state.theme === 'light') root.classList.add('light');
    else root.classList.remove('light');
  }, [state.theme]);

  const toast = useCallback((msg, type = 'success') => {
    dispatch({ type: 'ADD_TOAST', payload: { msg, kind: type } });
  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch, toast }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() { return useContext(AppContext); }
