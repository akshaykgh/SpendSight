import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { PALETTE, fmtShort } from "../constants";

const Tooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload?: { percent?: number } }>;
}) => {
  if (!active || !payload?.length) return null;
  const percent = payload[0].payload?.percent ?? 0;
  return (
    <div
      style={{
        background: "#1a1d27",
        border: "1px solid #374151",
        borderRadius: 8,
        padding: "8px 12px",
        fontSize: 12,
        color: "#fff",
      }}
    >
      <p style={{ margin: 0, color: "#9ca3af" }}>{payload[0].name}</p>
      <p style={{ margin: "4px 0 0", fontWeight: 600 }}>
        {fmtShort(payload[0].value)} ({percent.toFixed(1)}%)
      </p>
    </div>
  );
};

export function CategoryChart({
  categoryMap,
}: {
  categoryMap: Record<string, number>;
}) {
  const baseData = Object.entries(categoryMap)
    .filter(([k]) => k !== "Income")
    .sort((a, b) => b[1] - a[1]);

  const total = baseData.reduce((sum, [, value]) => sum + value, 0);
  const data = baseData
    .map(([name, value], i) => ({
      name,
      value,
      percent: total > 0 ? (value / total) * 100 : 0,
      color: PALETTE[i % PALETTE.length],
    }));

  return (
    <div className="bg-[#1a1d27] rounded-2xl border border-gray-800 p-5 inline-block w-full">
      {}
      <h3 className="text-white text-xl font-extrabold tracking-tight mb-0.5">
        Spending by Category
      </h3>
      <p className="text-gray-500 text-xs mb-3">Excludes income transactions</p>

      {}
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={95}
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((e, i) => (
              <Cell key={i} fill={e.color} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>

      {}
      <div className="flex flex-wrap gap-x-2 gap-y-1.5 justify-center mt-3">
        {data.map((e, i) => (
          <div key={i} className="flex items-center gap-1">
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: e.color }}
            />
            <span className="text-gray-400 text-xs">
              {e.name} ({e.percent.toFixed(1)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}