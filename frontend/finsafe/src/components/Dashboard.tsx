import { useState, useMemo } from 'react';
import type { JobResult } from '../types';
import { fmtCurrency } from '../constants';
import { SummaryCards } from './SummaryCards';
import { CategoryChart } from './CategoryChart';
import { SpendingOverTimeChart } from './SpendingOverTimeChart';
import { TransactionTable } from './TransactionTable';
import { FlaggedPanel } from './FlaggedPanel';

interface Props {
  result: JobResult;
  jobId: string;
  onReset: () => void;
}

type Tab = 'overview' | 'transactions' | 'flagged';

export function Dashboard({ result, jobId, onReset }: Props) {
  const [tab, setTab] = useState<Tab>('overview');

  const stats = useMemo(() => {
    const txs = result.categorizedTransactions;
    const totalSpend  = txs.filter(t => t.category !== 'Income').reduce((s, t) => s + t.amount, 0);
    const totalIncome = txs.filter(t => t.category === 'Income').reduce((s, t) => s + t.amount, 0);
    const fraudCount  = txs.filter(t => !!t.fraud_signal).length;

    const categoryMap: Record<string, number> = {};
    txs.forEach(t => {
      if (t.category !== 'Income')
        categoryMap[t.category] = (categoryMap[t.category] ?? 0) + t.amount;
    });

    return {
      totalSpend, totalIncome,
      anomalyCount: result.flaggedTransactions.length,
      fraudCount,
      healthScore: result.healthScore,
      categoryMap,
    };
  }, [result]);

  const summaryText = useMemo(() => {
    const topCategoryEntry = Object.entries(stats.categoryMap)
      .sort((a, b) => b[1] - a[1])[0];
    const topCategory = topCategoryEntry?.[0] ?? 'N/A';
    const topCategorySpend = topCategoryEntry?.[1] ?? 0;
    const net = stats.totalIncome - stats.totalSpend;
    const netDirection = net >= 0 ? 'surplus' : 'deficit';

    return `FinSafe analyzed ${result.transactionCount} transactions. Total spending is ${fmtCurrency(
      stats.totalSpend,
    )} against income of ${fmtCurrency(stats.totalIncome)}, resulting in a ${netDirection} of ${fmtCurrency(
      Math.abs(net),
    )}. Your highest spending category is ${topCategory} (${fmtCurrency(
      topCategorySpend,
    )}), with ${stats.anomalyCount} anomaly flags and ${stats.fraudCount} fraud signals detected.`;
  }, [result.transactionCount, stats]);

  const TABS: { key: Tab; label: string; count?: number }[] = [
    { key: 'overview',      label: 'Overview' },
    { key: 'transactions',  label: 'All Transactions', count: result.transactionCount },
    { key: 'flagged',       label: 'Flagged',          count: result.flaggedTransactions.length },
  ];

  return (
    <div className="min-h-screen bg-[#0f1117]">
      {}
      <header className="border-b border-gray-800 bg-[#0f1117]/90 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <p className="text-white font-semibold text-sm">Transaction Analysis</p>
              <p className="text-gray-500 text-xs font-mono">{jobId.slice(0, 8)}…</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 text-green-400 text-xs border border-green-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
              Completed · {result.transactionCount} transactions
            </span>
            <button onClick={onReset}
              className="text-sm text-gray-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors">
              ↑ New Upload
            </button>
          </div>
        </div>

        {}
        <div className="max-w-7xl mx-auto px-6 flex gap-1 border-t border-gray-800/50">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                tab === t.key
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}>
              {t.label}
              {t.count !== undefined && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  tab === t.key ? 'bg-indigo-500/20 text-indigo-400' : 'bg-gray-800 text-gray-500'
                }`}>{t.count}</span>
              )}
            </button>
          ))}
        </div>
      </header>

      {}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {tab === 'overview' && (
          <div className="space-y-6">
            <section className="rounded-2xl border border-indigo-500/20 bg-indigo-500/10 p-5">
              <h3 className="text-white text-xl font-extrabold tracking-tight mb-1">
                Spending Summary
              </h3>
              <p className="text-indigo-100/90 text-sm leading-relaxed">{summaryText}</p>
            </section>
            <SummaryCards stats={stats} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CategoryChart categoryMap={stats.categoryMap} />
              <FlaggedPanel transactions={result.flaggedTransactions} compact />
            </div>
            <SpendingOverTimeChart
              weeklyActual={result.weeklyActual}
              forecast={result.forecast}
            />
          </div>
        )}
        {tab === 'transactions' && (
          <TransactionTable transactions={result.categorizedTransactions} />
        )}
        {tab === 'flagged' && (
          <FlaggedPanel transactions={result.flaggedTransactions} />
        )}
      </main>
    </div>
  );
}
