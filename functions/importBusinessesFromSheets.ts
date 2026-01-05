import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized - Admin access required' }, { status: 403 });
    }

    // Get request body
    const { spreadsheetId, sheetName } = await req.json();

    if (!spreadsheetId) {
      return Response.json({ error: 'Spreadsheet ID is required' }, { status: 400 });
    }

    // Get Google Sheets access token
    const accessToken = await base44.asServiceRole.connectors.getAccessToken('googlesheets');
    
    if (!accessToken) {
      return Response.json({ error: 'Google Sheets not connected. Please authorize first.' }, { status: 400 });
    }

    // Fetch data from Google Sheets
    const range = sheetName ? `${sheetName}!A:Z` : 'A:Z';
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Failed to read spreadsheet:', error);
      
      if (response.status === 403 || response.status === 401) {
        return Response.json({ 
          error: 'אין הרשאה לקרוא את הגיליון. ודא שהגיליון משותף עם החשבון שלך או שהוא ציבורי.',
          details: error 
        }, { status: 403 });
      }
      
      return Response.json({ 
        error: 'לא ניתן לקרוא את הגיליון. ודא שהכתובת נכונה והגיליון נגיש.',
        details: error 
      }, { status: 500 });
    }

    const data = await response.json();
    const rows = data.values;

    console.log('Total rows from sheet:', rows?.length);

    if (!rows || rows.length === 0) {
      return Response.json({ error: 'No data found in spreadsheet' }, { status: 400 });
    }

    // First row is headers
    const headers = rows[0].map(h => h.trim());
    const dataRows = rows.slice(1);

    console.log('Headers found:', headers);
    console.log('Data rows count:', dataRows.length);

    // Find column indices
    const getColumnIndex = (possibleNames) => {
      for (const name of possibleNames) {
        const index = headers.findIndex(h => 
          h.toLowerCase().includes(name.toLowerCase())
        );
        if (index !== -1) return index;
      }
      return -1;
    };

    const nameIdx = getColumnIndex(['שם', 'name', 'business name', 'עסק']);
    const categoryIdx = getColumnIndex(['קטגוריה', 'category']);
    const subcategoryIdx = getColumnIndex(['תת קטגוריה', 'subcategory', 'תת-קטגוריה']);
    const cityIdx = getColumnIndex(['עיר', 'city']);
    const addressIdx = getColumnIndex(['כתובת', 'address', 'full address']);
    const phoneIdx = getColumnIndex(['טלפון', 'phone', 'פלאפון']);
    const emailIdx = getColumnIndex(['מייל', 'email', 'אימייל']);
    const websiteIdx = getColumnIndex(['אתר', 'website', 'אתר אינטרנט']);
    const kashrutIdx = getColumnIndex(['כשרות', 'kashrut']);
    const descriptionIdx = getColumnIndex(['תיאור', 'description']);

    console.log('Column mapping:', { nameIdx, categoryIdx, subcategoryIdx, cityIdx, addressIdx, phoneIdx });

    if (nameIdx === -1) {
      return Response.json({ 
        error: 'Could not find business name column. Available columns: ' + headers.join(', ') 
      }, { status: 400 });
    }

    // Fetch all categories for mapping
    const categories = await base44.asServiceRole.entities.Category.list();
    const categoryMap = new Map();
    categories.forEach(cat => {
      categoryMap.set(cat.name.toLowerCase(), cat);
      if (cat.slug) categoryMap.set(cat.slug.toLowerCase(), cat);
    });

    // Process rows
    const results = {
      success: [],
      errors: [],
      skipped: []
    };

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const rowNum = i + 2; // +2 because of header and 0-based index

      try {
        // Skip empty rows
        if (!row || row.length === 0 || !row[nameIdx] || row[nameIdx].trim() === '') {
          results.skipped.push({ row: rowNum, reason: 'Empty row' });
          continue;
        }

        const businessName = row[nameIdx]?.trim();
        if (!businessName) {
          results.skipped.push({ row: rowNum, reason: 'No business name' });
          continue;
        }

        // Build business data
        const businessData = {
          business_name: businessName,
          status: 'pending',
          created_by: user.email
        };

        // Category
        if (categoryIdx !== -1 && row[categoryIdx]) {
          const categoryName = row[categoryIdx].trim();
          const category = categoryMap.get(categoryName.toLowerCase());
          if (category) {
            businessData.category_id = category.id;
            businessData.category_name = category.name;
            businessData.category_slug = category.slug;
          }
        }

        // Subcategory
        if (subcategoryIdx !== -1 && row[subcategoryIdx]) {
          businessData.subcategory_name = row[subcategoryIdx].trim();
        }

        // City
        if (cityIdx !== -1 && row[cityIdx]) {
          businessData.city = row[cityIdx].trim();
        }

        // Address
        if (addressIdx !== -1 && row[addressIdx]) {
          businessData.full_address = row[addressIdx].trim();
        }

        // Phone
        if (phoneIdx !== -1 && row[phoneIdx]) {
          businessData.phone = row[phoneIdx].trim();
        }

        // Email
        if (emailIdx !== -1 && row[emailIdx]) {
          businessData.email = row[emailIdx].trim();
        }

        // Website
        if (websiteIdx !== -1 && row[websiteIdx]) {
          businessData.website = row[websiteIdx].trim();
        }

        // Kashrut
        if (kashrutIdx !== -1 && row[kashrutIdx]) {
          businessData.kashrut = row[kashrutIdx].trim();
        }

        // Description
        if (descriptionIdx !== -1 && row[descriptionIdx]) {
          businessData.description = row[descriptionIdx].trim();
        }

        // Create business page
        const created = await base44.asServiceRole.entities.BusinessPage.create(businessData);
        
        results.success.push({
          row: rowNum,
          name: businessName,
          id: created.id
        });

      } catch (error) {
        console.error(`Error processing row ${rowNum}:`, error);
        results.errors.push({
          row: rowNum,
          name: row[nameIdx]?.trim() || 'Unknown',
          error: error.message
        });
      }
    }

    const finalResult = {
      success: true,
      summary: {
        total: dataRows.length,
        imported: results.success.length,
        errors: results.errors.length,
        skipped: results.skipped.length
      },
      details: results
    };

    console.log('Import completed:', finalResult.summary);

    return Response.json(finalResult);

  } catch (error) {
    console.error('Error importing from Google Sheets:', error);
    return Response.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
});