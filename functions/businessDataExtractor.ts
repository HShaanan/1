
import { createClientFromRequest } from 'npm:@base44/sdk@0.5.0';

function formatOpeningHours(openingHours) {
    if (!openingHours || !Array.isArray(openingHours.periods)) {
        return {};
    }

    const dayMapEng = {
        0: 'sunday', 1: 'monday', 2: 'tuesday', 3: 'wednesday', 4: 'thursday', 5: 'friday', 6: 'saturday'
    };

    const schedule = {};

    openingHours.periods.forEach(period => {
        const dayKey = dayMapEng[period.open.day];
        if (!dayKey) return; // Should not happen with valid data, but good safeguard

        const openTime = `${period.open.time.slice(0, 2)}:${period.open.time.slice(2)}`;
        
        // If there's no close time, assume it's open 24 hours from the open time.
        // This is typically for 24/7 businesses where the period doesn't have a close field.
        if (!period.close) {
             if (!schedule[dayKey]) schedule[dayKey] = '';
             // If a day has multiple 24-hour periods, this might look odd, but generally one period covers the whole day.
             schedule[dayKey] += (schedule[dayKey] ? ', ' : '') + `${openTime} - 24 שעות`;
             return;
        }

        const closeTime = `${period.close.time.slice(0, 2)}:${period.close.time.slice(2)}`;
        
        // Handle periods that span across midnight
        if (period.close.day !== period.open.day) {
            // Add range for the opening day until midnight
            if (!schedule[dayKey]) schedule[dayKey] = '';
            schedule[dayKey] += (schedule[dayKey] ? ', ' : '') + `${openTime} - 00:00`;
            
            // Add range for the closing day from midnight
            const closeDayKey = dayMapEng[period.close.day];
            if(closeDayKey) {
                if (!schedule[closeDayKey]) schedule[closeDayKey] = '';
                // Prepend to ensure the 00:00-X segment comes first if there are other segments on the closeDay.
                schedule[closeDayKey] = `00:00 - ${closeTime}` + (schedule[closeDayKey] ? ', ' + schedule[closeDayKey] : '');
            }
        } else {
            // Standard same-day period
            if (!schedule[dayKey]) schedule[dayKey] = '';
            schedule[dayKey] += (schedule[dayKey] ? ', ' : '') + `${openTime} - ${closeTime}`;
        }
    });

    // For days that are not in the schedule, mark them as closed
    Object.values(dayMapEng).forEach(dayKey => {
        if (!schedule[dayKey]) {
            // For a Haredi website, make Saturday's "Closed" message explicit for Shabbat.
            schedule[dayKey] = dayKey === 'saturday' ? 'סגור בשבת' : 'סגור';
        }
    });

    return schedule;
}

