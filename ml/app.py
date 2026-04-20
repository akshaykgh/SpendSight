from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
from typing import List, Optional

from models.categorizer    import categorize_transactions, get_training_rows
from models.anomaly        import detect_anomalies
from models.merchant_risk  import compute_merchant_risk
from models.velocity_burst import detect_velocity_burst
from models.category_drift import detect_category_drift
from models.forecast       import forecast_spending
from utils.health_score    import compute_health_score


_MAX_TRANSACTIONS = 5_000
_DROP_COLS = [
    'date_parsed', 'date_only', 'hour', 'hour_parsed',
    'week', 'week_label', 'month', 'rolling_3day', 'day_offset', 'week_bucket'
]


@asynccontextmanager
async def lifespan(app: FastAPI):
    get_training_rows()   
    yield

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class Transaction(BaseModel):
    description: str
    amount: float
    date: Optional[str] = None


class PredictRequest(BaseModel):
    transactions: List[Transaction]


@app.get("/health")
def health():
    return {
        "status":        "ok",
        "models":        "loaded",
        "training_rows": get_training_rows()
    }


@app.post("/predict")
def predict(body: PredictRequest):
    try:
        data = [t.dict() for t in body.transactions]

        if not data:
            raise HTTPException(status_code=400, detail="No transactions provided")

        if len(data) > _MAX_TRANSACTIONS:
            raise HTTPException(
                status_code=400,
                detail=f"Too many transactions. Max allowed: {_MAX_TRANSACTIONS}"
            )

        df = pd.DataFrame(data)
        df.columns = df.columns.str.lower().str.strip()

        missing = [c for c in ['description', 'amount'] if c not in df.columns]
        if missing:
            raise HTTPException(status_code=400, detail=f"Missing required columns: {missing}")

        df['amount'] = (
            df['amount'].astype(str)
            .str.replace(r'[$,]', '', regex=True)
        )
        df['amount'] = pd.to_numeric(df['amount'], errors='coerce').fillna(0).abs()

        if 'date' not in df.columns or df['date'].isnull().all():
            df['date'] = pd.Timestamp.today()

        df = categorize_transactions(df)
        df = detect_anomalies(df)
        df = compute_merchant_risk(df)
        df = detect_velocity_burst(df)

        drift_alerts    = detect_category_drift(df)
        forecast        = forecast_spending(df)
        anomalies_count = int(df['anomaly'].sum())
        burst_count     = int(df['velocity_burst'].sum())
        health_score    = compute_health_score(df, anomalies_count, drift_alerts, burst_count)

        category_summary = (
            df[df['category'] != 'Income']
            .groupby('category')
            .agg(total=('amount', 'sum'), avg_confidence=('category_confidence', 'mean'))
            .round(2)
            .reset_index()
            .to_dict(orient='records')
        )

        df['date_parsed'] = pd.to_datetime(df['date'], errors='coerce')
        df['week_label']  = df['date_parsed'].dt.strftime('Week %W')
        weekly_spend = (
            df.groupby('week_label')['amount']
            .sum().round(2).reset_index()
            .rename(columns={'amount': 'total', 'week_label': 'week'})
            .to_dict(orient='records')
        )

        df = df.drop(columns=[c for c in _DROP_COLS if c in df.columns])
        df = df.where(pd.notna(df), other=None)

        return {
            "transactions":       df.to_dict(orient='records'),
            "category_summary":   category_summary,
            "weekly_spend":       weekly_spend,
            "forecast":           forecast,
            "drift_alerts":       drift_alerts,
            "health_score":       health_score,
            "anomalies_count":    anomalies_count,
            "burst_count":        burst_count,
            "total_transactions": len(df)
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
