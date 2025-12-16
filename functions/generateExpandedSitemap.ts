import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const baseUrl = 'https://meshelanu.co.il';
    
    // Get all active business pages and categories
    const [businessPages, categories] = await Promise.all([
      base44.asServiceRole.entities.BusinessPage.filter({
        is_active: true,
        approval_status: 'approved',
        is_frozen: false
      }),
      base44.asServiceRole.entities.Category.filter({
        is_active: true
      })
    ]);

    // Extract unique cities
    const citiesSet = new Set();
    businessPages.forEach(b => {
      const city = b.city || 'ביתר-עילית';
      citiesSet.add(city);
    });
    const cities = Array.from(citiesSet);

    // Filter only food/restaurant and shopping categories (not professionals)
    const foodKeywords = /אוכל|מסעד|קייטר|מזון|גריל|בשר|דגים|פיצה|שווארמה|מאפ|קונדיט|חלבי|בשרי|שף|טבח|קפה|מאפים/i;
    const shopKeywords = /חנות|קניות|ציוד|חשמל|אלקטרוניקה|מחשבים|ביגוד|אופנה|לבוש|הנעלה|ספרים|צעצוע|ריהוט|בית|קוסמטיקה|פארם|מתנות|כלי|מוצר/i;
    
    const relevantCategories = categories.filter(c => 
      !c.parent_id && (foodKeywords.test(c.name) || shopKeywords.test(c.name))
    );

    const allSubcategories = categories.filter(c => c.parent_id);

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
      { path: 'Browse', priority: '0.9' },
      { path: 'Search', priority: '0.9' },
      { path: 'Add', priority: '0.8' },
      { path: 'TermsOfUsePage', priority: '0.3' },
      { path: 'AccessibilityStatement', priority: '0.3' }
    ];
    
    staticPages.forEach(page => {
      sitemap += `  <url>
    <loc>${baseUrl}/page/${page.path}</loc>
    <changefreq>daily</changefreq>
    <priority>${page.priority}</priority>
  </url>\n`;
    });

    // City + Category pages (Dynamic Landing Pages)
    cities.forEach(city => {
      const citySlug = city
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\u0590-\u05FFa-z0-9-]/g, '');
      
      relevantCategories.forEach(category => {
        const categorySlug = category.slug || category.id;
        
        // Main category page
        sitemap += `  <url>
    <loc>${baseUrl}/page/DynamicCategoryPage?city=${encodeURIComponent(city)}&amp;category=${encodeURIComponent(categorySlug)}</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>\n`;

        // Subcategory pages
        const subcats = allSubcategories.filter(s => s.parent_id === category.id);
        subcats.forEach(subcat => {
          const subcatSlug = subcat.slug || subcat.id;
          sitemap += `  <url>
    <loc>${baseUrl}/page/DynamicCategoryPage?city=${encodeURIComponent(city)}&amp;category=${encodeURIComponent(categorySlug)}&amp;subcategory=${encodeURIComponent(subcatSlug)}</loc>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>\n`;
        });
      });
    });

    // Individual Business Pages
    businessPages.forEach(page => {
      const slug = page.url_slug || page.id;
      const lastmod = page.updated_date || page.created_date;
      const date = new Date(lastmod).toISOString().split('T')[0];
      
      sitemap += `  <url>
    <loc>${baseUrl}/page/BusinessPage?slug=${encodeURIComponent(slug)}</loc>
    <lastmod>${date}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>\n`;
    });
    
    sitemap += '</urlset>';
    
    // Log statistics
    console.log('📊 Sitemap Generated:');
    console.log(`- Cities: ${cities.length}`);
    console.log(`- Categories: ${relevantCategories.length}`);
    console.log(`- Business Pages: ${businessPages.length}`);
    console.log(`- Total URLs: ~${cities.length * relevantCategories.length + businessPages.length + staticPages.length}`);
    
    return new Response(sitemap, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600'
      }
    });
    
  } catch (error) {
    console.error('Error generating expanded sitemap:', error);
    return new Response('Error generating sitemap', { 
      status: 500,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
});