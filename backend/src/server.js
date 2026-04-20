import { app } from "./app.js";
import { env } from "./config/env.js";

process.on("SIGTERM", () => {
  console.error("Received SIGTERM from platform");
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
});

console.log("NODE_ENV =", env.nodeEnv);
console.log("PORT =", env.port);
console.log("ML_SERVICE_URL =", env.mlServiceUrl);

app.listen(env.port, "0.0.0.0", () => {
  console.log(`FinSafe backend listening on port ${env.port}`);
});