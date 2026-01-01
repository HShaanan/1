import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Authenticate user
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get Salesforce access token via App Connector
    const accessToken = await base44.asServiceRole.connectors.getAccessToken("salesforce");
    
    if (!accessToken) {
      return Response.json({ 
        error: 'Salesforce not connected. Please authorize Salesforce first.' 
      }, { status: 403 });
    }

    // Fetch Salesforce instance URL (usually provided during OAuth)
    // For now, we'll use a common pattern - you may need to adjust this
    const instanceUrl = 'https://YOUR_INSTANCE.salesforce.com'; // This will be dynamic in production
    
    // Query Opportunities with stages
    const query = `SELECT Id, Name, StageName, Amount, CloseDate, Probability, AccountId, Account.Name, OwnerId, Owner.Name, CreatedDate FROM Opportunity ORDER BY CreatedDate DESC LIMIT 100`;
    const queryUrl = `${instanceUrl}/services/data/v58.0/query?q=${encodeURIComponent(query)}`;
    
    const response = await fetch(queryUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Salesforce API error:', response.status, errorText);
      return Response.json({ 
        error: 'Failed to fetch Salesforce data',
        details: errorText 
      }, { status: response.status });
    }

    const data = await response.json();
    
    // Transform data for easier consumption
    const opportunities = data.records.map(opp => ({
      id: opp.Id,
      name: opp.Name,
      stage: opp.StageName,
      amount: opp.Amount,
      closeDate: opp.CloseDate,
      probability: opp.Probability,
      accountName: opp.Account?.Name,
      ownerName: opp.Owner?.Name,
      createdDate: opp.CreatedDate
    }));

    // Calculate stage statistics
    const stageStats = opportunities.reduce((acc, opp) => {
      const stage = opp.stage || 'Unknown';
      if (!acc[stage]) {
        acc[stage] = { count: 0, totalAmount: 0, opportunities: [] };
      }
      acc[stage].count++;
      acc[stage].totalAmount += opp.amount || 0;
      acc[stage].opportunities.push(opp);
      return acc;
    }, {});

    return Response.json({
      success: true,
      opportunities,
      stageStats,
      totalOpportunities: opportunities.length,
      totalValue: opportunities.reduce((sum, opp) => sum + (opp.amount || 0), 0)
    });

  } catch (error) {
    console.error('Salesforce integration error:', error);
    return Response.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
});