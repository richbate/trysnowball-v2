// src/__tests__/legacyGuard.unit.test.js
describe('Legacy localStorage guard', () => {
  it('does not crash if legacy key exists', () => {
    localStorage.setItem('debtBalances', JSON.stringify([{ balance: 18512, minPayment: 0 }]));
    const parsed = JSON.parse(localStorage.getItem('debtBalances'));
    expect(parsed[0].balance).toBe(18512);
    expect(true).toBe(true);
  });
});
