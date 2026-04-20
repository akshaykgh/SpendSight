import { fmtCurrency } from "../constants";

interface Stats {
  totalSpend: number;
  totalIncome: number;
  anomalyCount: number;
  fraudCount: number;
  healthScore?: number;
}

const CARDS = [
  {
    key: "totalSpend",
    label: "Total Spending",
    icon: "💸",
    ring: "border-blue-500/20",
    bg: "bg-blue-500/10",
    val: "text-blue-400",
  },
  {
    key: "totalIncome",
    label: "Total Income",
    icon: "📈",
    ring: "border-green-500/20",
    bg: "bg-green-500/10",
    val: "text-green-400",
  },
  {
    key: "anomalyCount",
    label: "Anomalies Detected",
    icon: "⚠️",
    ring: "border-yellow-500/20",
    bg: "bg-yellow-500/10",
    val: "text-yellow-400",
  },
  {
    key: "fraudCount",
    label: "Fraud Signals",
    icon: "🚨",
    ring: "border-red-500/20",
    bg: "bg-red-500/10",
    val: "text-red-400",
  },
  {
    key: "healthScore",
    label: "Health Score",
    icon: "🧠",
    ring: "border-indigo-500/20",
    bg: "bg-indigo-500/10",
    val: "text-indigo-400",
  },
] as const;

export function SummaryCards({ stats }: { stats: Stats }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      {CARDS.map(({ key, label, icon, ring, bg, val }) => (
        <div key={key} className={`rounded-2xl border ${ring} ${bg} p-5`}>
          <span className="text-2xl mb-3 block">{icon}</span>
          <p className={`text-2xl font-bold ${val}`}>
            {key === "totalSpend" || key === "totalIncome"
              ? fmtCurrency(stats[key])
              : key === "healthScore"
                ? `${Math.round(stats.healthScore ?? 0)}/100`
                : String(stats[key])}
          </p>
          <p className="text-gray-500 text-sm mt-1">{label}</p>
        </div>
      ))}
    </div>
  );
}
