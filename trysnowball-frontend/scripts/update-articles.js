const https = require('https');
const fs = require('fs');
const { parseString } = require('xml2js');
const { JSDOM } = require('jsdom');

const RSS_URL = 'https://trysnowball.substack.com/feed';

// Strip HTML to get plain text
function stripHtml(html) {
  return html.replace(/<[^>]*>/g, '').trim();
}

// Estimate read time
function estimateReadTime(content) {
  const words = stripHtml(content).split(/\s+/).length;
  const minutes = Math.ceil(words / 200);
  return `${minutes} min read`;
}

// Convert title to slug
function slugify(str) {
  return str.toLowerCase().replace(/[^\w ]+/g, '').replace(/ +/g, '-');
}

// Categorise article based on title/content
function categorizeArticle(title, content) {
  const titleLower = title.toLowerCase();
  const contentLower = content.toLowerCase();

  if (titleLower.includes('built') || titleLower.includes('tool') || contentLower.includes('personal')) return { category: 'Personal Story', categoryColor: 'blue' };
  if (titleLower.includes('spending') || titleLower.includes('impulse') || titleLower.includes('sales')) return { category: 'Spending Tips', categoryColor: 'green' };
  if (titleLower.includes('why') || titleLower.includes('made') || titleLower.includes('story')) return { category: 'Origin Story', categoryColor: 'purple' };
  if (titleLower.includes('debt') || titleLower.includes('payoff') || titleLower.includes('snowball')) return { category: 'Debt Strategy', categoryColor: 'red' };
  if (titleLower.includes('money') || titleLower.includes('finance') || titleLower.includes('budget')) return { category: 'Money Tips', categoryColor: 'yellow' };

  return { category: 'Financial Insights', categoryColor: 'indigo' };
}

// Clean content from RSS content:encoded field
function cleanRSSContent(content) {
  if (!content) return '';
  
  try {
    // Wrap content in a proper HTML structure
    const dom = new JSDOM(`<!DOCTYPE html><html><body>${content}</body></html>`);
    const document = dom.window.document;
    const body = document.body;

    if (!body) {
      console.warn('No body element found, returning original content');
      return content;
    }

    // Remove any remaining Substack-specific elements
    [...body.querySelectorAll('[data-testid], [class*="pencraft"], [class*="pc-"]')].forEach(el => el.remove());
    
    // Remove subscription CTAs and promotional content
    [...body.querySelectorAll('*')].forEach(el => {
      const text = el.textContent?.toLowerCase() || '';
      if ((text.includes('subscribe') && text.includes('free')) || 
          text.includes('thanks for reading') ||
          text.includes('support my work')) {
        el.remove();
      }
    });

    // Remove empty elements
    [...body.querySelectorAll('*')].forEach(el => {
      if (!el.textContent?.trim() && !el.querySelector('img')) {
        el.remove();
      }
    });

    // Clean up attributes but keep essential ones
    [...body.querySelectorAll('*')].forEach(el => {
      // Keep href for links, src for images, but remove everything else
      const keepAttrs = ['href', 'src', 'alt'];
      const attrs = [...el.attributes];
      attrs.forEach(attr => {
        if (!keepAttrs.includes(attr.name)) {
          el.removeAttribute(attr.name);
        }
      });
    });

    // Highlight money amounts in the content
    let cleanedHTML = body.innerHTML.trim();
    
    // Match currency symbols followed by numbers (£100, $50, etc.)
    cleanedHTML = cleanedHTML.replace(/([£$€¥][\d,]+(?:\.\d{2})?)/g, '<span class="money-amount">$1</span>');
    
    // Match numbers followed by common debt terms
    cleanedHTML = cleanedHTML.replace(/(\d+[k]?\s*(?:debt|overdraft|balance|payment))/gi, '<span class="money-amount">$1</span>');

    return cleanedHTML;
  } catch (error) {
    console.warn('Error cleaning RSS content:', error.message);
    return content; // Return original content if cleaning fails
  }
}

// Fetch, parse, and write articles
https.get(RSS_URL, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', async () => {
    parseString(data, async (err, result) => {
      if (err) {
        console.error('❌ Error parsing RSS:', err);
        process.exit(1);
      }

      const articles = [];
      const items = result.rss.channel[0].item || [];

      for (const item of items) {
        const title = item.title[0];
        const description = item.description[0];
        const link = item.link[0];
        const pubDate = new Date(item.pubDate[0]);

        // Extract full content from RSS content:encoded field
        const contentEncoded = item['content:encoded'] ? item['content:encoded'][0] : '';
        const fullContent = cleanRSSContent(contentEncoded);

        const plainDescription = stripHtml(description);
        let excerpt = plainDescription.split('.')[0];
        if (excerpt.length > 150) excerpt = plainDescription.substring(0, 150) + '...';

        const readTime = estimateReadTime(fullContent || description);
        const { category, categoryColor } = categorizeArticle(title, fullContent || description);
        const slug = slugify(title);
        articles.push({
          title,
          excerpt,
          url: link,
          publishedDate: pubDate.toISOString().split('T')[0],
          readTime,
          category,
          categoryColor,
          slug,
          content: fullContent
        });
      }

      articles.sort((a, b) => new Date(b.publishedDate) - new Date(a.publishedDate));

      const filePath = './public/articles.json';
      fs.writeFileSync(filePath, JSON.stringify({ articles, lastUpdated: new Date().toISOString() }, null, 2));

      console.log(`✅ Updated ${articles.length} articles with full content`);
    });
  });
}).on('error', (err) => {
  console.error('❌ Error fetching RSS:', err);
});