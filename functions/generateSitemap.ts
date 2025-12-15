import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Base URL of the site
    const baseUrl = 'https://meshelanu.co.il';
    
    // Get all active and approved business pages
    const businessPages = await base44.asServiceRole.entities.BusinessPage.filter({
      is_active: true,
      approval_status: 'approved',
      is_frozen: false
    });
    
    // Get all active categories
    const categories = await base44.asServiceRole.entities.Category.filter({
      is_active: true
    });
    
    // Extract unique cities from business pages
    const citiesSet = new Set();
    businessPages.forEach(b => {
      const city = b.city || 'ביתר-עילית';
      citiesSet.add(city);
    });
    const cities = Array.from(citiesSet);
    
    // Build sitemap XML
    let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
    sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    
    // Homepage
    sitemap += `  <url>
    <loc>${baseUrl}</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>\n`;
    
    // Static pages
    const staticPages = [
      { path: 'Browse', priority: '0.9', changefreq: 'daily' },
      { path: 'Search', priority: '0.9', changefreq: 'daily' },
      { path: 'Add', priority: '0.8', changefreq: 'weekly' },
      { path: 'TermsOfUsePage', priority: '0.3', changefreq: 'monthly' },
      { path: 'AccessibilityStatement', priority: '0.3', changefreq: 'monthly' }
    ];
    
    staticPages.forEach(page => {
      sitemap += `  <url>
    <loc>${baseUrl}/page/${page.path}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>\n`;
    });
    
    // City-based business pages (SEO-friendly URLs)
    businessPages.forEach(page => {
      const slug = page.url_slug || page.id;
      const city = (page.city || 'ביתר-עילית')
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\u0590-\u05FFa-z0-9-]/g, '');
      const categorySlug = page.category_slug || 'business';
      const lastmod = page.updated_date || page.created_date;
      const date = new Date(lastmod).toISOString().split('T')[0];
      
      sitemap += `  <url>
    <loc>${baseUrl}/${city}/${categorySlug}/${slug}</loc>
    <lastmod>${date}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>\n`;
    });
    
    // City-based category pages
    const mainCategories = categories.filter(c => !c.parent_id);
    cities.forEach(city => {
      const citySlug = city
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\u0590-\u05FFa-z0-9-]/g, '');
      
      mainCategories.forEach(category => {
        const categorySlug = category.slug || category.id;
        
        sitemap += `  <url>
    <loc>${baseUrl}/${citySlug}/${categorySlug}</loc>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>\n`;
      });
    });
    
    sitemap += '</urlset>';
    
    return new Response(sitemap, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
      }
    });
    
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return new Response('Error generating sitemap', { 
      status: 500,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
});