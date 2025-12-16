import React from 'react';
import { JsonLd } from 'react-schemaorg';

/**
 * קומפוננטה ליצירת נתונים מובנים (Schema.org) עבור עסקים מקומיים.
 * משפרת את הנראות בתוצאות החיפוש של גוגל עם Rich Snippets.
 */
export const LocalBusinessSchema = ({ business }) => {
  if (!business) return null;

  const schema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: business.business_name, // שם העסק בלבד, ללא סלוגנים
    description: business.description ? business.description.substring(0, 160) : undefined,
    image: business.images && business.images.length > 0 ? business.images : [business.preview_image],
    telephone: business.contact_phone,
    email: business.business_owner_email,
    url: typeof window !== 'undefined' ? window.location.href : undefined,
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

  // הוספת שעות פתיחה אם קיימות בפורמט שגוגל מבין (דורש פירסור אם הפורמט מורכב, כרגע נשאיר בסיסי)
  // כאן אפשר להרחיב בעתיד פונקציה שמפרסרת את ה-hours string למערך של OpeningHoursSpecification

  return <JsonLd item={schema} />;
};