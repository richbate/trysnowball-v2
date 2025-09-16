// src/App.js
import React, { useState, useRef, useEffect } from 'react';
import { Routes, Route, Link, useLocation, Navigate, useParams } from 'react-router-dom';

import { initPostHog } from './lib/posthog';
import { initWebVitals } from './reportWebVitals';
import './env';
import './utils/testPostHog';
import './utils/envDebug';

import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { UserFlowProvider } from './contexts/UserFlowContext';
import { useDemoMode } from './providers/DemoModeProvider';

import ThemeToggle from './components/ThemeToggle';
import StepperNavigation from './components/StepperNavigation';
import Button from './components/ui/Button';
import { Menu, ChevronDown, X } from 'lucide-react';

// Feature flags
import { FEATURE } from './lib/featureFlags';

// Pages - conditional based on feature flag
import HomeLegacy from './pages/HomeLegacy';
import HomeNew from './pages/Home';
import Plan from './pages/Plan';
import MyPlan from './pages/MyPlan/index';
import ChartLibraryDemo from './pages/ChartLibraryDemo';
import NotFound from './pages/NotFound';
import UpgradeSuccessToast from './components/UpgradeSuccessToast';
import OfflineBanner from './components/OfflineBanner';
import { AuthProvider, useAuth } from './contexts/AuthContext.tsx';
import { useDebts } from './hooks/useDebts';
import AuthDebugPanel from './components/AuthDebugPanel';
import AuthDebugBanner from './components/AuthDebugBanner';
import DemoChrome from './components/DemoChrome';
import FirstTimeOnboarding from './components/FirstTimeOnboarding';
import VersionInfo from './components/VersionInfo';
import { AppErrorBoundary } from './components/AppErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import PageSkeleton from './components/PageSkeleton';
import Status from './pages/Status';

const Home = FEATURE.newHomeIA ? HomeNew : HomeLegacy;

// Development test pages
const LocalTest = React.lazy(() => import('./pages/LocalTest'));
const ShareCardTest = React.lazy(() => import('./pages/ShareCardTest'));

// Lazy pages
const Landing = React.lazy(() => import('./pages/Landing'));
const LoginMagic = React.lazy(() => import('./pages/LoginMagic'));
const LoginSuccess = React.lazy(() => import('./pages/LoginSuccess'));
const SignupConfirmation = React.lazy(() => import('./pages/SignupConfirmation'));
const DemoEnter = React.lazy(() => import('./pages/DemoEnter'));
const MoneyMakeoverArticle = React.lazy(() => import('./pages/MoneyMakeoverArticle'));
const Article = React.lazy(() => import('./pages/Article'));
const Coach = React.lazy(() => import('./pages/Coach'));
const Waitlist = React.lazy(() => import('./pages/Waitlist'));
const Security = React.lazy(() => import('./pages/Security'));
const HowItWorks = React.lazy(() => import('./pages/HowItWorks'));
const LibraryLayout = React.lazy(() => import('./pages/library/LibraryLayout'));
const LibraryIndexPage = React.lazy(() => import('./pages/library'));
const DebtSnowballVsAvalanche = React.lazy(() => import('./pages/library/DebtSnowballVsAvalanche'));
const SmallDebtChallenge = React.lazy(() => import('./pages/library/SmallDebtChallenge'));
const AICoachLibrary = React.lazy(() => import('./pages/library/AICoach'));
const PayOff5000 = React.lazy(() => import('./pages/library/PayOff5000'));
const SpendReviewSnoop = React.lazy(() => import('./pages/library/SpendReviewSnoop'));
const FiveDebtMistakes = React.lazy(() => import('./pages/library/FiveDebtMistakes'));

