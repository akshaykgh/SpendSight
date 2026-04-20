import clsx from "clsx";
import { Badge } from "./Badge";
import { fmtDate } from "../constants";
import type { Transaction } from "../types";

const riskVariant = (r: string) =>
  (
    ({
      "High Risk": "red",
      "Medium Risk": "orange",
      Infrequent: "yellow",
      Familiar: "gray",
    }) as const
  )[r] ?? "gray";

function TxCard({ tx }: { tx: Transaction }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-yellow-500/5 border border-yellow-500/10 hover:bg-yellow-500/10 transition-colors">
      <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center flex-shrink-0">
        ⚠️
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-white text-sm font-medium truncate">
              {tx.description}
            </p>
            <p className="text-gray-500 text-xs">{tx.category}</p>
          </div>
          <span className="text-yellow-400 font-mono text-sm font-semibold whitespace-nowrap">
            ${tx.amount.toFixed(2)}
          </span>
        </div>
        <p className="text-yellow-400/70 text-xs mt-1.5 bg-yellow-900/20 rounded px-2 py-1">
          {tx.anomaly_reason}
        </p>
        <div className="flex flex-wrap gap-2 mt-2 items-center">
          <span className="text-gray-600 text-xs">{fmtDate(tx.date)}</span>
          <Badge variant={riskVariant(tx.merchant_risk)}>
            {tx.merchant_risk}
          </Badge>
          {tx.fraud_signal && <Badge variant="red">🚨 {tx.fraud_signal}</Badge>}
          {tx.velocity_burst && (
            <Badge variant="orange">⚡ Velocity Burst</Badge>
          )}
        </div>
      </div>
    </div>
  );
}

export function FlaggedPanel({
  transactions,
  compact,
}: {
  transactions: Transaction[];
  compact?: boolean;
}) {
  const list = compact ? transactions.slice(0, 6) : transactions;
  return (
    <div
      className={clsx(
        "bg-[#1a1d27] rounded-2xl border border-gray-800",
        compact ? "p-6" : "",
      )}
    >
      <div
        className={clsx(
          "flex items-center justify-between mb-4",
          !compact && "p-6 border-b border-gray-800",
        )}
      >
        {compact ? (
          <>
            <h3 className="text-white text-xl font-extrabold tracking-tight">
              Recent Anomalies
            </h3>
            <Badge variant="yellow">{transactions.length} total</Badge>
          </>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-yellow-500/10 flex items-center justify-center text-lg">
              ⚠️
            </div>
            <div>
              <h3 className="text-white text-xl font-extrabold tracking-tight">
                Flagged Transactions
              </h3>
              <p className="text-gray-500 text-sm">
                {transactions.length} anomalies detected
              </p>
            </div>
          </div>
        )}
      </div>
      <div className={clsx("space-y-2", !compact && "p-6")}>
        {list.length === 0 ? (
          <div className="text-center py-10 text-gray-600">
            <p className="text-4xl mb-3">✅</p>
            <p className="text-sm">No anomalies detected</p>
          </div>
        ) : (
          list.map((tx, i) => <TxCard key={i} tx={tx} />)
        )}
      </div>
    </div>
  );
}
