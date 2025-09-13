
/docs/CP-3_FOUNDATION.md

# CP-3: Foundation Locked — Backend, D1, Encryption

## Purpose
Provide a production-grade backend for TrySnowball with persistent debt storage, proper authentication, and encryption. This replaces local mocks and makes the platform operational.

---

## Schema

### Debts Table
```sql
CREATE TABLE debts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  amount REAL NOT NULL,        -- £ balance
  apr REAL NOT NULL,           -- % APR
  min_payment REAL NOT NULL,   -- £ minimum monthly
  order_index INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_debts_user_id ON debts(user_id);

Constraints
	•	amount >= 0
	•	apr BETWEEN 0 AND 100
	•	min_payment > 0
	•	order_index >= 0

⸻

API Contracts

Base URL: /api/v2/debts
	•	GET /debts
	•	Auth: JWT required
	•	Returns: UKDebt[]
	•	POST /debts
	•	Auth: JWT required
	•	Body: { name, amount, apr, min_payment, order_index }
	•	Returns: created UKDebt
	•	PATCH /debts/:id
	•	Auth: JWT required
	•	Updates debt fields
	•	Returns: updated UKDebt
	•	DELETE /debts/:id
	•	Auth: JWT required
	•	Returns: { success: true }

⸻

Authentication
	•	Magic Link → JWT flow (already spec’d in CP-0/CP-1).
	•	Each JWT contains user_id.
	•	API endpoints must reject unauthenticated requests with 401 Unauthorized.

⸻

Encryption
	•	Worker-based encryption service (Cloudflare Worker or KV binding).
	•	Fields to encrypt at rest: name, amount, apr, min_payment.
	•	Strategy:
	•	Encrypt before writing to D1.
	•	Decrypt after reading from D1.
	•	Keys stored securely via Cloudflare Secrets.

⸻

Golden Tests
	1.	CRUD Roundtrip
	•	Create → Fetch → Update → Delete → Fetch (empty).
	2.	Auth Isolation
	•	User A cannot fetch User B’s debts.
	3.	Encryption
	•	Raw D1 row is encrypted, decrypted transparently in API.
	4.	Validation
	•	Negative APR rejected.
	•	Zero min_payment rejected.

---

# `/tasks/CP-3_TASKS.md`

```md
# CP-3 Task List — Foundation Locked

## Database
- [ ] Create D1 database + apply debts table migration
- [ ] Verify schema constraints (amount >= 0, apr 0–100, min_payment > 0)

## Backend
- [ ] Implement Cloudflare Worker at `/api/v2/debts`
- [ ] Add routes:
  - [ ] GET /debts (list all for user)
  - [ ] POST /debts (create debt)
  - [ ] PATCH /debts/:id (update debt)
  - [ ] DELETE /debts/:id (delete debt)

## Auth
- [ ] Integrate JWT-based auth (magic link already spec’d in CP-0)
- [ ] Reject requests without valid token (401)
- [ ] Ensure debts filtered by `user_id`

## Encryption
- [ ] Add encryption module in Worker
- [ ] Encrypt debt fields before writing to D1
- [ ] Decrypt fields before returning to client
- [ ] Store encryption key in Cloudflare Secrets

## Tests
- [ ] CRUD roundtrip test (create → fetch → update → delete)
- [ ] Auth isolation test (user A cannot read user B’s debts)
- [ ] Encryption test (raw D1 data unreadable, API returns correct plaintext)
- [ ] Validation test (reject invalid APR/min_payment)

## Documentation
- [ ] Update `/docs/CP-3_FOUNDATION.md` with final API examples + test results
- [ ] Mark CP-3 section complete in `/docs/INDEX.md`

