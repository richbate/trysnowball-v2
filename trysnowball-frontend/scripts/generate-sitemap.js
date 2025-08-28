const fs = require('fs');
const path = require('path');

// Article list - sync with actual articles
const ARTICLES = [
  'debt-snowball-vs-avalanche',
  'small-debt-challenge', 
  'ai-coach',
  'pay-off-5000-fast',
  'spend-review-snoop',
  'five-debt-mistakes'
];

const base = 'https://trysnowball.co.uk';
const urls = [
  '/',
  '/library',
  ...ARTICLES.map(slug => `/library/${slug}`),
  '/how-it-works',
  '/security',
  '/library/strategies',
  '/upgrade',
  '/auth/login'
];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${base}${url}</loc>
    <changefreq>weekly</changefreq>
    <priority>${url === '/' ? '1.0' : url.startsWith('/library/') ? '0.8' : '0.6'}</priority>
  </url>`).join('\n')}
</urlset>`;

// Write to public directory
const publicDir = path.join(__dirname, '..', 'public');
const sitemapPath = path.join(publicDir, 'sitemap.xml');

try {
  fs.writeFileSync(sitemapPath, xml, 'utf8');
  console.log(`✅ Sitemap generated: ${sitemapPath}`);
  console.log(`📄 ${urls.length} URLs included`);
} catch (error) {
  console.error('❌ Failed to generate sitemap:', error.message);
  process.exit(1);
}