// New library articles
const DebtSnowballPlan = React.lazy(() => import('./pages/library/DebtSnowballPlan'));
const DebtAvalanchePlan = React.lazy(() => import('./pages/library/DebtAvalanchePlan'));
const CustomStrategyPlan = React.lazy(() => import('./pages/library/CustomStrategyPlan'));
const UpdateBalancesGuide = React.lazy(() => import('./pages/library/UpdateBalancesGuide'));
const PriorityDebtsUK = React.lazy(() => import('./pages/library/PriorityDebtsUK'));
const BreathingSpaceUK = React.lazy(() => import('./pages/library/BreathingSpaceUK'));
const HowToUpdateBalances = React.lazy(() => import('./pages/library/HowToUpdateBalances'));
const Upgrade = React.lazy(() => import('./pages/Upgrade'));
const Billing = React.lazy(() => import('./pages/Billing'));
const Profile = React.lazy(() => import('./pages/Profile'));
const Onboarding = React.lazy(() => import('./pages/Onboarding'));

// New simple library system
const LibraryHome = React.lazy(() => import('./pages/LibraryHome'));
const ArticlePage = React.lazy(() => import('./pages/ArticlePage'));

function ArticleRedirect() {
  const { slug } = useParams();
  return <Navigate to={`/library/${slug}`} replace />;
}

