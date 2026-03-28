import { PostItem } from './content/local';

/**
 * RSS/ATOM 订阅生成工具
 * 
 * 提供静态化订阅文件生成功能，支持 RSS 2.0 和 ATOM 1.0 格式
 * 在构建时生成订阅文件，适配静态部署环境
 */

/**
 * 生成 RSS 2.0 格式订阅内容
 * 
 * @param posts 博客文章列表
 * @param baseUrl 网站基础URL
 * @returns RSS XML 内容
 */
export function generateRSS(posts: PostItem[], baseUrl: string = process.env.NEXT_PUBLIC_SITE_URL || 'https://yospace.waveyo.cn'): string {
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

/**
 * 生成 ATOM 1.0 格式订阅内容
 * 
 * @param posts 博客文章列表
 * @param baseUrl 网站基础URL
 * @returns ATOM XML 内容
 */
export function generateATOM(posts: PostItem[], baseUrl: string = process.env.NEXT_PUBLIC_SITE_URL || 'https://yospace.waveyo.cn'): string {
  const siteTitle = process.env.NEXT_PUBLIC_SITE_TITLE || 'Blog';
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
 * XML 特殊字符转义函数
 * 
 * @param str 需要转义的字符串
 * @returns 转义后的字符串
 */
function escapeXML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}