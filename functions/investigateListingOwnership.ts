import { createClientFromRequest } from 'npm:@base44/sdk@0.5.0';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const adminUser = await base44.auth.me();

        if (!adminUser || adminUser.role !== 'admin') {
            return new Response(JSON.stringify({ error: 'Unauthorized: Admin access required.' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
        }

        const { listing_id } = await req.json();

        if (!listing_id) {
            return new Response(JSON.stringify({ error: 'Missing listing_id parameter.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }

        // Use service role to bypass RLS for investigation
        const listing = await base44.asServiceRole.entities.Listing.get(listing_id);

        if (!listing) {
            return new Response(JSON.stringify({ error: `Listing with id ${listing_id} not found.` }), { status: 404, headers: { 'Content-Type': 'application/json' } });
        }

        const investigationResult = {
            listing_id: listing.id,
            title: listing.title,
            created_at: listing.created_date,
            created_by: listing.created_by, // השדה היחיד לבעלות
            current_owner_determination: {
                primary_owner: listing.created_by || null,
                source: listing.created_by ? 'created_by' : 'none',
            },
            history_log: [
                { timestamp: new Date().toISOString(), event: "Investigation run by admin: " + adminUser.email },
                { timestamp: listing.created_date, event: `Listing created. Owner: ${listing.created_by}.` }
            ]
        };

        return new Response(JSON.stringify({ success: true, data: investigationResult }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Investigation Error:', error);
        return new Response(JSON.stringify({ success: false, error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
});