Deno.serve(async (req) => {
    // טיפול ב-CORS
    if (req.method === 'OPTIONS') {
        return new Response(null, {
            status: 204,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
        });
    }

    console.log("🚀 Starting businessDataExtractor function");

    try {
        const base44 = createClientFromRequest(req);
        
        // פרסור הבקשה
        let requestData;
        try {
            requestData = await req.json();
            console.log("📥 Request data received:", JSON.stringify(requestData, null, 2));
        } catch (e) {
            console.error("❌ Failed to parse request JSON:", e);
            return new Response(JSON.stringify({ 
                success: false,
                data: {
                    success: false,
                    error: "Invalid JSON in request body"
                }
            }), { 
                status: 400,
                headers: { 
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*" 
                },
            });
        }

        const { business_name, category_name, subcategory_name, address_hint } = requestData;

        console.log("🎯 Extracted parameters:", { 
            business_name, 
            category_name, 
            subcategory_name, 
            address_hint 
        });

        if (!business_name?.trim()) {
            console.log("❌ No business name provided");
            return new Response(JSON.stringify({ 
                success: false,
                data: {
                    success: false,
                    error: "חסר שם עסק"
                }
            }), { 
                status: 400,
                headers: { 
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*" 
                },
            });
        }

        // שימוש במפתח המאוחד לכל שירותי Google
        const googleApiKey = Deno.env.get("GOOGLE_MAPS_APIKEY");
        
        console.log("🔑 Using unified Google API key:", { 
            key_name: "GOOGLE_MAPS_APIKEY",
            key_present: !!googleApiKey,
            key_length: googleApiKey?.length || 0
        });
        
        if (!googleApiKey) {
            console.error("❌ Missing unified Google API key");
            return new Response(JSON.stringify({
                success: false,
                data: {
                    success: false,
                    error: "שגיאת תצורה: חסר מפתח GOOGLE_MAPS_APIKEY"
                }
            }), {
                status: 500,
                headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            });
        }

        console.log("🔍 Starting comprehensive business search...");
        
        // שלב 1: חיפוש העסק ב-Google Maps
        console.log("📍 Step 1: Searching in Google Maps");
        const mapsData = await searchBusinessInGoogleMaps(
            business_name.trim(),
            category_name,
            subcategory_name,
            address_hint,
            googleApiKey
        );
        console.log("📍 Maps search result:", JSON.stringify(mapsData, null, 2));

        // שלב 2: יצירת תוכן שיווקי עם Google Gemini
        console.log("🤖 Step 2: Generating content with Google Gemini");
        const contentData = await generateBusinessContent(
            business_name.trim(),
            category_name,
            subcategory_name,
            mapsData,
            googleApiKey
        );
        console.log("🤖 Content generation result:", JSON.stringify(contentData, null, 2));

        // שילוב הנתונים
        console.log("🔄 Step 3: Combining results");
        const businessData = {
            business_found: mapsData.found || contentData.success,
            search_confidence: Math.max(mapsData.confidence || 0, contentData.confidence || 0),
            contact_phone: mapsData.phone || contentData.phone || "",
            website_url: mapsData.website || contentData.website || "",
            address: mapsData.address || contentData.address || address_hint || "",
            coordinates: mapsData.coordinates || null,
            generated_title: contentData.title || generateDefaultTitle(business_name.trim(), category_name),
            generated_description: contentData.description || generateDefaultDescription(business_name.trim(), category_name),
            
            // --- שדות משודרגים ---
            generated_images: mapsData.images || [], // שינוי שם השדה כדי שיהיה ברור יותר
            keywords: [...new Set([...(mapsData.keywords || []), ...(contentData.keywords || [])])], // איחוד ומניעת כפילויות
            pricing_list: contentData.price_list || [], // שינוי שם השדה למשהו ברור יותר
            business_hours: mapsData.opening_hours || {}, // Correctly passing the processed hours object

            // --- שדות מטא-דאטה ---
            google_place_id: mapsData.place_id || "",
            google_maps_url: mapsData.maps_url || "",
            rating: mapsData.rating || null,
            total_ratings: mapsData.user_ratings_total || 0, // Using user_ratings_total from mapsData
            sources: [...(mapsData.sources || []), ...(contentData.sources || [])],
            raw_google_data: mapsData.raw_google_data || {}
        };
        
        console.log("✅ Final combined business data:", JSON.stringify(businessData, null, 2));

        console.log("✅ Business data extraction completed:", {
            found: businessData.business_found,
            confidence: businessData.search_confidence,
            sources: businessData.sources
        });

        return new Response(JSON.stringify({
            success: true,
            data: {
                success: true,
                data: businessData
            }
        }), {
            status: 200,
            headers: { 
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*" 
            },
        });

    } catch (error) {
        console.error("❌ Unexpected error in businessDataExtractor:", error);
        console.error("❌ Error stack:", error.stack);
        
        const errorResponse = {
            success: false,
            data: {
                success: false,
                error: error.message || "שגיאה בעיבוד הבקשה",
                stack: error.stack
            }
        };

        console.log("📤 Sending error response:", JSON.stringify(errorResponse, null, 2));

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { 
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*" 
            },
        });
    }
});

