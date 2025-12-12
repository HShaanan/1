import { createClientFromRequest } from 'npm:@base44/sdk@0.5.0';

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);

    try {
        // Check if user is admin
        const user = await base44.auth.me();
        if (!user || user.role !== 'admin') {
            return new Response(JSON.stringify({ error: 'Unauthorized - Admin only' }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        console.log('🧹 Starting immediate duplicate reviews cleanup...');

        // Get all active reviews
        const allReviews = await base44.asServiceRole.entities.Review.filter({ is_active: true });
        
        console.log(`📊 Found ${allReviews.length} active reviews total`);

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
        const duplicateDetails = [];

        console.log(`🔍 Found ${Object.keys(reviewGroups).length} unique user-listing combinations`);

        // Process each group
        for (const [key, reviews] of Object.entries(reviewGroups)) {
            if (reviews.length > 1) {
                duplicatesFound += reviews.length - 1;
                
                console.log(`🔍 Found ${reviews.length} duplicate reviews for ${key}`);
                
                // Sort by created_date (newest first)
                reviews.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
                
                // Keep the newest, delete the rest
                const keepReview = reviews[0];
                const reviewsToDelete = reviews.slice(1);
                
                duplicateDetails.push({
                    key,
                    kept: {
                        id: keepReview.id,
                        created: keepReview.created_date,
                        text: keepReview.review_text?.substring(0, 50) + '...'
                    },
                    deleted: reviewsToDelete.map(r => ({
                        id: r.id,
                        created: r.created_date,
                        text: r.review_text?.substring(0, 50) + '...'
                    }))
                });
                
                console.log(`✅ Keeping review ${keepReview.id} (${keepReview.created_date})`);
                
                for (const reviewToDelete of reviewsToDelete) {
                    try {
                        console.log(`🗑️ Deleting duplicate review ${reviewToDelete.id} (${reviewToDelete.created_date})`);
                        await base44.asServiceRole.entities.Review.delete(reviewToDelete.id);
                        duplicatesRemoved++;
                    } catch (error) {
                        console.error(`❌ Error deleting review ${reviewToDelete.id}:`, error);
                    }
                }
            }
        }

        // Now update review counts for all affected listings
        const affectedListings = new Set();
        for (const [key] of Object.entries(reviewGroups)) {
            const listingId = key.split('-')[0];
            affectedListings.add(listingId);
        }

        console.log(`🔄 Updating review counts for ${affectedListings.size} listings...`);

        for (const listingId of affectedListings) {
            try {
                const activeReviews = await base44.asServiceRole.entities.Review.filter({
                    listing_id: listingId,
                    is_active: true
                });
                
                await base44.asServiceRole.entities.Listing.update(listingId, {
                    reviews_count: activeReviews.length
                });
                
                console.log(`✅ Updated listing ${listingId}: ${activeReviews.length} reviews`);
            } catch (error) {
                console.error(`❌ Error updating listing ${listingId}:`, error);
            }
        }

        const result = {
            success: true,
            totalReviews: allReviews.length,
            duplicatesFound,
            duplicatesRemoved,
            affectedListingsCount: affectedListings.size,
            duplicateDetails: duplicateDetails.slice(0, 10), // Show first 10 for debugging
            message: `✅ נוקו ${duplicatesRemoved} חוות דעת כפולות מתוך ${duplicatesFound} שנמצאו. עודכנו ${affectedListings.size} מודעות.`
        };

        console.log('🎉 Cleanup completed:', result);

        return new Response(JSON.stringify(result), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('❌ Error in cleanDuplicateReviewsNow:', error);
        return new Response(JSON.stringify({ 
            success: false,
            error: 'Internal server error',
            details: error.message 
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
});