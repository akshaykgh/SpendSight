export type MerchantRisk = 'Familiar' | 'Infrequent' | 'Medium Risk' | 'High Risk';
export type JobStatus = 'queued' | 'processing' | 'completed' | 'failed';

export interface Transaction {
  amount: number;
  anomaly: boolean;
  anomaly_reason: string;
  anomaly_score: number;
  category: string;
  category_confidence: number;
  date: string;
  description: string;
  fraud_signal: string;
  merchant_risk: MerchantRisk;
  velocity_burst: boolean;
  velocity_burst_msg: string;
}

export interface WeeklyActualPoint {
  week: string;
  total: number;
}

export interface ForecastPoint {
  week: string;
  forecast: number;
}

export interface JobResult {
  transactionCount: number;
  source: string;
  categorizedTransactions: Transaction[];
  flaggedTransactions: Transaction[];
  healthScore?: number;
  weeklyActual?: WeeklyActualPoint[];
  forecast?: ForecastPoint[];
}

export interface JobResponse {
  jobId: string;
  status: JobStatus;
  createdAt?: string;
  updatedAt?: string;
  result?: JobResult;
  error?: string;
  pollUrl?: string;
}
