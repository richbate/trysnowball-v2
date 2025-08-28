// Input: engine monthly timeline aggregated across debts
// Expected fields (rename as needed to your engine):
// { interestPaid, principalMin, principalExtra }

export function toPaymentsBarRows(timeline) {
  return (timeline || []).map((m, i) => ({
    month: i + 1,
    Interest: Math.max(0, Math.round(m?.interestPaid || 0)),
    "Minimum Principal": Math.max(0, Math.round(m?.principalMin || 0)),
    "Snowball Extra": Math.max(0, Math.round(m?.principalExtra || 0)),
  }));
}

export function toPercentRows(rows) {
  return rows.map(r => {
    const t = r.Interest + r["Minimum Principal"] + r["Snowball Extra"];
    if (!t) return { ...r, Interest: 0, "Minimum Principal": 0, "Snowball Extra": 0 };
    return {
      ...r,
      Interest: +(r.Interest / t * 100).toFixed(1),
      "Minimum Principal": +((r["Minimum Principal"] / t) * 100).toFixed(1),
      "Snowball Extra": +((r["Snowball Extra"] / t) * 100).toFixed(1),
    };
  });
}

// Generate sample payment data for demo
export function generateSamplePaymentData(extraPayment = 100) {
  const timeline = [];
  let remainingBalance = 25000;
  
  for (let month = 0; month <= 24 && remainingBalance > 0; month++) {
    const monthlyInterestRate = 0.18 / 12; // 18% APR
    const interestPaid = remainingBalance * monthlyInterestRate;
    const minimumPrincipal = Math.min(remainingBalance, 250); // Base minimum payment
    const extraPrincipal = Math.min(remainingBalance - minimumPrincipal, extraPayment);
    
    timeline.push({
      interestPaid,
      principalMin: minimumPrincipal,
      principalExtra: extraPrincipal,
    });
    
    remainingBalance = Math.max(0, remainingBalance - minimumPrincipal - extraPrincipal);
  }
  
  return timeline;
}