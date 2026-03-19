/**
 * Google News RSSãã£ã¼ããåå¾ãããªãã¤ã¬ã¯ãURLãå®URLã«è§£æ±ºããã¹ã¯ãªãã
 * GitHub Actionsã§å®æå®è¡ããã
 *
 * åºå: data/articles.jsonï¼è¨äºãã¼ã¿ + è§£æ±ºæ¸ã¿URLï¼
 */

import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'fs';

// RSSãã£ã¼ãURLä¸è¦§ï¼ããã·ã¥ãã¼ãã®CAT_Qã¨åãï¼
const FEEDS = {
  deel: 'https://news.google.com/rss/search?q=%22Deel%22+%E6%8E%A1%E7%94%A8+OR+%E4%BA%BA%E4%BA%8B+OR+HR+OR+EOR&hl=ja&gl=JP&ceid=JP:ja',
  funding_p: 'https://news.google.com/rss/search?q=site%3Athebridge.jp+OR+site%3Aprtimes.jp+%E8%B3%87%E9%87%91%E8%AA%BF%E9%81%94+OR+%E3%82%B9%E3%82%BF%E3%83%BC%E3%83%88%E3%82%A2%E3%83%83%E3%83%97+OR+%E3%82%B7%E3%83%AA%E3%83%BC%E3%82%BAA+OR+%E3%82%B7%E3%83%AA%E3%83%BC%E3%82%BAB+OR+%E3%82%B7%E3%83%AA%E3%83%BC%E3%82%BAC&hl=ja&gl=JP&ceid=JP:ja',
  funding_nk: 'https://news.google.com/rss/search?q=site%3Anikkei.com+%E3%82%B9%E3%82%BF%E3%83%BC%E3%83%88%E3%82%A2%E3%83%83%E3%83%97+%E8%B3%87%E9%87%91%E8%AA%BF%E9%81%94+OR+%E5%87%BA%E8%B3%87&hl=ja&gl=JP&ceid=JP:ja',
  funding_vt: 'https://news.google.com/rss/search?q=site%3Aventure.jp+%E8%B3%87%E9%87%91%E8%AA%BF%E9%81%94&hl=ja&gl=JP&ceid=JP:ja',
  funding_sdb: 'https://news.google.com/rss/search?q=site%3Astartup-db.com+%E8%B3%87%E9%87%91%E8%AA%BF%E9%81%94&hl=ja&gl=JP&ceid=JP:ja',
  funding_ini: 'https://news.google.com/rss/search?q=site%3Ainitial.inc+%E8%B3%87%E9%87%91%E8%AA%BF%E9%81%94&hl=ja&gl=JP&ceid=JP:ja',
  funding_sil: 'https://news.google.com/rss/search?q=site%3Astartup-il.com+%E8%B3%87%E9%87%91%E8%AA%BF%E9%81%94&hl=ja&gl=JP&ceid=JP:ja',
  funding: 'https://news.google.com/rss/search?q=%E3%82%B9%E3%82%BF%E3%83%BC%E3%83%88%E3%82%A2%E3%83%83%E3%83%97+%E8%B3%87%E9%87%91%E8%AA%BF%E9%81%94+OR+%E3%82%B7%E3%83%AA%E3%83%BC%E3%82%BAA+OR+%E3%82%B7%E3%83%AA%E3%83%BC%E3%82%BAB+OR+%E3%82%B7%E3%83%AA%E3%83%BC%E3%82%BAC&hl=ja&gl=JP&ceid=JP:ja',
  ma_p: 'https://news.google.com/rss/search?q=site%3Amaonline.jp+OR+site%3Anikkei.com+OR+site%3Atoyokeizai.net+M%26A+OR+%E8%B2%B7%E5%8F%8E+OR+%E6%B5%B7%E5%A4%96%E9%80%B2%E5%87%BA&hl=ja&gl=JP&ceid=JP:ja',
  ma: 'https://news.google.com/rss/search?q=M%26A+%E8%B2%B7%E5%8F%8E+OR+%E5%90%88%E4%BD%B5+OR+TOB+OR+MBO+OR+%E4%B8%8A%E5%A0%B4%E5%BB%83%E6%AD%A2&hl=ja&gl=JP&ceid=JP:ja',
  global_p: 'https://news.google.com/rss/search?q=site%3Anikkei.com+OR+site%3Atoyokeizai.net+%E6%B5%B7%E5%A4%96%E9%80%B2%E5%87%BA+OR+%E3%82%B0%E3%83%AD%E3%83%BC%E3%83%90%E3%83%AB%E5%B1%95%E9%96%8B+OR+%E6%B5%B7%E5%A4%96%E6%8B%A0%E7%82%B9&hl=ja&gl=JP&ceid=JP:ja',
  global: 'https://news.google.com/rss/search?q=%E6%B5%B7%E5%A4%96%E9%80%B2%E5%87%BA+OR+%E6%B5%B7%E5%A4%96%E5%B1%95%E9%96%8B+OR+%E3%82%B0%E3%83%AD%E3%83%BC%E3%83%90%E3%83%AB%E5%B1%95%E9%96%8B+OR+%E6%B5%B7%E5%A4%96%E4%BA%8B%E6%A5%AD&hl=ja&gl=JP&ceid=JP:ja',
  talent: 'https://news.google.com/rss/search?q=%E6%B5%B7%E5%A4%96%E4%BA%BA%E6%9D%90%E6%8E%A1%E7%94%A8+OR+%E3%82%B0%E3%83%AD%E3%83%BC%E3%83%90%E3%83%AB%E4%BA%BA%E6%9D%90+OR+%E5%A4%96%E5%9B%BD%E4%BA%BA%E6%8E%A1%E7%94%A8+OR+%E3%83%AA%E3%83%A2%E3%83%BC%E3%83%88%E3%83%AF%E3%83%BC%E3%82%AF+%E6%B5%B7%E5%A4%96&hl=ja&gl=JP&ceid=JP:ja',
  hr_p: 'https://news.google.com/rss/search?q=site%3Ahrnote.jp+OR+site%3Aroumu.com+%E6%B5%B7%E5%A4%96+OR+%E5%A4%96%E5%9B%BD%E4%BA%BA+OR+%E5%9C%A8%E7%95%99%E8%B3%87%E6%A0%BC+OR+%E5%B0%B1%E5%8A%B4%E3%83%93%E3%82%B6&hl=ja&gl=JP&ceid=JP:ja',
  hr: 'https://news.google.com/rss/search?q=HR+%E3%83%86%E3%83%83%E3%82%AF+OR+%E4%BA%BA%E4%BA%8B%E3%83%86%E3%83%83%E3%82%AF+OR+%E5%8A%B4%E5%8B%99%E7%AE%A1%E7%90%86+OR+%E7%B5%A6%E4%B8%8E%E8%A8%88%E7%AE%97+SaaS&hl=ja&gl=JP&ceid=JP:ja',
  inbound: 'https://news.google.com/rss/search?q=site%3Ajetro.go.jp+OR+site%3Ajp.techcrunch.com+%E6%97%A5%E6%9C%AC%E9%80%B2%E5%87%BA+OR+%E5%AF%BE%E6%97%A5%E6%8A%95%E8%B3%87&hl=ja&gl=JP&ceid=JP:ja',
  competitor: 'https://news.google.com/rss/search?q=%22Remote.com%22+OR+%22Papaya+Global%22+OR+%22Velocity+Global%22+OR+%22Oyster+HR%22+OR+%22Rippling%22+OR+%22Globalization+Partners%22&hl=ja&gl=JP&ceid=JP:ja',
};

