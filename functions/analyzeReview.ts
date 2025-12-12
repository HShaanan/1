import { createClientFromRequest } from 'npm:@base44/sdk@0.5.0';

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);

    try {
        const { review_id } = await req.json();
        
        if (!review_id) {
            return new Response(JSON.stringify({ error: 'review_id is required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Get the review
        const review = await base44.asServiceRole.entities.Review.get(review_id);
        if (!review) {
            return new Response(JSON.stringify({ error: 'Review not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // קבלת הזמן הישראלי לעדכון
        let israelTime;
        try {
            const { data: timeResponse } = await base44.functions.invoke('getIsraelTime', {});
            israelTime = timeResponse?.israelTime || new Date().toISOString();
        } catch (timeError) {
            console.warn('Could not get Israel time, using local time:', timeError);
            israelTime = new Date().toISOString();
        }

        // Update review with Israel time
        await base44.asServiceRole.entities.Review.update(review_id, {
            updated_date: israelTime,
            ai_processed: true,
            ai_processed_at: israelTime
        });

        return new Response(JSON.stringify({ 
            success: true, 
            message: 'Review analyzed and updated with Israel time',
            israel_time: israelTime
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error analyzing review:', error);
        return new Response(JSON.stringify({ 
            error: 'Internal server error',
            details: error.message 
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
});