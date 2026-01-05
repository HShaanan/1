import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import * as XLSX from 'npm:xlsx';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Admin only
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { fileData, fileName } = await req.json();
    
    if (!fileData) {
      return Response.json({ error: 'No file provided' }, { status: 400 });
    }

    // Decode base64 to arrayBuffer
    const binaryString = atob(fileData);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const arrayBuffer = bytes.buffer;
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(firstSheet);

    if (jsonData.length === 0) {
      return Response.json({ error: 'Excel file is empty or invalid' }, { status: 400 });
    }

    // Debug: Print actual column names
    const firstRowKeys = Object.keys(jsonData[0] || {});
    console.log('📋 Excel columns found:', firstRowKeys);

    const results = {
      total: jsonData.length,
      success: 0,
      failed: 0,
      errors: [],
      debug: { columns: firstRowKeys }
    };

    // Get all categories and kashrut authorities once
    const categories = await base44.asServiceRole.entities.Category.list();
    const allKashrut = await base44.asServiceRole.entities.Kashrut.list();

    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];

      try {
        // Flexible column matching - find key that contains the text
        const getColumnValue = (keywords) => {
          for (const key of Object.keys(row)) {
            const normalizedKey = key.trim().toLowerCase();
            if (keywords.some(kw => normalizedKey.includes(kw.toLowerCase()))) {
              const val = row[key];
              return val ? String(val).trim() : '';
            }
          }
          return '';
        };

        const businessName = getColumnValue(['שם העסק', 'שם עסק', 'עסק', 'שם']);
        const address = getColumnValue(['כתובת', 'רחוב', 'מען']);
        const phone = getColumnValue(['טלפון', 'פלאפון', 'נייד', 'טל']);
        const kashrut = getColumnValue(['מפקח', 'כשרות', 'רשות']);

        // Skip empty or invalid rows
        if (!businessName || !businessName.trim() || businessName.toLowerCase().includes('empty')) {
          continue;
        }

        // Skip rows with clearly invalid data (headers, fax numbers, etc.)
        const lowerName = businessName.toLowerCase().trim();
        if (lowerName.includes('שעות פתיחה') || 
            lowerName.includes('פקס:') || 
            lowerName.includes('אימייל') ||
            lowerName.includes('rate limit') ||
            lowerName.length < 3) {
          continue;
        }

        // Find or use default category
        let categoryId = categories.find(c => c.name === 'אחר')?.id;
        if (!categoryId && categories.length > 0) {
          categoryId = categories[0].id;
        }

        // Find kashrut authority if provided
        let kashrutAuthority = null;
        if (kashrut && kashrut.trim()) {
          kashrutAuthority = allKashrut.find(k => 
            k.name?.includes(kashrut.trim()) || 
            kashrut.trim().includes(k.name || '')
          );
        }

        const businessData = {
          business_name: businessName.trim(),
          display_title: businessName.trim(),
          description: `${businessName.trim()} - עסק כשר`,
          contact_phone: phone?.trim() || '',
          city: 'ביתר עילית',
          address: address?.trim() || '',
          business_owner_email: user.email,
          category_id: categoryId,
          is_active: false,
          approval_status: 'pending',
          kashrut_id: kashrutAuthority?.id || null,
          metadata: {
            imported_from_csv: true,
            import_date: new Date().toISOString(),
            kashrut_text: kashrut?.trim() || null
          }
        };

        await base44.asServiceRole.entities.BusinessPage.create(businessData);
        results.success++;

      } catch (error) {
        results.failed++;
        results.errors.push(`Row ${i + 2}: ${error.message}`);
      }
    }

    return Response.json({
      success: true,
      results
    });

  } catch (error) {
    console.error('CSV import error:', error);
    return Response.json({ 
      error: 'Import failed',
      details: error.message 
    }, { status: 500 });
  }
});