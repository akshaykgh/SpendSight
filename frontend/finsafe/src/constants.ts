export const PALETTE = ['#6366f1','#8b5cf6','#a78bfa','#22c55e','#f59e0b','#ef4444','#06b6d4','#ec4899','#f97316','#84cc16'];

export const CAT_DOT: Record<string, string> = {
  'Food & Dining': '#f97316', 'Shopping & Retail': '#a78bfa',
  'Transportation': '#06b6d4', 'Healthcare & Medical': '#22c55e',
  'Entertainment & Recreation': '#ec4899', 'Utilities & Services': '#64748b',
  'Income': '#4ade80', 'Rent & Mortgage': '#ef4444', 'Financial Services': '#f59e0b',
};

export const RISK_STYLE: Record<string, string> = {
  'Familiar':    'bg-green-500/10 text-green-400 border-green-500/20',
  'Infrequent':  'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  'Medium Risk': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  'High Risk':   'bg-red-500/10 text-red-400 border-red-500/20',
};

export const fmtCurrency = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

export const fmtShort = (n: number) => n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n.toFixed(0)}`;

export const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

export const fmtTime = (d: string) =>
  new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
