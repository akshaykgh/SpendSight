# SpendSight (FinSafe) — Full Stack Transaction Insights

SpendSight (aka **FinSafe**) is a 3-part system that turns raw bank transactions (uploaded as a CSV) into:
- **Categorization** (merchant/description → category)
- **Anomaly / flagged spend detection**
- **Weekly actuals + 4-week forecast**
- **High-level “financial health” score**

The architecture is intentionally simple for a demo/hack-style environment: **in-memory job queue**, **CSV upload**, and a separate **ML inference service** the backend calls.

---

## Repo Layout

```
frontend/finsafe/   # React + Vite UI (CSV upload + dashboard)
backend/            # Node/Express API (upload endpoint + job queue + ML integration)
ml/                 # FastAPI ML service (/predict, /health)
docs/               # Project docs/notes (if any)
```

---

## Tech Stack

- **Frontend**: React + TypeScript + Vite (+ Tailwind + Recharts)
- **Backend**: Node.js (>= 20) + Express, `multer` upload, `csv-parser`, `axios`
- **ML service**: Python + FastAPI + pandas/numpy + scikit-learn

---

## Quickstart (Run Everything Locally)

You’ll run **three processes** in three terminals.

### 1) Start the ML service (FastAPI)

```bash
cd ml
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

- ML health check: `GET http://localhost:8000/health`

### 2) Start the backend (Express API)

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

- Backend health check: `GET http://localhost:<PORT>/api/health`

**Important**: The backend `PORT` defaults to **3000** if not set, and the ML service should be set to **8000**.

Recommended `.env` values (edit `backend/.env` after copying):

```env
PORT=8080
ML_SERVICE_URL=http://localhost:8000
ML_SERVICE_TIMEOUT_MS=10000
CORS_ORIGIN=*
API_RATE_LIMIT_WINDOW_MS=900000
API_RATE_LIMIT_MAX=100
JOB_QUEUE_CONCURRENCY=1
NODE_ENV=development
```

### 3) Start the frontend (Vite)

```bash
cd frontend/finsafe
npm install
npm run dev
```

Set the API base URL for local backend development using a Vite env var:

```env
VITE_API_BASE_URL=http://localhost:8080
```

Notes:
- The frontend code falls back to a hosted backend URL if `VITE_API_BASE_URL` is not set.
- Don’t commit `frontend/finsafe/.env` (it’s typically local-only).

---

## How It Works (High Level)

1. **Frontend** uploads a CSV to `POST /api/jobs/upload`
2. **Backend** enqueues a job, parses the CSV into normalized transactions
3. **Backend** calls ML: `POST ${ML_SERVICE_URL}/predict`
4. **Frontend** polls `GET /api/jobs/:jobId` until status is `completed`
5. **Dashboard** renders category totals, flagged/anomalous transactions, weekly spend, forecast, and health score

---

## Frontend (React) Details

- **Upload**: sends `multipart/form-data` with field name **`file`**
- **Polling**: hits `GET /api/jobs/:jobId` until `completed` (or `failed`)

Scripts (from `frontend/finsafe/package.json`):
- `npm run dev`
- `npm run build`
- `npm run preview`
- `npm run lint`

---

## Backend (Express API) Details

### Endpoints

- `GET /api/health`
- `POST /api/jobs/upload` (multipart form field: `file`)
- `GET /api/jobs/:jobId` (poll job)
- `GET /api/jobs/meta/queue` (queue snapshot)

### Upload constraints

- **File type**: CSV only
- **Size limit**: 5 MB
- **Storage**: written to `backend/uploads/`, then deleted after job completion/failure

### Job model (polling)

Statuses:
- `queued`
- `processing`
- `completed` (includes `result`)
- `failed` (includes `error`)

---

## CSV Format (What You Can Upload)

The backend CSV parser is flexible about headers and will try common variants.

### Required fields (per row)

- **Date** (any of): `date`, `transaction_date`, `posted_date`, `timestamp`, ...
- **Description** (any of): `description`, `merchant`, `memo`, `name`, ...
- **Amount** (any of): `amount`, `debit`, `value`, ...

### Notes

- Dates must be parseable by JavaScript `Date(...)`
- Amount supports `$`, `,`, whitespace, and parentheses for negatives (e.g. `($12.34)`)
- Rows missing a valid date/description/amount are skipped

---

## ML Service (FastAPI) Details

### Endpoints

- `GET /health` → `{ status, models, training_rows }`
- `POST /predict` → full analysis for a list of transactions

### Request shape

```json
{
  "transactions": [
    { "date": "2026-03-01T14:00:00.000Z", "description": "Walmart groceries", "amount": -93.1 }
  ]
}
```

### Response shape (key fields)

The ML service returns (at minimum) these keys used by the backend:
- `transactions` (categorized + enriched)
- `forecast`

Additional keys often returned and used/normalized by the backend:
- `category_summary` (→ backend `categoryTotals`)
- `weekly_spend` (→ backend `weeklyActual`)
- `health_score` (→ backend `healthScore`)

---

## Environment Variables Summary

### `backend/.env`

- `PORT`: backend port (suggest `8080`)
- `ML_SERVICE_URL`: ML base URL (suggest `http://localhost:8000`)
- `ML_SERVICE_TIMEOUT_MS`: ML request timeout
- `CORS_ORIGIN`: allowed origin(s), `*` for dev
- `API_RATE_LIMIT_*`: request rate limiting
- `JOB_QUEUE_CONCURRENCY`: parallel job workers (in-memory)

### `frontend/finsafe/.env` (Vite)

- `VITE_API_BASE_URL`: backend base URL for local dev (e.g. `http://localhost:8080`)

---

## Troubleshooting

- **Frontend uploads but polling fails**: ensure `VITE_API_BASE_URL` matches the backend `PORT`.
- **Jobs fail with ML errors**: ensure ML is running and `backend/.env` has `ML_SERVICE_URL=http://localhost:8000`.
- **CORS errors**: set `CORS_ORIGIN=*` for local dev (or your Vite dev server origin).
- **“No valid transactions found in CSV”**: verify your CSV has parseable date/amount + non-empty description.

---

## Security / Git Hygiene

- Do **not** commit real `.env` files (they may contain secrets or local-only values).
- Prefer `.env.example` files for documenting configuration (backend already includes one).
