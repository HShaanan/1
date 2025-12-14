import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized - admin only' }, { status: 403 });
    }

    // טעינת כל עמודי העסק הפעילים
    const pages = await base44.asServiceRole.entities.BusinessPage.filter({
      is_active: true,
      approval_status: 'approved'
    });

    console.log(`📊 Found ${pages.length} active business pages to improve`);

    const results = {
      total: pages.length,
      improved: 0,
      fixed_hours: 0,
      errors: []
    };

    // טעינת קטגוריות לשיפור AI
    const categories = await base44.asServiceRole.entities.Category.list();

    for (const page of pages) {
      try {
        let updated = false;
        const updateData = {};

        // 1. תיקון שעות פעילות
        if (page.hours) {
          let parsedHours = page.hours;
          
          if (typeof parsedHours === 'string') {
            try {
              parsedHours = JSON.parse(parsedHours);
            } catch (e) {
              // פורמט טקסט מגוגל - המרה
              const textHours = parsedHours;
              const schedule = {};
              
              const dayMapping = {
                'ראשון': 'sunday',
                'שני': 'monday',
                'שלישי': 'tuesday',
                'רביעי': 'wednesday',
                'חמישי': 'thursday',
                'שישי': 'friday',
                'שבת': 'saturday'
              };
              
              const lines = textHours.split('\n');
              lines.forEach(line => {
                const match = line.match(/יום\s+(\S+):\s+(.+)/);
                if (match) {
                  const hebrewDay = match[1];
                  const timeStr = match[2].trim();
                  const dayKey = dayMapping[hebrewDay];
                  
                  if (dayKey) {
                    if (timeStr === 'סגור') {
                      schedule[dayKey] = { isOpen: false };
                    } else {
                      const ranges = timeStr.split(',').map(r => r.trim());
                      const timeRanges = ranges.map(range => {
                        const times = range.split(/[–-]/).map(t => t.trim());
                        if (times.length === 2) {
                          return { open: times[0], close: times[1] };
                        }
                        return null;
                      }).filter(Boolean);
                      
                      if (timeRanges.length > 0) {
                        schedule[dayKey] = {
                          isOpen: true,
                          is24Hours: false,
                          timeRanges
                        };
                      }
                    }
                  }
                }
              });
              
              parsedHours = { schedule };
              updateData.hours = JSON.stringify(parsedHours);
              updated = true;
              results.fixed_hours++;
            }
          } else {
            // בדיקה אם צריך להמיר פורמט ישן לחדש
            const schedule = parsedHours.schedule || parsedHours;
            
            if (schedule && Object.keys(schedule).length > 0) {
              const firstKey = Object.keys(schedule)[0];
              const firstDay = schedule[firstKey];
              
              if (firstDay && (firstDay.hasOwnProperty('open') || firstDay.hasOwnProperty('closed'))) {
                const newSchedule = {};
                Object.keys(schedule).forEach(day => {
                  const oldDay = schedule[day];
                  if (oldDay.closed) {
                    newSchedule[day] = { isOpen: false };
                  } else if (oldDay.open && oldDay.close) {
                    newSchedule[day] = {
                      isOpen: true,
                      is24Hours: false,
                      timeRanges: [{ open: oldDay.open, close: oldDay.close }]
                    };
                  }
                });
                parsedHours = { schedule: newSchedule };
                updateData.hours = JSON.stringify(parsedHours);
                updated = true;
                results.fixed_hours++;
              }
            }
          }
        }

        // 2. שיפור תוכן עם AI (רק אם חסר תיאור או כותרת)
        const needsImprovement = !page.description || page.description.length < 50 || !page.display_title;
        
        if (needsImprovement) {
          const categoryName = categories.find(c => c.id === page.category_id)?.name || "";
          const subcategoryName = (Array.isArray(page.subcategory_ids) && page.subcategory_ids.length > 0)
            ? categories.find(c => c.id === page.subcategory_ids[0])?.name || ""
            : "";

          try {
            const aiResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
              prompt: `שפר את התוכן הבא לעמוד עסק בשפה עברית צנועה ומקצועית.

נתוני העסק:
- שם: ${page.business_name || ""}
- כותרת: ${page.display_title || ""}
- תיאור: ${page.description || ""}
- קטגוריה: ${categoryName}
- תת-קטגוריה: ${subcategoryName}
- כתובת: ${page.address || ""}

הנחיות:
1. שפר את הכותרת (עד 70 תווים)
2. שפר את התיאור (200-400 תווים, ברור ואטרקטיבי)
3. הצע טקסט לכפתור ווטסאפ (עד 40 תווים)
4. הצע הודעת ווטסאפ (עד 140 תווים)
5. הצע 3-5 תגיות רלוונטיות

החזר JSON בלבד.`,
              response_json_schema: {
                type: "object",
                properties: {
                  improved_title: { type: "string" },
                  improved_description: { type: "string" },
                  whatsapp_button_text: { type: "string" },
                  whatsapp_message: { type: "string" },
                  tags: { type: "array", items: { type: "string" } }
                }
              }
            });

            if (aiResult.improved_title) {
              updateData.display_title = aiResult.improved_title.slice(0, 80);
            }
            if (aiResult.improved_description) {
              updateData.description = aiResult.improved_description;
            }
            if (aiResult.whatsapp_button_text) {
              updateData.whatsapp_button_text = aiResult.whatsapp_button_text.slice(0, 40);
            }
            if (aiResult.whatsapp_message) {
              updateData.whatsapp_message = aiResult.whatsapp_message.slice(0, 140);
            }
            if (Array.isArray(aiResult.tags) && aiResult.tags.length > 0) {
              const currentTags = page.special_fields?.tags || [];
              const mergedTags = [...new Set([...currentTags, ...aiResult.tags])];
              updateData.special_fields = {
                ...(page.special_fields || {}),
                tags: mergedTags
              };
            }

            updated = true;
            results.improved++;
          } catch (aiErr) {
            console.error(`AI improvement failed for ${page.business_name}:`, aiErr);
          }
        }

        // עדכון העסק אם יש שינויים
        if (updated && Object.keys(updateData).length > 0) {
          await base44.asServiceRole.entities.BusinessPage.update(page.id, updateData);
          console.log(`✅ Updated: ${page.business_name}`);
        }

      } catch (pageErr) {
        console.error(`Error processing ${page.business_name}:`, pageErr);
        results.errors.push({
          business_name: page.business_name,
          error: pageErr.message
        });
      }
    }

    return Response.json({
      success: true,
      results
    });

  } catch (error) {
    console.error('Bulk improve error:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});