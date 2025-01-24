import fs from 'fs';
import { globby } from 'globby';
import prettier from 'prettier';

const SITE_URL = process.env.VITE_SITE_URL || 'https://offersplus.io';

async function generateSitemap() {
  const pages = await globby([
    'src/pages/**/*.tsx',
    '!src/pages/**/[*.tsx', // Exclude dynamic routes
    '!src/pages/_*.tsx',    // Exclude special pages
    '!src/pages/api',       // Exclude API routes
  ]);

  const sitemap = `
    <?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${pages
        .map((page) => {
          const path = page
            .replace('src/pages', '')
            .replace('.tsx', '')
            .replace('/index', '');
          const route = path === '/index' ? '' : path;

          return `
            <url>
              <loc>${`${SITE_URL}${route}`}</loc>
              <lastmod>${new Date().toISOString()}</lastmod>
              <changefreq>daily</changefreq>
              <priority>0.7</priority>
            </url>
          `;
        })
        .join('')}
    </urlset>
  `;

  try {
    const formatted = await prettier.format(sitemap, {
      parser: 'html',
    });

    // Write sitemap to the public directory
    fs.writeFileSync('public/sitemap.xml', formatted);
    console.log('✅ Sitemap generated successfully!');
  } catch (error) {
    console.error('Error generating sitemap:', error);
    // Write unformatted sitemap as fallback
    fs.writeFileSync('public/sitemap.xml', sitemap);
    console.log('⚠️ Sitemap generated without formatting');
  }
}

generateSitemap();
