
document.addEventListener("DOMContentLoaded", () => {
  const chartContainer = document.querySelector("#what-if-chart");
  let chart;

  async function fetchDebts() {
    return [
      { name: "Credit Card", balance: 1200, rate: 0.21, payment: 75 },
      { name: "Car Loan", balance: 5000, rate: 0.07, payment: 150 },
      { name: "Overdraft", balance: 800, rate: 0.15, payment: 50 }
    ];
  }

  function simulateForecast(debts, strategy, extra = 0, extraOneTime = 0) {
    let debtsCopy = JSON.parse(JSON.stringify(debts));
    let month = 0;
    const totalHistory = [];

    debtsCopy.sort((a, b) => {
      if (strategy === "snowball") return a.balance - b.balance;
      if (strategy === "avalanche") return b.rate - a.rate;
      return 0;
    });

    let oneTimeApplied = false;

    while (month < 600) {
      let snowball = debtsCopy.reduce((sum, d) => d.balance > 0 ? sum + d.payment : sum, 0) + extra;
      if (!oneTimeApplied && extraOneTime > 0) {
        snowball += extraOneTime;
        oneTimeApplied = true;
      }

      let totalBalance = 0;
      let allPaid = true;

      for (let i = 0; i < debtsCopy.length; i++) {
        const d = debtsCopy[i];
        if (d.balance <= 0) continue;
        allPaid = false;

        const interest = (d.rate / 12) * d.balance;
        const amountDue = d.balance + interest;
        const pay = Math.min(snowball, amountDue);
        const principal = pay - interest;

        d.balance -= principal;
        d.balance = Math.max(d.balance, 0);
        snowball -= pay;

        totalBalance += d.balance;
      }

      totalHistory.push({
        month,
        total: parseFloat(totalBalance.toFixed(2))
      });

      if (allPaid) break;
      month++;
    }

    return totalHistory;
  }

  function renderDebtTable(debts) {
    const tableBody = document.querySelector("tbody");
    if (!tableBody) return;
    tableBody.innerHTML = "";
    debts.forEach(debt => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${debt.name}</td>
        <td>£${debt.balance.toFixed(2)}</td>
        <td>${(debt.rate * 100).toFixed(2)}</td>
        <td>£${debt.payment.toFixed(2)}</td>
      `;
      tableBody.appendChild(row);
    });
  }

  function getBoostValues() {
    let extraMonthly = 0;
    let extraOneTime = 0;
    document.querySelectorAll("input[name='boost']:checked").forEach(cb => {
      const value = parseFloat(cb.value);
      const freq = cb.dataset.frequency;
      if (freq === "monthly") extraMonthly += value;
      else if (freq === "one-time") extraOneTime += value;
    });
    return { extraMonthly, extraOneTime };
  }

  async function updateChart() {
    const debts = await fetchDebts();
    if (!debts.length) return;

    renderDebtTable(debts);

    const { extraMonthly, extraOneTime } = getBoostValues();

    const snowball = simulateForecast(debts, "snowball", 0, 0);
    const snowballBoost = simulateForecast(debts, "snowball", extraMonthly, extraOneTime);
    const avalanche = simulateForecast(debts, "avalanche", 0, 0);
    const avalancheBoost = simulateForecast(debts, "avalanche", extraMonthly, extraOneTime);

    const maxMonths = Math.max(snowball.length, snowballBoost.length, avalanche.length, avalancheBoost.length);
    const labels = Array.from({ length: maxMonths }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() + i);
      return date.toLocaleString('default', { month: 'short', year: 'numeric' });
    });

    const options = {
      chart: { type: 'line', height: 400 },
      series: [
        { name: "Snowball", data: snowball.map(p => p.total) },
        { name: "Snowball (With Boost)", data: snowballBoost.map(p => p.total) },
        { name: "Avalanche", data: avalanche.map(p => p.total) },
        { name: "Avalanche (With Boost)", data: avalancheBoost.map(p => p.total) }
      ],
      xaxis: { categories: labels, title: { text: "Month" } },
      yaxis: { title: { text: "Balance (£)" } },
      tooltip: {
        y: { formatter: value => `£${value.toFixed(2)}` }
      },
      legend: { position: 'bottom' }
    };

    if (chart) chart.destroy();
    chart = new ApexCharts(chartContainer, options);
    chart.render();
  }

  updateChart();

  document.querySelectorAll("input[name='boost']").forEach(cb =>
    cb.addEventListener("change", updateChart)
  );
});
