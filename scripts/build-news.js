import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync, copyFileSync, rmSync } from 'node:fs';
import { join, basename, extname } from 'node:path';

const SRC_HOME = process.env.BUILD_SRC_HOME || 'src/home';
const SRC_RAW = process.env.BUILD_NEWS_SRC || 'src/raw';
const DIST = process.env.BUILD_DIST || 'dist';
const DIST_NEWS = join(DIST, 'news');
const OUTPUT = join(DIST_NEWS, 'news-feed.json');

function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) {
    return { metadata: {}, body: content.trim() };
  }
  const rawMeta = match[1];
  const body = match[2].trim();
  const metadata = {};
  for (const line of rawMeta.split('\n')) {
    const sep = line.indexOf(':');
    if (sep === -1) continue;
    const key = line.slice(0, sep).trim();
    const val = line.slice(sep + 1).trim();
    if (val.startsWith('[') && val.endsWith(']')) {
      metadata[key] = val.slice(1, -1).split(',').map(s => s.trim());
    } else {
      metadata[key] = val;
    }
  }
  return { metadata, body };
}

function markdownToHtml(md) {
  if (!md) return '';
  let html = md
    // Headers
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    // Bold and italic
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Code
    .replace(/`(.*?)`/g, '<code>$1</code>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    // Lists
    .replace(/^- (.*$)/gm, '<li>$1</li>')
    // Paragraphs
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>');
  html = '<p>' + html + '</p>';
  // Wrap lists
  html = html.replace(/(<li>.*<\/li>)+/g, '<ul>$&</ul>');
  // Clean up empty paragraphs
  html = html.replace(/<p><\/p>/g, '');
  return html;
}

function buildArticle(filePath) {
  const raw = readFileSync(filePath, 'utf-8');
  const { metadata, body } = parseFrontmatter(raw);
  const id = basename(filePath, extname(filePath));
  const html = markdownToHtml(body);
  return {
    id,
    title: metadata.title || id,
    date: metadata.date || null,
    tags: Array.isArray(metadata.tags) ? metadata.tags : [],
    content: body,
    html,
  };
}

function buildNewsFeed(srcDir) {
  if (!existsSync(srcDir)) return { articles: [] };

  const files = readdirSync(srcDir)
    .filter(f => f.endsWith('.md'))
    .sort()
    .map(f => buildArticle(join(srcDir, f)));

  const sorted = files.sort((a, b) => {
    if (a.date === null && b.date === null) return 0;
    if (a.date === null) return 1;
    if (b.date === null) return -1;
    return b.date.localeCompare(a.date);
  });

  return { articles: sorted };
}

function assembleDist() {
  if (existsSync(DIST)) {
    for (const entry of readdirSync(DIST)) {
      const full = join(DIST, entry);
      if (entry === 'news') continue;
      rmSync(full, { recursive: true, force: true });
    }
  }
  mkdirSync(DIST, { recursive: true });
  mkdirSync(DIST_NEWS, { recursive: true });

  const filesToCopy = ['index.html', 'main.js', 'newsWorker.js'];
  for (const f of filesToCopy) {
    const src = join(SRC_HOME, f);
    const dst = join(DIST, f);
    if (existsSync(src)) {
      copyFileSync(src, dst);
    } else {
      console.warn(`Warning: ${src} not found, skipping`);
    }
  }

  const feed = buildNewsFeed(SRC_RAW);
  writeFileSync(OUTPUT, JSON.stringify(feed, null, 2) + '\n', 'utf-8');
  console.log(`Assembled ${DIST}/ with ${feed.articles.length} article(s)`);
}

assembleDist();