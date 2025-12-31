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

    const results = {
      total: jsonData.length,
      success: 0,
      failed: 0,
      errors: []
    };

    // Get all categories for mapping
    const categories = await base44.asServiceRole.entities.Category.list();

    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];

      try {
        const businessName = row['שם עסק']?.toString().trim();
        const phone = row['טלפון']?.toString().trim();
        const phoneExtra = row['טלפון נוסף']?.toString().trim();
        const address = row['כתובת']?.toString().trim();
        const city = row['עיר']?.toString().trim();
        const kashrutStartDate = row['ממתי תוקף הכשרות']?.toString().trim();
        const kashrutEndDate = row['עד מתי תוקף הכשרות']?.toString().trim();
        const email = row['אימייל']?.toString().trim();

        if (!businessName || !phone) {
          results.failed++;
          results.errors.push(`Row ${i + 2}: Missing business name or phone`);
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