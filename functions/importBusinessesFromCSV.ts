import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Admin only
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get('file');
    
    if (!file) {
      return Response.json({ error: 'No file provided' }, { status: 400 });
    }

    const csvText = await file.text();
    const lines = csvText.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      return Response.json({ error: 'CSV file is empty or invalid' }, { status: 400 });
    }

    // Skip header
    const dataLines = lines.slice(1);
    
    const results = {
      total: dataLines.length,
      success: 0,
      failed: 0,
      errors: []
    };

    // Get all categories for mapping
    const categories = await base44.asServiceRole.entities.Category.list();
    
    for (let i = 0; i < dataLines.length; i++) {
      const line = dataLines[i];
      const columns = line.split('\t'); // Tab-separated
      
      try {
        const [
          businessName,
          phone,
          phoneExtra,
          address,
          city,
          kashrutStartDate,
          kashrutEndDate,
          email
        ] = columns;

        if (!businessName?.trim() || !phone?.trim()) {
          results.failed++;
          results.errors.push(`Row ${i + 2}: Missing required fields (business name or phone)`);
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