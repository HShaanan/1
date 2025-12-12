import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user || user.role !== 'admin') {
            return Response.json({ 
                success: false, 
                error: 'Unauthorized. Admin access required.' 
            }, { status: 403 });
        }

        const { business_page_id, new_owner_email } = await req.json();

        if (!business_page_id || !new_owner_email) {
            return Response.json({ 
                success: false, 
                error: 'Missing required parameters: business_page_id and new_owner_email.' 
            }, { status: 400 });
        }

        // בדיקת תקינות אימייל
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(new_owner_email)) {
            return Response.json({ 
                success: false, 
                error: 'Invalid email format.' 
            }, { status: 400 });
        }

        const cleanEmail = new_owner_email.trim().toLowerCase();

        console.log(`[FixOwnership] Attempting to update business page ${business_page_id} with owner ${cleanEmail}`);

        // עדכון בעלות
        await base44.asServiceRole.entities.BusinessPage.update(business_page_id, {
            business_owner_email: cleanEmail
        });

        console.log(`[FixOwnership] Update completed for business page ${business_page_id}`);

        // אימות ש השינוי התבצע
        const verifiedPage = await base44.asServiceRole.entities.BusinessPage.get(business_page_id);
        
        if (verifiedPage.business_owner_email === cleanEmail) {
            console.log(`[FixOwnership] SUCCESS: Ownership verified for ${cleanEmail}`);
            return Response.json({ 
                success: true, 
                message: `הבעלות על העסק עודכנה בהצלחה ל-${cleanEmail}`,
                data: {
                    business_page_id: business_page_id,
                    new_owner_email: cleanEmail,
                    business_name: verifiedPage.business_name
                }
            });
        } else {
            console.error(`[FixOwnership] FAILED: Verification failed. Expected ${cleanEmail}, got ${verifiedPage.business_owner_email}`);
            return Response.json({ 
                success: false, 
                error: `שגיאה: העדכון לא נשמר. הבעלים הנוכחי הוא ${verifiedPage.business_owner_email || 'לא מוגדר'}.` 
            }, { status: 500 });
        }

    } catch (error) {
        console.error('[FixOwnership] Error:', error.message);
        return Response.json({ 
            success: false, 
            error: `שגיאה פנימית: ${error.message}` 
        }, { status: 500 });
    }
});