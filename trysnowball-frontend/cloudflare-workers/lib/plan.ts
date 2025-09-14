export async function getPlan(c: any, userId: string) {
  const row = await c.env.DB.prepare(
    'SELECT is_pro, beta_access FROM users WHERE id=?'
  ).bind(userId).first();
  const is_paid = !!(row?.beta_access || row?.is_pro);
  const source = row?.beta_access ? 'beta' : (row?.is_pro ? 'stripe' : 'none');
  return { is_paid, source };
}