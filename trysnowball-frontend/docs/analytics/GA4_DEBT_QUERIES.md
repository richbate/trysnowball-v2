# 🔍 GA4 Debt Activity Queries - Property 495676011

## **Quick Debt Activity Check**

### **Query 1: Debt Page Traffic**
```
Reports → Engagement → Pages and Screens
Filter: Page title/Page location contains "debt" OR "/debts"
Date Range: Last 90 days
```
**What it shows:** Historic traffic to debt management pages

### **Query 2: AI Coach Engagement**  
```
Reports → Engagement → Events
Filter: Event name = "ai_coach_page_visit"
Date Range: All time
```
**What it shows:** Total users who've accessed AI coaching

### **Query 3: Active Debt Users**
```
Explore → Free Form
Dimensions: User pseudo ID, Event name, Date
Metrics: Event count
Filters: Event name contains "ai_coach" OR Page location contains "debt"
```
**What it shows:** Individual users engaging with debt features

### **Query 4: User Journey to Debt Features**
```
Explore → Path Exploration  
Starting point: Page location = "/" (homepage)
Exploration: Page location contains "debt" OR "coach"
```
**What it shows:** How users discover debt management

## **Advanced Analysis**

### **Conversion Funnel:**
```
1. Homepage visit
2. /debts page visit  
3. ai_coach_page_visit event
4. ai_coach_feedback event
```

### **Cohort Analysis:**
```
Users by first visit date → Retention to debt features
```

### **Geographic Analysis:**
```
Reports → User → Demographics → Location
Filter: Users who triggered ai_coach_page_visit
```

## **Key Metrics to Track**

- **Total users with debt activity:** Unique users on /debts pages
- **AI coach adoption:** Users with ai_coach_page_visit events  
- **Engagement depth:** Users with multiple debt-related events
- **Conversion rate:** Homepage visitors → Debt feature users

Your GA4 property 495676011 should have all this historic data! 📊