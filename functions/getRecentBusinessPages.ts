import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    const { limit = 8 } = await req.json();

    try {
        const client = base44.asServiceRole;

        const recentPages = await client.entities.BusinessPage.filter(
            { is_active: true, approval_status: 'approved' },
            '-created_date',
            limit
        );

        return new Response(JSON.stringify({
            success: true,
            business_pages: recentPages
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Error fetching recent business pages:', error);
        return new Response(JSON.stringify({ 
            success: false, 
            error: 'Failed to fetch business pages',
            details: error.message 
        }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
});