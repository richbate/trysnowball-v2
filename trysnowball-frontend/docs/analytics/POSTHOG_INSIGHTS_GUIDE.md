# 📊 PostHog Insights Setup Guide - User Debt Activity

## Quick Dashboard Setup

### 1. **Key Metrics to Track**

**Primary Conversion Metric:**
- **Event**: `debt_added_first`
- **Description**: Number of users who added their first debt
- **Why Important**: Core conversion from visitor → active user

**User Journey Funnel:**
```
onboarding_started → onboarding_completed → debt_added_first → debt_balance_updated
```

### 2. **Create These Insights in PostHog**

#### Insight 1: "Users Adding First Debt"
- **Type**: Trends
- **Event**: `debt_added_first`
- **Time Range**: Last 30 days
- **Breakdown**: By `debt_type` property

#### Insight 2: "Onboarding to Debt Conversion Funnel"
- **Type**: Funnel
- **Steps**:
  1. `onboarding_completed`
  2. `debt_added_first`
- **Time Range**: Last 30 days

#### Insight 3: "Active Debt Users"
- **Type**: Trends
- **Event**: `debt_balance_updated`
- **Time Range**: Last 7 days
- **Description**: Users making progress on debts

#### Insight 4: "User Segments Distribution"
- **Type**: Trends
- **Event**: `onboarding_completed`
- **Breakdown**: By `user_segment` property

### 3. **Quick Checks**

**Total Users with Debts:**
- Go to Events → Filter by `debt_added_first`
- Count = Total users who've ever added a debt

**Recent Activity:**
- Live Events → Look for `debt_balance_updated`
- Shows users actively managing debts

**Conversion Rate:**
- Compare `onboarding_completed` vs `debt_added_first` counts

### 4. **User-Level Analysis**

**Find Specific Users:**
- Persons tab → Filter by events
- Look for users with `debt_added_first` event
- See their complete journey

### 5. **Key Questions to Answer**

1. **How many users have added debts?**
   - Count of unique users with `debt_added_first` event

2. **What's the conversion rate?**
   - `debt_added_first` / `onboarding_completed` * 100

3. **Which debt types are most common?**
   - Breakdown `debt_added_first` by `debt_type`

4. **Are users making progress?**
   - Count of `debt_balance_updated` events
   - Look for `is_progress: true` property

5. **Which user segments convert best?**
   - Funnel analysis by `user_segment`

### 6. **Real-Time Monitoring**

**Live Activity Check:**
```
1. PostHog → Live Events
2. Look for these events in real-time:
   - debt_added_first (new users adding debts)
   - debt_balance_updated (users updating progress)
   - onboarding_completed (new signups)
```

### 7. **Export Data (if needed)**

**CSV Export:**
- Any insight can be exported to CSV
- Good for sharing with stakeholders

**API Access:**
- PostHog has API for programmatic access
- Can build custom dashboards

---

## 🚨 Red Flags to Watch For

- **Low conversion**: `onboarding_completed` but no `debt_added_first`
- **No progress**: `debt_added_first` but no `debt_balance_updated`
- **High abandonment**: Users not completing onboarding

## 🎯 Success Metrics

- **>20% conversion** from onboarding to first debt
- **>10% of users** update balances monthly
- **Growing** `debt_milestone` events over time