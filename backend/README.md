# FinSafe Backend

Backend API service for FinSafe with:
- CSV upload endpoint
- Async job queue with polling
- Rate-limited API
- ML integration (`POST /predict`)

## Tech
- Node.js + Express
- `multer` + `csv-parser`
- In-memory async queue

## Run

```bash
cd /Users/akshaykumargh/Desktop/finsafe/backend
npm install
cp .env.example .env
npm run dev
```

Server runs on `http://localhost:8080` by default.

## Endpoints
- `GET /api/health`
- `POST /api/jobs/upload` (multipart form field: `file`)
- `GET /api/jobs/:jobId`
- `GET /api/jobs/meta/queue`

## ML Contract
Backend calls:
- `POST ${ML_SERVICE_URL}/predict`

Request body:

```json
{
  "transactions": [
    {
      "date": "2026-03-01T14:00:00.000Z",
      "description": "Walmart groceries",
      "amount": -93.1
    }
  ]
}
```

Expected response (minimum):

```json
{
  "categorizedTransactions": [],
  "flaggedTransactions": [],
  "forecast": []
}
```

Optional response keys supported:
- `categoryTotals`
- `weeklyActual`
- `healthScore`

If ML is down or response shape is incompatible, job processing fails.

## Notes
- Queue and jobs are in-memory (suitable for hack/demo environment).
- Uploaded CSVs are deleted after job completion/failure.
- To productionize: swap in Redis + durable job store + object storage.
