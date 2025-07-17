// SEO utility functions for dynamic meta tags
export const updatePageTitle = (title) => {
  document.title = title;
};

export const updateMetaDescription = (description) => {
  let metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription) {
    metaDescription.setAttribute('content', description);
  }
};

export const updateCanonicalUrl = (url) => {
  let canonical = document.querySelector('link[rel="canonical"]');
  if (canonical) {
    canonical.setAttribute('href', url);
  }
};

export const updateOpenGraphTags = (title, description, url) => {
  const ogTitle = document.querySelector('meta[property="og:title"]');
  const ogDescription = document.querySelector('meta[property="og:description"]');
  const ogUrl = document.querySelector('meta[property="og:url"]');
  
  if (ogTitle) ogTitle.setAttribute('content', title);
  if (ogDescription) ogDescription.setAttribute('content', description);
  if (ogUrl) ogUrl.setAttribute('content', url);
};

export const updateTwitterTags = (title, description, url) => {
  const twitterTitle = document.querySelector('meta[property="twitter:title"]');
  const twitterDescription = document.querySelector('meta[property="twitter:description"]');
  const twitterUrl = document.querySelector('meta[property="twitter:url"]');
  
  if (twitterTitle) twitterTitle.setAttribute('content', title);
  if (twitterDescription) twitterDescription.setAttribute('content', description);
  if (twitterUrl) twitterUrl.setAttribute('content', url);
};

export const updatePageSEO = (pageData) => {
  const { title, description, url, fullTitle } = pageData;
  
  updatePageTitle(fullTitle || `${title} - TrySnowball`);
  updateMetaDescription(description);
  updateCanonicalUrl(url);
  updateOpenGraphTags(fullTitle || `${title} - TrySnowball`, description, url);
  updateTwitterTags(fullTitle || `${title} - TrySnowball`, description, url);
};

// Page-specific SEO data
export const SEO_DATA = {
  home: {
    title: "Debt Payoff Calculator & Financial Freedom Tools",
    description: "Get out of debt faster with smart payment strategies. Free debt payoff calculator, what-if scenarios, and financial freedom tips.",
    url: "https://trysnowball.co.uk/",
    fullTitle: "TrySnowball - Debt Payoff Calculator & Financial Freedom Tools"
  },
  debts: {
    title: "My Debts - Debt Tracker",
    description: "Track your debts and create a personalized payoff plan using the debt snowball or avalanche method.",
    url: "https://trysnowball.co.uk/my-debts"
  },
  whatif: {
    title: "What-If Scenarios - Debt Payoff Calculator",
    description: "Explore different debt payoff strategies and see how extra payments can accelerate your path to financial freedom.",
    url: "https://trysnowball.co.uk/what-if"
  },
  aicoach: {
    title: "AI Debt Coach - Personalized Financial Guidance",
    description: "Get personalized debt advice and financial guidance from our AI coach to optimize your debt payoff strategy.",
    url: "https://trysnowball.co.uk/ai-coach"
  },
  library: {
    title: "Financial Freedom Library - Debt Resources",
    description: "Essential books, guides, and resources for debt payoff, budgeting, and achieving financial freedom.",
    url: "https://trysnowball.co.uk/library"
  },
  futureplans: {
    title: "Future Plans - Roadmap & Feature Voting",
    description: "See what's coming next for TrySnowball and vote on features you'd like to see added.",
    url: "https://trysnowball.co.uk/future-plans"
  }
};