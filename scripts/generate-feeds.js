/* eslint-disable @typescript-eslint/no-require-imports */

const fs = require('fs');
const path = require('path');

// 直接复制需要的函数到脚本中（避免模块导入问题）
function escapeXML(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function generateRSS(posts, baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://yospace.waveyo.cn') {
  const siteTitle = process.env.NEXT_PUBLIC_SITE_TITLE || 'WaveYo';
  const siteDescription = process.env.NEXT_PUBLIC_SITE_DESCRIPTION || '从群众出发，扎根群众。向前，无限进步';
  
  const items = posts.map(post => {
    const postUrl = `${baseUrl}/blog/${post.slug}`;
    const pubDate = new Date(post.publishedTime).toUTCString();
    
    return `
      <item>
        <title>${escapeXML(post.title)}</title>
        <link>${postUrl}</link>
        <guid isPermaLink="true">${postUrl}</guid>
        <pubDate>${pubDate}</pubDate>
        <description>${escapeXML(post.description || '')}</description>
      </item>`;
  }).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXML(siteTitle)}</title>
    <link>${baseUrl}</link>
    <description>${escapeXML(siteDescription)}</description>
    <language>zh-CN</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${items}
  </channel>
</rss>`;
}

function generateATOM(posts, baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://yospace.waveyo.cn') {
  const siteTitle = process.env.NEXT_PUBLIC_SITE_TITLE || 'WaveYo';
  const siteUrl = baseUrl;
  const updated = new Date().toISOString();
  
  const entries = posts.map(post => {
    const postUrl = `${baseUrl}/blog/${post.slug}`;
    const published = new Date(post.publishedTime).toISOString();
    const updated = new Date(post.publishedTime).toISOString();
    
    return `
    <entry>
      <title type="html">${escapeXML(post.title)}</title>
      <link href="${postUrl}" rel="alternate"/>
      <id>${postUrl}</id>
      <published>${published}</published>
      <updated>${updated}</updated>
      <summary type="html">${escapeXML(post.description || '')}</summary>
      <author>
        <name>${process.env.NEXT_PUBLIC_AUTHOR_NAME || 'Author'}</name>
      </author>
    </entry>`;
  }).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${escapeXML(siteTitle)}</title>
  <link href="${siteUrl}" rel="alternate"/>
  <link href="${baseUrl}/feeds/atom.xml" rel="self"/>
  <id>${siteUrl}</id>
  <updated>${updated}</updated>
  <author>
    <name>${process.env.NEXT_PUBLIC_AUTHOR_NAME || 'Author'}</name>
  </author>
  ${entries}
</feed>`;
}

/**
 * 订阅文件生成脚本
 * 
 * 在构建时自动生成 RSS 和 ATOM 订阅文件
 * 支持多语言内容生成，默认生成所有语言的聚合订阅
 */

// 复制 getLocalPostsList 的核心逻辑到脚本中
async function getLocalPostsList(offset, limit, locale = 'en') {
  const fs = require('fs');
  const path = require('path');
  const matter = require('gray-matter');
  
  const postsDirectory = path.join(process.cwd(), 'src/content/posts');
  
  if (!fs.existsSync(postsDirectory)) {
    return { items: [], total: 0, locale };
  }

  const safeOffset = Math.max(0, Math.floor(offset));
  const safeLimit = Math.max(1, Math.floor(limit));
  const fileNames = fs.readdirSync(postsDirectory);

  // 根据 locale 过滤对应语言的 Markdown 文件
  const filteredFiles = fileNames.filter(fileName => {
    if (!fileName.endsWith('.md')) return false;
    if (locale === 'en') {
      const parts = fileName.split('.');
      return parts.length === 2; // only [slug, md]
    } else {
      return fileName.endsWith(`.${locale}.md`);
    }
  });

  const allPostsData = filteredFiles.map(fileName => {
    const fullPath = path.join(postsDirectory, fileName);
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data } = matter(fileContents);
    
    const slug = fileName.replace(/\.md$/, '').replace(new RegExp(`\.${locale}$`), '');
    
    return {
      slug,
      title: data.title || slug,
      description: data.description || '',
      publishedTime: data.date || '',
      isPinned: data.isPinned || false,
      isRecommended: data.isRecommended || false,
      dateObj: new Date(data.date || 0)
    };
  });

  // 按发布时间倒序排列文章
  const sortedPosts = allPostsData.sort((a, b) => {
    return b.dateObj.getTime() - a.dateObj.getTime();
  });

  const paginatedPosts = sortedPosts.slice(safeOffset, safeOffset + safeLimit);

  const items = paginatedPosts.map(post => {
    const result = { ...post };
    delete result.dateObj;
    return result;
  });

  return { items, total: sortedPosts.length, locale };
}

async function generateFeeds() {
  try {
    console.log('开始生成订阅文件...');
    
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://yospace.waveyo.cn';
    const feedsDir = path.join(process.cwd(), 'public', 'feeds');
    
    // 确保 feeds 目录存在
    if (!fs.existsSync(feedsDir)) {
      fs.mkdirSync(feedsDir, { recursive: true });
    }
    
    // 获取所有语言的博客文章（数量限制可调整）
    const zhPosts = await getLocalPostsList(0, 50, 'zh-CN');
    const enPosts = await getLocalPostsList(0, 50, 'en');
    
    // 合并所有语言的文章，按发布时间倒序
    const allPosts = [...zhPosts.items, ...enPosts.items]
      .sort((a, b) => new Date(b.publishedTime) - new Date(a.publishedTime))
      .slice(0, 20); // 限制最新20篇文章
    
    // 生成 RSS 订阅文件
    const rssContent = generateRSS(allPosts, baseUrl);
    fs.writeFileSync(path.join(feedsDir, 'rss.xml'), rssContent);
    console.log('RSS 生成成功');
    
    // 生成 ATOM 订阅文件
    const atomContent = generateATOM(allPosts, baseUrl);
    fs.writeFileSync(path.join(feedsDir, 'atom.xml'), atomContent);
    console.log('ATOM 生成成功');
    
    console.log('订阅文件生成完成！');
    
  } catch (error) {
    console.error('生成订阅文件时出错:', error);
    process.exit(1);
  }
}

// 直接执行时运行生成任务
if (require.main === module) {
  generateFeeds();
}

module.exports = { generateFeeds };
