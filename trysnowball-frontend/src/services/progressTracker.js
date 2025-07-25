/**
 * Progress Tracker Service - JavaScript version
 * Handles all database operations for debt tracking and progress monitoring
 */

// Helper function to get current month key
const getMonthKey = (monthOffset = 0) => {
  const date = new Date();
  date.setMonth(date.getMonth() + monthOffset);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

// Helper functions
const calculateTotalBalance = (snapshots, userId) => {
  return snapshots
    .filter(s => s.userId === userId)
    .reduce((sum, s) => sum + s.balance, 0);
};

const getActiveDebts = (debts, userId) => {
  return debts.filter(debt => debt.userId === userId && debt.isActive);
};

const getLatestSnapshots = (snapshots, userId) => {
  const latestMonth = getMonthKey();
  return snapshots.filter(s => s.userId === userId && s.month === latestMonth);
};

// ============================================================================
// DATA STORAGE SERVICE
// ============================================================================

class ProgressTrackerService {
  constructor() {
    this.users = [];
    this.debts = [];
    this.debtSnapshots = [];
    this.userProgress = [];
    this.milestones = [];
    this.initialized = false;
    
    this.loadSampleData();
  }

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  async loadSampleData() {
    if (this.initialized) return;
    
    try {
      // Load sample data from public directory
      const response = await fetch('/sampleDatabase.json');
      const data = await response.json();
      
      this.users = data.users || [];
      this.debts = data.debts || [];
      this.debtSnapshots = data.debtSnapshots || [];
      this.userProgress = data.userProgress || [];
      this.milestones = data.milestones || [];
      
      console.log('Sample data loaded:', {
        users: this.users.length,
        debts: this.debts.length,
        snapshots: this.debtSnapshots.length,
        progress: this.userProgress.length,
        milestones: this.milestones.length
      });
      
      this.initialized = true;
    } catch (error) {
      console.error('Failed to load sample data:', error);
      // Use empty arrays if sample data fails to load
      this.users = [];
      this.debts = [];
      this.debtSnapshots = [];
      this.userProgress = [];
      this.milestones = [];
      this.initialized = true;
    }
  }

  // ============================================================================
  // USER MANAGEMENT
  // ============================================================================

  async getUser(userId) {
    await this.loadSampleData();
    return this.users.find(user => user.userId === userId) || null;
  }

  async createUser(userData) {
    await this.loadSampleData();
    const user = {
      ...userData,
      userId: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString()
    };
    
    this.users.push(user);
    return user;
  }

  // ============================================================================
  // DEBT MANAGEMENT
  // ============================================================================

  async getDebts(userId) {
    await this.loadSampleData();
    return this.debts.filter(debt => debt.userId === userId);
  }

  async getActiveDebts(userId) {
    await this.loadSampleData();
    return getActiveDebts(this.debts, userId);
  }

  async createDebt(debtData) {
    await this.loadSampleData();
    const debt = {
      ...debtData,
      debtId: `debt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      isActive: true
    };
    
    this.debts.push(debt);
    return debt;
  }

  async updateDebt(debtId, updates) {
    await this.loadSampleData();
    const index = this.debts.findIndex(debt => debt.debtId === debtId);
    if (index === -1) return null;

    this.debts[index] = {
      ...this.debts[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    return this.debts[index];
  }

  async deleteDebt(debtId) {
    await this.loadSampleData();
    const index = this.debts.findIndex(debt => debt.debtId === debtId);
    if (index === -1) return false;

    // Soft delete - mark as inactive
    this.debts[index].isActive = false;
    this.debts[index].updatedAt = new Date().toISOString();
    return true;
  }

  // ============================================================================
  // SNAPSHOT MANAGEMENT
  // ============================================================================

  async getSnapshots(userId, debtId, month) {
    await this.loadSampleData();
    return this.debtSnapshots.filter(snapshot => {
      if (snapshot.userId !== userId) return false;
      if (debtId && snapshot.debtId !== debtId) return false;
      if (month && snapshot.month !== month) return false;
      return true;
    });
  }

  async getLatestSnapshots(userId) {
    await this.loadSampleData();
    return getLatestSnapshots(this.debtSnapshots, userId);
  }

  async createSnapshot(snapshotData) {
    await this.loadSampleData();
    const snapshot = {
      ...snapshotData,
      recordedAt: new Date().toISOString()
    };
    
    // Remove any existing snapshot for this debt/month
    this.debtSnapshots = this.debtSnapshots.filter(
      s => !(s.userId === snapshot.userId && s.debtId === snapshot.debtId && s.month === snapshot.month)
    );
    
    this.debtSnapshots.push(snapshot);
    return snapshot;
  }

  async getSnapshotHistory(userId, debtId, months = 12) {
    await this.loadSampleData();
    const snapshots = this.debtSnapshots
      .filter(s => s.userId === userId && s.debtId === debtId)
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-months);
    
    return snapshots;
  }

  // ============================================================================
  // PROGRESS TRACKING
  // ============================================================================

  async getUserProgress(userId, month) {
    await this.loadSampleData();
    return this.userProgress.filter(progress => {
      if (progress.userId !== userId) return false;
      if (month && progress.month !== month) return false;
      return true;
    });
  }

  async createProgressSnapshot(userId, month) {
    await this.loadSampleData();
    const targetMonth = month || getMonthKey();
    
    // Get all snapshots for this month
    const monthSnapshots = await this.getSnapshots(userId, undefined, targetMonth);
    
    // Calculate aggregated data
    const totalBalance = monthSnapshots.reduce((sum, s) => sum + s.balance, 0);
    const totalPaid = monthSnapshots.reduce((sum, s) => sum + s.actualPayment, 0);
    const totalInterestCharged = monthSnapshots.reduce((sum, s) => sum + s.interestCharged, 0);
    
    // Get previous month's progress for streak calculation
    const previousMonth = getMonthKey(-1);
    const previousProgress = await this.getUserProgress(userId, previousMonth);
    const prevProgress = previousProgress[0];
    
    // Calculate streaks (simplified logic)
    const streakNoNewDebt = this.calculateNewDebtStreak(userId, targetMonth);
    const streakNoWastedSpend = prevProgress ? prevProgress.streakNoWastedSpend + 1 : 1;
    
    const progress = {
      userId,
      month: targetMonth,
      totalBalance,
      totalPaid,
      totalInterestCharged,
      streakNoNewDebt,
      streakNoWastedSpend,
      mainFocus: 'snowball_method', // Default focus
      netWorthChange: totalPaid - totalInterestCharged,
      recordedAt: new Date().toISOString(),
      milestones: []
    };
    
    // Remove existing progress for this month
    this.userProgress = this.userProgress.filter(
      p => !(p.userId === userId && p.month === targetMonth)
    );
    
    this.userProgress.push(progress);
    return progress;
  }

  calculateNewDebtStreak(userId, currentMonth) {
    // Simplified: check if any new debts were created this month
    const monthStart = new Date(`${currentMonth}-01`);
    const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
    
    const newDebtsThisMonth = this.debts.filter(debt => {
      if (debt.userId !== userId) return false;
      const createdDate = new Date(debt.createdAt);
      return createdDate >= monthStart && createdDate <= monthEnd;
    });
    
    return newDebtsThisMonth.length === 0 ? 1 : 0;
  }

  // ============================================================================
  // MILESTONE TRACKING
  // ============================================================================

  async getMilestones(userId) {
    await this.loadSampleData();
    return this.milestones
      .filter(milestone => milestone.userId === userId)
      .sort((a, b) => new Date(b.achievedAt).getTime() - new Date(a.achievedAt).getTime());
  }

  async createMilestone(milestoneData) {
    await this.loadSampleData();
    const milestone = {
      ...milestoneData,
      milestoneId: `milestone_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      achievedAt: new Date().toISOString()
    };
    
    this.milestones.push(milestone);
    return milestone;
  }

  async checkForNewMilestones(userId, debtId) {
    await this.loadSampleData();
    const newMilestones = [];
    
    // Check for debt payoff milestone
    if (debtId) {
      const latestSnapshot = await this.getSnapshots(userId, debtId);
      const latest = latestSnapshot[latestSnapshot.length - 1];
      
      if (latest && latest.balance === 0) {
        const debt = this.debts.find(d => d.debtId === debtId);
        if (debt) {
          const milestone = await this.createMilestone({
            userId,
            type: 'debt_paid_off',
            title: `${debt.name} Paid Off! 🎉`,
            description: `Completely eliminated your ${debt.name} debt!`,
            value: debt.limit,
            debtId
          });
          newMilestones.push(milestone);
        }
      }
    }
    
    return newMilestones;
  }

  // ============================================================================
  // ANALYTICS & INSIGHTS
  // ============================================================================

  async getDebtSummary(userId) {
    await this.loadSampleData();
    const activeDebts = await this.getActiveDebts(userId);
    const latestSnapshots = await this.getLatestSnapshots(userId);
    
    const totalBalance = latestSnapshots.reduce((sum, s) => sum + s.balance, 0);
    const totalMinPayments = activeDebts.reduce((sum, d) => sum + d.minPayment, 0);
    const averageInterestRate = activeDebts.length > 0 
      ? activeDebts.reduce((sum, d) => sum + d.interestRate, 0) / activeDebts.length 
      : 0;
    
    // Simplified calculation for demo
    const monthsToPayoff = totalMinPayments > 0 ? Math.ceil(totalBalance / totalMinPayments) : 0;
    const totalInterestCost = totalBalance * (averageInterestRate / 100) * (monthsToPayoff / 12);
    
    return {
      totalBalance,
      totalMinPayments,
      averageInterestRate,
      monthsToPayoff,
      totalInterestCost
    };
  }

  async getProgressTrend(userId, months = 6) {
    await this.loadSampleData();
    const progressData = await this.getUserProgress(userId);
    const milestones = await this.getMilestones(userId);
    
    return progressData
      .slice(-months)
      .map(progress => ({
        month: progress.month,
        totalBalance: progress.totalBalance,
        totalPaid: progress.totalPaid,
        milestoneCount: milestones.filter(m => m.achievedAt.startsWith(progress.month)).length
      }));
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  async exportUserData(userId) {
    await this.loadSampleData();
    return {
      user: await this.getUser(userId),
      debts: await this.getDebts(userId),
      snapshots: await this.getSnapshots(userId),
      progress: await this.getUserProgress(userId),
      milestones: await this.getMilestones(userId)
    };
  }

  async clearUserData(userId) {
    await this.loadSampleData();
    this.debts = this.debts.filter(d => d.userId !== userId);
    this.debtSnapshots = this.debtSnapshots.filter(s => s.userId !== userId);
    this.userProgress = this.userProgress.filter(p => p.userId !== userId);
    this.milestones = this.milestones.filter(m => m.userId !== userId);
    this.users = this.users.filter(u => u.userId !== userId);
    
    return true;
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const progressTracker = new ProgressTrackerService();
export default progressTracker;