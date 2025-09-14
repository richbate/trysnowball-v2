# User Accounts PRD: TrySnowball Persistent Identity System

**Date:** September 1, 2025  
**Status:** Planning  
**Priority:** High  

## 🎯 **Problem Statement**

TrySnowball currently operates with anonymous sessions - users can add debts and use features, but their data lives in localStorage and isn't tied to a persistent identity. This creates several issues:

- **No cross-device sync** - users lose data when switching browsers/devices
- **Poor analytics** - we can't track real user engagement (`users_with_debts = 0`)
- **No social features** - can't implement usernames, sharing, or community aspects
- **Billing disconnect** - Stripe customers exist but their app data is disconnected
- **No user journey tracking** - can't measure conversion from signup → debt entry → engagement

## 🎯 **Solution: Persistent User Accounts**

Implement a proper user account system that:
1. **Links all user data to persistent user IDs** in D1 database
2. **Migrates localStorage data** to cloud storage on first login
3. **Enables usernames** for Instagram debt warriors and social sharing
4. **Provides cross-device sync** of debts, snapshots, and progress
5. **Unlocks accurate analytics** and user journey tracking

## 📊 **Current State Analysis**

### **Existing D1 Tables:**
```sql
users (id, email, is_pro, created_at, last_login, login_count, isPro, last_seen_at, referral_id)
login_tokens (token, email, expires_at, used, created_at)
auth_logs (id, user_id, event_type, metadata, created_at)
user_preferences (user_id, extra_payment, created_at, updated_at)
debts (user_id, debt_data, created_at, updated_at) -- EXISTS but unused
debt_payments (user_id, payment_data, created_at, updated_at) -- EXISTS but unused
```

### **Current localStorage Data:**
```javascript
// These live in browser storage, not tied to user accounts:
ts_debts: [debt objects]
ts_snapshots: [historical balance data]  
ts_goals: [user goals]
ts_snowflakes: [one-off payments]
ts_commitments: [user commitments]
ts_user_preferences: {extra_payment, etc}
```

## 🏗️ **Technical Architecture**

### **Phase 1: Database Schema Extensions**

#### **1.1 Update Users Table**
```sql
ALTER TABLE users ADD COLUMN username TEXT UNIQUE;
ALTER TABLE users ADD COLUMN display_name TEXT;
ALTER TABLE users ADD COLUMN profile_visibility TEXT DEFAULT 'private'; -- 'private', 'public', 'friends'
ALTER TABLE users ADD COLUMN onboarding_completed BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN data_migrated_at TEXT; -- track localStorage migration
```

#### **1.2 Create User Data Tables**
```sql
-- User debts (replace localStorage ts_debts)
CREATE TABLE user_debts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  balance REAL NOT NULL,
  original_amount REAL,
  interest_rate REAL NOT NULL,
  min_payment REAL NOT NULL,
  debt_type TEXT, -- 'credit_card', 'loan', 'mortgage', etc.
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Balance snapshots (replace localStorage ts_snapshots)
CREATE TABLE user_snapshots (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  debt_id TEXT NOT NULL,
  balance REAL NOT NULL,
  recorded_at TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (debt_id) REFERENCES user_debts(id)
);

-- User snowflakes (replace localStorage ts_snowflakes)  
CREATE TABLE user_snowflakes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  debt_id TEXT NOT NULL,
  amount REAL NOT NULL,
  month_index INTEGER NOT NULL,
  note TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (debt_id) REFERENCES user_debts(id)
);

-- User goals (replace localStorage ts_goals)
CREATE TABLE user_goals (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  goal_type TEXT NOT NULL, -- 'debt_payoff', 'debt_reduction', 'payment_boost'
  target_value REAL,
  target_debt_id TEXT,
  target_date TEXT,
  is_completed BOOLEAN DEFAULT false,
  completed_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (target_debt_id) REFERENCES user_debts(id)
);

-- User commitments (replace localStorage ts_commitments)
CREATE TABLE user_commitments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  commitment_text TEXT NOT NULL,
  commitment_type TEXT, -- 'monthly_extra', 'debt_focus', 'spending_cut'
  amount REAL,
  is_active BOOLEAN DEFAULT true,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### **Phase 2: API Endpoints**

#### **2.1 User Data Management**
```javascript
// New API endpoints needed:
GET  /api/user/debts          // Replace localStorage ts_debts
POST /api/user/debts          // Add new debt
PUT  /api/user/debts/:id      // Update debt
DELETE /api/user/debts/:id    // Delete debt

