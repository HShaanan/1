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

    // Get all categories for mapping
    const categories = await base44.asServiceRole.entities.Category.list();

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

        const businessName = getColumnValue(['שם עסק', 'עסק', 'שם']);
        const phone = getColumnValue(['טלפון', 'פלאפון', 'נייד', 'טל']);
        const phoneExtra = getColumnValue(['טלפון נוסף', 'נוסף', 'טלפון 2']);
        const address = getColumnValue(['כתובת', 'רחוב', 'מען']);
        const city = getColumnValue(['עיר', 'יישוב']);
        const kashrutStartDate = getColumnValue(['ממתי תוקף', 'תוקף מ', 'תחילת']);
        const kashrutEndDate = getColumnValue(['עד מתי תוקף', 'תוקף עד', 'סיום']);
        const email = getColumnValue(['אימייל', 'מייל', 'email', 'דוא"ל']);

        if (!businessName || !phone) {
          results.failed++;
          results.errors.push(`Row ${i + 2}: Missing name="${businessName || 'EMPTY'}" or phone="${phone || 'EMPTY'}"`);
          continue;
        }

        // Find or use default category
        let categoryId = categories.find(c => c.name === 'אחר')?.id;
        if (!categoryId && categories.length > 0) {
          categoryId = categories[0].id;
        }

        const businessData = {
          business_name: businessName.trim(),
          display_title: businessName.trim(),
          description: `${businessName.trim()} - עסק כשר`,
          contact_phone: phone.trim(),
          city: city?.trim() || 'בית-שמש',
          address: address?.trim() || '',
          business_owner_email: email?.trim() || user.email,
          category_id: categoryId,
          is_active: false, // Requires approval
          approval_status: 'pending',
          metadata: {
            imported_from_csv: true,
            import_date: new Date().toISOString(),
            phone_extra: phoneExtra?.trim() || null,
            kashrut_start_date: kashrutStartDate?.trim() || null,
            kashrut_end_date: kashrutEndDate?.trim() || null
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