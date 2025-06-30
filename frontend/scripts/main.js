document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("debt-form");
  const debtListSection = document.getElementById("debt-list-section");
  const tableBody = document.querySelector("#debt-table tbody");
  const resultDiv = document.getElementById("forecast-result");
  const strategySelect = document.getElementById("strategy-select");
  const submitBtn = form ? form.querySelector('button[type="submit"]') : null;

  const API_BASE = "https://tiwdytcqh0.execute-api.eu-west-2.amazonaws.com/dev"; // Your real API Gateway base URL

  let debts = [];

  // Validation helpers
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

  document.addEventListener("DOMContentLoaded", () => {
  const questions = [
    "Hi! What's your name?",
    "What is your total debt amount (£)?",
    "How much can you afford to pay monthly (£)?",
    "What is the average interest rate on your debt (%)?"
  ];
  let answers = [];
  let currentQuestion = 0;

  const chatMessages = document.getElementById("chat-messages");
  const chatInput = document.getElementById("chat-input");
  const chatSubmit = document.getElementById("chat-submit");

  function addMessage(text, fromUser = false) {
    const msgDiv = document.createElement("div");
    msgDiv.textContent = text;
    msgDiv.style.margin = "0.5rem 0";
    msgDiv.style.padding = "0.5rem";
    msgDiv.style.borderRadius = "6px";
    msgDiv.style.maxWidth = "80%";
    msgDiv.style.backgroundColor = fromUser ? "#DCF8C6" : "#eee";
    msgDiv.style.alignSelf = fromUser ? "flex-end" : "flex-start";
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function askQuestion() {
    if (currentQuestion < questions.length) {
      addMessage(questions[currentQuestion]);
      chatInput.value = "";
      chatInput.focus();
    } else {
      // Calculate and show results
      const name = answers[0];
      const debt = parseFloat(answers[1]);
      const payment = parseFloat(answers[2]);
      const rate = parseFloat(answers[3]);

      const monthsToClear = Math.ceil(debt / payment);

      addMessage(`Thanks, ${name}. Here’s a quick summary:`);
      addMessage(`Total debt: £${debt.toFixed(2)}`);
      addMessage(`Monthly payment: £${payment.toFixed(2)}`);
      addMessage(`Interest rate: ${rate.toFixed(2)}%`);
      addMessage(`Estimated payoff time: ${monthsToClear} months`);
      chatInput.style.display = "none";
      chatSubmit.style.display = "none";
    }
  }

  chatSubmit.addEventListener("click", () => {
    const input = chatInput.value.trim();
    if (!input) return;
    addMessage(input, true);
    answers.push(input);
    currentQuestion++;
    askQuestion();
  });

  chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      chatSubmit.click();
    }
  });

  // Initialize chat UI style for messages container
  chatMessages.style.display = "flex";
  chatMessages.style.flexDirection = "column";

  askQuestion();
});

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
    // Optional: Only if you have a deleteDebt API and Lambda setup
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

  // Initialize
  fetchDebts();
async function runDebtScenario() {
  alert("Welcome! Let's explore your debt situation.");

  const name = prompt("What's your name?");
  if (!name) {
    alert("Name is required. Please reload and try again.");
    return;
  }

  const totalDebt = prompt("What is your total debt amount (£)? (e.g., 5000)");
  const debtNum = parseFloat(totalDebt);
  if (isNaN(debtNum) || debtNum <= 0) {
    alert("Please enter a valid positive number for debt.");
    return;
  }

  const monthlyPayment = prompt("How much can you afford to pay monthly (£)? (e.g., 300)");
  const paymentNum = parseFloat(monthlyPayment);
  if (isNaN(paymentNum) || paymentNum <= 0) {
    alert("Please enter a valid positive number for monthly payment.");
    return;
  }

  const interestRate = prompt("What is the average interest rate on your debt (%)? (e.g., 8)");
  const rateNum = parseFloat(interestRate);
  if (isNaN(rateNum) || rateNum < 0) {
    alert("Please enter a valid interest rate.");
    return;
  }

  // Simple projection: Rough months to clear debt ignoring compounding for simplicity
  const monthsToClear = Math.ceil(debtNum / paymentNum);

  alert(
    `Hi ${name}, based on your inputs:\n` +
    `- Total Debt: £${debtNum.toFixed(2)}\n` +
    `- Monthly Payment: £${paymentNum.toFixed(2)}\n` +
    `- Interest Rate: ${rateNum.toFixed(2)}%\n\n` +
    `If you maintain these payments, it will take approximately ${monthsToClear} months to pay off your debt.\n\n` +
    `Note: This is a simplified calculation ignoring interest compounding for demo purposes.`
  );
}

// Run the scenario
runDebtScenario();
});