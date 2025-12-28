import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { GoogleAuth } from 'npm:google-auth-library@9.6.3';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        const user = await base44.auth.me();
        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Unauthorized - Admin only' }, { status: 401 });
        }

        // Get credentials from secrets
        const credentialsJson = Deno.env.get('GOOGLE_INDEXING_CREDENTIALS');
        
        console.log('Checking GOOGLE_INDEXING_CREDENTIALS...');
        console.log('Secret exists:', !!credentialsJson);
        console.log('Secret length:', credentialsJson?.length || 0);
        
        if (!credentialsJson) {
            return Response.json({ 
                error: 'Missing GOOGLE_INDEXING_CREDENTIALS secret',
                debug: 'Secret not found in environment variables',
                hint: 'Check Base44 dashboard > Settings > Secrets'
            }, { status: 400 });
        }

        let credentials;
        try {
            credentials = JSON.parse(credentialsJson);
            if (!credentials.client_email || !credentials.private_key) {
                throw new Error('Missing required fields (client_email or private_key)');
            }
        } catch (parseError) {
            return Response.json({
                error: 'Invalid credentials JSON format',
                details: parseError.message,
                hint: 'Make sure the secret contains valid Google Service Account JSON'
            }, { status: 400 });
        }

        // Initialize Google Auth
        const auth = new GoogleAuth({
            credentials,
            scopes: ['https://www.googleapis.com/auth/indexing']
        });

        const client = await auth.getClient();
        const baseUrl = 'https://meshelanu.co.il';
        
        // Collect all URLs
        const urls = [];

        // 1. Static pages
        urls.push(baseUrl);
        urls.push(`${baseUrl}/browse`);
        urls.push(`${baseUrl}/search`);
        urls.push(`${baseUrl}/add`);
        urls.push(`${baseUrl}/landing`);

        // 2. Business pages
        const businesses = await base44.asServiceRole.entities.BusinessPage.filter({ 
            is_active: true, 
            approval_status: 'approved' 
        });
        
        for (const business of businesses) {
            if (business.url_slug) {
                urls.push(`${baseUrl}/business/${business.url_slug}`);
            }
        }

        // 3. Category pages (dynamic)
        const categories = await base44.asServiceRole.entities.Category.list();
        for (const category of categories) {
            if (category.slug) {
                urls.push(`${baseUrl}/category/${category.slug}`);
            }
        }

        // 4. Landing pages (SEO stores)
        const landingPages = await base44.asServiceRole.entities.LandingPage.filter({ is_active: true });
        for (const page of landingPages) {
            if (page.url_path) {
                urls.push(`${baseUrl}${page.url_path}`);
            }
        }

        // Send to Google Indexing API
        const results = [];
        const BATCH_SIZE = 100;
        
        for (let i = 0; i < urls.length; i += BATCH_SIZE) {
            const batch = urls.slice(i, i + BATCH_SIZE);
            
            for (const url of batch) {
                try {
                    const response = await client.request({
                        url: 'https://indexing.googleapis.com/v3/urlNotifications:publish',
                        method: 'POST',
                        data: {
                            url: url,
                            type: 'URL_UPDATED'
                        }
                    });

                    results.push({
                        url,
                        status: 'success',
                        response: response.data
                    });

                    // Rate limiting - wait 100ms between requests
                    await new Promise(resolve => setTimeout(resolve, 100));
                    
                } catch (error) {
                    results.push({
                        url,
                        status: 'error',
                        error: error.message
                    });
                }
            }
        }

        const summary = {
            total: urls.length,
            success: results.filter(r => r.status === 'success').length,
            failed: results.filter(r => r.status === 'error').length
        };

        return Response.json({
            success: true,
            summary,
            results
        });

    } catch (error) {
        console.error('Google Indexing error:', error);
        return Response.json({ 
            error: error.message,
            details: error.stack
        }, { status: 500 });
    }
});