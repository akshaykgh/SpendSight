import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { fmtShort } from "../constants";
import type { ForecastPoint, WeeklyActualPoint } from "../types";

interface Props {
  weeklyActual?: WeeklyActualPoint[];
  forecast?: ForecastPoint[];
}

interface ChartRow {
  label: string;
  actual: number | null;
  forecast: number | null;
  isToday?: boolean;
}

const normalizeNumber = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

export function SpendingOverTimeChart({ weeklyActual = [], forecast = [] }: Props) {
  const actualRows = weeklyActual.map((w) => ({
    label: w.week || "Past",
    actual: normalizeNumber(w.total),
    forecast: null,
  }));

  const forecastRows = forecast.map((f, idx) => ({
    label: f.week || `Week +${idx + 1}`,
    actual: null,
    forecast: normalizeNumber(f.forecast),
  }));

  const data: ChartRow[] = [
    ...actualRows,
    { label: "Today", actual: null, forecast: null, isToday: true },
    ...forecastRows,
  ];

  const hasActual = actualRows.length > 0;
  const hasForecast = forecastRows.length > 0;

  return (
    <div className="bg-[#1a1d27] rounded-2xl border border-gray-800 p-5">
      <h3 className="text-white text-xl font-extrabold tracking-tight mb-0.5">
        Spending Over Time
      </h3>
      <p className="text-gray-500 text-xs mb-3">
        Solid line = weekly actuals, dashed amber = 4-week forecast
      </p>

      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 26, right: 8, left: -16, bottom: 8 }}>
          <CartesianGrid stroke="#374151" strokeOpacity={0.3} vertical={false} />
          <XAxis dataKey="label" tick={{ fill: "#9ca3af", fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis
            tickFormatter={(v) => fmtShort(Number(v))}
            tick={{ fill: "#9ca3af", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={54}
          />
          <Tooltip
            contentStyle={{
              background: "#111827",
              border: "1px solid #374151",
              borderRadius: 10,
              color: "#fff",
              fontSize: 12,
            }}
            formatter={(
              value: number | string | ReadonlyArray<number | string> | undefined,
              name: string | number | undefined,
            ) => {
              const label = String(name ?? "");
              if (value === undefined) return ["-", label] as [string, string];
              const raw = Array.isArray(value) ? value[0] : value;
              const num = Number(raw);
              if (!Number.isFinite(num)) return ["-", label] as [string, string];
              return [fmtShort(num), label === "actual" ? "Actual" : "Forecast"] as [string, string];
            }}
          />
          <ReferenceLine
            x="Today"
            stroke="#94a3b8"
            strokeDasharray="4 4"
            label={{ value: "Today", fill: "#cbd5e1", fontSize: 11, position: "insideTop", dy: -4 }}
          />
          <Line
            type="monotone"
            dataKey="actual"
            stroke="#60a5fa"
            strokeWidth={3}
            dot={{ r: 3, fill: "#60a5fa" }}
            connectNulls={false}
            hide={!hasActual}
          />
          <Line
            type="monotone"
            dataKey="forecast"
            stroke="#f59e0b"
            strokeDasharray="7 5"
            strokeWidth={3}
            dot={{ r: 3, fill: "#f59e0b" }}
            connectNulls={false}
            hide={!hasForecast}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
