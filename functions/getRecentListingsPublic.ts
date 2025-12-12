import { createClientFromRequest } from 'npm:@base44/sdk@0.5.0';

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    const { limit = 8 } = await req.json();

    try {
        const client = base44.asServiceRole;

        const recentListings = await client.entities.Listing.filter(
            { is_active: true, approval_status: 'approved' },
            '-created_date',
            limit
        );

        return new Response(JSON.stringify({
            success: true,
            listings: recentListings
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Error fetching recent listings:', error);
        return new Response(JSON.stringify({ 
            success: false, 
            error: 'Failed to fetch listings',
            details: error.message 
        }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
});