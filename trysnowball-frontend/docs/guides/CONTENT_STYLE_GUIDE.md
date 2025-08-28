# TrySnowball - Content Style Guide

**Version**: 2.0.0  
**Last Updated**: January 2025  
**Target Market**: UK (with occasional US references where noted)  

## 🎯 Brand Voice & Tone

### Core Personality
- **Supportive, not preachy**: We understand debt is stressful
- **Direct, not corporate**: Plain English, no financial jargon
- **Encouraging, not patronising**: Celebrate progress, acknowledge challenges
- **Practical, not theoretical**: Focus on actionable steps and real results

### Tone Variations by Context
- **Onboarding**: Welcoming, reassuring, educational
- **Error states**: Apologetic, helpful, solution-focused
- **Success/milestones**: Celebratory, proud, motivating
- **Pro features**: Professional, value-focused, clear benefits
- **Financial advice**: Careful, disclaimer-aware, empowering

## 🇬🇧 UK Localisation Standards

### Currency & Numbers
- **Currency**: Always £ symbol, never GBP or pounds
- **Amounts**: £1,234.56 (comma thousands separator, full stop decimal)
- **Percentages**: 18.9% (one decimal place for interest rates)
- **Large numbers**: 1,000+ use commas, under 1,000 no separator

### Financial Terminology
| Use This (UK) | Not This (US) | Context |
|---------------|---------------|----------|
| Current account | Checking account | Bank accounts |
| Mortgage | Home loan | Property financing |
| Overdraft | Negative balance | Bank account deficit |
| APR (Annual Percentage Rate) | Interest rate | Always specify APR |
| Credit card | Credit card | ✓ Same globally |
| Personal loan | Personal loan | ✓ Same globally |
| Hire purchase | Installment plan | Vehicle/equipment financing |

### UK-Specific Financial Products
- **ISA (Individual Savings Account)** - not "savings account"
- **Premium Bonds** - government lottery bonds
- **Workplace pension** - not 401k
- **SIPP (Self-Invested Personal Pension)** - not IRA
- **Junior ISA** - not 529 plan
- **Help to Buy ISA/LISA** - UK housing schemes

### Dates & Times
- **Date format**: DD/MM/YYYY or "8 January 2025"
- **Time format**: 24-hour preferred (14:30) or 12-hour with am/pm
- **Relative dates**: "last month", "next week", "in 3 months"

## 📝 Writing Standards

### Reading Level
- **Target**: Reading age 14-16 (accessible to most adults)
- **Sentence length**: Average 15-20 words, max 25 words
- **Paragraph length**: 2-4 sentences maximum
- **Avoid**: Financial jargon, complex compound sentences

