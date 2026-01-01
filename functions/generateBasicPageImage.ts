import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const result = await base44.integrations.Core.GenerateImage({
      prompt: `Create a screenshot mockup of an extremely basic, unprofessional business webpage from 2005. 
      
Key elements:
- Plain white background
- Simple black Arial/Times New Roman text
- Business name at top in Hebrew: "פיצה מקפיצה"
- Basic contact info: phone "050-1234567"
- Simple text lines with opening hours in Hebrew
- No images, no colors, no styling
- No CSS, no modern design
- Looks like a Microsoft Word document converted to HTML
- Very amateur and outdated appearance
- Include some basic Hebrew text for address and description
- Everything aligned to the right (RTL)

Style: Make it look like a 1990s/early 2000s webpage - extremely basic HTML, no professional design whatsoever. Think GeoCities or early internet era.`
    });

    const imageUrl = result?.url || result?.data?.url;

    if (!imageUrl) {
      throw new Error('No image URL returned from AI generation');
    }

    return Response.json({ 
      success: true, 
      imageUrl 
    });

  } catch (error) {
    console.error('Error generating image:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});