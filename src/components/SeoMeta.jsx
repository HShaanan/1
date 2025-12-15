import React from "react";
import { Helmet } from "react-helmet-async";

export default function SeoMeta({ 
  title, 
  description, 
  imageUrl, 
  url = typeof window !== 'undefined' ? window.location.href : '',
  city = "ביתר עילית",
  category = "",
  kashrut = ""
}) {
  // Build dynamic SEO-optimized title
  let fullTitle = "";
  
  if (title) {
    // Business page - enhanced with city and kashrut
    const cityPart = city ? `ב${city}` : "";
    const kashrutPart = kashrut ? `כשר ${kashrut}` : "";
    
    if (kashrutPart && cityPart) {
      fullTitle = `${title} ${cityPart} | ${kashrutPart} | משלנו`;
    } else if (cityPart) {
      fullTitle = `${title} ${cityPart} | משלנו`;
    } else {
      fullTitle = `${title} | משלנו`;
    }
  } else if (category && city) {
    // Category page
    fullTitle = `${category} ב${city} | משלנו`;
  } else {
    // Default homepage
    fullTitle = "משלנו - פלטפורמת עסקים וקהילה";
  }
  
  const finalDescription = description || `משלנו - המקום למצוא עסקים, מקצוענים ושירותים בקהילה החרדית${city ? ` ב${city}` : ''}`;
  const finalImage = imageUrl || "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/613960439_ChatGPT_Image_Jul_29__2025__02_28_50_AM-removebg-preview.png";

  return (
    <Helmet>
      {/* Standard Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={finalDescription} />
      
      {/* Open Graph Tags */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:image" content={finalImage} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="משלנו" />
      
      {/* Twitter Card Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={finalDescription} />
      <meta name="twitter:image" content={finalImage} />
    </Helmet>
  );
}