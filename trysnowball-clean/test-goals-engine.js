// Quick test of the goals engine
const { GoalsEngine } = require('./build/lib/goalsEngine');
const { USER_TIERS } = require('./build/types/Entitlements');
const { GOAL_TYPES } = require('./build/types/Goals');

async function testGoalsEngine() {
  const engine = new GoalsEngine();
  
  console.log('Testing goals engine creation...');
  
  try {
    const result = await engine.createGoal({
      user_id: 'test_user_123',
      type: GOAL_TYPES.DEBT_CLEAR,
      target_value: 0,
      target_date: '2025-06-01'
    }, USER_TIERS.FREE);
    
    console.log('Result:', result);
    
    if (result.success) {
      console.log('✅ Goal creation successful');
    } else {
      console.log('❌ Goal creation failed:', result.error, result.message);
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testGoalsEngine();