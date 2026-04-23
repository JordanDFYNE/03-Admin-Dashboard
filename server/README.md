# Warehouse Backend

## Local setup

1. Copy `.env.example` to `.env`
2. Install dependencies with `npm install`
3. Run migrations with `npm run migrate`
4. Seed from the CSV files with `npm run seed`
5. Start the API with `npm run dev`

## Main endpoints

- `GET /api/health`
- `POST /api/auth/google`
- `GET /api/consumables`
- `GET /api/consumables/summary`
- `GET /api/inventory/balances`
- `POST /api/inventory/movements`
- `POST /api/imports/consumables`
- `POST /api/imports/weekly-checks`
- `GET /api/reports/overview`
- `GET /api/barcodes/lookup/:barcodeValue`

## Cloud Run target

- Service: `warehouse-backend`
- Region: `europe-west2`
- Cloud SQL instance: `checkout-tracking-app:europe-west2:store-migration-db`
- Secrets: `warehouse-database-url`, `warehouse-jwt-secret`
