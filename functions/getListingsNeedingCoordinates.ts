import { createClientFromRequest } from 'npm:@base44/sdk@0.5.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Ensure user is authenticated
    if (!(await base44.auth.isAuthenticated())) {
      return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // Optionally verify admin role (the page already does this; double-check here)
    const me = await base44.auth.me().catch(() => null);
    if (!me || me.role !== 'admin') {
      return Response.json({ success: false, message: 'Admin only' }, { status: 403 });
    }

    // Read optional payload
    let limit = 250;
    try {
      const body = await req.json();
      if (body && typeof body.limit === 'number' && body.limit > 0 && body.limit <= 1000) {
        limit = body.limit;
      }
    } catch (_) {
      // no body provided -> use defaults
    }

    // Fetch recent listings and filter those needing coordinates
    // Using service role to avoid user filters and to allow admin operation
    const recent = await base44.asServiceRole.entities.Listing.list('-updated_date', Math.max(limit * 2, 300));
    const needs = (recent || []).filter((l) => {
      const hasAddress = !!(l && typeof l.address === 'string' && l.address.trim().length > 0);
      const latOk = typeof l?.lat === 'number' && !Number.isNaN(l.lat);
      const lngOk = typeof l?.lng === 'number' && !Number.isNaN(l.lng);
      return hasAddress && !(latOk && lngOk);
    }).slice(0, limit);

    const listings = needs.map((l) => ({
      id: l.id,
      title: l.title || '',
      address: l.address || '',
      category_id: l.category_id || null,
    }));

    return Response.json({ success: true, count: listings.length, listings });
  } catch (error) {
    return Response.json(
      { success: false, message: error?.message || 'Internal error' },
      { status: 500 }
    );
  }
});