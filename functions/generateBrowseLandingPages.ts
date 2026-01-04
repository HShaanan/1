import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Check if called from scheduled task (no real user) or from API
        let isScheduledTask = false;
        try {
            const user = await base44.auth.me();
            if (!user || user.role !== 'admin') {
                return Response.json({ error: 'Unauthorized - Admin only' }, { status: 401 });
            }
        } catch (error) {
            // If auth fails, assume it's a scheduled task
            isScheduledTask = true;
        }

        const { mode = 'create', maxPages = 50 } = await req.json().catch(() => ({}));

        console.log(`🚀 Starting Browse landing pages generation`);

        // שלב 1: שליפת כל הקטגוריות והעסקים
        const [categories, businesses, existingStorePages] = await Promise.all([
            base44.asServiceRole.entities.Category.filter({ is_active: true }),
            base44.asServiceRole.entities.BusinessPage.filter({ 
                is_active: true,
                approval_status: 'approved',
                is_frozen: false
            }),
            base44.asServiceRole.entities.StorePage.list()
        ]);

        console.log(`📊 ${categories.length} categories, ${businesses.length} businesses`);

        // שלב 2: חילוץ ערים ייחודיות
        const citiesSet = new Set();
        businesses.forEach(b => {
            if (b.city) citiesSet.add(b.city);
        });
        const cities = Array.from(citiesSet);
        console.log(`🏙️ ${cities.length} unique cities`);

        // שלב 3: בניית קומבינציות פופולריות
        const mainCategories = categories.filter(c => !c.parent_id);
        const subcategories = categories.filter(c => c.parent_id);
        
        const existingSlugs = new Set(existingStorePages.map(p => p.slug));

        // קומבינציות: עיר + קטגוריה ראשית
        const combinations = [];
        
        cities.forEach(city => {
            // קטגוריות ראשיות
            mainCategories.forEach(category => {
                const slug = `${category.name}-${city}`
                    .toLowerCase()
                    .replace(/\s+/g, '-')
                    .replace(/[^\u0590-\u05FFa-z0-9-]/g, '');

                if (!existingSlugs.has(slug)) {
                    combinations.push({
                        type: 'category',
                        city,
                        category,
                        slug,
                        title: `${category.name} ב${city}`,
                        meta_title: `${category.name} ב${city} | משלנו - המדריך המלא`,
                        meta_description: `מצאו את ${category.name} הטובים ביותר ב${city}. רשימה מקיפה של עסקים מומלצים עם ביקורות, מחירים, ופרטי קשר.`
                    });
                }
            });

            // תת-קטגוריות פופולריות
            subcategories.slice(0, 20).forEach(subcat => {
                const slug = `${subcat.name}-${city}`
                    .toLowerCase()
                    .replace(/\s+/g, '-')
                    .replace(/[^\u0590-\u05FFa-z0-9-]/g, '');

                if (!existingSlugs.has(slug)) {
                    const parent = mainCategories.find(c => c.id === subcat.parent_id);
                    combinations.push({
                        type: 'subcategory',
                        city,
                        category: parent,
                        subcategory: subcat,
                        slug,
                        title: `${subcat.name} ב${city}`,
                        meta_title: `${subcat.name} ב${city} | משלנו`,
                        meta_description: `הרשימה המלאה של ${subcat.name} ב${city}. מצאו את העסק המושלם עבורכם.`
                    });
                }
            });
        });

        // הגבל למספר דפים מקסימלי
        const limitedCombinations = combinations.slice(0, maxPages);

        console.log(`✨ ${limitedCombinations.length} new pages to create (${combinations.length} total possible)`);

        // במצב תצוגה מקדימה
        if (mode === 'preview') {
            return Response.json({
                success: true,
                preview: true,
                total_possible: combinations.length,
                to_create: limitedCombinations.length,
                max_pages: maxPages,
                stats: {
                    cities: cities.length,
                    main_categories: mainCategories.length,
                    subcategories: subcategories.length
                },
                sample_combinations: limitedCombinations.slice(0, 10).map(c => ({
                    type: c.type,
                    title: c.title,
                    slug: c.slug,
                    city: c.city,
                    category: c.category?.name,
                    subcategory: c.subcategory?.name
                }))
            });
        }

        // שלב 4: יצירת הדפים
        const results = [];
        const errors = [];

        for (const combo of limitedCombinations) {
            try {
                // יצירת תוכן AI
                const promptText = combo.type === 'category'
                    ? `צור תוכן SEO איכותי לדף נחיתה של "${combo.category.name}" ב${combo.city}.
                    
כתוב פסקה עשירה ב-150-250 מילים בעברית תקנית שכוללת:
- למה ${combo.city} היא עיר מעולה ל${combo.category.name}
- מה מייחד את העסקים המקומיים
- מה כדאי לחפש בעסקים כאלה
- קריאה לפעולה לגלות את העסקים

התוכן חייב להיות טבעי, אותנטי, ממוקד SEO.`
                    : `צור תוכן SEO איכותי לדף נחיתה של "${combo.subcategory.name}" ב${combo.city}.
                    
כתוב פסקה עשירה ב-150-250 מילים בעברית תקנית שכוללת:
- למה ${combo.subcategory.name} חשוב/פופולרי ב${combo.city}
- איך לבחור ${combo.subcategory.name} טוב
- טיפים ללקוחות
- קריאה לפעולה

התוכן חייב להיות טבעי, אותנטי, ממוקד SEO.`;

                const contentResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
                    prompt: promptText,
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

                // בנית filters עבור StorePage
                const filters = {
                    category_id: combo.category?.id || null,
                    subcategory_ids: combo.subcategory ? [combo.subcategory.id] : null,
                    city: combo.city,
                    active_tab: "all",
                    delivery: false,
                    pickup: false,
                    open_now: false
                };

                // יצירת StorePage
                const newPage = await base44.asServiceRole.entities.StorePage.create({
                    title: combo.title,
                    slug: combo.slug,
                    description: contentResponse?.description || '',
                    meta_title: combo.meta_title,
                    meta_description: combo.meta_description,
                    filters: filters,
                    is_active: true,
                    view_count: 0
                });

                results.push({ 
                    slug: combo.slug, 
                    id: newPage.id,
                    title: combo.title,
                    type: combo.type
                });
                console.log(`✅ Created: ${combo.slug}`);

            } catch (error) {
                console.error(`❌ Error creating ${combo.slug}:`, error.message);
                errors.push({ 
                    slug: combo.slug,
                    title: combo.title,
                    error: error.message 
                });
            }

            // השהיה למניעת עומס API
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        return Response.json({
            success: true,
            message: `נוצרו ${results.length} דפי נחיתה חדשים`,
            stats: {
                total_possible: combinations.length,
                created: results.length,
                errors: errors.length,
                cities: cities.length
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