// חיפוש עסק ב-Google Maps/Places API
async function searchBusinessInGoogleMaps(businessName, category, subcategory, addressHint, apiKey) {
    console.log("🗺️ searchBusinessInGoogleMaps called with:", {
        businessName, category, subcategory, addressHint
    });
    
    try {
        // שלב 1: חיפוש טקסט לקבלת Place ID
        const searchQuery = `${businessName} ${addressHint || 'ישראל'}`.trim();
        console.log("🗺️ Step 1: Text Search query:", searchQuery);
        
        const textSearchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?` + 
            `query=${encodeURIComponent(searchQuery)}` +
            `&language=he` +
            `&key=${apiKey}`;

        console.log("🗺️ Making API call to Google Maps Text Search");
        const searchResponse = await fetch(textSearchUrl);
        
        if (!searchResponse.ok) {
            const errorText = await searchResponse.text();
            console.error("🗺️ Google Maps Text Search API Error:", searchResponse.status, errorText);
            return {
                found: false,
                confidence: 0,
                sources: [`Google Maps API Text Search Error: ${searchResponse.status}`]
            };
        }

        const searchData = await searchResponse.json();
        console.log("🗺️ Google Maps Text Search response:", JSON.stringify(searchData, null, 2));
        
        if (searchData.status !== 'OK' || !searchData.results?.length) {
            console.log("🗺️ No results found in Text Search");
            return {
                found: false,
                confidence: 0,
                sources: [`Google Maps - No results for: ${searchQuery}`]
            };
        }

        const placeId = searchData.results[0].place_id;
        console.log(`🗺️ Found Place ID: ${placeId}`);

        // שלב 2: קבלת פרטים מלאים עם Place ID
        const fields = "name,formatted_address,formatted_phone_number,website,rating,user_ratings_total,opening_hours,url,place_id,geometry,types,photos,reviews,price_level"; // הוספת שדות חדשים
        const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${apiKey}&language=he`;
        
        console.log("🗺️ Step 2: Fetching Place Details...");
        const detailsResponse = await fetch(detailsUrl);
        
        if (!detailsResponse.ok) {
            const errorText = await detailsResponse.text();
            console.error("🗺️ Place Details API Error:", detailsResponse.status, errorText);
            return {
                found: true, // We found it, but couldn't get details
                confidence: 50,
                sources: [`Google Maps - Details Error: ${detailsResponse.status}`]
            };
        }

        const detailsData = await detailsResponse.json();
        console.log("🗺️ Place Details response:", JSON.stringify(detailsData, null, 2));

        if (detailsData.status !== 'OK') {
            console.warn(`🗺️ Place Details status not OK: ${detailsData.status}`);
            return {
                found: true,
                confidence: 55,
                sources: [`Google Maps - Details Status: ${detailsData.status}`]
            };
        }
        
        const placeDetails = detailsData.result;
        
        // --- הוספת מילות מפתח מסוגי העסק ---
        const hebrewKeywords = {
            'restaurant': 'מסעדה', 'food': 'אוכל', 'cafe': 'בית קפה', 'bar': 'בר',
            'store': 'חנות', 'electronics_store': 'חנות אלקטרוניקה', 'clothing_store': 'חנות בגדים',
            'lodging': 'אירוח', 'hotel': 'מלון', 'health': 'בריאות', 'doctor': 'רופא',
            'electrician': 'חשמלאי', 'plumber': 'אינסטלטור', 'roofing_contractor': 'קבלן גגות',
            'general_contractor': 'קבלן שיפוצים', 'point_of_interest': 'נקודת עניין',
            'establishment': 'עסק', 'accounting': 'ראיית חשבון', 'bank': 'בנק', 'beauty_salon': 'מכון יופי',
            'book_store': 'חנות ספרים', 'car_repair': 'מוסך', 'dentist': 'רופא שיניים', 'gym': 'מכון כושר',
            'hair_care': 'סלון יופי', 'laundry': 'מכבסה', 'lawyer': 'עורך דין', 'museum': 'מוזיאון',
            'pharmacy': 'בית מרקחת', 'spa': 'ספא', 'veterinary_care': 'וטרינר'
        };
        const keywords = (placeDetails.types || [])
            .map(type => hebrewKeywords[type] || type.replace(/_/g, ' '))
            .filter(kw => kw !== 'נקודת עניין' && kw !== 'עסק');

        // --- הוספת כתובות URL של תמונות ---
        const images = (placeDetails.photos || []).slice(0, 10).map(photo => 
            `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1024&photoreference=${photo.photo_reference}&key=${apiKey}`
        );


        return {
            found: true,
            confidence: 90,
            phone: placeDetails.formatted_phone_number || "",
            website: placeDetails.website || "",
            address: placeDetails.formatted_address || "",
            coordinates: placeDetails.geometry?.location || null, // { lat, lng }
            place_id: placeDetails.place_id,
            maps_url: placeDetails.url || "",
            opening_hours: formatOpeningHours(placeDetails.opening_hours), // Use the updated formatOpeningHours
            rating: placeDetails.rating || null,
            user_ratings_total: placeDetails.user_ratings_total || 0, // Ensure this field is passed
            keywords, // <-- החזרת התגיות
            images, // החזרת מערך התמונות
            sources: ["Google Maps - Place Details"],
            raw_google_data: placeDetails // שמירת כל המידע הגולמי
        };

    } catch (error) {
        console.error("🗺️ Google Maps search failed:", error);
        return {
            found: false,
            confidence: 0,
            sources: [`Google Maps Error: ${error.message}`]
        };
    }
}

