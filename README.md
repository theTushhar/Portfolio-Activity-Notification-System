# Portfolio Activity & Notification System

Mini microservices-based system using **Express + React (Vite)**.

## 1. Architecture

### Services
- **API Gateway** (`api-gateway`, port `3000`)
  - Single entry point
  - Proxies requests to backend services
  - CORS, Helmet, rate limiting, request logging

- **Portfolio Service** (`portfolio-service`, port `3001`)
  - Handles transaction creation and fetch
  - Persists transactions in PostgreSQL
  - Publishes `transaction.created` events to RabbitMQ
  - Supports idempotency via `Idempotency-Key`

- **Notification Service** (`notification-service`, port `3002`)
  - Consumes transaction events from RabbitMQ
  - Applies user preference rules
  - Sends email notifications with retry/backoff
  - Persists notification status in PostgreSQL
  - Caches preferences in Redis

- **UI** (`ui`, port `3003`)
  - React + Vite frontend for transactions and preferences

### Infrastructure
- RabbitMQ (event broker)
- Two PostgreSQL DBs (database-per-service)
- Redis (preference cache)
- Docker Compose for local orchestration

## 2. Assessment Mapping

### Core requirements
- API Gateway service: ✅
- Portfolio service: ✅
- Notification service: ✅
- Event-driven communication: ✅ RabbitMQ topic exchange
- Database persistence: ✅ PostgreSQL + TypeORM
- Background/async processing: ✅ RabbitMQ consumer
- Error handling & retry: ✅ API/service error handling + exponential retry for email
- Structured logging: ✅ Winston JSON logs

### Bonus implemented
- Message queue integration: ✅ RabbitMQ
- Caching layer: ✅ Redis for preferences
- Docker Compose setup: ✅
- CI/CD pipeline: ✅ GitHub workflows in `.github/workflows`

### Bonus not implemented
- Distributed tracing: ❌
- Authentication/authorization: ❌

## 3. Tradeoffs Considered

- **Simple Express services over framework-heavy setup**
  - Faster to build and easier to explain for assessment.
  - Tradeoff: less built-in structure than full framework patterns.

- **At-least-once style event processing with idempotency**
  - Reliable and practical for this use case.
  - Tradeoff: needs deduplication logic (`transactionId`/`idempotencyKey`).

- **`synchronize` controlled by env (`DB_SYNC`)**
  - Easy local setup.
  - Tradeoff: for production, migrations are preferred.

## 4. Scalability Considerations

- API gateway and each service can scale independently.
- Event-driven decoupling allows adding new consumers without changing portfolio service.
- Queue buffering helps smooth traffic spikes.
- Redis reduces DB reads for preference lookups.
- DB-per-service isolates ownership and reduces cross-service contention.

## 5. Run Locally

## Prerequisites
- Docker + Docker Compose
- Node.js 20+

## Steps
1. Create env file at repo root:
```bash
cp .env.example .env
```
2. Fill `REDIS_URL` and `REDIS_TOKEN` in `.env`.
3. Start backend stack:
```bash
docker-compose up -d --build
```
4. Start UI:
```bash
cd ui
npm ci
npm run dev
```
5. Open UI:
- `http://localhost:3003`

## 6. API Endpoints

- `POST /api/portfolio/transactions`
- `GET /api/portfolio/transactions/user/:userId`
- `PUT /api/notifications/preferences/:userId`
- `GET /api/notifications/preferences/:userId`
- `GET /health`

## Example request
```bash
curl -X POST http://localhost:3000/api/portfolio/transactions \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: tx-001" \
  -d '{
    "userId": "user-123",
    "assetSymbol": "AAPL",
    "type": "BUY",
    "quantity": 10,
    "price": 150
  }'
```

## 7. Notes

- Failed message processing is routed to a DLQ (`notification.transaction.created.dlq`).
- SMTP is optional locally; if not configured, email sending is skipped with a warning log.