const CATEGORY_MAP = {
  funding_p: 'funding',
  ma_p: 'ma',
  global_p: 'global',
  hr_p: 'hr',
  inbound: 'global',
  funding_nk: 'funding',
  funding_vt: 'funding',
  funding_sdb: 'funding',
  funding_ini: 'funding',
  funding_sil: 'funding',
};


const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// è¨äºã®ä¿ææéï¼1ã¶æ = 31æ¥ï¼
const MAX_AGE_DAYS = 31;

function isWithinMaxAge(pubDateStr) {
  if (!pubDateStr) return false;
  try {
    const pubDate = new Date(pubDateStr);
    const now = new Date();
    const diffMs = now - pubDate;
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    return diffDays <= MAX_AGE_DAYS;
  } catch {
    return false;
  }
}

// --- Non-relevant article filter ---
const EXCLUDE_PATTERNS = [
  /\bRBW\b/i,/\bHYBE\b/i,/Kstyle/i,/K-POP/i,/KPOP/i,
  /\bSM\s*Entertainment/i,/\bYG\s*Entertainment/i,/\bJYP/i,
  /WoW!Korea/i,/KOREA WAVE/i,
  /\u{B9E4}\u{C77C}\u{ACBD}\u{C81C}/u,/\u{D55C}\u{AD6D}\u{ACBD}\u{C81C}/u,/\u{C870}\u{C120}\u{C77C}\u{BCF4}/u,/\u{C911}\u{C559}\u{C77C}\u{BCF4}/u,/\u{B3D9}\u{C544}\u{C77C}\u{BCF4}/u,
  /MK\.co\.kr/i,/hankyung/i,/chosun\.com/i,
];

