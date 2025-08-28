// cloudflare-workers/trysnowball-e2e-worker.ts
export interface Env {
  TARGET_BASE_URL: string;     // e.g. https://trysnowball.co.uk
  STRIPE_MODE: string;         // test|live (use test on staging)
  E2E_MAGIC_DOMAIN: string;    // domain for magic link redirects if needed
  E2E_PRO_USER_EMAIL?: string; // seeded pro user
  E2E_PRO_USER_TOKEN?: string; // optional pre-issued token to skip flow
  E2E_TIMEOUT_MS?: string;     // "15000"
  // any secrets needed (jwt public key if we locally verify, etc.)
}

type TestFn = (env: Env, ctx: ExecutionContext) => Promise<void>;

const tests: Record<string, TestFn> = {
  "auth:register-login-me": async (env) => {
    const email = `e2e_${Date.now()}@example.test`;
    // 1) request magic link or register
    let res = await fetch(`${env.TARGET_BASE_URL}/auth/request-link`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email })
    });
    if (!res.ok) throw new Error(`request-link ${res.status}`);

    // 2) poll a test-only verification endpoint (your worker can expose a "dev-verify" for E2E)
    res = await fetch(`${env.TARGET_BASE_URL}/auth/dev-complete-magic`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email })
    });
    const { token } = await res.json();
    if (!token) throw new Error("no token issued");

    // 3) /auth/me with token
    res = await fetch(`${env.TARGET_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error(`/auth/me ${res.status}`);
    const me = await res.json();
    if (!me?.user?.email || me.user.email !== email) throw new Error("me mismatch");

    // 4) refresh
    const r2 = await fetch(`${env.TARGET_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!r2.ok) throw new Error(`refresh ${r2.status}`);
  },

  "pro-gate:denied-for-free": async (env) => {
    const res = await fetch(`${env.TARGET_BASE_URL}/api/ai/coach`, { method: "POST" });
    if (res.status !== 401 && res.status !== 403) throw new Error(`expected 401/403 got ${res.status}`);
  },

  "pro-gate:allowed-for-pro": async (env) => {
    const token = env.E2E_PRO_USER_TOKEN!;
    if (!token) throw new Error("E2E_PRO_USER_TOKEN missing");
    const res = await fetch(`${env.TARGET_BASE_URL}/api/ai/coach`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({ message: "hi" })
    });
    if (!res.ok) throw new Error(`coach ${res.status}`);
  },

  "debts:crud-and-order": async (env) => {
    const token = env.E2E_PRO_USER_TOKEN!;
    const authed = (path: string, init: RequestInit = {}) =>
      fetch(`${env.TARGET_BASE_URL}${path}`, {
        ...init,
        headers: { ...(init.headers||{}), Authorization: `Bearer ${token}`, "content-type": "application/json" }
      });

    // add
    let r = await authed(`/api/debts`, { method: "POST", body: JSON.stringify({ name: "E2E Small", balance: 120, minPayment: 25, apr: 0 })});
    if (!r.ok) throw new Error(`create debt ${r.status}`);
    const created = await r.json();

    // list + order
    r = await authed(`/api/debts`);
    const list = await r.json();
    if (!Array.isArray(list.debts) || list.debts.length < 1) throw new Error("no debts");
    const has999 = list.debts.some((d: any) => d.order === 999);
    if (has999) throw new Error("found order:999");

    // edit
    r = await authed(`/api/debts/${created.id}`, { method: "PUT", body: JSON.stringify({ balance: 90 })});
    if (!r.ok) throw new Error(`edit debt ${r.status}`);

    // delete
    r = await authed(`/api/debts/${created.id}`, { method: "DELETE" });
    if (r.status !== 204 && r.status !== 200) throw new Error(`delete debt ${r.status}`);
  },

  "checkout:session-and-portal": async (env) => {
    if (env.STRIPE_MODE !== "test") return; // skip on prod guard
    const res = await fetch(`${env.TARGET_BASE_URL}/api/create-checkout-session`, { 
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        customerEmail: "e2e@test.com",
        successUrl: `${env.TARGET_BASE_URL}/success`,
        cancelUrl: `${env.TARGET_BASE_URL}/cancel`
      })
    });
    if (!res.ok) throw new Error(`checkout ${res.status}`);
    const { url } = await res.json();
    if (!url || !url.includes("stripe")) throw new Error("no stripe url");
    // portal
    const p = await fetch(`${env.TARGET_BASE_URL}/api/create-portal-session`, { 
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        customerEmail: "e2e@test.com",
        returnUrl: `${env.TARGET_BASE_URL}/billing`
      })
    });
    if (!p.ok) throw new Error(`portal ${p.status}`);
  },

  "milestone:trigger": async (env) => {
    const token = env.E2E_PRO_USER_TOKEN!;
    const authed = (path: string, init: RequestInit = {}) =>
      fetch(`${env.TARGET_BASE_URL}${path}`, {
        ...init,
        headers: { ...(init.headers||{}), Authorization: `Bearer ${token}`, "content-type": "application/json" }
      });

    // create tiny debt and pay it off
    let r = await authed(`/api/debts`, { method: "POST", body: JSON.stringify({ name:"E2E Tiny", balance: 10, minPayment:10, apr:0 })});
    const debt = await r.json();
    await authed(`/api/debts/${debt.id}`, { method: "PUT", body: JSON.stringify({ balance: 0 })});
    // assert milestone log endpoint (or analytics hook) saw an event
    r = await authed(`/api/milestones/recent`);
    if (!r.ok) throw new Error(`milestones ${r.status}`);
    const events = await r.json();
    const found = events.some((e: any) => e.type === "debt_paid" && e.debtId === debt.id);
    if (!found) throw new Error("no milestone event logged");
  }
};

async function runAll(env: Env): Promise<Response> {
  const results: any[] = [];
  for (const [name, fn] of Object.entries(tests)) {
    const started = Date.now();
    try {
      await Promise.race([
        fn(env, {} as any),
        new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), Number(env.E2E_TIMEOUT_MS||15000)))
      ]);
      results.push({ name, ok: true, ms: Date.now() - started });
    } catch (e:any) {
      results.push({ name, ok: false, error: e.message, ms: Date.now() - started });
    }
  }
  
  const passed = results.filter(r => r.ok).length;
  const failed = results.filter(r => !r.ok).length;
  const ok = results.every(r => r.ok);
  
  const report = {
    ok,
    summary: { passed, failed, total: results.length },
    results,
    timestamp: new Date().toISOString(),
    environment: env.TARGET_BASE_URL.includes('staging') ? 'staging' : 'production'
  };
  
  return new Response(JSON.stringify(report, null, 2), {
    status: ok ? 200 : 500,
    headers: { 
      "content-type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    
    // Health check
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        worker: 'trysnowball-e2e-v2'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Run tests
    if (url.pathname === '/run-tests' || url.pathname === '/') {
      return runAll(env);
    }
    
    return new Response('Not Found', { status: 404 });
  }
};