import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * BASE44 Visual Architect & Positioning Engine
 * Transforms basic descriptions into professional image prompts with advanced composition
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { description, image_type, subject } = await req.json();

    if (!description) {
      return Response.json({ error: 'Description required' }, { status: 400 });
    }

    // מפת טיפוסי תמונות ללוגיקת מיצוב
    const typeStrategies = {
      'logo': {
        composition: 'Centered symmetrical composition',
        camera: 'Straight-on frontal view',
        depth: 'Flat minimal depth, clean background',
        lighting: 'Even studio lighting, no harsh shadows',
        technical: 'vector-style, clean edges, high contrast, professional branding, white or transparent background'
      },
      'kashrut_logo': {
        composition: 'Perfect center symmetry with negative space border',
        camera: 'Direct frontal perspective',
        depth: 'Shallow depth, isolated subject',
        lighting: 'Soft diffused lighting from top, subtle rim light',
        technical: 'orthodox jewish certification badge style, clean serif hebrew typography, royal blue and gold accents, professional seal design, embossed look, white background'
      },
      'product': {
        composition: 'Rule of thirds, subject slightly off-center',
        camera: '45-degree elevated angle',
        depth: 'Shallow bokeh background, sharp foreground',
        lighting: 'Rembrandt lighting with soft key light from left',
        technical: 'product photography, studio quality, commercial grade, hyper-realistic textures'
      },
      'hero': {
        composition: 'Golden ratio placement, dynamic diagonal flow',
        camera: 'Slightly low angle for impact',
        depth: 'Layered depth - foreground, midground, background separation',
        lighting: 'Dramatic rim lighting with volumetric atmosphere',
        technical: 'cinematic wide angle, atmospheric depth, professional color grading, ultra-sharp detail'
      },
      'interior': {
        composition: 'Two-point perspective with natural depth',
        camera: 'Eye-level humanistic perspective',
        depth: 'Deep focus showing spatial context',
        lighting: 'Natural window light mixed with warm ambient',
        technical: 'architectural photography, wide dynamic range, cozy ambiance, realistic materials'
      }
    };

    const strategy = typeStrategies[image_type] || typeStrategies['product'];

    // בניית הפרומפט הסופי
    const masterPrompt = `
${description}

COMPOSITION DIRECTIVES:
- ${strategy.composition}
- ${strategy.camera}
- ${strategy.depth}
- ${strategy.lighting}

TECHNICAL SPECIFICATIONS:
${strategy.technical}, 4K ultra-detailed, professional photography, optimal contrast, color harmony

CRITICAL RULES:
- Subject must have breathing room (minimum 15% negative space on edges)
- Avoid dead-center unless symmetry is the goal
- Ensure clear focal point using depth and lighting
- Maintain visual hierarchy: Subject > Supporting Elements > Background
`.trim();

    // ניתוח נוסף עם LLM לשיפור
    const enhancedPrompt = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a professional photography art director. Enhance this image generation prompt to be even more precise and visually striking. Keep it concise but add specific technical details about composition, lighting, and aesthetics. Return ONLY the enhanced prompt, no explanations.

Original prompt:
${masterPrompt}`,
      response_json_schema: null
    });

    return Response.json({
      success: true,
      original_description: description,
      visual_blueprint: {
        composition_style: strategy.composition,
        spatial_positioning: {
          subject_placement: strategy.composition,
          camera_angle: strategy.camera,
          depth_of_field: strategy.depth
        },
        lighting_map: strategy.lighting,
        technical_specs: strategy.technical
      },
      master_prompt: enhancedPrompt.trim()
    });

  } catch (error) {
    console.error('Smart prompt generation error:', error);
    return Response.json({ 
      error: 'Failed to generate prompt',
      details: error.message 
    }, { status: 500 });
  }
});