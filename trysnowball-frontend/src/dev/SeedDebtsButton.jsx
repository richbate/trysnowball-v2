import React, { useState } from "react";
import { localDebtManager } from "../storage/localDebtManager.ts";

const NAMES = [
  "Visa",
  "Mastercard",
  "Amex",
  "Store Card",
  "Overdraft",
  "Car Loan",
  "Personal Loan",
  "Student Loan",
];

function rand(min, max) {
  return Math.random() * (max - min) + min;
}
function money(n) {
  return Math.round(n * 100) / 100;
}
function minPaymentFromBalance(balance) {
  // ~1.5% of balance, clamped between £15–£250
  const pct = balance * 0.015;
  return Math.max(15, Math.min(250, money(pct)));
}

async function seedFixed() {
  await localDebtManager.clearAllData();
  await localDebtManager.addDebt({ name: "Visa", balance: 1200, interest: 19.9, minPayment: 35,  order: 1 });
  await localDebtManager.addDebt({ name: "Car Loan", balance: 6500, interest: 6.5,  minPayment: 120, order: 2 });
  await localDebtManager.addDebt({ name: "Overdraft", balance: 900,  interest: 39.9, minPayment: 25,  order: 3 });
  await localDebtManager.addDebt({ name: "Student Loan", balance: 3200, interest: 3.1,  minPayment: 50,  order: 4 });
}

async function seedRandom(count = 5, { clearFirst = true } = {}) {
  if (clearFirst) await localDebtManager.clearAllData();
  const picked = [...NAMES].sort(() => 0.5 - Math.random()).slice(0, count);
  let order = 1;
  for (const name of picked) {
    const balance = money(rand(300, 12000));
    const apr = money(rand(2, 34)); // 2–34% APR
    const min = minPaymentFromBalance(balance);
    await localDebtManager.addDebt({
      name,
      balance,
      interest: apr,
      minPayment: min,
      order: order++,
    });
  }
}

export default function SeedDebtsButton() {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  // Only show on dev routes
  const isDevRoute =
    typeof window !== "undefined" &&
    window.location.pathname.startsWith("/dev");

  if (!isDevRoute) return null;

  const run = (fn) => async () => {
    try {
      setBusy(true);
      setMsg("");
      await fn();
      setMsg("✅ Debts seeded. Refresh the page you’re testing.");
    } catch (e) {
      console.error(e);
      setMsg("❌ Seeding failed. Check console.");
    } finally {
      setBusy(false);
    }
  };

  const nukeDB = async () => {
    setBusy(true);
    setMsg("");
    try {
      if (window.indexedDB) {
        const req = window.indexedDB.deleteDatabase("trysnowball");
        await new Promise((resolve) => {
          req.onsuccess = resolve;
          req.onerror = resolve;
          req.onblocked = resolve;
        });
      }
      await localDebtManager.clearAllData();
      setMsg("🧨 IndexedDB nuked. Data cleared.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-3 border rounded-lg bg-purple-50 mb-4">
      <div className="text-sm font-medium text-purple-900 mb-2">
        Dev Tools: Seed Test Debts
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          disabled={busy}
          onClick={run(seedFixed)}
          className="px-3 py-1.5 rounded bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50"
        >
          Seed Fixed Demo (4)
        </button>
        <button
          disabled={busy}
          onClick={run(() => seedRandom(5, { clearFirst: true }))}
          className="px-3 py-1.5 rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          Seed Random (5)
        </button>
        <button
          disabled={busy}
          onClick={run(() => seedRandom(8, { clearFirst: true }))}
          className="px-3 py-1.5 rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          Seed Random (8)
        </button>
        <button
          disabled={busy}
          onClick={nukeDB}
          className="px-3 py-1.5 rounded bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:opacity-50"
        >
          Nuke DB
        </button>
      </div>
      {msg && <div className="mt-2 text-sm text-purple-900">{msg}</div>}
    </div>
  );
}