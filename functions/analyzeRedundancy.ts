
import { createClientFromRequest } from 'npm:@base44/sdk@0.5.0';

// Helper to scan directories recursively
async function scanDirectory(path, fileList) {
    try {
        for await (const entry of Deno.readDir(path)) {
            const fullPath = `${path}/${entry.name}`;
            if (entry.isDirectory && !['node_modules', '.git', 'dist'].includes(entry.name)) {
                await scanDirectory(fullPath, fileList);
            } else if (entry.isFile && /\.(js|jsx)$/.test(entry.name)) {
                fileList.push(fullPath);
            }
        }
    } catch (e) {
        console.warn(`Could not read directory: ${path}`);
    }
}

// Simple heuristic to find candidate pairs for comparison
function findCandidatePairs(filePaths) {
    const candidates = [];
    const normalized = filePaths.map(p => ({
        original: p,
        normalized: p.split('/').pop().toLowerCase().replace(/component|util|helper|service|page|index|\.js|\.jsx/g, '')
    }));

    for (let i = 0; i < normalized.length; i++) {
        for (let j = i + 1; j < normalized.length; j++) {
            if (normalized[i].normalized === normalized[j].normalized && normalized[i].normalized.length > 3) {
                 if (normalized[i].original !== normalized[j].original) {
                    candidates.push([normalized[i].original, normalized[j].original]);
                 }
            }
        }
    }
    // Limit to 5 pairs to avoid excessive API calls in one run
    return candidates.slice(0, 5);
}

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    const authed = await base44.auth.isAuthenticated().catch(() => false);
    if (!authed) return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), { status: 401 });
    
    const me = await base44.auth.me();
    if (me.role !== 'admin') return new Response(JSON.stringify({ ok: false, error: "Admin access required" }), { status: 403 });
    
    try {
        console.log("Starting redundancy analysis...");
        const fileList = [];
        await scanDirectory('./components', fileList);
        await scanDirectory('./utils', fileList);
        await scanDirectory('./hooks', fileList);

        const candidatePairs = findCandidatePairs(fileList);
        console.log(`Found ${candidatePairs.length} candidate pairs for analysis.`);

        if (candidatePairs.length === 0) {
            return new Response(JSON.stringify({ ok: true, analysis: [] }), { status: 200 });
        }

        const analysisPromises = candidatePairs.map(async (pair) => {
            try {
                const [fileAPath, fileBPath] = pair;
                const fileAContent = await Deno.readTextFile(fileAPath);
                const fileBContent = await Deno.readTextFile(fileBPath);

                const prompt = `
                    You are an expert code reviewer. Analyze the following two JavaScript files and determine if they are functionally redundant.

                    File A: ${fileAPath}
                    \`\`\`javascript
                    ${fileAContent}
                    \`\`\`

                    File B: ${fileBPath}
                    \`\`\`javascript
                    ${fileBContent}
                    \`\`\`

                    Check for the following:
                    1. Do they export functions/components that perform the exact same task?
                    2. Does one file's functionality completely supersede the other?
                    3. Are they near-duplicates with minor differences?

                    Based on your analysis, provide a JSON response.
                `;

                const llmResponse = await base44.asServiceRole.integrations.InvokeLLM({
                    prompt,
                    response_json_schema: {
                        type: 'object',
                        properties: {
                            is_redundant: { type: 'boolean' },
                            reason: { type: 'string', description: 'A detailed explanation of why the files are or are not redundant.' },
                            recommendation: { type: 'string', description: 'e.g., "Deprecate File A and use File B", or "Keep both files"' }
                        },
                        required: ['is_redundant', 'reason', 'recommendation']
                    }
                });

                if (llmResponse.is_redundant) {
                    return {
                        files: pair,
                        contents: [fileAContent, fileBContent],
                        reason: llmResponse.reason,
                        recommendation: llmResponse.recommendation
                    };
                }
                return null;
            } catch (e) {
                console.error(`Error analyzing pair ${pair}:`, e);
                return null;
            }
        });

        const results = (await Promise.all(analysisPromises)).filter(Boolean);
        console.log(`LLM analysis complete. Found ${results.length} redundant pairs.`);

        return new Response(JSON.stringify({ ok: true, analysis: results }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error("Redundancy analysis failed:", error);
        return new Response(JSON.stringify({ ok: false, error: error.message }), { status: 500 });
    }
});
