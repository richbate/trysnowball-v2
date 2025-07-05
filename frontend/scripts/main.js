// main.js

// Core app logic for debt form and forecast
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("debt-form");
  const debtListSection = document.getElementById("debt-list-section");
  const tableBody = document.querySelector("#debt-table tbody");
  const resultDiv = document.getElementById("forecast-result");
  const strategySelect = document.getElementById("strategy-select");
  const submitBtn = form ? form.querySelector('button[type="submit"]') : null;

  const API_BASE = "https://tiwdytcqh0.execute-api.eu-west-2.amazonaws.com/dev";

  let debts = [];

  function isNameValid(name) {
    return /^[a-zA-Z0-9 ]+$/.test(name.trim());
  }

  function isNumberValid(value) {
    return /^\d+(\.\d{1,2})?$/.test(value.trim());
  }

  function isRateValid(rate) {
    const num = parseFloat(rate);
    return !isNaN(num) && num >= 0 && num <= 100;
  }

  function validateInputs() {
    if (!form) return false;
    const name = form.elements["name"].value;
    const balance = form.elements["balance"].value;
    const rate = form.elements["rate"].value;
    const payment = form.elements["payment"].value;

    return (
      isNameValid(name) &&
      isNumberValid(balance) &&
      isNumberValid(rate) &&
      isRateValid(rate) &&
      isNumberValid(payment)
    );
  }

  function toggleSubmit() {
    if (!submitBtn) return;
    submitBtn.disabled = !validateInputs();
  }

  async function fetchDebts() {
    try {
      const res = await fetch(`${API_BASE}/listDebt?userId=demo-user`);
      if (!res.ok) throw new Error("Failed to fetch debts");
      debts = await res.json();
      renderDebts();
      displayGroupForecast();
    } catch (err) {
      console.error(err);
      debtListSection.style.display = "none";
      resultDiv.innerHTML = `<p style="color:red;">Error loading debts</p>`;
    }
  }

  async function addDebt(debt) {
    try {
      const res = await fetch(`${API_BASE}/addDebt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(debt)
      });
      if (!res.ok) throw new Error("Failed to add debt");
      const addedDebt = await res.json();
      debts.push(addedDebt);
      renderDebts();
      displayGroupForecast();
    } catch (err) {
      console.error(err);
      alert("Error adding debt. Please try again.");
    }
  }

  async function deleteDebt(index) {
    const debt = debts[index];
    if (!debt || !debt.debtId) return;
    try {
      const res = await fetch(`${API_BASE}/deleteDebt?debtId=${encodeURIComponent(debt.debtId)}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete debt");
      debts.splice(index, 1);
      renderDebts();
      displayGroupForecast();
    } catch (err) {
      console.error(err);
      alert("Error deleting debt. Please try again.");
    }
  }

  function renderDebts() {
    tableBody.innerHTML = "";
    if (debts.length === 0) {
      debtListSection.style.display = "none";
      return;
    }
    debtListSection.style.display = "block";

    debts.forEach((debt, index) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${debt.name}</td>
        <td>£${debt.balance.toFixed(2)}</td>
        <td>${(debt.rate * 100).toFixed(2)}</td>
        <td>£${debt.payment.toFixed(2)}</td>
        <td><button data-index="${index}" class="delete-btn">Delete</button></td>
      `;
      tableBody.appendChild(row);
    });

    document.querySelectorAll(".delete-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const index = e.target.dataset.index;
        deleteDebt(index);
      });
    });
  }

  if (form) {
    toggleSubmit();
    ["name", "balance", "rate", "payment"].forEach(fieldName => {
      const input = form.elements[fieldName];
      if (input) {
        input.addEventListener("input", toggleSubmit);
      }
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!validateInputs()) {
        alert("Please fill out all fields correctly before submitting.");
        return;
      }
      const debt = {
        name: form.elements["name"].value.trim(),
        balance: parseFloat(form.elements["balance"].value),
        rate: parseFloat(form.elements["rate"].value) / 100,
        payment: parseFloat(form.elements["payment"].value),
      };
      addDebt(debt);
      form.reset();
      toggleSubmit();
    });
  }

  if (strategySelect) {
    strategySelect.addEventListener("change", displayGroupForecast);
  }

  function simulateForecast(debts, strategy, extra = 0) {
    let debtsCopy = JSON.parse(JSON.stringify(debts));
    let month = 0;
    const totalHistory = [];

    debtsCopy.sort((a, b) => {
      if (strategy === "snowball") return a.balance - b.balance;
      if (strategy === "avalanche") return b.rate - a.rate;
      return 0;
    });

    while (month < 600) {
      let snowball = debtsCopy.reduce((sum, d) => d.balance > 0 ? sum + d.payment : sum, 0) + extra;
      let totalBalance = 0;
      let debtBalances = [];
      let allPaid = true;

      for (let i = 0; i < debtsCopy.length; i++) {
        const d = debtsCopy[i];

        if (d.balance <= 0) {
          debtBalances.push(null);
          continue;
        }

        allPaid = false;
        const interest = (d.rate / 12) * d.balance;
        const amountDue = d.balance + interest;
        const pay = Math.min(snowball, amountDue);
        const principal = pay - interest;

        d.balance -= principal;
        d.balance = Math.max(d.balance, 0);
        snowball -= pay;

        debtBalances.push(d.balance > 0 ? parseFloat(d.balance.toFixed(2)) : null);
        totalBalance += d.balance;
      }

      totalHistory.push({
        month,
        total: parseFloat(totalBalance.toFixed(2)),
        debts: debtBalances
      });

      if (allPaid) break;
      month++;
    }

    return totalHistory;
  }

  function displayGroupForecast() {
    if (debts.length === 0) {
      resultDiv.innerHTML = "";
      return;
    }

    const strategy = strategySelect ? strategySelect.value : "snowball";

    const normal = simulateForecast(debts, strategy, 0);
    const boosted = simulateForecast(debts, strategy, 50);

    const months = normal.map((_, i) => `Month ${i + 1}`);

    resultDiv.innerHTML = `
      <h2>Group Forecast (${strategy})</h2>
      <p><strong>Total months:</strong> ${normal.length}</p>
      <p><strong>With +£50/month:</strong> ${boosted.length} months</p>
      <canvas id="debt-forecast-chart"></canvas>
    `;

    const ctx = document.getElementById("debt-forecast-chart").getContext("2d");

    if (window.debtChart) window.debtChart.destroy();

    window.debtChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: months,
        datasets: [
          {
            label: "Total Balance",
            data: normal.map(m => m.total),
            borderColor: "#0074D9",
            fill: false,
          },
          {
            label: "With +£50/month",
            data: boosted.map(m => m.total),
            borderColor: "#2ECC40",
            borderDash: [5, 5],
            fill: false,
          },
          ...debts.map((d, idx) => ({
            label: d.name,
            data: normal.map(m => m.debts[idx] !== undefined && m.debts[idx] !== null ? m.debts[idx] : null),
            borderColor: `hsl(${(idx * 60) % 360}, 70%, 50%)`,
            fill: false,
          }))
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: "bottom"
          },
          tooltip: {
            callbacks: {
              label: ctx => ctx.raw !== null ? `£${ctx.raw.toFixed(2)}` : ''
            }
          }
        },
        scales: {
          y: {
            title: { display: true, text: "Balance (£)" }
          },
          x: {
            title: { display: true, text: "Month" }
          }
        }
      }
    });
  }

  fetchDebts();

  // ---- Optional Chat Feature (disabled on load) ----
  // To enable later, call `runDebtScenario()` or `startChatBot()` manually

  function runDebtScenario() {
    // ...original prompt-based version (optional)
  }

  function startChatBot() {
    // ...original Q&A form-based version (optional)
  }
});