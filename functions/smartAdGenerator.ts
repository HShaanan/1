
import { createClientFromRequest } from 'npm:@base44/sdk@0.5.0';

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    const { business_name, category_name, subcategory_name, initial_data } = await req.json();

    if (!business_name?.trim()) {
        return new Response(JSON.stringify({
            success: false,
            error: "יש לספק שם עסק"
        }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
        });
    }

    // Unify all Google API keys to GOOGLE_MAPS_APIKEY
    const googleAiKey = Deno.env.get("GOOGLE_MAPS_APIKEY");

    if (!googleAiKey) {
        return new Response(JSON.stringify({
            success: false,
            error: "GOOGLE_MAPS_APIKEY לא הוגדר"
        }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }

    try {
        // **STEP 1: Better business search in Hebrew context**
        const searchPrompt = `חפש מידע אמיתי על העסק "${business_name}" בישראל.
        מצא פרטי קשר אמיתיים אם הם קיימים ברשת:
        - מספר טלפון ישראלי (פורמט כמו 03-1234567 או 050-1234567)
        - כתובת אתר מלאה
        - כתובת פיזית מלאה בישראל

        אם לא נמצא - החזר מחרוזות ריקות. החזר רק מידע אמיתי שקיים באינטרנט.

        החזר JSON בלבד:`;

        const searchPayload = {
            contents: [{ parts: [{ text: searchPrompt }] }],
            generationConfig: {
                temperature: 0.1,
                responseMimeType: "application/json",
                responseSchema: {
                    type: "object",
                    properties: {
                        contact_phone: { type: "string" },
                        website_url: { type: "string" },
                        address: { type: "string" },
                        business_found: { type: "boolean" },
                        search_notes: { type: "string" }
                    }
                }
            },
            tools: [{ googleSearchRetrieval: {} }]
        };

        console.log(`Searching for real data for: ${business_name}`);
        let extractedData = {
            contact_phone: "",
            website_url: "",
            address: "",
            business_found: false,
            search_notes: "לא נמצא"
        };

        try {
            const searchResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${googleAiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(searchPayload)
            });

            if (searchResponse.ok) {
                const searchResult = await searchResponse.json();
                if (searchResult.candidates?.[0]?.content?.parts?.[0]?.text) {
                    try {
                        const parsed = JSON.parse(searchResult.candidates[0].content.parts[0].text);
                        extractedData = { ...extractedData, ...parsed };
                        console.log("Search results:", extractedData);
                    } catch (parseError) {
                        console.warn("Failed to parse search results:", parseError);
                    }
                }
            }
        } catch (searchError) {
            console.warn("Search failed:", searchError.message);
        }

        // **STEP 2: Generate Hebrew ad copy with strict language control**
        const adPrompt = `צור מודעה עסקית מקצועית בעברית בלבד עבור "${business_name}" בתחום "${category_name}"${subcategory_name ? ` (${subcategory_name})` : ''}.

נתונים שנמצאו: ${JSON.stringify(extractedData, null, 2)}

דרישות חמורות:
- כתוב רק בעברית! אסור שפות אחרות!
- כותרת: עד 50 תווים, קליטה ומקצועית
- תיאור: 150-250 מילים, מותאם לציבור דתי/חרדי
- דגש על איכות, אמינות, ניסיון
- שפה מכבדת ללא הבטחות יתר
- אל תמציא פרטי קשר!

החזר JSON בלבד:`;

        const adPayload = {
            contents: [{ parts: [{ text: adPrompt }] }],
            generationConfig: {
                temperature: 0.7, // Higher for more variety
                responseMimeType: "application/json",
                responseSchema: {
                    type: "object",
                    properties: {
                        title: { type: "string" },
                        description: { type: "string" }
                    }
                }
            }
        };

        console.log("Generating Hebrew ad copy...");
        let generatedAd = {
            title: `${business_name} - ${category_name}`,
            description: `${business_name} מציע שירותי ${category_name} מקצועיים ואמינים. צוות מנוסה עם דגש על שירות איכותי ושביעות רצון הלקוחות.`
        };

        try {
            const adResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${googleAiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(adPayload)
            });

            if (adResponse.ok) {
                const adResult = await adResponse.json();
                if (adResult.candidates?.[0]?.content?.parts?.[0]?.text) {
                    try {
                        const parsed = JSON.parse(adResult.candidates[0].content.parts[0].text);
                        generatedAd = { ...generatedAd, ...parsed };
                        console.log("Generated ad:", generatedAd);
                    } catch (parseError) {
                        console.warn("Failed to parse ad generation:", parseError);
                    }
                }
            }
        } catch (adError) {
            console.warn("Ad generation failed:", adError.message);
        }

        // **STEP 3: Final result with debug info**
        const finalData = {
            success: true,
            data: {
                title: generatedAd.title,
                description: generatedAd.description,
                contact_phone: extractedData.contact_phone || "",
                website_url: extractedData.website_url || "",
                address: extractedData.address || "",
                business_found: extractedData.business_found || false,
                debug_info: {
                    search_attempted: true,
                    search_notes: extractedData.search_notes || "חיפוש הושלם",
                    business_name_searched: business_name
                }
            }
        };

        console.log("Final result:", finalData);
        return new Response(JSON.stringify(finalData), {
            headers: { "Content-Type": "application/json" },
            status: 200,
        });

    } catch (error) {
        console.error("Smart ad generator error:", error);
        return new Response(JSON.stringify({
            success: false,
            error: "שגיאה בעיבוד הבקשה: " + error.message
        }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
});
