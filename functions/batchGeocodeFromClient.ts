import { createClientFromRequest } from 'npm:@base44/sdk@0.5.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    if (!(await base44.auth.isAuthenticated())) {
      return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const me = await base44.auth.me().catch(() => null);
    if (!me || me.role !== 'admin') {
      return Response.json({ success: false, message: 'Admin only' }, { status: 403 });
    }

    const { listingUpdates } = await req.json();
    if (!Array.isArray(listingUpdates) || listingUpdates.length === 0) {
      return Response.json({ success: false, message: 'No updates provided', updated: 0, errors: 0 });
    }

    let updated = 0;
    let errors = 0;
    const errorsList = [];

    // Update each listing with provided coordinates and optionally normalized address
    for (const item of listingUpdates) {
      try {
        const id = item?.id;
        const lat = Number(item?.lat);
        const lng = Number(item?.lng);
        const newAddress = typeof item?.address === 'string' ? item.address : undefined;

        if (!id || Number.isNaN(lat) || Number.isNaN(lng)) {
          errors++;
          errorsList.push({ id, reason: 'Invalid id/lat/lng' });
          continue;
        }

        const patch = { lat, lng };
        if (newAddress && newAddress.trim().length > 0) {
          patch.address = newAddress.trim();
        }

        await base44.asServiceRole.entities.Listing.update(id, patch);
        updated++;
      } catch (e) {
        errors++;
        errorsList.push({ id: item?.id, reason: e?.message || 'update failed' });
      }
    }

    return Response.json({
      success: true,
      updated,
      errors,
      details: errorsList,
    });
  } catch (error) {
    return Response.json(
      { success: false, message: error?.message || 'Internal error', updated: 0, errors: 0 },
      { status: 500 }
    );
  }
});