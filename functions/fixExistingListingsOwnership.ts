import { createClientFromRequest } from 'npm:@base44/sdk@0.5.0';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Admin access required
        const user = await base44.auth.me();
        if (!user || user.role !== 'admin') {
            return Response.json({ 
                success: false, 
                error: 'Unauthorized: Admin access required' 
            }, { status: 403 });
        }

        console.log('[FixOwnership] Starting ownership fix process...');

        // Get all listings using service role to bypass RLS
        const allListings = await base44.asServiceRole.entities.Listing.list();
        console.log(`[FixOwnership] Found ${allListings.length} total listings`);

        let fixedCount = 0;
        let alreadyCorrectCount = 0;
        let errorCount = 0;
        const errors = [];

        for (const listing of allListings) {
            try {
                // Skip if created_by is already set correctly
                if (listing.created_by && listing.created_by !== 'unknown' && listing.created_by.includes('@')) {
                    alreadyCorrectCount++;
                    continue;
                }

                // Check if we have creator_email to use as source of truth
                if (!listing.creator_email || !listing.creator_email.includes('@')) {
                    console.warn(`[FixOwnership] Listing ${listing.id} has no valid creator_email: ${listing.creator_email}`);
                    continue;
                }

                // Update the created_by field
                await base44.asServiceRole.entities.Listing.update(listing.id, {
                    created_by: listing.creator_email
                });

                fixedCount++;
                console.log(`[FixOwnership] Fixed listing ${listing.id}: ${listing.title} -> owner: ${listing.creator_email}`);

            } catch (err) {
                errorCount++;
                const errorMsg = `Failed to fix listing ${listing.id}: ${err.message}`;
                errors.push(errorMsg);
                console.error(`[FixOwnership] ${errorMsg}`);
            }
        }

        const summary = {
            success: true,
            totalListings: allListings.length,
            fixedCount,
            alreadyCorrectCount,
            errorCount,
            errors: errors.slice(0, 10), // Limit to first 10 errors
            message: `תיקון הושלם! עודכנו ${fixedCount} מודעות, ${alreadyCorrectCount} כבר היו תקינות, ${errorCount} שגיאות.`
        };

        console.log('[FixOwnership] Process completed:', summary);
        
        return Response.json(summary);

    } catch (error) {
        console.error('[FixOwnership] Fatal error:', error);
        return Response.json({
            success: false,
            error: `שגיאה כללית: ${error.message}`
        }, { status: 500 });
    }
});