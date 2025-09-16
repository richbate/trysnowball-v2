/**
 * DebtEngine.js - Unified debt calculation module
 * Consolidates simulateSnowball, generatePayoffTimeline, and calculateExtraPaymentForTarget
 * Single source of truth for all debt calculations
 */

/**
 * Core debt calculation class with all methods consolidated
 */
export class DebtEngine {
  constructor(debts, options = {}) {
    this.options = {
      maxMonths: 600,          // allow long horizons
      roundingPrecision: 2,    // round to pennies
      strategy: 'snowball', // snowball or avalanche
      ...options
    };
    
    // Build payoff queue respecting user order
    this.debts = this._buildPayoffQueue(JSON.parse(JSON.stringify(debts)));
  }

  /**
   * Build payoff queue respecting user order over strategy
   * If all debts have numeric order, use that. Otherwise fall back to strategy.
   */
  _buildPayoffQueue(debts) {
    // Check if all debts have explicit numeric order
    const hasUserOrder = debts.every(d => Number.isFinite(d.order));
    
    if (hasUserOrder) {
      // User priority - respect exact order
      return debts.sort((a, b) => a.order - b.order);
    }
    
    // Fall back to strategy-based sorting
    return this.options.strategy === 'avalanche'
      ? debts.sort((a, b) => b.rate - a.rate) // highest rate first
      : debts.sort((a, b) => a.balance - b.balance); // smallest balance first (snowball)
  }

  /**
   * Calculate months to pay off debt using snowball method
   * @param {number} totalPayment - Total monthly payment (minimums + extra)
   * @returns {number} Number of months to pay off debt (or -1 if > maxMonths)
   */
  calculatePayoffMonths(totalPayment) {
    const debts = JSON.parse(JSON.stringify(this.debts));
    const totalDebt = debts.reduce((sum, debt) => sum + debt.balance, 0);

    // Edge case: no debts
    if (totalDebt === 0) return 0;

    // Edge case: total payment clears all debts in 1 month
    if (totalPayment >= totalDebt) return 1;

    for (let month = 1; month <= this.options.maxMonths; month++) {
      let available = totalPayment;

      // Step 1: Apply interest and pay minimum payments
      for (let debt of debts) {
        if (debt.balance <= 0) continue;

        // Calculate and apply interest first (monthly nominal rate)
        const monthlyRate = (debt.rate || debt.interest || 0) / 12 / 100;
        const interest = this._roundToPrecision(debt.balance * monthlyRate);
        debt.balance = this._roundToPrecision(debt.balance + interest);

        // Apply minimum payment to balance
        const minPayment = debt.minPayment || 0;
        const actualPayment = Math.min(debt.balance, minPayment);
        debt.balance = this._roundToPrecision(Math.max(0, debt.balance - actualPayment));
        
        // Deduct the actual amount we paid (not the nominal minimum)
        available = this._roundToPrecision(available - actualPayment);
      }

      // Ensure available payment is never negative
      available = Math.max(0, available);

      // Step 2: Apply extra to payoff-priority debts, cascading remainder
      // Priority = explicit user order from constructor sort.
      while (available > 0) {
        const next = debts.find(d => d.balance > 0);
        if (!next) break;
        const extra = Math.min(available, next.balance);
        next.balance = this._roundToPrecision(next.balance - extra);
        available = this._roundToPrecision(available - extra);
      }

      // Step 3: Check if all debts are cleared
      const totalRemaining = debts.reduce((sum, debt) => sum + debt.balance, 0);
      if (this._roundToPrecision(totalRemaining) <= 0.01) return month; // penny-accurate stop
    }

    return -1; // Not paid off within maxMonths
  }

