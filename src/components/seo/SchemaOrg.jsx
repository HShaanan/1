import React from 'react';
import { JsonLd } from 'react-schemaorg';

/**
 * קומפוננטה ליצירת נתונים מובנים (Schema.org) עבור עסקים מקומיים.
 * משפרת את הנראות בתוצאות החיפוש של גוגל עם Rich Snippets.
 */
export const LocalBusinessSchema = ({ business }) => {
  if (!business) return null;

  // Use the clean slug URL if available, otherwise fallback to current URL but strip query params if possible
  const canonicalUrl = business.url_slug 
    ? (typeof window !== 'undefined' ? `${window.location.origin}/BusinessPage?slug=${business.url_slug}` : undefined)
    : (typeof window !== 'undefined' ? window.location.href : undefined);

  const schema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: business.business_name || business.display_title, // שם העסק בלבד
    description: business.description ? business.description.substring(0, 160) : undefined,
    image: business.images && business.images.length > 0 ? business.images : [business.preview_image],
    telephone: business.contact_phone,
    email: business.business_owner_email,
    url: canonicalUrl,
    address: {
      "@type": "PostalAddress",
      streetAddress: business.address,
      addressLocality: business.city || "ביתר עילית",
      postalCode: "90500", // חובה לגוגל - ברירת מחדל לביתר עילית
      addressCountry: "IL"
    },
    priceRange: business.price_range || "$$",
  };

  // הוספת קואורדינטות אם קיימות
  if (business.lat && business.lng) {
    schema.geo = {
      "@type": "GeoCoordinates",
      latitude: business.lat,
      longitude: business.lng
    };
  }

  // הוספת דירוג אם קיים
  if (business.smart_rating > 0) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: business.smart_rating,
      reviewCount: business.reviews_count || 1,
      bestRating: "5",
      worstRating: "1"
    };
  }

  // הוספת שעות פתיחה אם קיימות
  if (business.hours) {
      // Basic implementation - ideally parse the hours string
      schema.openingHours = business.hours; 
  }

  return <JsonLd item={schema} />;
};

/**
 * סכמה כללית לאתר - לדף הבית ודפי קטגוריה
 */
export const WebsiteSchema = ({ name = "משלנו", description, url }) => {
    const siteUrl = url || (typeof window !== 'undefined' ? window.location.origin : 'https://meshelanu.co.il');
    
    const schema = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": name,
        "url": siteUrl,
        "description": description || "הפלטפורמה הכשרה למשלוחים, מסעדות ועסקים בביתר עילית והסביבה.",
        "image": "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/613960439_ChatGPT_Image_Jul_29__2025__02_28_50_AM-removebg-preview.png",
        "potentialAction": {
            "@type": "SearchAction",
            "target": `${siteUrl}/Browse?q={search_term_string}`,
            "query-input": "required name=search_term_string"
        },
        "publisher": {
            "@type": "Organization",
            "name": "משלנו",
            "logo": {
                "@type": "ImageObject",
                "url": "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/613960439_ChatGPT_Image_Jul_29__2025__02_28_50_AM-removebg-preview.png"
            }
        }
    };

    return <JsonLd item={schema} />;
};

/**
 * סכמה לארגון/מותג
 */
export const OrganizationSchema = () => {
    const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://meshelanu.co.il';
    
    const schema = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "משלנו",
        "url": siteUrl,
        "logo": "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/613960439_ChatGPT_Image_Jul_29__2025__02_28_50_AM-removebg-preview.png",
        "sameAs": [
            "https://www.facebook.com/meshelanu",
            "https://www.instagram.com/meshelanu"
        ],
        "contactPoint": {
            "@type": "ContactPoint",
            "telephone": "+972-50-1234567", // Example placeholder
            "contactType": "customer service",
            "areaServed": "IL",
            "availableLanguage": "Hebrew"
        }
    };

    return <JsonLd item={schema} />;
};

/**
 * סכמה לרשימת עסקים (Carousel/ItemList) - עבור דף ה-Browse
 * @see https://developers.google.com/search/docs/appearance/structured-data/local-business#carousel
 */
export const LocalBusinessListSchema = ({ businesses }) => {
    if (!businesses || businesses.length === 0) return null;

    // Google recommends limiting the list to the main items visible
    // We'll take the top 10 to avoid massive DOM nodes, assuming they are sorted by relevance/promotion
    const topBusinesses = businesses.slice(0, 10);
    const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://meshelanu.co.il';

    const schema = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "itemListElement": topBusinesses.map((business, index) => {
            const url = business.url_slug 
                ? `${siteUrl}/BusinessPage?slug=${business.url_slug}`
                : `${siteUrl}/BusinessPage?id=${business.id}`;

            return {
                "@type": "ListItem",
                "position": index + 1,
                "item": {
                    "@type": "LocalBusiness",
                    "name": business.business_name || business.display_title,
                    "url": url,
                    "image": business.preview_image || business.images?.[0],
                    "address": {
                        "@type": "PostalAddress",
                        "streetAddress": business.address || "ביתר עילית",
                        "addressLocality": business.city || "ביתר עילית",
                        "addressCountry": "IL"
                    },
                    // Optional: AggregateRating if available to show stars in list
                    ...(business.smart_rating > 0 && {
                        "aggregateRating": {
                            "@type": "AggregateRating",
                            "ratingValue": business.smart_rating,
                            "reviewCount": business.reviews_count || 1
                        }
                    })
                }
            };
        })
    };

    return <JsonLd item={schema} />;
};