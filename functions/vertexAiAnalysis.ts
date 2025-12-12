import { createClientFromRequest } from 'npm:@base44/sdk@0.5.0';
import { unzip } from 'npm:fflate@0.8.2';

// פונקציית עזר לבדיקה אם קובץ הוא קוד
function isCodeFile(filename) {
    return /\.(js|jsx|ts|tsx|json)$/i.test(filename) && 
           !filename.includes('.min.') &&
           !filename.includes('.test.') &&
           !filename.endsWith('.d.ts');
}

// פונקציית עזר לבדיקה אם לדלג על תיקייה
function shouldSkipDirectory(name) {
    const skipDirs = ['node_modules', '.git', 'dist', 'build', '.next', 'tmp', '.deno', 'public'];
    return skipDirs.includes(name) || name.startsWith('.');
}

// פונקציית עזר רקורסיבית לסריקת תיקיות
async function scanDirectoryRecursive(dirPath, fileList) {
    try {
        for await (const entry of Deno.readDir(dirPath)) {
            const fullPath = `${dirPath}/${entry.name}`;
            if (entry.isDirectory && !shouldSkipDirectory(entry.name)) {
                await scanDirectoryRecursive(fullPath, fileList);
            } else if (entry.isFile && isCodeFile(entry.name)) {
                try {
                    const content = await Deno.readTextFile(fullPath);
                    if (content.trim().length > 10) {
                        fileList.push({ path: fullPath, content });
                    }
                } catch (readError) {
                    console.error(`[SCAN] Failed to read file ${fullPath}:`, readError.message);
                }
            }
        }
    } catch (dirError) {
        console.error(`[SCAN] Failed to read directory ${dirPath}:`, dirError.message);
    }
}

// פונקציית עזר לאיסוף כל קבצי הקוד מהפרויקט
async function gatherLiveCodeSample() {
    console.log('[SCAN] Starting live code scan...');
    const allFiles = [];
    const rootDirs = ['./pages', './components', './functions', './entities', './agents'];
    
    // הוספת קבצי בסיס חשובים
    const rootFiles = ['./Layout.js'];
    for (const filePath of rootFiles) {
         try {
            const content = await Deno.readTextFile(filePath);
            allFiles.push({ path: filePath, content });
        } catch(e) { /* Ignore if not found */ }
    }

    for (const dir of rootDirs) {
        await scanDirectoryRecursive(dir, allFiles);
    }

    console.log(`[SCAN] Total files found: ${allFiles.length}`);
    return allFiles.map(f => ({ path: f.path, content: f.content.substring(0, 4000) }));
}


// פונקציית עזר לפריסת ZIP וקריאת קבצים
async function unzipAndReadFiles(zipBuffer) {
    const codeFiles = [];
    const unzipped = await new Promise((resolve, reject) => {
        unzip(new Uint8Array(zipBuffer), (err, data) => {
            if (err) return reject(err);
            resolve(data);
        });
    });

    for (const [relativePath, fileData] of Object.entries(unzipped)) {
        if (!relativePath.endsWith('/') && isCodeFile(relativePath)) {
            const content = new TextDecoder().decode(fileData);
            if (content.trim().length > 10) {
                codeFiles.push({
                    path: relativePath,
                    content: content.substring(0, 4000)
                });
            }
        }
    }
    return codeFiles;
}

// פונקציית ניתוח ראשית עם Vertex AI
async function performVertexAiAnalysis(apiKey, codeFiles) {
    const codeContent = codeFiles.map(f => `
// File: ${f.path}
${f.content}
    `).join('\n\n---\n\n');

    const prompt = `
        You are a world-class software architect. Analyze the following React/JavaScript application code.
        The user wants a high-level architecture review and concrete recommendations for improvement.

        Code dump of ${codeFiles.length} files:
        ${codeContent}

        Provide your analysis in Hebrew with the following structure:
        1.  **General Architecture Assessment:** A brief overview of the project structure, patterns, and overall code quality.
        2.  **Key Issues Found:** A list of the most critical issues (e.g., tight coupling, large components, lack of separation of concerns).
        3.  **Actionable Recommendations:** Provide 3-5 concrete, actionable steps the developer should take to improve the code. Be specific (e.g., "Split the 'MyComponent.js' into three smaller components: X, Y, and Z", "Create a dedicated 'hooks' directory for all custom hooks").
    `;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.2, maxOutputTokens: 4096 }
        })
    });

    if (!response.ok) throw new Error(`Google API error: ${response.status} ${await response.text()}`);
    
    const data = await response.json();
    const analysis = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!analysis) throw new Error("No content received from AI analysis.");
    
    return { fullAnalysis: analysis, riskLevel: 'low' }; // Default risk, can be improved later
}


Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        if (!(await base44.auth.me())?.role === 'admin') {
            return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), { status: 401 });
        }
        
        const { action, zipFileUri } = await req.json();
        const apiKey = Deno.env.get("GOOGLE_MAPS_APIKEY");

        if (!apiKey) return new Response(JSON.stringify({ ok: false, error: "Google API key is not configured" }), { status: 500 });
        if (action !== 'advanced_code_analysis') return new Response(JSON.stringify({ ok: false, error: "Invalid action" }), { status: 400 });

        let codeContent = [];
        if (zipFileUri) {
            const { signed_url } = await base44.asServiceRole.integrations.invoke('Core.CreateFileSignedUrl', { file_uri: zipFileUri });
            if (!signed_url) throw new Error("Failed to create signed URL for ZIP.");
            
            const zipResponse = await fetch(signed_url);
            if (!zipResponse.ok) throw new Error(`Failed to fetch ZIP: ${zipResponse.statusText}`);
            
            codeContent = await unzipAndReadFiles(await zipResponse.arrayBuffer());
        } else {
            codeContent = await gatherLiveCodeSample();
        }

        if (codeContent.length === 0) {
            return new Response(JSON.stringify({ ok: false, error: "No code files found to analyze." }), { status: 400 });
        }

        const analysis = await performVertexAiAnalysis(apiKey, codeContent);
        return new Response(JSON.stringify({ ok: true, analysis, filesAnalyzed: codeContent.length }), { status: 200 });

    } catch (error) {
        console.error("Vertex AI analysis function error:", error);
        return new Response(JSON.stringify({ ok: false, error: error.message }), { status: 500 });
    }
});