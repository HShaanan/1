import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Base URL of the site
    const baseUrl = 'https://meshlanoo.base44.app';
    
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
    <loc>${baseUrl}/${page.path}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>\n`;
    });
    
    // Business pages
    businessPages.forEach(page => {
      const slug = page.url_slug || page.id;
      const lastmod = page.updated_date || page.created_date;
      const date = new Date(lastmod).toISOString().split('T')[0];
      
      sitemap += `  <url>
    <loc>${baseUrl}/BusinessPage?slug=${encodeURIComponent(slug)}</loc>
    <lastmod>${date}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>\n`;
    });
    
    // Category pages (Browse with category filter)
    categories.forEach(category => {
      if (category.parent_id) return; // Skip subcategories for now
      
      sitemap += `  <url>
    <loc>${baseUrl}/Browse?category=${encodeURIComponent(category.id)}</loc>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>\n`;
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