// יצירת תוכן שיווקי עם Google Gemini
async function generateBusinessContent(businessName, category, subcategory, mapsData, apiKey) {
    console.log("🤖 generateBusinessContent called with unified API key");
    
    // בניית הקונטקסט
    let context = `שם העסק: "${businessName}"
קטגוריה: ${category || 'לא צוין'}
תת-קטגוריה: ${subcategory || 'לא צוין'}`;

    if (mapsData.found) {
        if (mapsData.address) context += `\nכתובת: ${mapsData.address}`;
        if (mapsData.website) context += `\nאתר: ${mapsData.website}`;
        if (mapsData.rating) context += `\nדירוג: ${mapsData.rating} כוכבים מתוך ${mapsData.user_ratings_total} דירוגים.`;
    }

    if (mapsData.raw_google_data && mapsData.raw_google_data.reviews && mapsData.raw_google_data.reviews.length > 0) {
        context += `\n\nתמצית ביקורות לקוחות (לשימושך בלבד כדי להבין את נקודות החוזק):\n`;
        mapsData.raw_google_data.reviews.slice(0, 3).forEach((review, index) => {
            if (review.text) {
                context += `- ביקורת ${index + 1}: "${review.text}"\n`;
            }
        });
    }

    const prompt = `אתה קופירייטר מומחה המתמחה בכתיבה שיווקית לעסקים קטנים ובינוניים עבור קהל ישראלי דתי וחרדי. המטרה שלך היא לכתוב מודעה מושכת, חיובית ומקצועית שתגרום ללקוחות לפעול.

**הנחיות קריטיות:**
1.  **טון וסגנון:** שמור על שפה נקייה, מכובדת ומקצועית. הימנע מסלנג או מהבטחות מוגזמות.
2.  **מטרה שיווקית:** כתוב תיאור שמדגיש את היתרונות של העסק. אם זה עסק של אוכל, השתמש בתיאורים מעוררי תיאבון. אם זה איש מקצוע, הדגש אמינות, מקצועיות ושירות.
3.  **שימוש בביקורות:** השתמש בביקורות הלקוחות אך ורק כדי לזהות נקודות חוזק, מנות פופולריות או שירותים מוערכים. **לעולם, בשום פנים ואופן, אל תזכיר ביקורת שלילית או חסרונות.** התעלם לחלוטין מכל היבט שלילי.
4.  **אל תמציא מידע:** בנה את הכתיבה שלך על הנתונים שסופקו בלבד.
5.  **פורמט פלט:** החזר תמיד JSON תקין ומדויק לפי הסכמה.

**נתונים:**
${context}

**משימה:**
בהתבסס על הנתונים, כתוב מודעה והחזר אותה בפורמט ה-JSON הבא:
{
  "title": "כותרת קצרה וקליטה (עד 70 תווים) שתופסת את מהות העסק",
  "description": "תיאור שיווקי באורך 250-500 תווים. הדגש את היתרונות המרכזיים, השירותים הפופולריים והאווירה במקום. גרם ללקוח לרצות להגיע.",
  "keywords": ["מילת מפתח 1", "מילת מפתח 2", "מילת מפתח 3", "תחום עיסוק"],
  "price_list": [
    { 
      "category": "קטגוריית מחירון (לדוגמה: מנות עיקריות, שירותי ייעוץ)", 
      "items": [
        { "name": "שם שירות/מוצר 1", "price": "מחיר (אם ידוע, אחרת השאר ריק)", "note": "תיאור קצר ומעורר תיאבון/מעניין (עד 50 תווים)" },
        { "name": "שם שירות/מוצר 2", "price": "", "note": "" }
      ]
    }
  ],
  "confidence": 85
}`;

    try {
        console.log("🤖 Making API call to Google Gemini with unified key");
        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + apiKey, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ 
                    parts: [{ text: prompt }] 
                }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 1500,
                    topP: 0.9,
                    topK: 40
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("🤖 Google Gemini API error:", response.status, errorText);
            
            // שיפור הודעת השגיאה
            let errorMessage = `Google Gemini API Error: ${response.status}`;
            if (response.status === 403) {
                errorMessage = "Google Gemini API Error: 403 - Forbidden. Please ensure the 'Generative Language API' is enabled in your Google Cloud project.";
            } else if (response.status === 400) {
                errorMessage = "Google Gemini API Error: 400 - Bad Request. The prompt may be invalid.";
            }

            return {
                success: false,
                confidence: 0,
                sources: [errorMessage]
            };
        }

        const result = await response.json();
        console.log("🤖 Google Gemini response:", JSON.stringify(result, null, 2));

        const aiText = result?.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!aiText) {
            console.error("🤖 No text received from Google Gemini");
            return {
                success: false,
                confidence: 0,
                sources: ["Google Gemini - No response"]
            };
        }

        console.log("🤖 AI Response text:", aiText);

        let jsonData;
        try {
            const jsonMatch = aiText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                jsonData = JSON.parse(jsonMatch[0]);
                console.log("🤖 Parsed JSON:", JSON.stringify(jsonData, null, 2));
            } else {
                throw new Error("No JSON found in response");
            }
        } catch (e) {
            console.error("🤖 JSON parse error:", e.message);
            return {
                success: false,
                confidence: 0,
                sources: [`Google Gemini Parse Error: ${e.message}`]
            };
        }
        
        return {
            success: true,
            title: jsonData.title || "",
            description: jsonData.description || "",
            keywords: jsonData.keywords || [],
            price_list: jsonData.price_list || [], // <-- החזרת המחירון, כעת עם קטגוריות
            confidence: jsonData.confidence || 75,
            sources: ["Google Gemini - Content Generated"]
        };

    } catch (error) {
        console.error("🤖 Google Gemini content generation failed:", error);
        return {
            success: false,
            confidence: 0,
            sources: [`Google Gemini Error: ${error.message}`]
        };
    }
}

// יצירת כותרת ברירת מחדל
function generateDefaultTitle(businessName, category) {
    const title = `${businessName} - ${category || 'שירותים מקצועיים'}`;
    console.log("📝 Generated default title:", title);
    return title.substring(0, 70); // Changed from 60 to 70 for new prompt
}

// יצירת תיאור ברירת מחדל
function generateDefaultDescription(businessName, category) {
    const description = `${businessName} מספק שירותי ${category || 'מקצועיים'} באיכות גבוהה. ` +
        `אנו מחויבים למקצועיות, אמינות ושירות מעולה. ` +
        `הצוות המנוסה שלנו מוכן לעמוד לרשותכם ולספק פתרונות מותאמים לצרכיכם. ` +
        `צרו קשר עוד היום לקבלת ייעוץ מקצועי ללא התחייבות.`;
    
    console.log("📝 Generated default description:", description);
    return description;
}
