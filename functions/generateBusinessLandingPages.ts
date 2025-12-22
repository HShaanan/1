import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Unauthorized - Admin only' }, { status: 401 });
        }

        const { city = 'ביתר עילית', mode = 'preview' } = await req.json().catch(() => ({}));

        console.log(`🚀 Starting business landing pages generation for ${city}`);

        // שלב 1: שליפת כל העסקים הפעילים
        const businesses = await base44.asServiceRole.entities.BusinessPage.filter({ 
            is_active: true,
            approval_status: 'approved',
            is_frozen: false
        });

        console.log(`📊 Found ${businesses.length} active businesses`);

        // סינון עסקים לפי עיר אם צוין
        const cityBusinesses = city 
            ? businesses.filter(b => b.city === city)
            : businesses;

        console.log(`🏙️ ${cityBusinesses.length} businesses in ${city}`);

        // שלב 2: בדיקת דפים קיימים
        const existingPages = await base44.asServiceRole.entities.LandingPage.list();
        const existingSlugs = new Set(existingPages.map(p => p.slug));

        console.log(`📋 ${existingSlugs.size} existing landing pages`);

        // שלב 3: בניית רשימת דפים לייצור
        const pagesToCreate = cityBusinesses
            .filter(business => {
                const slug = `${business.business_name}-${city}`
                    .toLowerCase()
                    .replace(/\s+/g, '-')
                    .replace(/[^\u0590-\u05FFa-z0-9-]/g, '');
                return !existingSlugs.has(slug);
            })
            .map(business => {
                const slug = `${business.business_name}-${city}`
                    .toLowerCase()
                    .replace(/\s+/g, '-')
                    .replace(/[^\u0590-\u05FFa-z0-9-]/g, '');

                return {
                    business,
                    slug,
                    title: `${business.business_name} ב${city}`,
                    meta_title: `${business.business_name} ב${city} | משלנו`,
                    meta_description: `מצא את ${business.business_name} ב${city}. ${business.description?.substring(0, 100) || 'עסק מומלץ במשלנו'}`
                };
            });

        console.log(`✨ ${pagesToCreate.length} new pages to create`);

        // במצב תצוגה מקדימה
        if (mode === 'preview') {
            return Response.json({
                success: true,
                preview: true,
                total_businesses: cityBusinesses.length,
                existing_pages: existingSlugs.size,
                new_pages_count: pagesToCreate.length,
                sample_pages: pagesToCreate.slice(0, 10).map(p => ({
                    business_name: p.business.business_name,
                    slug: p.slug,
                    title: p.title
                }))
            });
        }

        // שלב 4: יצירת הדפים
        const results = [];
        const errors = [];

        for (const pageData of pagesToCreate) {
            try {
                // יצירת תוכן AI
                const contentResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
                    prompt: `צור תוכן SEO איכותי ומושך לדף נחיתה של העסק "${pageData.business.business_name}" ב${city}.
                    
העסק: ${pageData.business.business_name}
תיאור: ${pageData.business.description || 'עסק מומלץ'}
עיר: ${city}

כתוב תוכן בעברית תקנית, 150-250 מילים, בסגנון AIDA:
- Attention: למה כדאי לבחור בעסק הזה
- Interest: מה מיוחד בו
- Desire: מה הלקוח מקבל
- Action: קריאה לבקר/לפנות

התוכן חייב להיות ממוקד המרה, אותנטי ומקורי.`,
                    response_json_schema: {
                        type: "object",
                        properties: {
                            description: { 
                                type: "string",
                                description: "תוכן עשיר SEO (150-250 מילים)"
                            }
                        },
                        required: ["description"]
                    }
                });

                // יצירת דף הנחיתה
                const newPage = await base44.asServiceRole.entities.LandingPage.create({
                    business_page_id: pageData.business.id,
                    business_name: pageData.business.business_name,
                    city: city,
                    slug: pageData.slug,
                    title: pageData.title,
                    meta_title: pageData.meta_title,
                    meta_description: pageData.meta_description,
                    description: contentResponse?.description || '',
                    is_active: true,
                    view_count: 0
                });

                results.push({ 
                    slug: pageData.slug, 
                    id: newPage.id,
                    business_name: pageData.business.business_name
                });
                console.log(`✅ Created: ${pageData.slug}`);

            } catch (error) {
                console.error(`❌ Error creating ${pageData.slug}:`, error.message);
                errors.push({ 
                    business_name: pageData.business.business_name,
                    slug: pageData.slug,
                    error: error.message 
                });
            }

            // השהיה קטנה למניעת עומס
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        return Response.json({
            success: true,
            message: `נוצרו ${results.length} דפי נחיתה בהצלחה`,
            stats: {
                total_businesses: cityBusinesses.length,
                existing_pages: existingSlugs.size,
                created: results.length,
                errors: errors.length
            },
            created_pages: results,
            errors: errors.slice(0, 10)
        });

    } catch (error) {
        console.error('💥 Global error:', error);
        return Response.json({
            success: false,
            error: error.message,
            stack: error.stack
        }, { status: 500 });
    }
});