import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { business_page_id } = await req.json();

        if (!business_page_id) {
            return Response.json({ error: 'business_page_id is required' }, { status: 400 });
        }

        // Get all reviews for this business page
        const reviews = await base44.asServiceRole.entities.Review.filter({
            business_page_id: business_page_id,
            is_active: true
        });

        const reviewsCount = reviews.length;
        const avgRating = reviewsCount > 0 
            ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviewsCount
            : 0;

        // Update business page with correct counts
        await base44.asServiceRole.entities.BusinessPage.update(business_page_id, {
            reviews_count: reviewsCount,
            smart_rating: Math.round(avgRating * 10) / 10 // Round to 1 decimal place
        });

        return Response.json({
            success: true,
            updated: {
                business_page_id,
                reviews_count: reviewsCount,
                smart_rating: Math.round(avgRating * 10) / 10
            }
        });

    } catch (error) {
        console.error('Update error:', error);
        return Response.json({ 
            error: 'Failed to update business page counts',
            details: error.message 
        }, { status: 500 });
    }
});