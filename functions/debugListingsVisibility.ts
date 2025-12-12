import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get all business pages
        const allPages = await base44.asServiceRole.entities.BusinessPage.list();
        
        // Filter active and approved
        const activePages = allPages.filter(page => 
            page.is_active === true && page.approval_status === 'approved'
        );

        // Get categories for reference
        const categories = await base44.asServiceRole.entities.Category.list();

        const debug = {
            total_pages: allPages.length,
            active_approved_pages: activePages.length,
            inactive_pages: allPages.filter(page => !page.is_active).length,
            pending_pages: allPages.filter(page => page.approval_status === 'pending').length,
            rejected_pages: allPages.filter(page => page.approval_status === 'rejected').length,
            categories_count: categories.length,
            sample_active_pages: activePages.slice(0, 3).map(page => ({
                id: page.id,
                display_title: page.display_title,
                business_name: page.business_name,
                category_id: page.category_id,
                is_active: page.is_active,
                approval_status: page.approval_status,
                created_date: page.created_date
            }))
        };

        return Response.json({ success: true, debug });

    } catch (error) {
        console.error('Debug error:', error);
        return Response.json({ 
            error: 'Failed to debug business pages visibility',
            details: error.message 
        }, { status: 500 });
    }
});