function isRelevantArticle(title,source){
  const text=title+' '+(source||'');
  return !EXCLUDE_PATTERNS.some(p=>p.test(text));
}

// --- Funding relevance filter ---
const FUNDING_KW = /資金調達|調達額|億円|万円|出資|増資|ラウンド|シリーズ[A-Z]|シード|ファンド|エンジェル|バリュエーション|IPO|上場/;
function isFundingRelevant(title) {
  return FUNDING_KW.test(title || '');
}

// --- HTMLã¨ã³ãã£ãã£ãã³ã¼ã ---
function decodeHtmlEntities(str) {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/');
}

// --- RSS XML ãã¼ã¹ ---
function parseRssXml(xml) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const title = block.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.trim() || '';
    const link = block.match(/<link>([\s\S]*?)<\/link>/)?.[1]?.trim() || '';
    const pubDate = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1]?.trim() || '';
    const sourceText = block.match(/<source[^>]*>([\s\S]*?)<\/source>/)?.[1]?.trim() || '';
    const sourceUrl = block.match(/<source[^>]+url="([^"]+)"/)?.[1] || '';
    const descRaw = block.match(/<description>([\s\S]*?)<\/description>/)?.[1]?.trim() || '';

    // descriptionã¯HTMLã¨ã³ãã£ãã£åããã¦ãããã¨ãå¤ãã®ã§ãã³ã¼ããã¦ããhrefæ½åº
    const descDecoded = decodeHtmlEntities(descRaw);
    const descHref = descDecoded.match(/href="(https?:\/\/(?!news\.google\.com)[^"]+)"/)?.[1] || '';

    items.push({ title, link, pubDate, source: sourceText, sourceUrl, descHref });
  }
  return items;
}

// --- URLãæå¹ãªè¨äºURLãå¤å® ---
function isValidArticleUrl(url) {
  if (!url) return false;
  if (url.includes('news.google.com')) return false;
  if (url.includes('consent.google')) return false;
  if (url.includes('accounts.google')) return false;
  try {
    const parsed = new URL(url);
    // ãã¹ãç©ºãã«ã¼ãã®ã¿ = ãã¡ã¤ã³ã ã = è¨äºURLã§ã¯ãªã
    const path = parsed.pathname.replace(/\/+$/, '');
    if (!path || path === '') return false;
    return true;
  } catch {
    return false;
  }
}

// --- Google News URL â å®URL è§£æ±ºï¼npm google-news-decoderå©ç¨ï¼ ---
async function resolveWithDecoder(url) {
  try {
    const { default: GoogleNewsDecoder } = await import('google-news-decoder');
    const decoder = new GoogleNewsDecoder();
    const result = await decoder.decodeGoogleNewsUrl(url);
    if (result && result.decodedUrl && isValidArticleUrl(result.decodedUrl)) {
      return result.decodedUrl;
    }
    if (result && result.url && isValidArticleUrl(result.url)) {
      return result.url;
    }
  } catch (e) {
    // google-news-decoderãä½¿ããªã/å¤±æããå ´å
    console.log('    Decoder failed: ' + e.message);
  }
  return null;
}

