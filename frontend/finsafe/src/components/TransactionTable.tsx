import { useState, useMemo } from "react";
import clsx from "clsx";
import { Badge } from "./Badge";
import { CAT_DOT, fmtDate, fmtTime } from "../constants";
import type { Transaction } from "../types";

const PAGE = 20;
type SortKey =
  | "date"
  | "amount"
  | "category"
  | "merchant_risk"
  | "category_confidence";

const riskVariant = (r: string) =>
  (
    ({
      "High Risk": "red",
      "Medium Risk": "orange",
      Infrequent: "yellow",
      Familiar: "gray",
    }) as const
  )[r] ?? "gray";

function Th({
  label,
  k,
  sortKey,
  sortDir,
  onSort,
}: {
  label: string;
  k: SortKey;
  sortKey: SortKey;
  sortDir: "asc" | "desc";
  onSort: (k: SortKey) => void;
}) {
  return (
    <th
      onClick={() => onSort(k)}
      className="px-4 py-3 text-left font-medium cursor-pointer hover:text-gray-300 whitespace-nowrap select-none"
    >
      {label}
      <span
        className={clsx(
          "ml-1 text-xs",
          sortKey === k ? "text-indigo-400" : "text-gray-700",
        )}
      >
        {sortKey === k ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
      </span>
    </th>
  );
}

export function TransactionTable({
  transactions,
}: {
  transactions: Transaction[];
}) {
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("All");
  const [filter, setFilter] = useState<"all" | "anomaly" | "clean">("all");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(0);

  const categories = useMemo(
    () => [
      "All",
      ...Array.from(new Set(transactions.map((t) => t.category))).sort(),
    ],
    [transactions],
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return [...transactions]
      .filter(
        (t) =>
          !q ||
          t.description.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q),
      )
      .filter((t) => cat === "All" || t.category === cat)
      .filter(
        (t) =>
          filter === "all" || (filter === "anomaly" ? t.anomaly : !t.anomaly),
      )
      .sort((a, b) => {
        const c =
          a[sortKey] < b[sortKey] ? -1 : a[sortKey] > b[sortKey] ? 1 : 0;
        return sortDir === "asc" ? c : -c;
      });
  }, [transactions, search, cat, filter, sortKey, sortDir]);

  const totalPages = Math.ceil(filtered.length / PAGE);
  const rows = filtered.slice(page * PAGE, (page + 1) * PAGE);

  const toggleSort = (k: SortKey) => {
    if (k === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(k);
      setSortDir("desc");
    }
    setPage(0);
  };

  const thProps = { sortKey, sortDir, onSort: toggleSort };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder="Search by description, category…"
            className="w-full pl-9 pr-4 py-2 bg-[#1a1d27] border border-gray-700 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
        <select
          value={cat}
          onChange={(e) => {
            setCat(e.target.value);
            setPage(0);
          }}
          className="px-3 py-2 bg-[#1a1d27] border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
        >
          {categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <div className="flex rounded-xl border border-gray-700 overflow-hidden text-sm">
          {(["all", "clean", "anomaly"] as const).map((f) => (
            <button
              key={f}
              onClick={() => {
                setFilter(f);
                setPage(0);
              }}
              className={clsx(
                "px-3 py-2 capitalize transition-colors",
                filter === f
                  ? "bg-indigo-600 text-white"
                  : "bg-[#1a1d27] text-gray-400 hover:text-white",
              )}
            >
              {f}
            </button>
          ))}
        </div>
        <span className="text-gray-500 text-xs ml-auto">
          {filtered.length} results
        </span>
      </div>

      <div className="bg-[#1a1d27] rounded-2xl border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-800 text-gray-500 text-xs">
              <tr>
                <Th label="Date" k="date" {...thProps} />
                <th className="px-4 py-3 text-left font-medium">Description</th>
                <Th label="Category" k="category" {...thProps} />
                <Th label="Amount" k="amount" {...thProps} />
                <Th label="Risk" k="merchant_risk" {...thProps} />
                <Th label="Confidence" k="category_confidence" {...thProps} />
                <th className="px-4 py-3 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((tx, i) => (
                <tr
                  key={i}
                  className={clsx(
                    "border-b border-gray-800/50 hover:bg-white/[0.015] transition-colors",
                    tx.anomaly && "bg-yellow-500/[0.04]",
                  )}
                >
                  <td className="px-4 py-3 text-gray-400 whitespace-nowrap text-xs font-mono">
                    {fmtDate(tx.date)}
                    <span className="block text-gray-600">
                      {fmtTime(tx.date)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white font-medium max-w-[200px]">
                    <span className="block truncate">{tx.description}</span>
                    {tx.fraud_signal && (
                      <span className="block text-xs text-red-400 mt-0.5 truncate">
                        🚨 {tx.fraud_signal}
                      </span>
                    )}
                    {tx.velocity_burst && (
                      <span className="block text-xs text-orange-400 mt-0.5">
                        ⚡ {tx.velocity_burst_msg}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="flex items-center gap-1.5 text-xs text-gray-300">
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{
                          background: CAT_DOT[tx.category] ?? "#6b7280",
                        }}
                      />
                      {tx.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono whitespace-nowrap">
                    <span
                      className={
                        tx.category === "Income"
                          ? "text-green-400"
                          : "text-white"
                      }
                    >
                      {tx.category === "Income" ? "+" : "-"}$
                      {tx.amount.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={riskVariant(tx.merchant_risk)}>
                      {tx.merchant_risk}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 min-w-[80px]">
                      <div className="flex-1 bg-gray-800 rounded-full h-1.5">
                        <div
                          className="h-1.5 rounded-full bg-indigo-500"
                          style={{ width: `${tx.category_confidence}%` }}
                        />
                      </div>
                      <span className="text-gray-500 text-xs w-8 text-right">
                        {tx.category_confidence.toFixed(0)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={tx.anomaly ? "yellow" : "green"}>
                      {tx.anomaly ? "Anomaly" : "Normal"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-800">
            <span className="text-gray-500 text-xs">
              Showing {page * PAGE + 1}–
              {Math.min((page + 1) * PAGE, filtered.length)} of{" "}
              {filtered.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 text-xs rounded-lg bg-gray-800 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                ← Prev
              </button>
              <span className="text-gray-600 text-xs px-1">
                {page + 1} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 text-xs rounded-lg bg-gray-800 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
