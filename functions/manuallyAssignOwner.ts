import { createClientFromRequest } from 'npm:@base44/sdk@0.5.0';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);

        // 1. Admin check
        const user = await base44.auth.me();
        if (!user || user.role !== 'admin') {
            return Response.json({ success: false, message: 'Unauthorized. Admins only.' }, { status: 403 });
        }

        const { listing_id, owner_email } = await req.json();
        console.log(`[AssignOwner] Request received: listing_id=${listing_id}, owner_email=${owner_email}`);

        if (!listing_id || !owner_email) {
            return Response.json({ success: false, message: 'Listing ID and Owner Email are required.' }, { status: 400 });
        }
        
        // 2. עדכון created_by במקום assigned_owner
        console.log(`[AssignOwner] Attempting to update listing ${listing_id} with created_by=${owner_email}`);
        await base44.asServiceRole.entities.Listing.update(listing_id, {
            created_by: owner_email
        });
        
        console.log(`[AssignOwner] SDK update call for listing ${listing_id} completed. Now verifying.`);

        // 3. Verification step
        const verifiedListing = await base44.asServiceRole.entities.Listing.get(listing_id);
        console.log('[AssignOwner] Verification get call completed. Fetched created_by:', verifiedListing.created_by);

        if (verifiedListing.created_by === owner_email) {
            // It worked!
            console.log(`[AssignOwner] SUCCESS: Owner for listing ${listing_id} correctly updated to ${owner_email}.`);
            return Response.json({ 
                success: true, 
                message: `הבעלות על המודעה הועברה בהצלחה ל-${owner_email}` 
            });
        } else {
            // It failed
            console.error(`[AssignOwner] FAILED: Owner update did not persist for listing ${listing_id}. DB value is still ${verifiedListing.created_by}`);
            return Response.json({ 
                success: false, 
                message: `שגיאה: העדכון לא נשמר. הבעלים הנוכחי הוא עדיין ${verifiedListing.created_by || 'לא מוגדר'}.` 
            }, { status: 500 });
        }

    } catch (error) {
        console.error('[AssignOwner] Error caught in function:', error.message);
        return Response.json(
            { success: false, message: `שגיאה פנימית במערכת: ${error.message}` },
            { status: 500 }
        );
    }
});