const https = require('https');
const xml2js = require('xml2js');
const fs = require('fs');

// Robust RSS parser that handles malformed XML
function cleanXML(xmlString) {
  // Remove or encode common problematic characters
  return xmlString
    // Fix unescaped ampersands that aren't already part of entities
    .replace(/&(?![a-zA-Z0-9#]{1,7};)/g, '&amp;')
    // Fix unescaped less-than signs in content
    .replace(/<(?![!\/]?[a-zA-Z])/g, '&lt;')
    // Fix unescaped greater-than signs
    .replace(/(?<![a-zA-Z\/])>/g, '&gt;')
    // Clean up any malformed CDATA sections
    .replace(/<!\[CDATA\[(.*?)\]\]>/gs, (match, content) => {
      // Properly escape the content inside CDATA
      const cleanContent = content
        .replace(/]]>/g, ']]&gt;')
        .replace(/<!\[CDATA\[/g, '&lt;![CDATA[');
      return `<![CDATA[${cleanContent}]]>`;
    })
    // Remove any control characters that might cause issues
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

function fetchRSS(url) {
  return new Promise((resolve, reject) => {
    console.log(`Fetching RSS from: ${url}`);
    
    const request = https.get(url, {
      headers: {
        'User-Agent': 'TrySnowball RSS Reader/1.0'
      }
    }, (response) => {
      let data = '';
      
      // Handle redirects
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        console.log(`Redirecting to: ${response.headers.location}`);
        return fetchRSS(response.headers.location).then(resolve).catch(reject);
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
        return;
      }
      
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        console.log(`Received ${data.length} bytes of RSS data`);
        
        try {
          // Clean the XML before parsing
          const cleanedXML = cleanXML(data);
          console.log('XML cleaned successfully');
          
          // Create parser with more lenient options
          const parser = new xml2js.Parser({
            trim: true,
            explicitArray: false,
            ignoreAttrs: false,
            normalize: true,
            normalizeTags: true,
            explicitRoot: false,
            emptyTag: null,
            // More lenient parsing options
            strict: false,
            sanitize: true,
            // Handle CDATA properly
            charkey: '_',
            attrkey: '$'
          });
          
          parser.parseString(cleanedXML, (err, result) => {
            if (err) {
              console.error('XML parsing error after cleaning:', err.message);
              console.error('Error at position:', err.line, err.column);
              
              // Try one more time with even more aggressive cleaning
              try {
                const superCleanXML = data
                  .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, (match, content) => {
                    // Simply remove CDATA and encode the content
                    return content
                      .replace(/&/g, '&amp;')
                      .replace(/</g, '&lt;')
                      .replace(/>/g, '&gt;');
                  })
                  .replace(/&(?![a-zA-Z0-9#]{1,7};)/g, '&amp;')
                  .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
                
                parser.parseString(superCleanXML, (err2, result2) => {
                  if (err2) {
                    reject(new Error(`RSS parsing failed even after aggressive cleaning: ${err2.message}`));
                  } else {
                    resolve(result2);
                  }
                });
              } catch (fallbackError) {
                reject(new Error(`Final fallback parsing failed: ${fallbackError.message}`));
              }
            } else {
              resolve(result);
            }
          });
        } catch (cleaningError) {
          reject(new Error(`XML cleaning failed: ${cleaningError.message}`));
        }
      });
    });
    
    request.on('error', (err) => {
      reject(new Error(`Request failed: ${err.message}`));
    });
    
    // Set timeout
    request.setTimeout(30000, () => {
      request.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

function extractArticles(rssData) {
  try {
    console.log('Extracting articles from RSS data...');
    
    // Handle different RSS structures
    const channel = rssData.rss?.channel || rssData.channel || rssData;
    const items = channel.item || [];
    
    console.log(`Found ${Array.isArray(items) ? items.length : 1} items`);
    
    // Helper function to clean CDATA and HTML
    const cleanText = (text) => {
      if (!text) return '';
      return text
        .replace(/<!\[CDATA\[(.*?)\]\]>/gs, '$1') // Remove CDATA wrapper
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .trim();
    };
    
    const articles = (Array.isArray(items) ? items : [items]).map((item, index) => {
      try {
        // Extract guid as string, handling complex objects
        let guid = item.guid;
        if (typeof guid === 'object') {
          guid = guid._ || guid.text || item.link || `item-${index}`;
        }
        
        return {
          title: cleanText(item.title) || 'Untitled',
          link: item.link || (typeof item.guid === 'string' ? item.guid : item.guid?._ || ''),
          description: cleanText(item.description || item.summary) || '',
          pubDate: item.pubdate || item.published || new Date().toISOString(),
          guid: guid || `item-${index}`
        };
      } catch (itemError) {
        console.warn(`Error processing item ${index}:`, itemError.message);
        return null;
      }
    }).filter(Boolean); // Remove null items
    
    console.log(`Successfully extracted ${articles.length} articles`);
    return articles;
  } catch (error) {
    console.error('Error extracting articles:', error.message);
    return [];
  }
}

async function updateArticles() {
  const RSS_URL = 'https://trysnowball.substack.com/feed';
  const OUTPUT_FILE = 'public/articles.json';
  
  try {
    console.log('Starting RSS update process...');
    
    // Fetch and parse RSS
    const rssData = await fetchRSS(RSS_URL);
    console.log('RSS fetched and parsed successfully');
    
    // Extract articles
    const articles = extractArticles(rssData);
    
    if (articles.length === 0) {
      console.warn('No articles extracted from RSS feed');
      // Don't fail the build, just use empty array
    }
    
    // Ensure output directory exists
    const outputDir = OUTPUT_FILE.split('/').slice(0, -1).join('/');
    if (outputDir && !fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Write articles to file
    const outputData = {
      articles,
      lastUpdated: new Date().toISOString(),
      source: RSS_URL,
      count: articles.length
    };
    
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(outputData, null, 2));
    console.log(`✅ Successfully updated ${OUTPUT_FILE} with ${articles.length} articles`);
    
    // Log first few articles for verification
    if (articles.length > 0) {
      console.log('\nFirst few articles:');
      articles.slice(0, 3).forEach((article, index) => {
        console.log(`${index + 1}. ${article.title} (${article.pubDate})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error updating articles:', error.message);
    
    // Create a fallback empty file rather than failing the build
    const fallbackData = {
      articles: [],
      lastUpdated: new Date().toISOString(),
      source: RSS_URL,
      count: 0,
      error: error.message
    };
    
    try {
      const outputDir = OUTPUT_FILE.split('/').slice(0, -1).join('/');
      if (outputDir && !fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      fs.writeFileSync(OUTPUT_FILE, JSON.stringify(fallbackData, null, 2));
      console.log('Created fallback empty articles file');
    } catch (fallbackError) {
      console.error('Failed to create fallback file:', fallbackError.message);
      process.exit(1);
    }
    
    // Exit with success to prevent build failure
    console.log('Continuing with empty articles to prevent build failure');
  }
}

// Run the update
if (require.main === module) {
  updateArticles();
}

module.exports = { updateArticles, fetchRSS, extractArticles };