import fs from "fs/promises";
import path from "path";

import { env } from "../config/env.js";
import { analyzeTransactions } from "./analysisService.js";
import { parseTransactionsCsv } from "./csvParser.js";

const jobs = new Map();
const queue = [];
let activeWorkers = 0;

const safeUnlink = async (filePath) => {
  try {
    await fs.unlink(filePath);
  } catch (_error) {
    // Ignore file cleanup failures.
  }
};

const processJob = async (jobId) => {
  const job = jobs.get(jobId);
  if (!job) return;

  job.status = "processing";
  job.updatedAt = new Date().toISOString();

  try {
    const transactions = await parseTransactionsCsv(job.filePath);
    if (transactions.length === 0) {
      throw new Error("No valid transactions found in CSV");
    }

    const analysis = await analyzeTransactions(transactions);

    job.status = "completed";
    job.updatedAt = new Date().toISOString();
    job.result = {
      transactionCount: transactions.length,
      ...analysis,
    };
    await safeUnlink(job.filePath);
  } catch (error) {
    job.status = "failed";
    job.updatedAt = new Date().toISOString();
    job.error = error.message || "Job processing failed";
    await safeUnlink(job.filePath);
  }
};

const runNext = async () => {
  if (activeWorkers >= env.queueConcurrency || queue.length === 0) return;

  activeWorkers += 1;
  const nextJobId = queue.shift();

  try {
    await processJob(nextJobId);
  } finally {
    activeWorkers -= 1;
    if (queue.length > 0) {
      void runNext();
    }
  }
};

export const enqueueJob = ({ jobId, filePath, originalFileName }) => {
  jobs.set(jobId, {
    jobId,
    filePath: path.resolve(filePath),
    originalFileName,
    status: "queued",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  queue.push(jobId);
  void runNext();
};

export const getJob = (jobId) => jobs.get(jobId);

export const getQueueSnapshot = () => ({
  queuedCount: queue.length,
  activeWorkers,
  totalJobs: jobs.size,
});