  /**
   * Generate detailed month-by-month payoff timeline
   * @param {number} totalPayment - Total monthly payment
   * @returns {Array} Timeline entries with monthly breakdown
   */
  generateTimeline(totalPayment) {
    const debts = JSON.parse(JSON.stringify(this.debts));
    const totalDebt = debts.reduce((sum, d) => sum + d.balance, 0);
    const timeline = [];

    if (totalPayment >= totalDebt) {
      // Immediate payoff
      timeline.push({
        month: 1,
        totalDebt: 0,
        interestPaid: 0,
        principalPaid: totalDebt,
        remainingDebts: debts.map(d => ({ name: d.name, balance: 0 })),
      });
      return timeline;
    }

    for (let month = 1; month <= this.options.maxMonths; month++) {
      let available = totalPayment;
      let totalInterestPaid = 0;
      let totalPrincipalPaid = 0;

      // Step 1: Apply interest + minimum payments
      for (let debt of debts) {
        if (debt.balance <= 0) {
          // Track zero values for completed debts
          debt._startingBalance = 0;
          debt._interestThisMonth = 0;
          debt._minPaidThisMonth = 0;
          debt._extraPaidThisMonth = 0;
          continue;
        }

        // Track starting balance for this month
        debt._startingBalance = debt.balance;
        debt._interestThisMonth = 0;
        debt._minPaidThisMonth = 0;
        debt._extraPaidThisMonth = 0;

        const monthlyRate = (debt.rate || debt.interest || 0) / 12 / 100;
        const interest = this._roundToPrecision(debt.balance * monthlyRate);
        debt.balance = this._roundToPrecision(debt.balance + interest);
        totalInterestPaid += interest;
        debt._interestThisMonth = interest;

        const minPayment = Math.min(debt.balance, debt.minPayment || 0);
        debt.balance = this._roundToPrecision(Math.max(0, debt.balance - minPayment));
        totalPrincipalPaid += this._roundToPrecision(Math.max(minPayment - interest, 0));
        available = this._roundToPrecision(available - minPayment);
        debt._minPaidThisMonth = minPayment;
      }

      available = Math.max(0, available);

      // Step 2: Cascade extra across remaining debts by priority
      while (available > 0) {
        const next = debts.find(d => d.balance > 0);
        if (!next) break;
        const extra = Math.min(available, next.balance);
        next.balance = this._roundToPrecision(next.balance - extra);
        totalPrincipalPaid += this._roundToPrecision(extra);
        available = this._roundToPrecision(available - extra);
        
        // Track extra payment applied to this debt
        next._extraPaidThisMonth = this._roundToPrecision((next._extraPaidThisMonth || 0) + extra);
      }

      const totalRemaining = debts.reduce((sum, d) => sum + d.balance, 0);

      // Find focus debt (highest priority with balance > 0)
      const focusDebt = debts.find(d => d.balance > 0);
      
      timeline.push({
        month,
        totalDebt: this._roundToPrecision(totalRemaining),
        interestPaid: this._roundToPrecision(totalInterestPaid),
        principalPaid: this._roundToPrecision(totalPrincipalPaid),
        focus: focusDebt?.name || null,
        totals: {
          payment: this._roundToPrecision((totalInterestPaid + totalPrincipalPaid)),
          interest: this._roundToPrecision(totalInterestPaid),
          principal: this._roundToPrecision(totalPrincipalPaid),
          balanceEnd: this._roundToPrecision(totalRemaining)
        },
        items: debts.map(d => ({
          id: d.id || d.name,
          name: d.name,
          open: this._roundToPrecision(d._startingBalance || d.balance),
          interest: this._roundToPrecision(d._interestThisMonth || 0),
          minPaid: this._roundToPrecision(d._minPaidThisMonth || 0),
          extraPaid: this._roundToPrecision(d._extraPaidThisMonth || 0),
          close: this._roundToPrecision(d.balance)
        })),
        remainingDebts: debts.map(d => ({ 
          name: d.name, 
          balance: this._roundToPrecision(d.balance) 
        })),
      });

      if (this._roundToPrecision(totalRemaining) <= 0.01) break; // All debts cleared (pennies)
    }

    return timeline;
  }

