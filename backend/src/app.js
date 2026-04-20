import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";

import { env } from "./config/env.js";
import { jobsRouter } from "./routes/jobs.js";

const app = express();

app.set("trust proxy", 1);

app.use(express.json({ limit: "1mb" }));
app.use(cors({ origin: env.corsOrigin }));

app.use(
  rateLimit({
    windowMs: env.apiRateLimitWindowMs,
    limit: env.apiRateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

app.get("/", (_req, res) => {
  res.status(200).send("FinSafe backend is running");
});

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "finsafe-backend",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/jobs", jobsRouter);

app.use((err, _req, res, _next) => {
  console.error("Express error:", err);

  const status = err.status || 500;
  res.status(status).json({
    error: err.message || "Unexpected server error",
  });
});

export { app };