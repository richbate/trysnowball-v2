# CP-5 API Worker

Clean, modular Cloudflare Worker rebuild for CP-5 Goals & Challenges backend.

## 🗂 Structure

```
/workers/
  index.ts           → Main router (no frameworks)
  goals.ts           → CP-5 Goals endpoints
  utils/
    json.ts          → Response helpers
    auth.ts          → JWT user extraction
  migrations/
    001_create_goals.sql → D1 goals table
  wrangler.toml      → Worker configuration
  test-api.sh        → API testing script
```

## 🚀 Setup

1. **Install dependencies**
   ```bash
   cd workers
   npm install
   ```

2. **Configure database**
   ```bash
   # Update wrangler.toml with your D1 database ID
   # Run migration
   npm run db:migrate
   ```

3. **Set JWT secret**
   ```bash
   wrangler secret put JWT_SECRET
   ```

4. **Start development**
   ```bash
   npm run dev
   ```

## 🛠 API Endpoints

### Goals Management

- `GET /api/v2/goals` - List user's active goals
- `POST /api/v2/goals` - Create new goal
- `PATCH /api/v2/goals/:id` - Update goal progress
- `DELETE /api/v2/goals/:id` - Dismiss goal

### Health Check

- `GET /health` - Service status

## 🔐 Authentication

All CP-5 endpoints require JWT authentication:
```
Authorization: Bearer <jwt-token>
```

User ID extracted from JWT claims: `sub`, `user_id`, or `userId`

## 🧪 Testing

```bash
# Run test script (update API_BASE and TEST_TOKEN)
./test-api.sh
```

## 📚 Goal Schema

```typescript
interface Goal {
  id: string;
  user_id: string;
  type: 'debt_clear' | 'interest_saved' | 'time_saved';
  target_value: number;
  current_value?: number;
  forecast_debt_id?: string;
  created_at: string;
  completed_at?: string;
  dismissed: number; // 0 = active, 1 = dismissed
}
```

## 📦 Response Format

Success:
```json
{
  "status": "ok",
  "data": { ... }
}
```

Error:
```json
{
  "status": "error",
  "message": "Error description"
}
```

## 🚫 No Frameworks

- No Hono, no itty-router
- Simple, transparent routing
- Easy to debug and deploy
- Minimal dependencies