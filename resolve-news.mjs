/**
 * Google News RSSフィードを取得し、リダイレクトURLを実URLに解決するスクリプト
 * GitHub Actionsで定期実行される
 *
 * 出力: data/articles.json（記事データ + 解決済みURL）
 */

import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'fs';

// RSSフィードURL一覧（ダッシュボードのCAT_Qと同じ）
const FEEDS = {
  deel: 'https://news.google.com/rss/search?q=%22Deel%22+%E6%8E%A1%E7%94%A8+OR+%E4%BA%BA%E4%BA%8B+OR+HR+OR+EOR&hl=ja&gl=JP&ceid=JP:ja',
  funding: 'https://news.google.com/rss/search?q=%E3%82%B9%E3%82%BF%E3%83%BC%E3%83%88%E3%82%A2%E3%83%83%E3%83%97+%E8%B3%87%E9%87%91%E8%AA%BF%E9%81%94+OR+%E3%82%B7%E3%83%AA%E3%83%BC%E3%82%BAA+OR+%E3%82%B7%E3%83%AA%E3%83%BC%E3%82%BAB+OR+%E3%82%B7%E3%83%AA%E3%83%BC%E3%82%BAC&hl=ja&gl=JP&ceid=JP:ja',
  ma: 'https://news.google.com/rss/search?q=M%26A+%E8%B2%B7%E5%8F%8E+OR+%E5%90%88%E4%BD%B5+OR+TOB+OR+MBO+OR+%E4%B8%8A%E5%A0%B4%E5%BB%83%E6%AD%A2&hl=ja&gl=JP&ceid=JP:ja',
  competitor: 'https://news.google.com/rss/search?q=%22Remote.com%22+OR+%22Papaya+Global%22+OR+%22Velocity+Global%22+OR+%22Oyster+HR%22+OR+%22Rippling%22+OR+%22Globalization+Partners%22&hl=ja&gl=JP&ceid=JP:ja',
  global: 'https://news.google.com/rss/search?q=%E6%B5%B7%E5%A4%96%E9%80%B2%E5%87%BA+OR+%E6%B5%B7%E5%A4%96%E5%B1%95%E9%96%8B+OR+%E3%82%B0%E3%83%AD%E3%83%BC%E3%83%90%E3%83%AB%E5%B1%95%E9%96%8B+OR+%E6%B5%B7%E5%A4%96%E4%BA%8B%E6%A5%AD&hl=ja&gl=JP&ceid=JP:ja',
  talent: 'https://news.google.com/rss/search?q=%E6%B5%B7%E5%A4%96%E4%BA%BA%E6%9D%90%E6%8E%A1%E7%94%A8+OR+%E3%82%B0%E3%83%AD%E3%83%BC%E3%83%90%E3%83%AB%E4%BA%BA%E6%9D%90+OR+%E5%A4%96%E5%9B%BD%E4%BA%BA%E6%8E%A1%E7%94%A8+OR+%E3%83%AA%E3%83%A2%E3%83%BC%E3%83%88%E3%83%AF%E3%83%BC%E3%82%AF+%E6%B5%B7%E5%A4%96&hl=ja&gl=JP&ceid=JP:ja',
  hr: 'https://news.google.com/rss/search?q=HR+%E3%83%86%E3%83%83%E3%82%AF+OR+%E4%BA%BA%E4%BA%8B%E3%83%86%E3%83%83%E3%82%AF+OR+%E5%8A%B4%E5%8B%99%E7%AE%A1%E7%90%86+OR+%E7%B5%A6%E4%B8%8E%E8%A8%88%E7%AE%97+SaaS&hl=ja&gl=JP&ceid=JP:ja',
  event: 'https://news.google.com/rss/search?q=HR+%E3%82%AB%E3%83%B3%E3%83%95%E3%82%A1%E3%83%AC%E3%83%B3%E3%82%B9+OR+%E4%BA%BA%E4%BA%8B+%E3%82%BB%E3%83%9F%E3%83%8A%E3%83%BC+OR+%E6%8E%A1%E7%94%A8+%E3%82%A4%E3%83%99%E3%83%B3%E3%83%88+2025&hl=ja&gl=JP&ceid=JP:ja',
};

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// --- RSS XML パース ---
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
    const desc = block.match(/<description>([\s\S]*?)<\/description>/)?.[1]?.trim() || '';

    // descriptionからhref抽出
    const descHref = desc.match(/href="(https?:\/\/(?!news\.google\.com)[^"]+)"/)?.[1] || '';

    items.push({ title, link, pubDate, source: sourceText, sourceUrl, descHref });
  }
  return items;
}

