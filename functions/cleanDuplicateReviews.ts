import { createClientFromRequest } from 'npm:@base44/sdk@0.5.0';

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);

    try {
        // Check if user is admin
        const user = await base44.auth.me();
        if (!user || user.role !== 'admin') {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        console.log('🧹 Starting duplicate reviews cleanup...');

        // Get all active reviews
        const allReviews = await base44.asServiceRole.entities.Review.filter({ is_active: true });
        
        console.log(`📊 Found ${allReviews.length} active reviews`);

        // Group reviews by listing_id and reviewer_email
        const reviewGroups = {};
        
        allReviews.forEach(review => {
            const key = `${review.listing_id}-${review.reviewer_email}`;
            if (!reviewGroups[key]) {
                reviewGroups[key] = [];
            }
            reviewGroups[key].push(review);
        });

        let duplicatesFound = 0;
        let duplicatesRemoved = 0;

        // Process each group
        for (const [key, reviews] of Object.entries(reviewGroups)) {
            if (reviews.length > 1) {
                duplicatesFound += reviews.length - 1;
                
                console.log(`🔍 Found ${reviews.length} reviews for ${key}`);
                
                // Sort by created_date (newest first)
                reviews.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
                
                // Keep the newest, delete the rest
                const keepReview = reviews[0];
                const reviewsToDelete = reviews.slice(1);
                
                console.log(`✅ Keeping review ${keepReview.id} (${keepReview.created_date})`);
                
                for (const reviewToDelete of reviewsToDelete) {
                    try {
                        console.log(`🗑️ Deleting review ${reviewToDelete.id} (${reviewToDelete.created_date})`);
                        await base44.asServiceRole.entities.Review.delete(reviewToDelete.id);
                        duplicatesRemoved++;
                    } catch (error) {
                        console.error(`❌ Error deleting review ${reviewToDelete.id}:`, error);
                    }
                }
            }
        }

        const result = {
            success: true,
            totalReviews: allReviews.length,
            duplicatesFound,
            duplicatesRemoved,
            message: `נוקו ${duplicatesRemoved} חוות דעת כפולות מתוך ${duplicatesFound} שנמצאו`
        };

        console.log('🎉 Cleanup completed:', result);

        return new Response(JSON.stringify(result), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('❌ Error in cleanDuplicateReviews:', error);
        return new Response(JSON.stringify({ 
            error: 'Internal server error',
            details: error.message 
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
});