GET  /api/user/snapshots      // Replace localStorage ts_snapshots
POST /api/user/snapshots      // Add balance update

GET  /api/user/snowflakes     // Replace localStorage ts_snowflakes  
POST /api/user/snowflakes     // Add extra payment
PUT  /api/user/snowflakes/:id // Update extra payment
DELETE /api/user/snowflakes/:id // Delete extra payment

GET  /api/user/goals          // Replace localStorage ts_goals
POST /api/user/goals          // Add new goal
PUT  /api/user/goals/:id      // Update goal progress
DELETE /api/user/goals/:id    // Delete goal

GET  /api/user/profile        // User profile + preferences
PUT  /api/user/profile        // Update profile/username
```

#### **2.2 Username System**
```javascript
GET  /api/username/check/:username     // Check availability
POST /api/username/claim              // Claim username
GET  /u/:username                     // Public profile (if enabled)
```

### **Phase 3: Migration Strategy**

#### **3.1 Data Migration Flow**
```javascript
// On successful login/auth verification:
async function migrateUserData(userId) {
  // Check if migration already completed
  const user = await getUser(userId);
  if (user.data_migrated_at) return;
  
  // Read localStorage data
  const localDebts = JSON.parse(localStorage.getItem('ts_debts') || '[]');
  const localSnapshots = JSON.parse(localStorage.getItem('ts_snapshots') || '[]');
  const localSnowflakes = JSON.parse(localStorage.getItem('ts_snowflakes') || '[]');
  const localGoals = JSON.parse(localStorage.getItem('ts_goals') || '[]');
  const localCommitments = JSON.parse(localStorage.getItem('ts_commitments') || '[]');
  
  // Migrate to D1 with proper foreign keys
  for (const debt of localDebts) {
    await createUserDebt(userId, debt);
  }
  
  // Mark migration complete
  await updateUser(userId, { 
    data_migrated_at: new Date().toISOString(),
    onboarding_completed: localDebts.length > 0 
  });
  
  // Clear localStorage (optional - could keep as backup)
  localStorage.removeItem('ts_debts');
  localStorage.removeItem('ts_snapshots');
  // ... etc
}
```

#### **3.2 Backward Compatibility**
- Keep localStorage as fallback for anonymous users
- Gracefully handle users who haven't migrated yet
- Provide "Sign up to save your data" prompts

### **Phase 4: Frontend Data Layer Updates**

#### **4.1 Replace useDebts Hook**
```javascript
// Current: reads from localStorage
const { debts } = useDebts(); 

// New: reads from API with user context
const { debts, loading, error } = useUserDebts();
```

#### **4.2 Update Components**
```javascript
// Components that need updating:
- useDebts → useUserDebts (API-based)
- useSnapshots → useUserSnapshots  
- useSnowflakes → useUserSnowflakes
- useGoals → useUserGoals
- All debt management components
- Timeline/forecast calculations
```

## 🌟 **Username System Specifications**

### **4.1 Username Rules**
- **Length:** 3-20 characters
- **Characters:** a-z, 0-9, underscore, hyphen
- **Restrictions:** No consecutive special chars, can't start/end with special chars
- **Reserved:** admin, api, www, app, help, support, etc.

### **4.2 Username Features**
- **Optional:** Users can use the app without setting a username
- **Unique:** Enforced at database level
- **Case-insensitive:** stored lowercase, displayed as entered
- **Changeable:** Users can update (with rate limiting)

### **4.3 Social Integration**
```javascript
// Public profile URLs (when enabled):
https://trysnowball.co.uk/u/richbate
https://trysnowball.co.uk/u/keirahodge