  /**
   * Calculate required extra payment to reach target months using binary search
   * @param {number} targetMonths - Desired payoff timeline
   * @param {number} totalMinPayments - Sum of all minimum payments
   * @returns {number} Required extra payment amount
   */
  calculateExtraForTarget(targetMonths, totalMinPayments) {
    if (targetMonths <= 0) return 0;
    
    // Use realistic upper bound based on total debt
    const totalDebt = this.debts.reduce((sum, debt) => sum + debt.balance, 0);
    
    let low = 0;
    let high = totalDebt;
    let bestExtra = 0;

    while (low <= high) {
      const midExtra = Math.floor((low + high) / 2);
      const months = this.calculatePayoffMonths(totalMinPayments + midExtra);

      if (months > 0 && months <= targetMonths) {
        bestExtra = midExtra;
        high = midExtra - 1; // Try to find smaller payment
      } else {
        low = midExtra + 1; // Need higher payment
      }
    }

    return bestExtra;
  }

  /**
   * Generate comparison scenarios (Do Nothing, Minimum Only, Snowball)
   * @param {number} extraPayment - Extra payment amount for snowball
   * @returns {Object} Scenario data for charts
   */
  generateScenarios(extraPayment = 0) {
    const totalMinPayments = this.debts.reduce((sum, debt) => sum + debt.minPayment, 0);
    
    return {
      doNothing: this._generateDoNothingScenario(),
      minimumOnly: this._generateMinimumOnlyScenario(),
      snowball: this.generateTimeline(totalMinPayments + extraPayment)
    };
  }

  /**
   * Get key metrics summary
   * @param {number} extraPayment - Extra payment amount
   * @returns {Object} Key metrics for dashboard
   */
  getMetrics(extraPayment = 0) {
    const totalMinPayments = this.debts.reduce((sum, debt) => sum + debt.minPayment, 0);
    const totalDebt = this.debts.reduce((sum, debt) => sum + debt.balance, 0);
    
    const snowballMonths = this.calculatePayoffMonths(totalMinPayments + extraPayment);
    const minimumMonths = this.calculatePayoffMonths(totalMinPayments);
    
    const snowballTimeline = this.generateTimeline(totalMinPayments + extraPayment);
    const minimumTimeline = this.generateTimeline(totalMinPayments);
    
    const snowballInterest = snowballTimeline.reduce((sum, entry) => sum + entry.interestPaid, 0);
    const minimumInterest = minimumTimeline.reduce((sum, entry) => sum + entry.interestPaid, 0);
    
    return {
      totalDebt,
      totalMinPayments,
      snowballPayment: totalMinPayments + extraPayment,
      snowballMonths,
      minimumMonths,
      monthsSaved: Math.max(0, minimumMonths - snowballMonths),
      interestSaved: Math.max(0, minimumInterest - snowballInterest),
      isImmediatePayoff: snowballMonths === 1
    };
  }

  // Private helper methods
  _roundToPrecision(value) {
    const factor = Math.pow(10, this.options.roundingPrecision);
    return Math.round((value + Number.EPSILON) * factor) / factor;
  }

  _generateDoNothingScenario() {
    const data = [];
    for (let month = 0; month <= 60; month++) {
      const total = this.debts.reduce((acc, debt) => {
        const monthlyRate = debt.rate / 12 / 100;
        const futureBalance = debt.balance * Math.pow(1 + monthlyRate, month);
        return acc + futureBalance;
      }, 0);
      
      data.push({ 
        month, 
        balance: this._roundToPrecision(total),
        totalDebt: this._roundToPrecision(total)
      });
    }
    return data;
  }

  _generateMinimumOnlyScenario() {
    return this.generateTimeline(this.debts.reduce((sum, debt) => sum + debt.minPayment, 0));
  }
}

// Backwards compatibility exports
export const simulateSnowball = (debts, totalPayment) => {
  const engine = new DebtEngine(debts);
  return engine.calculatePayoffMonths(totalPayment);
};

export const generatePayoffTimeline = (debts, totalPayment) => {
  const engine = new DebtEngine(debts);
  return engine.generateTimeline(totalPayment);
};

export const calculateExtraPaymentForTarget = (targetMonths, debts, totalMinPayments) => {
  const engine = new DebtEngine(debts);
  return engine.calculateExtraForTarget(targetMonths, totalMinPayments);
};