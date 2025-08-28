# 📁 Archived Auth Documentation

⚠️ **These documents are OBSOLETE and contain dangerous patterns that will cause crashes if followed.**

## 🚨 Why These Were Archived

**TrySnowball CP-1** removed all authentication infrastructure in favor of a **local-only, demo-first architecture**. These documents describe:

- **Supabase integration** (removed weeks ago)
- **Magic link authentication** (no longer exists)  
- **JWT token storage** (not used in current architecture)
- **Server-side auth endpoints** (don't exist)

**Following these guides would lead to crashes and broken functionality.**

## 📋 Archived Files

| File | Original Purpose | Why Obsolete |
|------|------------------|--------------|
| `AUTH_DEBUG_GUIDE_SUPABASE_OBSOLETE.md` | Supabase session debugging | Supabase completely removed |
| `MAGIC_LINK_TESTING_OBSOLETE.md` | Magic link flow testing | Magic links removed |
| `SUPABASE_MIGRATION_ANALYSIS_OBSOLETE.md` | Migration planning doc | Migration completed, Supabase removed |
| `CLOUDFLARE_MIGRATION_GUIDE_OBSOLETE.md` | Server auth setup | Decided against server-side auth |

## ✅ Current Architecture (CP-1)

**TrySnowball now uses:**
- **No authentication** - Direct access to debt tracking
- **Local IndexedDB storage** - All data via `debtsManager` facade  
- **Demo data mode** - Easy testing and screenshots
- **Static deployment** - No server dependencies

## 📖 Current Documentation

For current patterns, see:
- **[AUTH_DEBUG_GUIDE.md](../AUTH_DEBUG_GUIDE.md)** - CP-1 auth debugging (no auth)
- **[../examples/README.md](../../examples/README.md)** - Safe code patterns
- **[../ARCHITECTURE.md](../../ARCHITECTURE.md)** - Current system design

## 🚫 Dangerous Patterns in Archived Docs

**Do NOT copy any code from archived documents.** They contain:

```javascript
// ❌ All of these will crash or fail:
import { supabase } from './supabase';
const session = await supabase.auth.getSession();  
const token = localStorage.getItem('token');
fetch('/auth/me');
```

**Instead, use current safe patterns:**
```javascript  
// ✅ Current safe patterns:
const { debts, metrics } = useDebts();
const data = await debtsManager.getData();
const user = { id: 'demo', isAuthenticated: true }; // Demo mode
```

---

**If you need authentication debugging, use the current [AUTH_DEBUG_GUIDE.md](../AUTH_DEBUG_GUIDE.md) which explains the CP-1 auth-free architecture.**