### Grammar & Style
- **British English**: -ise endings (recognise, organise, realise)
- **Oxford comma**: Use consistently (debt, loans, and overdrafts)
- **Contractions**: Encourage for friendly tone (you'll, we're, don't)
- **Active voice**: Preferred ("Update your balance" not "Your balance should be updated")

### Numbers & Measurements
- **Spell out**: Numbers one to nine in body text
- **Use numerals**: 10 and above, all percentages, all currency
- **Months**: Spell out (January, not 01 or Jan)
- **Time periods**: "3 months" not "three months", "2 years" not "two years"

## 😀 Emoji & Visual Language

### Emoji Usage Policy
- **Maximum**: 1-2 emojis per page/section
- **Placement**: Start of headings or highlight key points
- **Tone**: Supportive and encouraging, never frivolous
- **Avoid**: Complex emoji combinations, trending/slang emojis

### Approved Emojis by Context
- **Success/Progress**: 🎉 ✅ 📈 🚀
- **Security/Privacy**: 🔒 🛡️ ✓
- **Money/Finance**: 💳 💰 (sparingly)
- **Learning/Help**: 📚 💡 ❓
- **Warning/Attention**: ⚠️ ❌ (use judiciously)

### Icons Over Emojis
Prefer Lucide React icons for:
- Navigation elements
- Feature callouts
- Status indicators
- Action buttons

## 💬 User Interface Copy

### Button Text
- **Primary actions**: "Get started", "Add debt", "Update balance"
- **Secondary actions**: "Learn more", "View details", "Go back"
- **Destructive actions**: "Delete debt", "Clear data", "Remove account"
- **Disabled states**: "Calculating..." not "Loading..."

### Form Labels & Placeholders
- **Labels**: Clear, specific ("Current balance", not "Amount")
- **Placeholders**: Examples, not instructions ("£2,500.00", not "Enter amount")
- **Help text**: Below fields, in smaller grey text
- **Validation**: Specific, helpful ("Please enter a valid email address")

### Error Messages
- **Format**: "[Problem] - [Solution]"
- **Examples**: 
  - "Connection lost - Please check your internet and try again"
  - "Invalid email format - Please use name@domain.co.uk format"
  - "Balance too low - Minimum balance is £1"
- **Tone**: Apologetic but not over-dramatic

### Empty States
- **Encouraging**: "Ready to add your first debt?"
- **Actionable**: Include next step button/link
- **Helpful**: Explain what will happen next
- **Visual**: Use illustrations, not just text

## 🎯 Content by Section

### Onboarding & Education
- **Focus**: Building confidence, removing fear
- **Language**: "Let's start with", "Here's how", "You're in control"
- **Avoid**: Overwhelming detail, complex terminology
- **Include**: Clear next steps, escape routes

### AI Features (Pro)
- **Position**: Intelligent assistant, not replacement for user judgment  
- **Language**: "AI suggests", "Based on your data", "Consider this approach"
- **Disclaimers**: Clear about limitations, not qualified financial advice
- **Privacy**: Emphasise data anonymisation and privacy protection

### Financial Calculations
- **Transparency**: Always explain methodology
- **Caveats**: "Based on your current payments", "Assumes interest rates stay the same"
- **Optimism**: Focus on potential savings and time saved
- **Realism**: Include "life happens" messaging

### Subscription & Billing
- **Value-focused**: Lead with benefits, then price
- **Transparent**: No hidden fees, clear cancellation policy
- **Urgency**: Gentle, not aggressive ("Join over 1,000 users")
- **Social proof**: Real but anonymised success stories

## 🔍 Accessibility Guidelines

### Screen Reader Compatibility
- **Alt text**: Descriptive but concise
- **Link text**: Meaningful out of context ("Learn about debt strategies" not "Click here")
- **Headings**: Logical hierarchy (h1 → h2 → h3)
- **Labels**: All form inputs properly labelled

### Cognitive Accessibility
- **Progressive disclosure**: Show basics first, details on demand
- **Consistent navigation**: Same patterns throughout app
- **Clear language**: Avoid metaphors, explain technical terms
- **Chunked content**: Break long content into digestible sections

### Visual Accessibility
- **Colour contrast**: Minimum WCAG AA compliance
- **Font size**: Minimum 16px for body text
- **Line height**: 1.5x for readability
- **Focus states**: Clear keyboard navigation indicators

## ⚖️ Legal & Compliance

### Financial Disclaimers
Always include when providing financial guidance:
> "This is for educational purposes only and is not qualified financial advice. Consider consulting with a financial adviser for your specific situation."

### Data Protection Language
- **Transparent**: Explain exactly what data is collected
- **User control**: Emphasise opt-out options and data ownership
- **Simple language**: Avoid legal jargon in user-facing privacy notices
- **Action-focused**: "You can delete your data anytime"

### Marketing Claims
- **Evidence-based**: "Based on typical user data" not "guaranteed results"
- **Realistic**: Acknowledge that results vary by individual
- **Compliant**: Follow ASA guidelines for financial advertising
- **Honest**: Address limitations and potential challenges

## 📊 Content Testing & Quality

### Pre-Publish Checklist
- [ ] Reading level appropriate (Hemingway Editor: Grade 14 or below)
- [ ] British English spelling and terminology
- [ ] Currency formatting consistent (£X,XXX.XX)
- [ ] Emoji usage within guidelines (max 2 per section)
- [ ] All links working and relevant
- [ ] Mobile-friendly formatting (short paragraphs, scannable)

### A/B Testing Content
Test these elements regularly:
- **Headlines**: Clarity vs. personality
- **CTA buttons**: Action words vs. benefit words  
- **Error messages**: Technical vs. conversational
- **Onboarding copy**: Short vs. explanatory

### User Feedback Integration
- **Support tickets**: Track common confusion points
- **User testing**: Regular sessions with actual users
- **Analytics**: Monitor drop-off points in flows
- **Community feedback**: Social media and direct feedback

## 🔄 Content Maintenance

### Regular Reviews
- **Monthly**: Update any time-sensitive content (current rates, dates)
- **Quarterly**: Review for tone consistency and user feedback
- **Annually**: Full style guide review and update

### Version Control
- **Document changes**: Log all style guide updates
- **Team alignment**: Ensure all writers follow current guidelines
- **Tool integration**: Update Grammarly/style checking tools

---

*This style guide ensures TrySnowball maintains a consistent, accessible, and trustworthy voice that resonates with UK users while remaining welcoming to international visitors.*