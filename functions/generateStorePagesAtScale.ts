import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * פונקציה לייצור אוטומטי של דפי StorePage בקנה מידה רחב
 * מבוססת על מטריצת שילובים של קטגוריות, כשרויות וערים
 */
Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Unauthorized - Admin only' }, { status: 401 });
        }

        const { mode = 'preview', batchSize = 10, filters = {} } = await req.json().catch(() => ({}));

        // שלב 1: איסוף נתונים
        console.log('📊 שלב 1: שליפת נתונים...');
        const [categories, kashrutList, businessPages] = await Promise.all([
            base44.asServiceRole.entities.Category.list('sort_order'),
            base44.asServiceRole.entities.Kashrut.list('name'),
            base44.asServiceRole.entities.BusinessPage.filter({ is_active: true })
        ]);

        // זיהוי ערים פעילות
        const cities = [...new Set(businessPages.map(b => b.city).filter(Boolean))];
        
        // קטגוריות ראשיות ותתי-קטגוריות
        const mainCategories = categories.filter(c => !c.parent_id);
        const subCategories = categories.filter(c => c.parent_id);

        console.log(`✅ נמצאו: ${mainCategories.length} קטגוריות, ${subCategories.length} תת-קטגוריות, ${kashrutList.length} כשרויות, ${cities.length} ערים`);

        // שלב 2: בניית מטריצת שילובים
        console.log('🔄 שלב 2: בניית מטריצת שילובים...');
        const combinations = [];

        // סוג 1: קטגוריה ראשית + עיר
        for (const cat of mainCategories) {
            for (const city of cities) {
                combinations.push({
                    type: 'main_category_city',
                    category_id: cat.id,
                    category_name: cat.name,
                    city: city,
                    kashrut: null
                });
            }
        }

        // סוג 2: קטגוריה ראשית + כשרות + עיר
        for (const cat of mainCategories) {
            for (const kashrut of kashrutList) {
                for (const city of cities) {
                    combinations.push({
                        type: 'main_category_kashrut_city',
                        category_id: cat.id,
                        category_name: cat.name,
                        city: city,
                        kashrut: [kashrut.name]
                    });
                }
            }
        }

        // סוג 3: תת-קטגוריה + עיר
        for (const subCat of subCategories) {
            for (const city of cities) {
                const parentCat = mainCategories.find(c => c.id === subCat.parent_id);
                combinations.push({
                    type: 'sub_category_city',
                    category_id: parentCat?.id,
                    subcategory_id: subCat.id,
                    category_name: subCat.name,
                    city: city,
                    kashrut: null
                });
            }
        }

        // סוג 4: תת-קטגוריה + כשרות + עיר (רק לכשרויות מרכזיות)
        const mainKashrut = kashrutList.slice(0, 3); // רק 3 כשרויות מרכזיות לתת-קטגוריות
        for (const subCat of subCategories) {
            for (const kashrut of mainKashrut) {
                for (const city of cities) {
                    const parentCat = mainCategories.find(c => c.id === subCat.parent_id);
                    combinations.push({
                        type: 'sub_category_kashrut_city',
                        category_id: parentCat?.id,
                        subcategory_id: subCat.id,
                        category_name: subCat.name,
                        city: city,
                        kashrut: [kashrut.name]
                    });
                }
            }
        }

        // סוג 5: שירותים כלליים (משלוחים, איסוף עצמי)
        for (const city of cities) {
            combinations.push({
                type: 'delivery_service',
                category_name: 'משלוחי אוכל',
                city: city,
                delivery: true
            });
            combinations.push({
                type: 'pickup_service',
                category_name: 'איסוף עצמי',
                city: city,
                pickup: true
            });
        }

        console.log(`✅ נבנו ${combinations.length} שילובים אפשריים`);

        // סינון לפי פילטרים שהוגדרו
        let filteredCombinations = combinations;
        if (filters.cities && filters.cities.length > 0) {
            filteredCombinations = filteredCombinations.filter(c => filters.cities.includes(c.city));
        }
        if (filters.categories && filters.categories.length > 0) {
            filteredCombinations = filteredCombinations.filter(c => 
                filters.categories.includes(c.category_id) || filters.categories.includes(c.subcategory_id)
            );
        }

        console.log(`📋 אחרי סינון: ${filteredCombinations.length} שילובים לעיבוד`);

        // במצב preview - החזר רק את המטריצה
        if (mode === 'preview') {
            return Response.json({
                success: true,
                preview: true,
                total_combinations: filteredCombinations.length,
                sample_combinations: filteredCombinations.slice(0, 10),
                stats: {
                    main_categories: mainCategories.length,
                    sub_categories: subCategories.length,
                    kashrut_types: kashrutList.length,
                    cities: cities.length
                }
            });
        }

        // שלב 3 + 4: יצירת תוכן ודפים
        console.log('🚀 שלב 3-4: יצירת תוכן ודפים...');
        const results = [];
        const errors = [];
        
        // עיבוד באצוות
        for (let i = 0; i < filteredCombinations.length; i += batchSize) {
            const batch = filteredCombinations.slice(i, i + batchSize);
            console.log(`📦 מעבד אצווה ${Math.floor(i / batchSize) + 1}/${Math.ceil(filteredCombinations.length / batchSize)}`);

            for (const combo of batch) {
                try {
                    // יצירת slug ייחודי
                    const slugParts = [];
                    if (combo.category_name) slugParts.push(combo.category_name);
                    if (combo.kashrut) slugParts.push(combo.kashrut[0]);
                    if (combo.city) slugParts.push(combo.city);
                    const slug = slugParts
                        .join('-')
                        .toLowerCase()
                        .replace(/\s+/g, '-')
                        .replace(/[^\u0590-\u05FFa-z0-9-]/g, '');

                    // בדיקה אם הדף כבר קיים
                    const existing = await base44.asServiceRole.entities.StorePage.filter({ slug });
                    if (existing && existing.length > 0) {
                        console.log(`⏭️ דף קיים: ${slug}`);
                        continue;
                    }

                    // יצירת פרומפט ל-AI
                    const promptContext = `
קטגוריה: ${combo.category_name}
עיר: ${combo.city}
כשרות: ${combo.kashrut ? combo.kashrut.join(', ') : 'לא מוגדר'}
סוג: ${combo.type}

צור תוכן SEO איכותי ומושך למרה לדף נחיתה זה. השתמש במבנה AIDA:
- Attention: כותרת חזקה שמושכת
- Interest: למה הקטגוריה/שירות הזה חשוב
- Desire: מה המשתמש מקבל, יתרונות
- Action: קריאה ברורה לפעולה

התוכן חייב להיות:
1. ייחודי ומקורי (לא גנרי)
2. עשיר במילות מפתח באופן טבעי
3. ממוקד המרה (CRO)
4. בעברית תקנית וברורה
5. 200-400 מילים`;

                    // קריאה ל-AI ליצירת תוכן
                    const contentResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
                        prompt: promptContext,
                        response_json_schema: {
                            type: "object",
                            properties: {
                                title: { 
                                    type: "string",
                                    description: "כותרת H1 ממוקדת SEO (עד 70 תווים)"
                                },
                                description: { 
                                    type: "string",
                                    description: "תוכן עשיר SEO (200-400 מילים)"
                                },
                                meta_title: { 
                                    type: "string",
                                    description: "Meta title (עד 60 תווים)"
                                },
                                meta_description: { 
                                    type: "string",
                                    description: "Meta description (עד 160 תווים)"
                                }
                            },
                            required: ["title", "description", "meta_title", "meta_description"]
                        }
                    });

                    if (!contentResponse || !contentResponse.title) {
                        throw new Error('AI failed to generate content');
                    }

                    // בניית אובייקט סינון
                    const pageFilters = {
                        category_id: combo.category_id || null,
                        subcategory_ids: combo.subcategory_id ? [combo.subcategory_id] : null,
                        kashrut: combo.kashrut || null,
                        active_tab: combo.category_id ? 'all' : null,
                        delivery: combo.delivery || false,
                        pickup: combo.pickup || false,
                        open_now: false
                    };

                    // יצירת דף StorePage
                    const newPage = await base44.asServiceRole.entities.StorePage.create({
                        title: contentResponse.title,
                        slug: slug,
                        description: contentResponse.description,
                        meta_title: contentResponse.meta_title,
                        meta_description: contentResponse.meta_description,
                        is_active: true,
                        filters: pageFilters,
                        specific_business_ids: null
                    });

                    results.push({ slug, id: newPage.id, title: contentResponse.title });
                    console.log(`✅ נוצר דף: ${slug}`);

                } catch (error) {
                    console.error(`❌ שגיאה ביצירת ${combo.category_name} - ${combo.city}:`, error.message);
                    errors.push({ combo, error: error.message });
                }
            }

            // השהיה קצרה בין אצוות למניעת עומס
            if (i + batchSize < filteredCombinations.length) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }

        return Response.json({
            success: true,
            message: `יצירת דפים הושלמה בהצלחה`,
            stats: {
                total_attempted: filteredCombinations.length,
                created: results.length,
                errors: errors.length
            },
            created_pages: results,
            errors: errors.slice(0, 10) // רק 10 שגיאות ראשונות
        });

    } catch (error) {
        console.error('💥 שגיאה כללית:', error);
        return Response.json({
            success: false,
            error: error.message,
            stack: error.stack
        }, { status: 500 });
    }
});