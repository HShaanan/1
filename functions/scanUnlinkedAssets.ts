import { createClientFromRequest } from 'npm:@base44/sdk@0.5.0';

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);

    // בדיקת הרשאות מנהל
    const authed = await base44.auth.isAuthenticated().catch(() => false);
    if (!authed) {
        return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), { 
            status: 401, 
            headers: { "Content-Type": "application/json" } 
        });
    }

    const me = await base44.auth.me().catch(() => null);
    if (!me || me.role !== "admin") {
        return new Response(JSON.stringify({ ok: false, error: "Admin access required" }), { 
            status: 403, 
            headers: { "Content-Type": "application/json" } 
        });
    }

    try {
        // קריאת הפעולה מה-body
        const { action, assetIds } = await req.json().catch(() => ({ action: 'scan' }));

        if (action === 'scan') {
            // שלב 1: איסוף כל ה-URLs המקושרים
            console.log("Starting unlinked assets scan...");
            
            const linkedUrls = new Set();

            // מודעות פעילות ומאושרות
            try {
                const listings = await base44.asServiceRole.entities.Listing.filter({
                    is_active: true,
                    approval_status: 'approved'
                });
                
                console.log(`Found ${listings.length} active listings`);
                
                listings.forEach(listing => {
                    if (Array.isArray(listing.images)) {
                        listing.images.forEach(url => {
                            if (url && typeof url === 'string') {
                                linkedUrls.add(url.trim());
                            }
                        });
                    }
                });
            } catch (error) {
                console.error("Error fetching listings:", error);
            }

            // קטגוריות פעילות
            try {
                const categories = await base44.asServiceRole.entities.Category.filter({
                    is_active: true
                });
                
                console.log(`Found ${categories.length} active categories`);
                
                categories.forEach(category => {
                    if (category.image && typeof category.image === 'string') {
                        linkedUrls.add(category.image.trim());
                    }
                });
            } catch (error) {
                console.error("Error fetching categories:", error);
            }

            // באנרים פעילים
            try {
                const banners = await base44.asServiceRole.entities.BannerAd.filter({
                    is_active: true
                });
                
                console.log(`Found ${banners.length} active banners`);
                
                banners.forEach(banner => {
                    [banner.image_url, banner.video_url, banner.poster_url].forEach(url => {
                        if (url && typeof url === 'string') {
                            linkedUrls.add(url.trim());
                        }
                    });
                });
            } catch (error) {
                console.error("Error fetching banners:", error);
            }

            console.log(`Found ${linkedUrls.size} linked URLs`);

            // שלב 2: בדיקת נכסי מדיה
            let mediaAssets = [];
            try {
                // מביא רק נכסים שלא סומנו כ'unlinked' או 'deleted'
                const allAssets = await base44.asServiceRole.entities.MediaAsset.list();
                mediaAssets = allAssets.filter(asset => 
                    asset.status !== 'unlinked' && 
                    asset.status !== 'deleted'
                );
                
                console.log(`Found ${mediaAssets.length} media assets to check`);
            } catch (error) {
                console.error("Error fetching media assets:", error);
                return new Response(JSON.stringify({ 
                    ok: false, 
                    error: "Failed to fetch media assets" 
                }), { 
                    status: 500, 
                    headers: { "Content-Type": "application/json" } 
                });
            }

            // שלב 3: זיהוי נכסים לא מקושרים
            const unlinkedAssets = mediaAssets.filter(asset => {
                if (!asset.url || typeof asset.url !== 'string') return false;
                return !linkedUrls.has(asset.url.trim());
            });

            console.log(`Found ${unlinkedAssets.length} unlinked assets`);

            return new Response(JSON.stringify({
                ok: true,
                action: 'scan',
                found: unlinkedAssets.length,
                total_checked: mediaAssets.length,
                linked_urls_count: linkedUrls.size,
                assets: unlinkedAssets.map(asset => ({
                    id: asset.id,
                    url: asset.url,
                    title: asset.title || 'ללא כותרת',
                    media_type: asset.media_type || 'image',
                    created_date: asset.created_date
                }))
            }), { 
                status: 200, 
                headers: { "Content-Type": "application/json" } 
            });

        } else if (action === 'mark') {
            // סימון נכסים כ'לא מקושרים'
            if (!Array.isArray(assetIds) || assetIds.length === 0) {
                return new Response(JSON.stringify({ 
                    ok: false, 
                    error: "No asset IDs provided" 
                }), { 
                    status: 400, 
                    headers: { "Content-Type": "application/json" } 
                });
            }

            let updated = 0;
            for (const assetId of assetIds) {
                try {
                    await base44.asServiceRole.entities.MediaAsset.update(assetId, {
                        status: 'unlinked'
                    });
                    updated++;
                } catch (error) {
                    console.error(`Failed to mark asset ${assetId}:`, error);
                }
            }

            return new Response(JSON.stringify({
                ok: true,
                action: 'mark',
                updated,
                total: assetIds.length
            }), { 
                status: 200, 
                headers: { "Content-Type": "application/json" } 
            });

        } else if (action === 'delete') {
            // מחיקת נכסים לצמיתות
            if (!Array.isArray(assetIds) || assetIds.length === 0) {
                return new Response(JSON.stringify({ 
                    ok: false, 
                    error: "No asset IDs provided" 
                }), { 
                    status: 400, 
                    headers: { "Content-Type": "application/json" } 
                });
            }

            let deleted = 0;
            for (const assetId of assetIds) {
                try {
                    await base44.asServiceRole.entities.MediaAsset.delete(assetId);
                    deleted++;
                } catch (error) {
                    console.error(`Failed to delete asset ${assetId}:`, error);
                }
            }

            return new Response(JSON.stringify({
                ok: true,
                action: 'delete',
                deleted,
                total: assetIds.length
            }), { 
                status: 200, 
                headers: { "Content-Type": "application/json" } 
            });

        } else {
            return new Response(JSON.stringify({ 
                ok: false, 
                error: "Invalid action. Use 'scan', 'mark', or 'delete'" 
            }), { 
                status: 400, 
                headers: { "Content-Type": "application/json" } 
            });
        }

    } catch (error) {
        console.error("Scan function error:", error);
        return new Response(JSON.stringify({ 
            ok: false, 
            error: error.message || "Internal server error" 
        }), { 
            status: 500, 
            headers: { "Content-Type": "application/json" } 
        });
    }
});