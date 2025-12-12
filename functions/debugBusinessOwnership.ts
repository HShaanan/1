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

        console.log('🔍 [Debug] Starting debug - user:', user.email);

        // שליפת כל עמודי העסק
        const allPages = await base44.asServiceRole.entities.BusinessPage.list();

        console.log('📊 [Debug] Found pages:', allPages.length);
        
        const details = allPages.map(page => ({
            id: page.id,
            serial_number: page.serial_number,
            business_name: page.business_name,
            url_slug: page.url_slug,
            business_owner_email: page.business_owner_email,
            approval_status: page.approval_status,
            is_active: page.is_active,
            is_frozen: page.is_frozen || false,
            created_date: page.created_date,
            metadata: page.metadata
        }));

        const summary = {
            total: allPages.length,
            pending: allPages.filter(p => p.approval_status === 'pending').length,
            approved: allPages.filter(p => p.approval_status === 'approved').length,
            rejected: allPages.filter(p => p.approval_status === 'rejected').length,
            active: allPages.filter(p => p.is_active).length,
            frozen: allPages.filter(p => p.is_frozen).length,
        };

        console.log('📊 [Debug] Summary:', summary);

        return Response.json({
            success: true,
            total_pages: allPages.length,
            summary: summary,
            pages: details
        });

    } catch (error) {
        console.error('❌ [Debug] Error:', error);
        return Response.json({ 
            success: false, 
            error: error.message,
            stack: error.stack
        }, { status: 500 });
    }
});