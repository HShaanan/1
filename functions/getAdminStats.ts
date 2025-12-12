import { createClientFromRequest } from 'npm:@base44/sdk@0.7.0';

// Server-side in-memory cache to prevent rate limiting
const cache = {
    data: null,
    timestamp: 0,
    inProgress: false,
};

const CACHE_DURATION_MS = 3 * 60 * 1000; // 3 minutes

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);

    try {
        const user = await base44.auth.me();
        if (!user || user.role !== 'admin') {
            return new Response(JSON.stringify({ 
                success: false, 
                error: 'Unauthorized access' 
            }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const now = Date.now();
        
        // Check cache first
        if (cache.data && (now - cache.timestamp < CACHE_DURATION_MS)) {
            console.log('⚡️ Serving admin stats from cache.');
            return new Response(JSON.stringify({ 
                success: true, 
                data: cache.data, 
                fromCache: true 
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Prevent concurrent fetches
        if (cache.inProgress) {
            console.log('⏳ Fetch in progress, returning stale cache data if available.');
            if (cache.data) {
                return new Response(JSON.stringify({ 
                    success: true, 
                    data: cache.data, 
                    fromCache: true, 
                    stale: true 
                }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
            
            return new Response(JSON.stringify({ 
                success: false, 
                error: 'Too many concurrent requests, please try again shortly.' 
            }), {
                status: 429, 
                headers: { 'Content-Type': 'application/json' }
            });
        }

        cache.inProgress = true;
        console.log('📊 Fetching fresh admin stats...');

        // Calculate time for online users (last 5 minutes)
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

        // Use Promise.allSettled to handle partial failures gracefully
        const [pendingListingsResult, allReportsResult, onlineUsersResult] = await Promise.allSettled([
            base44.asServiceRole.entities.Listing.filter({ approval_status: 'pending' }).catch(err => {
                console.error('Error fetching pending listings:', err);
                return [];
            }),
            base44.asServiceRole.entities.Report.list('-created_date', 100).catch(err => {
                console.error('Error fetching reports:', err);
                return [];
            }),
            base44.asServiceRole.entities.User.filter({ 
                last_activity: { $gte: fiveMinutesAgo } 
            }).catch(err => {
                console.error('Error fetching online users:', err);
                return [];
            })
        ]);

        // Process results with fallbacks
        const pendingListingsCount = pendingListingsResult.status === 'fulfilled' 
            ? pendingListingsResult.value.length 
            : 0;

        const allReports = allReportsResult.status === 'fulfilled' 
            ? allReportsResult.value 
            : [];

        const newReportsCount = Array.isArray(allReports) 
            ? allReports.filter(r => r.status === 'new').length 
            : 0;

        const onlineUsersCount = onlineUsersResult.status === 'fulfilled' 
            ? Math.max(onlineUsersResult.value.length, 1) 
            : 1; // At least the admin is online

        const stats = {
            pendingListingsCount,
            newReportsCount,
            onlineUsersCount,
            lastUpdated: new Date().toISOString(),
            hasErrors: pendingListingsResult.status === 'rejected' || 
                      allReportsResult.status === 'rejected' || 
                      onlineUsersResult.status === 'rejected'
        };

        // Update cache
        cache.data = stats;
        cache.timestamp = now;
        
        console.log('📊 Admin stats computed successfully:', stats);

        return new Response(JSON.stringify({ 
            success: true, 
            data: stats, 
            fromCache: false 
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('💥 Critical error in getAdminStats:', error);
        
        // Try to return cached data if available, even if stale
        if (cache.data) {
            console.log('🆘 Returning stale cache data due to error');
            return new Response(JSON.stringify({ 
                success: true, 
                data: cache.data, 
                fromCache: true, 
                error: 'Partial data due to error' 
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Return fallback data if no cache available
        const fallbackStats = {
            pendingListingsCount: 0,
            newReportsCount: 0,
            onlineUsersCount: 1,
            lastUpdated: new Date().toISOString(),
            hasErrors: true,
            errorMessage: 'Unable to fetch current stats'
        };

        return new Response(JSON.stringify({ 
            success: true, 
            data: fallbackStats, 
            fallback: true 
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } finally {
        cache.inProgress = false; // Always release the lock
    }
});