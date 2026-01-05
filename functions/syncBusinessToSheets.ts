import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized - Admin access required' }, { status: 403 });
    }

    // Get Google Sheets access token
    const accessToken = await base44.asServiceRole.connectors.getAccessToken('googlesheets');
    
    if (!accessToken) {
      return Response.json({ error: 'Google Sheets not connected. Please authorize first.' }, { status: 400 });
    }

    // Fetch all business pages
    const businesses = await base44.asServiceRole.entities.BusinessPage.list();

    // Prepare data for spreadsheet
    const headers = [
      'Business Name',
      'Category',
      'Subcategory', 
      'City',
      'Address',
      'Phone',
      'Email',
      'Website',
      'Status',
      'Kashrut',
      'Created Date',
      'Owner Email'
    ];

    const rows = businesses.map(business => [
      business.business_name || '',
      business.category_name || '',
      business.subcategory_name || '',
      business.city || '',
      business.full_address || '',
      business.phone || '',
      business.email || '',
      business.website || '',
      business.status || '',
      business.kashrut || '',
      business.created_date || '',
      business.created_by || ''
    ]);

    // Create spreadsheet
    const createResponse = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        properties: {
          title: `Meshlanoo Business Listings - ${new Date().toLocaleDateString('he-IL')}`
        },
        sheets: [{
          properties: {
            title: 'Businesses',
            gridProperties: {
              rowCount: rows.length + 1,
              columnCount: headers.length
            }
          }
        }]
      })
    });

    if (!createResponse.ok) {
      const error = await createResponse.text();
      console.error('Failed to create spreadsheet:', error);
      return Response.json({ error: 'Failed to create spreadsheet', details: error }, { status: 500 });
    }

    const spreadsheet = await createResponse.json();
    const spreadsheetId = spreadsheet.spreadsheetId;
    const spreadsheetUrl = spreadsheet.spreadsheetUrl;

    // Write data to spreadsheet
    const updateResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Businesses!A1:append?valueInputOption=RAW`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          values: [headers, ...rows]
        })
      }
    );

    if (!updateResponse.ok) {
      const error = await updateResponse.text();
      console.error('Failed to write data:', error);
      return Response.json({ error: 'Failed to write data to spreadsheet', details: error }, { status: 500 });
    }

    // Format header row (make it bold)
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          requests: [
            {
              repeatCell: {
                range: {
                  sheetId: 0,
                  startRowIndex: 0,
                  endRowIndex: 1
                },
                cell: {
                  userEnteredFormat: {
                    backgroundColor: { red: 0.2, green: 0.5, blue: 0.8 },
                    textFormat: {
                      foregroundColor: { red: 1, green: 1, blue: 1 },
                      bold: true
                    }
                  }
                },
                fields: 'userEnteredFormat(backgroundColor,textFormat)'
              }
            },
            {
              autoResizeDimensions: {
                dimensions: {
                  sheetId: 0,
                  dimension: 'COLUMNS',
                  startIndex: 0,
                  endIndex: headers.length
                }
              }
            }
          ]
        })
      }
    );

    return Response.json({
      success: true,
      spreadsheetId,
      spreadsheetUrl,
      totalBusinesses: businesses.length,
      message: 'Successfully synced businesses to Google Sheets'
    });

  } catch (error) {
    console.error('Error syncing to Google Sheets:', error);
    return Response.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
});