// --- Google News URL â å®URL è§£æ±ºï¼HTTPãªãã¤ã¬ã¯ã + HTMLãã¼ã¹ï¼ ---
async function resolveByRedirect(url) {
  try {
    const resp = await fetch(url, {
      redirect: 'follow',
      headers: { 'User-Agent': UA, 'Accept': 'text/html', 'Accept-Language': 'ja,en;q=0.9' },
      signal: AbortSignal.timeout(5000),
    });

    // HTTPãªãã¤ã¬ã¯ãã§è§£æ±ºã§ããå ´å
    const finalUrl = resp.url;
    if (isValidArticleUrl(finalUrl)) {
      return finalUrl;
    }

    // HTMLããURLæ½åºãè©¦ã¿ã
    const html = await resp.text();
    const patterns = [
      /data-n-au="([^"]+)"/,
      /data-url="(https?:\/\/[^"]+)"/,
      /content="\d+;\s*url=(https?:\/\/[^"]+)"/i,
      /<meta[^>]+property="og:url"[^>]+content="(https?:\/\/[^"]+)"/,
      /<link[^>]+rel="canonical"[^>]+href="(https?:\/\/[^"]+)"/,
      /window\.location\.replace\("(https?:\/\/[^"]+)"\)/,
      /location\.href\s*=\s*"(https?:\/\/[^"]+)"/,
    ];

    for (const pattern of patterns) {
      const m = html.match(pattern);
      if (m && m[1]) {
        const candidate = decodeURIComponent(m[1]);
        if (isValidArticleUrl(candidate)) {
          return candidate;
        }
      }
    }
  } catch (e) {
    // ã¿ã¤ã ã¢ã¦ãç­
    console.log('    Redirect failed: ' + e.message);
  }
  return null;
}

// --- ã¡ã¤ã³è§£æ±ºã­ã¸ãã¯ ---
async function resolveGoogleNewsUrl(item) {
  const { link, descHref } = item;

  // 1. descriptionããæ½åºããURLãããã°ã¾ãä½¿ã
  if (isValidArticleUrl(descHref)) {
    return descHref;
  }

  // 2. google-news-decoderããã±ã¼ã¸ã§è§£æ±º
  if (link.includes('news.google.com')) {
    const decoded = await resolveWithDecoder(link);
    if (decoded) return decoded;
  }

  // 3. HTTPãªãã¤ã¬ã¯ã + HTMLãã¼ã¹ã§è§£æ±º
  if (link.includes('news.google.com')) {
    const redirected = await resolveByRedirect(link);
    if (redirected) return redirected;
  }

  // 4. å¨ã¦å¤±æããå ´åã¯Google Newsãªã³ã¯ããã®ã¾ã¾è¿ã
  return link;
}

// --- ã¡ã¤ã³å¦ç ---
// --- fetchArticleMeta: og:image, description ---
async function fetchArticleMeta(url) {
  const result = { img: '', summary: '' };
  if (!url || url.includes('news.google.com')) return result;
  try {
    const resp = await fetch(url, {
      headers: { 'User-Agent': UA, 'Accept': 'text/html,application/xhtml+xml', 'Accept-Language': 'ja,en;q=0.9' },
      signal: AbortSignal.timeout(5000), redirect: 'follow',
    });
    if (!resp.ok) return result;
    const html = await resp.text();
    const head = html.substring(0, Math.min(html.length, 15000));
    const imgP = [/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i, /<meta[^>]+content="([^"]+)"[^>]+property="og:image"/i, /<meta[^>]+name="twitter:image"[^>]+content="([^"]+)"/i];
    for (const p of imgP) { const m = head.match(p); if (m && m[1]) { result.img = decodeHtmlEntities(m[1]); break; } }
    const descP = [/<meta[^>]+property="og:description"[^>]+content="([^"]+)"/i, /<meta[^>]+content="([^"]+)"[^>]+property="og:description"/i, /<meta[^>]+name="description"[^>]+content="([^"]+)"/i];
    for (const p of descP) { const m = head.match(p); if (m && m[1]) { let d = decodeHtmlEntities(m[1]).trim(); if (d.length > 300) d = d.substring(0, 297) + '...'; result.summary = d; break; } }
  } catch (e) { console.log('  Meta fetch failed: ' + e.message); }
  return result;
}

