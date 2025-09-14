import { useEffect, useState } from "react";
import { secureAnalytics } from "../utils/secureAnalytics";

const BANNER_VERSION = "2025-09-privacy-v1"; // bump if copy/logic changes
const LS_KEY = `ts_privacy_banner_dismissed_${BANNER_VERSION}`;

export default function PrivacySecurityBanner({ className = "" }) {
 const [show, setShow] = useState(false);

 useEffect(() => {
  const dismissed = localStorage.getItem(LS_KEY) === "1";
  if (!dismissed) {
   setShow(true);
   secureAnalytics.trackEvent("privacy_announcement_viewed", { version: BANNER_VERSION });
  }
 }, []);

 if (!show) return null;

 const onDismiss = () => {
  localStorage.setItem(LS_KEY, "1");
  setShow(false);
  secureAnalytics.trackEvent("privacy_announcement_dismissed", { version: BANNER_VERSION });
 };

 const onLearnMore = () => {
  secureAnalytics.trackEvent("privacy_announcement_learn_more_clicked", { version: BANNER_VERSION });
 };

 return (
  <div
   data-testid="privacy-banner"
   role="status"
   aria-live="polite"
   className={
    "mx-auto max-w-5xl rounded-2xl border border-emerald-300/60 bg-emerald-50 p-4 sm:p-5 shadow-sm " +
    "flex flex-col sm:flex-row sm:items-center gap-3 " + className
   }
  >
   <div className="flex-1">
    <p className="text-emerald-900 font-semibold">
     Your data is safe — always encrypted, never sold.
    </p>
    <p className="text-emerald-900/80 text-sm mt-1">
     We now encrypt every debt before it's stored (AES-256-GCM). Analytics are de-identified
     (bands only) and hosted in the EU. No plaintext creditor names or exact balances are ever
     stored.
    </p>
    <div className="mt-3 flex flex-wrap gap-2">
     <a
      href="/privacy"
      onClick={onLearnMore}
      data-testid="privacy-learn-more"
      className="inline-flex items-center rounded-xl px-3 py-2 text-sm border border-emerald-300 hover:bg-emerald-100"
     >
      Learn more
     </a>
     <a
      href="/settings#privacy"
      className="inline-flex items-center rounded-xl px-3 py-2 text-sm border border-emerald-300 hover:bg-emerald-100"
     >
      Manage analytics (opt-in)
     </a>
    </div>
   </div>
   <button
    type="button"
    onClick={onDismiss}
    data-testid="privacy-dismiss"
    aria-label="Dismiss privacy announcement"
    className="self-start sm:self-center rounded-full p-2 hover:bg-emerald-100"
   >
    ✕
   </button>
  </div>
 );
}