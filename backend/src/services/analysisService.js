import { fetchMlPrediction } from "./mlClient.js";

const CATEGORIES = [
  "Food",
  "Transport",
  "Subscriptions",
  "Shopping",
  "Healthcare",
  "Housing",
  "Transfer",
  "Income",
];

const computeHealthScore = (flaggedCount, categoryTotals, hasIncome) => {
  let score = 100;
  score -= flaggedCount * 5;

  const spendOnly = categoryTotals.filter((row) => row.category !== "Income");
  const totalSpend = spendOnly.reduce((sum, row) => sum + Number(row.total || 0), 0);

  if (totalSpend > 0) {
    const exceedsForty = spendOnly.some((row) => Number(row.total || 0) / totalSpend > 0.4);
    if (exceedsForty) score -= 10;
  }

  if (hasIncome) score += 10;
  return Math.min(100, Math.max(0, score));
};

const normalizeMlResponse = (mlData) => {
  const categorizedTransactions = mlData.categorizedTransactions || mlData.transactions || [];

  const flaggedTransactions =
    mlData.flaggedTransactions ||
    mlData.anomalies ||
    (Array.isArray(categorizedTransactions)
      ? categorizedTransactions.filter((t) => t.anomaly === true || t.isAnomaly === true)
      : []);

  const categoryTotals = mlData.categoryTotals || mlData.category_summary || [];
  const weeklyActual = mlData.weeklyActual || mlData.actual || mlData.weekly_spend || [];
  const forecast = mlData.forecast || [];

  if (!Array.isArray(categorizedTransactions)) {
    throw new Error("ML response missing transactions array");
  }
  if (!Array.isArray(forecast)) {
    throw new Error("ML response missing forecast array");
  }

  const resolvedCategoryTotals =
    categoryTotals.length > 0
      ? categoryTotals
      : CATEGORIES.map((category) => ({
          category,
          total: Number(
            categorizedTransactions
              .filter((t) => t.category === category)
              .reduce((sum, t) => sum + Math.abs(Number(t.amount) || 0), 0)
              .toFixed(2),
          ),
        })).filter((row) => row.total > 0);

  const healthScore =
    Number.isFinite(mlData.healthScore) && mlData.healthScore >= 0
      ? mlData.healthScore
      : Number.isFinite(mlData.health_score) && mlData.health_score >= 0
        ? mlData.health_score
        : computeHealthScore(
            flaggedTransactions.length,
            resolvedCategoryTotals,
            categorizedTransactions.some((t) => t.category === "Income"),
          );

  return {
    source: "ml",
    categorizedTransactions,
    flaggedTransactions,
    categoryTotals: resolvedCategoryTotals,
    weeklyActual,
    forecast,
    healthScore,
  };
};

export const analyzeTransactions = async (transactions) => {
  const mlData = await fetchMlPrediction(transactions);
  return normalizeMlResponse(mlData);
};