async function main() {
  console.log('=== Deel News RSS Resolver v3 ===');
  console.log('Time: ' + new Date().toISOString());

  let existing = {};
  const dataPath = 'data/articles.json';
  if (existsSync(dataPath)) {
    try {
      const old = JSON.parse(readFileSync(dataPath, 'utf-8'));
      for (const a of old.articles || []) {
        // ã­ã£ãã·ã¥ã¯æå¹ãªè¨äºURLãã¤æéåã®ãã®ã®ã¿ä½¿ç¨
        if (isValidArticleUrl(a.resolvedUrl) && isWithinMaxAge(a.pubDate)) {
          existing[a.link] = a;
        }
      }
      console.log('Valid cached articles: ' + Object.keys(existing).length);
    } catch (e) {
      console.log('Could not read existing data, starting fresh');
    }
  }

  const allArticles = [];
  let resolvedCount = 0;
  let cachedCount = 0;
  let failedCount = 0;
  let metaFetchedCount = 0;

  for (const [category, rssUrl] of Object.entries(FEEDS)) {
    console.log('Fetching: ' + category);
    try {
      const resp = await fetch(rssUrl, {
        headers: { 'User-Agent': UA },
        signal: AbortSignal.timeout(15000),
      });
      if (!resp.ok) {
        console.log('  HTTP ' + resp.status + ' - skipping');
        continue;
      }
      const xml = await resp.text();
      const rawItems = parseRssXml(xml);
      const items = rawItems.filter(item => isWithinMaxAge(item.pubDate));
      console.log('  Found ' + rawItems.length + ' items, ' + items.length + ' within last ' + MAX_AGE_DAYS + ' days');

      for (const item of items) {
        // ã­ã£ãã·ã¥ã«æå¹ãªURLãããã°ãããä½¿ç¨
        if (existing[item.link]?.resolvedUrl) {
          allArticles.push({
            ...item,
            category: CATEGORY_MAP[category] || category,
            resolvedUrl: existing[item.link].resolvedUrl,
            img: existing[item.link].img || '',
            summary: existing[item.link].summary || '',
          });
          cachedCount++;
          continue;
        }

        // URLè§£æ±º
        console.log('  Resolving: ' + item.title.substring(0, 50) + '...');
        const resolvedUrl = await resolveGoogleNewsUrl(item);

        if (isValidArticleUrl(resolvedUrl)) {
          console.log('    -> OK: ' + resolvedUrl.substring(0, 80));
          resolvedCount++;
        } else {
          console.log('    -> FAILED (using original link)');
          failedCount++;
        }

        // Meta fetch (priority feeds only for speed)
        let img = '';
        let summary = '';
        const SKIP_META = ['funding','ma','global','hr','talent'];
        if (isValidArticleUrl(resolvedUrl) && !SKIP_META.includes(category)) {
          console.log('    Fetching meta...');
          const meta = await fetchArticleMeta(resolvedUrl);
          img = meta.img; summary = meta.summary;
          if (img || summary) { metaFetchedCount++; }
        }
        allArticles.push({ ...item, category: CATEGORY_MAP[category] || category, resolvedUrl, img, summary });

        // ã¬ã¼ãå¶éåé¿ã®ããå°ãå¾ã¤
        await new Promise(r => setTimeout(r, 100));
      }
    } catch (e) {
      console.log('  Error: ' + e.message);
    }
  }

  const seen = new Set();
  const unique = allArticles.filter(a => {
    if (seen.has(a.link)||seen.has(a.title)) return false;
    seen.add(a.link);seen.add(a.title);
    if(!isRelevantArticle(a.title,a.source)){
      console.log('  Excluded: '+a.title.substring(0,60));
      return false;
    }
    const _fcat = CATEGORY_MAP[a.category] || a.category;
    if (_fcat === 'funding' && !isFundingRelevant(a.title)) {
      console.log('  Funding irrelevant: ' + a.title.substring(0, 60));
      return false;
    }
    return true;
  });

  unique.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

  mkdirSync('data', { recursive: true });
  const output = {
    updatedAt: new Date().toISOString(),
    totalArticles: unique.length,
    resolvedInThisRun: resolvedCount,
    cachedFromPrevious: cachedCount,
    failedToResolve: failedCount,
    metaFetched: metaFetchedCount,
    articles: unique,
  };
  writeFileSync(dataPath, JSON.stringify(output, null, 2));

  console.log('=== Done ===');
  console.log('Total: ' + unique.length + ' articles');
  console.log('Newly resolved: ' + resolvedCount);
  console.log('Cached: ' + cachedCount);
  console.log('Failed: ' + failedCount);
  console.log('Meta fetched: ' + metaFetchedCount);
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