// --- Google News URL → 実URL 解決 ---
async function resolveGoogleNewsUrl(url) {
  if (!url.includes('news.google.com')) return url;

  try {
    const resp = await fetch(url, {
      redirect: 'follow',
      headers: { 'User-Agent': UA, 'Accept': 'text/html', 'Accept-Language': 'ja,en;q=0.9' },
      signal: AbortSignal.timeout(10000),
    });

    const finalUrl = resp.url;
    if (finalUrl && !finalUrl.includes('news.google.com') && !finalUrl.includes('consent.google')) {
      return finalUrl;
    }

    const html = await resp.text();
    const m1 = html.match(/data-n-au="([^"]+)"/);
    if (m1) return decodeURIComponent(m1[1]);
    const m2 = html.match(/data-url="(https?:\/\/(?!news\.google\.com)[^"]+)"/);
    if (m2) return m2[1];
    const m3 = html.match(/content="\d+;\s*url=(https?:\/\/(?!news\.google\.com)[^"]+)"/i);
    if (m3) return m3[1];
    const m4 = html.match(/<meta[^>]+property="og:url"[^>]+content="(https?:\/\/(?!news\.google\.com)[^"]+)"/);
    if (m4) return m4[1];
    const m5 = html.match(/<link[^>]+rel="canonical"[^>]+href="(https?:\/\/(?!news\.google\.com)[^"]+)"/);
    if (m5) return m5[1];
    const m6 = html.match(/href="(https?:\/\/(?!news\.google\.com|accounts\.google|consent\.google|www\.google)[^"]+)"/);
    if (m6) return m6[1];
  } catch (e) {
    // タイムアウト等
  }
  return url;
}

// --- メイン処理 ---
async function main() {
  console.log('=== Deel News RSS Resolver ===');
  console.log('Time: ' + new Date().toISOString());

  let existing = {};
  const dataPath = 'data/articles.json';
  if (existsSync(dataPath)) {
    try {
      const old = JSON.parse(readFileSync(dataPath, 'utf-8'));
      for (const a of old.articles || []) {
        existing[a.link] = a;
      }
      console.log('Existing articles: ' + Object.keys(existing).length);
    } catch (e) {
      console.log('Could not read existing data, starting fresh');
    }
  }

  const allArticles = [];
  let resolvedCount = 0;
  let cachedCount = 0;

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
      const items = parseRssXml(xml);
      console.log('  Found ' + items.length + ' items');

      for (const item of items) {
        if (existing[item.link]?.resolvedUrl && !existing[item.link].resolvedUrl.includes('news.google.com')) {
          allArticles.push({
            ...item,
            category,
            resolvedUrl: existing[item.link].resolvedUrl,
          });
          cachedCount++;
          continue;
        }

        let resolvedUrl = item.link;
        if (item.sourceUrl && !item.sourceUrl.includes('news.google.com')) {
          resolvedUrl = item.sourceUrl;
        } else if (item.descHref) {
          resolvedUrl = item.descHref;
        } else if (item.link.includes('news.google.com')) {
          resolvedUrl = await resolveGoogleNewsUrl(item.link);
          if (resolvedUrl !== item.link) resolvedCount++;
          await new Promise(r => setTimeout(r, 500));
        }

        allArticles.push({ ...item, category, resolvedUrl });
      }
    } catch (e) {
      console.log('  Error: ' + e.message);
    }
  }

  const seen = new Set();
  const unique = allArticles.filter(a => {
    if (seen.has(a.link)) return false;
    seen.add(a.link);
    return true;
  });

  unique.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

  mkdirSync('data', { recursive: true });
  const output = {
    updatedAt: new Date().toISOString(),
    totalArticles: unique.length,
    resolvedInThisRun: resolvedCount,
    cachedFromPrevious: cachedCount,
    articles: unique,
  };
  writeFileSync(dataPath, JSON.stringify(output, null, 2));

  console.log('=== Done ===');
  console.log('Total: ' + unique.length + ' articles');
  console.log('Newly resolved: ' + resolvedCount);
  console.log('Cached: ' + cachedCount);
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
