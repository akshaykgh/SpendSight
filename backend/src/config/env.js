import dotenv from "dotenv";

dotenv.config();

const toNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: toNumber(process.env.PORT, 3000),
  corsOrigin: process.env.CORS_ORIGIN || "*",
  apiRateLimitWindowMs: toNumber(process.env.API_RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
  apiRateLimitMax: toNumber(process.env.API_RATE_LIMIT_MAX, 100),
  mlServiceUrl: process.env.ML_SERVICE_URL || "http://localhost:8000",
  mlServiceTimeoutMs: toNumber(process.env.ML_SERVICE_TIMEOUT_MS, 10_000),
  queueConcurrency: Math.max(1, toNumber(process.env.JOB_QUEUE_CONCURRENCY, 1)),
};