function Dropdown({ title, items, isOpen, setIsOpen, colors }) {
  const dropdownRef = useRef(null);
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setIsOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${colors.text.secondary} hover:${colors.text.primary} hover:${colors.surfaceSecondary} flex items-center`}
      >
        <span>{title}</span>
        <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className={`absolute top-full left-0 mt-1 w-56 ${colors.surface} ${colors.border} border rounded-lg shadow-lg z-50`}>
          <div className="py-1">
            {items.map(([path, label, description]) => (
              <Link
                key={path}
                to={path}
                onClick={() => setIsOpen(false)}
                className={`block px-4 py-3 text-sm transition-colors hover:${colors.surfaceSecondary} ${colors.text.primary}`}
              >
                <div className="font-medium">{label}</div>
                {description && <div className={`text-xs ${colors.text.muted} mt-1`}>{description}</div>}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const location = useLocation();
  const { colors } = useTheme();
  const { user, authReady } = useAuth();
  const { debts } = useDebts();
  const hasDebtData = debts && debts.length > 0;
  const { enterDemo } = useDemoMode();

  const isFirstTimeUser = !localStorage.getItem('onboarding_completed');
  const shouldShowOnboarding = isFirstTimeUser && authReady && location.pathname === '/';
  
  // Demo route guard + query handling with kill switch
  useEffect(() => {
    if (!authReady) return;
    
    // Kill switch - disable demo mode entirely
    const demoDisabled = process.env.REACT_APP_DISABLE_DEMO === 'true';
    if (demoDisabled && location.pathname.startsWith('/demo')) {
      window.location.replace('/');
      return;
    }
    
    const url = new URL(window.location.href);
    const wantsDemo = url.searchParams.get('demo') === '1';
    const profile = url.searchParams.get('profile') || 'default';
    
    // Block demo for disabled state
    if (demoDisabled && wantsDemo) {
      return; // Ignore demo query param
    }
    
    // Handle ?demo=1 query parameter for non-authenticated users
    if (!user && wantsDemo && location.pathname !== '/demo') {
      enterDemo('query', profile);
      return;
    }
    
    // Handle /demo route for non-authenticated users
    if (!user && location.pathname.startsWith('/demo')) {
      enterDemo('route', profile);
      return;
    }
    
    // Redirect authenticated users away from demo routes
    if (user && location.pathname.startsWith('/demo')) {
      window.location.replace('/');
      return;
    }
  }, [location.pathname, location.search, user, authReady, enterDemo]);

  if (!authReady) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  if (shouldShowOnboarding) {
    return <FirstTimeOnboarding onComplete={() => (window.location.href = '/debts?onboarding=completed')} />;
  }

  const coreNavItems = [
    ['/', 'Home'],
    [FEATURE.newHomeIA ? '/plan' : '/my-plan', 'Plan'],
    ['/ai/coach', 'Coach'],
    ['/library', 'Learn'],
    ['/account', 'Account'],
  ];
  
  const accountItems = [
    ['/account/upgrade', 'Go Pro', 'Unlock unlimited features'],
    ['/account/export', 'Export', 'Download your data as CSV'],
  ];

  return (
    <div className={`min-h-screen ${colors.background}`}>
      <AuthDebugBanner />
      <DemoChrome />

      {/* DESKTOP NAV */}
      <nav className={`${colors.surface} shadow-sm ${colors.border} border-b sticky top-0 z-50`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left: Logo */}
            <Link to="/" className="flex items-center space-x-3 transition-colors">
              <img src="/logo-transparent.png" alt="Try Snowball logo" className="h-10 w-auto" />
              <span className={`text-base font-semibold ${colors.text.primary}`}>TrySnowball</span>
            </Link>

            {/* Desktop links */}
            <div className="hidden lg:flex items-center space-x-1">
              {coreNavItems.map(([path, label]) => {
                const active = location.pathname === path;
                return (
                  <Link
                    key={path}
                    to={path}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      active
                        ? 'bg-primary text-white shadow-sm transform scale-105'
                        : `${colors.text.secondary} hover:${colors.text.primary} hover:${colors.surfaceSecondary}`
                    }`}
                  >
                    {label}
                  </Link>
                );
              })}

              <div className={`w-px h-6 mx-2 ${colors.border}`} />

              {/* Login/Signup */}
              {user ? (
                <Link to="/auth/login" className={`px-3 py-2 text-sm ${colors.text.secondary} hover:${colors.text.primary}`}>
                  Logout
                </Link>
              ) : (
                <>
                  <Link to="/auth/login" className={`px-3 py-2 text-sm ${colors.text.secondary} hover:${colors.text.primary}`}>
                    Login
                  </Link>
                  <Button variant="primary" size="sm">
                    Sign Up Free
                  </Button>
                </>
              )}

              <ThemeToggle />
            </div>

            {/* Mobile toggles */}
            <div className="lg:hidden flex items-center space-x-2">
              <ThemeToggle />
              <button
                type="button"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={`${colors.text.secondary} hover:${colors.text.primary} p-2 rounded-lg`}
                aria-label="Toggle menu"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          {isMenuOpen && (
            <div className={`lg:hidden pb-4`}>
              <div className="flex flex-col space-y-2 mt-2">
                {coreNavItems.map(([path, label]) => (
                  <Link
                    key={path}
                    to={path}
                    onClick={() => setIsMenuOpen(false)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      location.pathname === path
                        ? 'bg-primary text-white shadow-sm'
                        : `${colors.text.secondary} hover:${colors.text.primary} hover:${colors.surfaceSecondary}`
                    }`}
                  >
                    {label}
                  </Link>
                ))}

                <div className={`h-px ${colors.border}`} />

                {user ? (
                  <Link
                    to="/auth/login"
                    onClick={() => setIsMenuOpen(false)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${colors.text.secondary} hover:${colors.text.primary} hover:${colors.surfaceSecondary}`}
                  >
                    Logout
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/auth/login"
                      onClick={() => setIsMenuOpen(false)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${colors.text.secondary} hover:${colors.text.primary} hover:${colors.surfaceSecondary}`}
                    >
                      Login
                    </Link>
                    <Link
                      to="/auth/login"
                      onClick={() => setIsMenuOpen(false)}
                      className="px-3 py-2 rounded-lg text-sm font-medium bg-primary text-white text-center"
                    >
                      Sign Up Free
                    </Link>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      <StepperNavigation hasDebtData={hasDebtData} />
      <AuthDebugPanel />

      <div className={`transition-all duration-300 ease-in-out ${colors.background} min-h-screen`} data-testid="app">
        <UpgradeSuccessToast />
        <Routes>
          {/* Landing & Auth Flow */}
          <Route path="/landing" element={<React.Suspense fallback={<PageSkeleton />}><Landing /></React.Suspense>} />
          <Route path="/onboarding" element={<React.Suspense fallback={<PageSkeleton />}><Onboarding /></React.Suspense>} />
          <Route path="/auth/signup-confirmation" element={<React.Suspense fallback={<PageSkeleton />}><SignupConfirmation /></React.Suspense>} />
          
          {/* Core */}
          <Route path="/" element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          } />
          <Route path="/waitlist" element={<React.Suspense fallback={<PageSkeleton />}><Waitlist /></React.Suspense>} />
          <Route path="/upgrade" element={<React.Suspense fallback={<PageSkeleton />}><Upgrade /></React.Suspense>} />
          <Route path="/pricing" element={<Navigate to="/upgrade" replace />} />
          
          {/* New Plan route (with feature flag) */}
          {FEATURE.newHomeIA ? (
            <>
              <Route path="/plan/*" element={<Plan />} />
              <Route path="/my-plan/*" element={<Navigate to="/plan" replace />} />
            </>
          ) : (
            <Route path="/my-plan/*" element={<MyPlan />} />
          )}

          {/* Debt Management - Redirect based on feature flag */}
          <Route path="/debts" element={<Navigate to={FEATURE.newHomeIA ? "/plan/debts" : "/my-plan/debts"} replace />} />
          {!FEATURE.newHomeIA && <Route path="/plan" element={<Navigate to="/my-plan" replace />} />}
          <Route path="/tools/debt-plan" element={<Navigate to={FEATURE.newHomeIA ? "/plan" : "/my-plan"} replace />} />
          <Route path="/what-if" element={<Navigate to={FEATURE.newHomeIA ? "/plan/forecast?scenario=true" : "/my-plan/forecast?scenario=true"} replace />} />

          {/* Library (new simple system) */}
          <Route path="/library" element={<React.Suspense fallback={<PageSkeleton />}><LibraryHome /></React.Suspense>} />
          
          {/* New library articles */}
          <Route path="/library/debt-snowball-plan" element={<React.Suspense fallback={<PageSkeleton />}><DebtSnowballPlan /></React.Suspense>} />
          <Route path="/library/debt-avalanche-plan" element={<React.Suspense fallback={<PageSkeleton />}><DebtAvalanchePlan /></React.Suspense>} />
          <Route path="/library/custom-strategy-plan" element={<React.Suspense fallback={<PageSkeleton />}><CustomStrategyPlan /></React.Suspense>} />
          <Route path="/library/update-balances-guide" element={<React.Suspense fallback={<PageSkeleton />}><UpdateBalancesGuide /></React.Suspense>} />
          <Route path="/library/priority-debts-uk" element={<React.Suspense fallback={<PageSkeleton />}><PriorityDebtsUK /></React.Suspense>} />
          <Route path="/library/breathing-space-uk" element={<React.Suspense fallback={<PageSkeleton />}><BreathingSpaceUK /></React.Suspense>} />
          <Route path="/library/how-to-update-balances" element={<React.Suspense fallback={<PageSkeleton />}><HowToUpdateBalances /></React.Suspense>} />
          <Route path="/library/debt-snowball-vs-avalanche" element={<React.Suspense fallback={<PageSkeleton />}><DebtSnowballVsAvalanche /></React.Suspense>} />
          <Route path="/library/small-debt-challenge" element={<React.Suspense fallback={<PageSkeleton />}><SmallDebtChallenge /></React.Suspense>} />
          <Route path="/library/five-debt-mistakes" element={<React.Suspense fallback={<PageSkeleton />}><FiveDebtMistakes /></React.Suspense>} />
          
          {/* Legacy markdown-based articles */}
          <Route path="/library/strategies-snowball-vs-avalanche" element={<React.Suspense fallback={<PageSkeleton />}><ArticlePage /></React.Suspense>} />
          <Route path="/library/custom-strategy-how-to" element={<React.Suspense fallback={<PageSkeleton />}><ArticlePage /></React.Suspense>} />

          {/* Legacy library (nested) - kept for backwards compatibility */}
          <Route path="/library-old" element={<React.Suspense fallback={<PageSkeleton />}><LibraryLayout /></React.Suspense>}>
            <Route index element={<React.Suspense fallback={<PageSkeleton />}><LibraryIndexPage /></React.Suspense>} />
            <Route path="debt-snowball-vs-avalanche" element={<React.Suspense fallback={<PageSkeleton />}><DebtSnowballVsAvalanche /></React.Suspense>} />
            <Route path="small-debt-challenge" element={<React.Suspense fallback={<PageSkeleton />}><SmallDebtChallenge /></React.Suspense>} />
            <Route path="ai-coach" element={<React.Suspense fallback={<PageSkeleton />}><AICoachLibrary /></React.Suspense>} />
            <Route path="pay-off-5000-fast" element={<React.Suspense fallback={<PageSkeleton />}><PayOff5000 /></React.Suspense>} />
            <Route path="spend-review-snoop" element={<React.Suspense fallback={<PageSkeleton />}><SpendReviewSnoop /></React.Suspense>} />
            <Route path="five-debt-mistakes" element={<React.Suspense fallback={<PageSkeleton />}><FiveDebtMistakes /></React.Suspense>} />
          </Route>

          {/* Legacy library routes */}
          <Route path="/library/money-makeover" element={<React.Suspense fallback={<PageSkeleton />}><MoneyMakeoverArticle /></React.Suspense>} />
          <Route path="/library/:slug" element={<React.Suspense fallback={<PageSkeleton />}><Article /></React.Suspense>} />
          <Route path="/how-it-works" element={<React.Suspense fallback={<PageSkeleton />}><HowItWorks /></React.Suspense>} />
          <Route path="/security" element={<React.Suspense fallback={<PageSkeleton />}><Security /></React.Suspense>} />

          {/* Auth */}
          <Route path="/auth/login" element={<React.Suspense fallback={<PageSkeleton />}><LoginMagic /></React.Suspense>} />
          <Route path="/login-success" element={<React.Suspense fallback={<PageSkeleton />}><LoginSuccess /></React.Suspense>} />

          {/* AI Coach */}
          <Route path="/ai/coach" element={<React.Suspense fallback={<PageSkeleton />}><Coach /></React.Suspense>} />

          {/* Account */}
          <Route path="/account" element={<Navigate to="/account/upgrade" replace />} />
          <Route path="/account/upgrade" element={<React.Suspense fallback={<PageSkeleton />}><Upgrade /></React.Suspense>} />
          <Route path="/account/export" element={<React.Suspense fallback={<PageSkeleton />}><Profile /></React.Suspense>} />
          <Route path="/profile" element={<React.Suspense fallback={<PageSkeleton />}><Profile /></React.Suspense>} />
          <Route path="/billing" element={<React.Suspense fallback={<PageSkeleton />}><Billing /></React.Suspense>} />

          {/* Demo mode - with kill switch */}
          {process.env.REACT_APP_DISABLE_DEMO !== 'true' && (
            <Route path="/demo" element={<React.Suspense fallback={<PageSkeleton />}><DemoEnter /></React.Suspense>} />
          )}
          
          {/* Status & redirects */}
          <Route path="/status" element={<Status />} />
          
          {/* Development test pages */}
          <Route path="/dev/charts" element={<ChartLibraryDemo />} />
          <Route path="/dev/local-test" element={<React.Suspense fallback={<PageSkeleton />}><LocalTest /></React.Suspense>} />
          <Route path="/dev/share-card-test" element={<React.Suspense fallback={<PageSkeleton />}><ShareCardTest /></React.Suspense>} />
          <Route path="/ref/:referralId" element={<Navigate to="/" replace />} />
          <Route path="/money-makeover" element={<Navigate to="/library/money-makeover" replace />} />
          <Route path="/ai-coach" element={<Navigate to="/ai/coach" replace />} />
          <Route path="/coach" element={<Navigate to="/ai/coach" replace />} />
          <Route path="/ai-report" element={<Navigate to="/ai/coach" replace />} />
          <Route path="/article/:slug" element={<ArticleRedirect />} />
          <Route path="/what-if" element={<Navigate to="/my-plan?tab=timeline&scenario=true" replace />} />
          <Route path="/login" element={<Navigate to="/auth/login" replace />} />
          <Route path="/login/success" element={<Navigate to="/login-success" replace />} />
          <Route path="/auth/success" element={<React.Suspense fallback={<PageSkeleton />}><LoginSuccess /></React.Suspense>} />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>

      {/* FOOTER */}
      <footer className={`${colors.surface} border-t ${colors.border} mt-auto`}>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="col-span-1">
              <div className="flex items-center space-x-3 mb-4">
                <img src="/logo-transparent.png" alt="Try Snowball logo" className="h-8 w-auto" />
                <span className={`text-lg font-semibold ${colors.text.primary}`}>TrySnowball</span>
              </div>
              <p className={`text-sm ${colors.text.secondary} max-w-sm`}>
                Beat debt faster with personalized coaching and smart payoff strategies.
              </p>
            </div>
            <div className="col-span-1">
              <h3 className={`text-sm font-semibold ${colors.text.primary} mb-4`}>Quick Links</h3>
              <ul className="space-y-2">
                <li><Link to="/debts" className={`text-sm ${colors.text.secondary} hover:${colors.text.primary}`}>Track Debts</Link></li>
                <li><Link to="/library" className={`text-sm ${colors.text.secondary} hover:${colors.text.primary}`}>Learn</Link></li>
              </ul>
            </div>
            <div className="col-span-1">
              <h3 className={`text-sm font-semibold ${colors.text.primary} mb-4`}>Support</h3>
              <ul className="space-y-2 mb-4">
                <li><Link to="/security" className={`text-sm ${colors.text.secondary} hover:${colors.text.primary}`}>Security</Link></li>
                <li><Link to="/how-it-works" className={`text-sm ${colors.text.secondary} hover:${colors.text.primary}`}>How It Works</Link></li>
              </ul>
              <div className="space-y-2">
                <a href="mailto:hello@trysnowball.co.uk" className={`text-sm ${colors.text.secondary} hover:${colors.text.primary} flex items-center space-x-2`}>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                  <span>hello@trysnowball.co.uk</span>
                </a>
                <p className={`text-xs ${colors.text.muted}`}>Questions? Feedback? We'd love to hear from you!</p>
              </div>
            </div>
          </div>
          <div className={`border-t ${colors.border} pt-6 mt-6 flex flex-col sm:flex-row justify-between items-center`}>
            <div className="flex items-center space-x-4">
              <p className={`text-xs ${colors.text.muted}`}>© {new Date().getFullYear()} TrySnowball.</p>
              <VersionInfo />
            </div>
            <div className="flex space-x-4 mt-4 sm:mt-0">
              <span className={`text-xs ${colors.text.muted}`}>Made with ❤️ for debt freedom</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function App() {
  console.log('🚀 App component rendering');
  useEffect(() => {
    console.log('🗺️ App routing - pathname:', window.location.pathname);
    initPostHog();
    initWebVitals();
    if (process.env.NODE_ENV === 'development') {
      import('./utils/securityDevTools').catch(() => {});
    }
  }, []);

  return (
    <AppErrorBoundary>
      <ThemeProvider>
        <UserFlowProvider>
          <AuthProvider>
            {/* No Router here — index.js owns BrowserRouter */}
            <OfflineBanner />
            <Navigation />
          </AuthProvider>
        </UserFlowProvider>
      </ThemeProvider>
    </AppErrorBoundary>
  );
}

export default App;