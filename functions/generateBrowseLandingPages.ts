import { createClient } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        // For scheduled tasks, use service role directly
        const appId = Deno.env.get("BASE44_APP_ID");
        const base44 = createClient(appId);

        const { mode = 'preview', maxPages = 50 } = await req.json().catch(() => ({}));

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
        
        // וריאציות חיפוש סמנטי
        const searchVariations = [
            { prefix: '', suffix: '' }, // בסיסי: "פיצה ביתר עילית"
            { prefix: 'חנות ', suffix: '' }, // "חנות פיצה ביתר עילית"
            { prefix: '', suffix: ' קרוב אליי' }, // "פיצה ביתר עילית קרוב אליי"
            { prefix: 'איפה למצוא ', suffix: '' }, // "איפה למצוא פיצה ביתר עילית"
            { prefix: 'איפה לקנות ', suffix: '' }, // "איפה לקנות..." (לקניות)
            { prefix: 'מתנה ל', suffix: '' }, // "מתנה ליום הולדת"
            { prefix: 'המלצות על ', suffix: '' }, // "המלצות על..."
            { prefix: '', suffix: ' זול' }, // "פיצה ביתר עילית זול"
            { prefix: '', suffix: ' באיכות' }, // "פיצה ביתר עילית באיכות"
        ];
        
        cities.forEach(city => {
            // קטגוריות ראשיות עם וריאציות
            mainCategories.forEach(category => {
                searchVariations.forEach(variation => {
                    const titleText = `${variation.prefix}${category.name}${variation.suffix} ב${city}`;
                    const slug = titleText
                        .toLowerCase()
                        .replace(/\s+/g, '-')
                        .replace(/[^\u0590-\u05FFa-z0-9-]/g, '');

                    if (!existingSlugs.has(slug) && slug.length > 5) {
                        combinations.push({
                            type: 'category_semantic',
                            city,
                            category,
                            slug,
                            title: titleText,
                            meta_title: `${titleText} | משלנו - המדריך המלא`,
                            meta_description: `${titleText} - מצאו את העסקים המומלצים ביותר ב${city}. ביקורות, מחירים, פרטי קשר ועוד.`
                        });
                    }
                });
            });

            // תת-קטגוריות עם וריאציות מצומצמות (רק הפופולריות)
            subcategories.slice(0, 15).forEach(subcat => {
                const popularVariations = [
                    { prefix: '', suffix: '' },
                    { prefix: 'חנות ', suffix: '' },
                    { prefix: 'איפה למצוא ', suffix: '' }
                ];
                
                popularVariations.forEach(variation => {
                    const titleText = `${variation.prefix}${subcat.name}${variation.suffix} ב${city}`;
                    const slug = titleText
                        .toLowerCase()
                        .replace(/\s+/g, '-')
                        .replace(/[^\u0590-\u05FFa-z0-9-]/g, '');

                    if (!existingSlugs.has(slug) && slug.length > 5) {
                        const parent = mainCategories.find(c => c.id === subcat.parent_id);
                        combinations.push({
                            type: 'subcategory_semantic',
                            city,
                            category: parent,
                            subcategory: subcat,
                            slug,
                            title: titleText,
                            meta_title: `${titleText} | משלנו`,
                            meta_description: `${titleText} - הרשימה המלאה של העסקים המובילים. מצאו את העסק המושלם עבורכם.`
                        });
                    }
                });
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
                // יצירת תוכן AI - התאמה לסוג החיפוש
                let promptText = '';
                
                if (combo.type === 'category_semantic' || combo.type === 'category') {
                    promptText = `צור תוכן SEO איכותי לדף נחיתה לחיפוש: "${combo.title}"
                    
כתוב פסקה עשירה ב-150-250 מילים בעברית תקנית שכוללת:
- תשובה ישירה לשאלת המשתמש
- למה ${combo.city} היא מקום מצוין למצוא את זה
- מה חשוב לדעת לפני שבוחרים
- קריאה לפעולה לגלות את העסקים המומלצים

התוכן חייב להיות טבעי, שיחתי, ועונה ישירות על כוונת החיפוש.`;
                } else {
                    promptText = `צור תוכן SEO איכותי לדף נחיתה לחיפוש: "${combo.title}"
                    
כתוב פסקה עשירה ב-150-250 מילים בעברית תקנית שכוללת:
- תשובה ישירות לשאלת המשתמש
- טיפים לבחירה נכונה
- מה מייחד את ${combo.city}
- קריאה לפעולה

התוכן חייב להיות טבעי, שיחתי, ועונה על כוונת החיפוש.`;
                }

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