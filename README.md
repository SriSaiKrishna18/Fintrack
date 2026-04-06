# FinTrack Pro — Finance Dashboard

> Built for the **Zorvyn FinTech Frontend Developer Intern** assignment.

[![Live Demo](https://img.shields.io/badge/Live_Demo-Vercel-000?style=flat&logo=vercel&logoColor=white)](https://fintrack-pro-v3.vercel.app)
[![GitHub](https://img.shields.io/badge/Repo-GitHub-181717?style=flat&logo=github)](https://github.com/SriSaiKrishna18/Fintrack)

**🔗 [Live Demo](https://fintrack-pro-v3.vercel.app) · [GitHub](https://github.com/SriSaiKrishna18/Fintrack)**

---

## Quick Start

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # 25 unit tests
npm run build
```

---

## My Approach

When I read the assignment I noticed it said *"keep things simple and clear — the goal is to see how you think and build."* So I tried to build something I would actually want to use day-to-day, rather than just a dashboard that checks every requirement box.

A few deliberate choices I made:

**I focused on the "why" behind numbers, not just the numbers.** Most finance dashboards show you totals and call it insights. I wanted mine to answer questions like: *Am I spending more on weekdays or weekends? What percentage of my expenses are locked-in recurring payments vs choices I make each month? How does my actual spending compare to the 50/30/20 rule — not the ideal, but my specific real numbers?*

**Recurring vs one-time is a distinction that actually matters.** ₹35,000 in monthly expenses feels very different if ₹28,000 of that is rent + SIPs + subscriptions you can't easily cut vs if it's all discretionary. I added a recurring flag to every transaction, a filter to isolate them, and a breakdown on the Insights page that shows this split.

**Notes on transactions are under-appreciated.** I personally annotate my bank statements. *"Sale price, was ₹5,499"* or *"Work expense to claim"* — these details disappear in every finance app I've used. So I added inline editable notes directly on the transaction row (no modal needed), and you can even search by note text.

**The health score algorithm is documented and transparent.** I didn't want it to feel like a magic black box. The four pillars (savings rate, budget adherence, income diversity, investment habit) are weighted explicitly and I explain them in the UI itself.

**Two roles, zero backend.** Admin and Viewer modes are simulated entirely on the frontend. The rule was: admin-only UI elements are removed from the DOM entirely (not just disabled), so you can't bypass them by inspecting elements.

---

## Stack

React 18 · Recharts · Vite · Vitest · Context API + useReducer · CSS Custom Properties · date-fns

---

## Features

### Core
| Requirement | Implementation |
|---|---|
| Dashboard Overview | KPI cards (Balance, Income, Expense, Projected EOM), Area chart (trend), Donut chart (category), Category breakdown bars |
| Transactions | Table with Date, Amount, Category, Type, Recurring badge, Inline note. Search (name + category + note), type filter, category filter, recurring filter, sort by name/date/amount |
| Role-Based UI | Admin: add/edit/delete/annotate/toggle recurring. Viewer: read-only. Pill switcher in Topbar + Sidebar. Role removes elements from DOM (not just disables). |
| Insights | 6 KPI cards, actual 50/30/20 breakdown (your numbers vs ideal), recurring vs one-time ring chart, day-of-week spending pattern, weekly spend trend, savings rate trend with 30% reference, smart observations |
| State Management | React Context + useReducer. Custom `useFinanceCalc` with `useMemo`. LocalStorage persistence. |

### Bonus
| Feature | Details |
|---|---|
| Dark / Light Mode | Full dual theme via CSS custom properties. Light theme uses a warm sand + mist atmospheric palette with frosted glass cards. |
| Data Persistence | Transactions, budgets, goals, theme, and recurring flags all survive page refresh. |
| CSV + JSON Export | Both formats include recurring flag and note fields. Export reflects active filters. |
| Budget Tracker | Per-category limits, visual progress bars, over-budget alerts, near-limit warnings. |
| Savings Goals | Create/edit/delete goals, fund deposits, progress rings, estimated completion time. |
| Financial Health Score | 0–100 across savings rate, budget adherence, income diversity, investment habit. |
| Projected Balance | End-of-month forecast from average daily spend rate. |
| Recurring Transaction Management | Flag/unflag recurring inline, filter by recurring/one-time, recurring breakdown on Insights. |
| Inline Notes | Click-to-edit notes directly on transaction rows. Searchable. |
| Bulk Delete | Select multiple transactions, delete in one action (Admin only). |
| Animated Counters | KPI values animate from 0 on first render only. Returns to page show values instantly. |
| Pagination | 15 rows/page with smart ellipsis. |
| Date Range Filter | All Time / This Month / Last Month / Last 3 Months. Applies to every metric and chart. |
| Toast System | 4 types: success/error/info/warning with animation. |
| Keyboard Shortcuts | Press `?` for full list. `1-5` pages, `T` theme, `N` new transaction. |
| Welcome Banner | Onboarding banner on first visit, dismissible. |
| Unit Tests | 25 tests via Vitest covering all financial calculations, health score, and budget tracking. |

---

## Evaluation Mapping (Explicit)

This section maps implementation directly to the assignment rubric so reviewers can verify quickly.

1. **Design & Creativity**
   - Warm/cool dual-theme visual language, glass-style cards, custom chart tooltips, and guided reviewer tour banner on Overview.
2. **Responsiveness**
   - Mobile sidebar overlay, responsive chart/card grids, compact topbar behavior, and transaction card layout under 768px.
3. **Functionality**
   - Dashboard KPIs + trend/categorical charts, full transactions CRUD + search/filter/sort/export, role-based UI simulation.
4. **User Experience**
   - Empty states, quick actions, keyboard shortcuts (`1-5`, `T`, `N`, `?`), toast feedback, pagination, guided walkthrough CTA.
5. **Technical Quality**
   - Modular page/components structure, derived data centralized in `useFinanceCalc`, reducer-driven global state, and page-level lazy loading via `React.lazy` + `Suspense`.
6. **State Management**
   - Context + `useReducer`; persisted keys include transactions, budgets, goals, theme, role, and date range.
7. **Documentation**
   - This README includes setup, architecture, assumptions, design rationale, and rubric mapping.
8. **Attention to Detail**
   - CSV escaping for quotes, page clamping after filtering, accessibility improvements (`Skip to content`, `aria-live` toasts), graceful no-data handling.

---

## 90-Second Demo Flow

If you want to evaluate quickly, use this exact sequence:

1. Open **Overview** and use **Reviewer Tour** buttons.
2. Switch **Admin -> Viewer** and confirm action controls disappear.
3. Go to **Transactions**: search by note, apply recurring filter, sort amount, export CSV/JSON.
4. Open **Insights**: verify 50/30/20, recurring vs one-time, day-of-week and monthly trends.
5. Open **Budgets/Goals**: edit a budget, add goal funds, and refresh to confirm persistence.

---

## Submission Note (Ready to Paste)

Hello Team,

I built this assignment as a frontend-focused finance dashboard with emphasis on clean UI, interaction quality, and clear state management. It includes all core requirements (overview + charts, transactions with filter/sort/search, role-based frontend UI, insights, and managed app state), along with optional enhancements like theme toggle, persistence, exports, keyboard shortcuts, and testing.

To evaluate quickly, please use the "90-second reviewer tour" on the Overview page and then check the "Evaluation Mapping" section in this README, where each rubric criterion is mapped directly to implemented features.

Thank you for reviewing my submission.

---

## Project Structure

```
src/
├── context/
│   └── AppContext.jsx          # Global state (useReducer), 18+ action types
├── data/
│   └── mockData.js             # 40 transactions (with recurring + notes), 15 categories, monthly + DOW history
├── hooks/
│   └── useFinanceCalc.js       # All derived data: totals, health score, recurring stats, DOW pattern, 50/30/20 actual
├── test/
│   ├── setup.js
│   └── useFinanceCalc.test.js  # 25 unit tests
├── components/
│   ├── Sidebar.jsx
│   ├── Topbar.jsx
│   ├── AddTransactionModal.jsx  # Add/edit with note field + recurring toggle
│   └── Toast.jsx
├── pages/
│   ├── Overview.jsx
│   ├── Transactions.jsx         # Inline notes, bulk select, recurring filter, recurring toggle per row
│   ├── Insights.jsx             # DOW pattern, recurring breakdown, weekly spend, actual 50/30/20
│   ├── Budgets.jsx
│   └── Goals.jsx
```

---

## Assumptions

1. *"Mock API integration"* is satisfied by `mockData.js` — no artificial loading delays since they'd hurt the demo experience.
2. The global date range filter applies to all metrics, not just the transaction list. This makes it genuinely useful.
3. Budget data is pre-seeded so the Budgets page demonstrates value immediately.
4. The Financial Health Score is a frontend heuristic, not financial advice.
5. The day-of-week spending pattern uses data from actual mock transactions, not fabricated values.

---

## Design Decisions

**CSS Custom Properties over CSS-in-JS.** A single 40+ variable design system in `index.css` lets me switch themes with a single class toggle on `<html>`. No flash of unstyled content, no runtime overhead.

**useMemo on every derived value.** Totals, filtered lists, category breakdowns, budget usage percentages, health score — all wrapped with precise dependency arrays. Typing in the search box doesn't recompute the health score.

**Counter animation cache.** KPI numbers animate from 0 only on initial load. A module-level cache prevents the "slot machine" effect every time you navigate back to the Overview.

**DOM removal for RBAC.** Admin-only elements use `{isAdmin && ...}`, not `disabled` or `display: none`. This is the correct React pattern for role-based UI.

---

*Built by **Sri Sai Krishna** · April 2026*
