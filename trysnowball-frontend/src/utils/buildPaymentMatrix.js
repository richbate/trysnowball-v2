import { formatCurrency } from './formatCurrency';

export function fmtMoney(n) {
  const v = Number.isFinite(n) ? n : 0;
  return formatCurrency(Math.round(v * 100) / 100);
}

export function defaultMonthLabel(m) {
  if (m?.dateLabel) return m.dateLabel;
  if (m?.date) {
    const d = new Date(m.date);
    return d.toLocaleString('en-GB', { month: 'short', year: '2-digit' });
  }
  return `M${(m?.monthIndex ?? 0) + 1}`;
}

export function buildPaymentMatrix(timeline = [], { debtOrder, monthLabel } = {}) {
  const labelFn = monthLabel || defaultMonthLabel;

  // Use debtOrder from inputs if provided, else infer from timeline
  let labels = Array.isArray(debtOrder) && debtOrder.length
    ? [...debtOrder]
    : Array.from(
        new Set(
          timeline.flatMap(m => (m.items ?? []).map(i => i.label))
        )
      );

  const rows = timeline.map((m, idx) => {
    const row = {
      rowNo: idx + 1,
      month: labelFn(m),
      snowball: m?.totalSnowball ?? 0,
      additional: m?.extraPayment ?? 0,
      flex: m?.flex ?? 0,
      snowflakes: (m.items ?? []).reduce((sum, item) => sum + (item.snowflake ?? 0), 0),
    };

    for (const name of labels) row[name] = 0;
    for (const it of (m.items ?? [])) if (it.label) row[it.label] = it.payment ?? 0;

    return row;
  });

  return { debts: labels, rows };
}