// Shareable achievements:
"@richbate just paid off their credit card! 🎉" 
→ Links to public milestone if sharing enabled
```

## 📈 **Analytics & Tracking Improvements**

### **5.1 New Events**
```javascript
// User lifecycle
user_account_created       // Via Stripe webhook or manual signup
user_onboarding_started    // First time adding debt
user_onboarding_completed  // Has >0 debts and set preferences
user_data_migrated        // localStorage → D1 migration

// Engagement
user_added_debt           // First debt vs additional debts  
user_updated_balance      // Snapshot creation
user_created_snowflake    // Extra payment added
user_achieved_milestone   // Debt cleared, goal completed

// Social
username_claimed          // User set their handle
profile_shared           // Used sharing features
milestone_shared         // Shared achievement
```

### **5.2 Dashboard Metrics**
```javascript
// Replace current broken metrics:
total_users: COUNT(users)
active_users: COUNT(users WHERE last_seen_at > DATE('-30 days'))
users_with_debts: COUNT(DISTINCT user_id FROM user_debts)  
users_with_goals: COUNT(DISTINCT user_id FROM user_goals)
total_debt_tracked: SUM(balance FROM user_debts)
total_payments_logged: SUM(amount FROM user_snapshots WHERE balance decreased)
```

## 🚀 **Implementation Phases**

### **Phase 1: Foundation (Week 1)**
- [ ] Create D1 schema migrations
- [ ] Add username validation utilities
- [ ] Update users table with new columns
- [ ] Basic API endpoints for user data

### **Phase 2: Data Migration (Week 1-2)**
- [ ] Implement migration logic
- [ ] Test migration with existing user accounts
- [ ] Add migration UI/prompts
- [ ] Handle edge cases and errors

### **Phase 3: Frontend Integration (Week 2)**
- [ ] Replace localStorage hooks with API calls
- [ ] Update all debt management components
- [ ] Add username claiming UI
- [ ] Test cross-device sync

### **Phase 4: Social Features (Week 3)**
- [ ] Public profile pages
- [ ] Sharing functionality  
- [ ] Achievement system
- [ ] Instagram-ready sharing formats

## ✅ **Success Criteria**

### **User Experience**
- [ ] Users can log in and see their data on any device
- [ ] Data migration happens seamlessly on first login
- [ ] Username system works without forcing adoption
- [ ] No data loss during localStorage → D1 migration

### **Technical**
- [ ] `users_with_debts > 0` in analytics
- [ ] All localStorage usage replaced with API calls
- [ ] Cross-device sync working
- [ ] Database performance acceptable with real user data

### **Business**
- [ ] Clear user journey: signup → add debt → engage with features
- [ ] Social sharing generates referral traffic
- [ ] Instagram debt warrior community can use @handles
- [ ] Pro conversion tracking works properly

## 🔒 **Security Considerations**

- **Username squatting:** Rate limit username changes
- **Data privacy:** Users control profile visibility
- **Cross-user data leaks:** Strict user_id filtering in all queries
- **Migration security:** Validate all migrated data
- **API authorization:** All endpoints require valid user session

## 📋 **Migration Rollout Plan**

1. **Test with Keira first** - she's our only real pro user
2. **Gradual rollout** - start with 10% of users
3. **Monitor for issues** - data loss, performance problems
4. **Full rollout** once stable
5. **Cleanup** - remove localStorage fallbacks after 30 days

---

**Next Actions:**
1. Review and approve this PRD
2. Create database migration scripts
3. Implement basic API endpoints
4. Test migration with existing users
5. Update frontend data layer