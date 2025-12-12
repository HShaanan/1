import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Unauthorized - Admin only' }, { status: 401 });
        }

        // שליפת כל הקטגוריות
        const allCategories = await base44.asServiceRole.entities.Category.list();
        console.log('Total categories found:', allCategories.length);

        // הקטגוריות שאנחנו רוצים לשמור (עם וריאציות שמות אפשריות)
        const keepCategories = [
            'אוכל', 'מזון', 'אוכל ושתייה', 'מזון ומשקאות',
            'קניות', 'קנייה', 'שופינג', 'חנויות',
            'אנשי מקצוע', 'שירותים', 'מומחים', 'מקצועות',
            'נדל"ן', 'נדלן', 'בתים', 'דירות', 'נכסים'
        ];

        // מציאת הקטגוריות הראשיות שצריך לשמור
        const categoriesToKeep = allCategories.filter(cat => 
            !cat.parent_id && // קטגוריות ראשיות בלבד
            keepCategories.some(keep => 
                cat.name.includes(keep) || keep.includes(cat.name)
            )
        );

        console.log('Main categories to keep:', categoriesToKeep.map(c => c.name));

        // איסוף כל התתי-קטגוריות של הקטגוריות שנשמרות
        const subcategoriesToKeep = allCategories.filter(cat => 
            cat.parent_id && 
            categoriesToKeep.some(keep => keep.id === cat.parent_id)
        );

        console.log('Subcategories to keep:', subcategoriesToKeep.length);

        // רשימת כל הקטגוריות שנשמרות (ראשיות + תתיות)
        const allToKeep = [...categoriesToKeep, ...subcategoriesToKeep];
        const idsToKeep = allToKeep.map(c => c.id);

        // מחיקת הקטגוריות שלא צריכות להישמר
        const categoriesToDelete = allCategories.filter(cat => 
            !idsToKeep.includes(cat.id)
        );

        console.log('Categories to delete:', categoriesToDelete.length);

        // ביצוע המחיקה
        let deletedCount = 0;
        for (const cat of categoriesToDelete) {
            try {
                await base44.asServiceRole.entities.Category.delete(cat.id);
                deletedCount++;
                console.log(`Deleted: ${cat.name}`);
            } catch (error) {
                console.error(`Failed to delete ${cat.name}:`, error.message);
            }
        }

        return Response.json({
            success: true,
            message: `ניקוי הושלם בהצלחה`,
            data: {
                totalCategories: allCategories.length,
                categoriesKept: allToKeep.length,
                categoriesDeleted: deletedCount,
                keptCategories: allToKeep.map(c => ({
                    name: c.name,
                    isMainCategory: !c.parent_id,
                    parentName: c.parent_id ? 
                        categoriesToKeep.find(main => main.id === c.parent_id)?.name 
                        : null
                }))
            }
        });

    } catch (error) {
        console.error('Error in cleanup:', error);
        return Response.json({ 
            error: 'שגיאה בביצוע הניקוי', 
            details: error.message 
        }, { status: 500 });
    }
});