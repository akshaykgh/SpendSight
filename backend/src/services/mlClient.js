import axios from "axios";

import { env } from "../config/env.js";

const client = axios.create({
  baseURL: env.mlServiceUrl,
  timeout: env.mlServiceTimeoutMs,
});

export const fetchMlPrediction = async (transactions) => {
  try {
    const response = await client.post("/predict", { transactions });
    return response.data;
  } catch (error) {
    const status = error?.response?.status;
    const mlError =
      error?.response?.data?.error ||
      error?.response?.data?.message ||
      error?.message ||
      "ML request failed";
    const enriched = new Error(status ? `ML ${status}: ${mlError}` : mlError);
    throw enriched;
  }
};
