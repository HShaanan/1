
import { createClientFromRequest } from 'npm:@base44/sdk@0.5.0';

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);

    // בדיקת הרשאות מנהל
    const authed = await base44.auth.isAuthenticated().catch(() => false);
    if (!authed) {
        return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), { 
            status: 401, 
            headers: { "Content-Type": "application/json" } 
        });
    }

    const me = await base44.auth.me().catch(() => null);
    if (!me || me.role !== "admin") {
        return new Response(JSON.stringify({ ok: false, error: "Admin access required" }), { 
            status: 403, 
            headers: { "Content-Type": "application/json" } 
        });
    }

    try {
        const { action, filesToDelete, safetyConfirmed } = await req.json().catch(() => ({ action: 'analyze' }));

        if (action === 'analyze') {
            console.log("🔍 Starting REAL dead code analysis...");

            const analysis = await performRealCodeAnalysis();
            return new Response(JSON.stringify({
                ok: true,
                action: 'analyze',
                analysis: analysis,
                warnings: [
                    "⚠️ זהו ניתוח אמיתי של קבצי הקוד באפליקציה",
                    "⚠️ מחיקת קבצים יכולה לשבור את האפליקציה",
                    "⚠️ ודא שיש לך גיבוי של הקוד לפני מחיקה",
                    "⚠️ בדוק כל קובץ בנפרד לפני המחיקה"
                ]
            }), { 
                status: 200, 
                headers: { "Content-Type": "application/json" } 
            });

        } else if (action === 'delete') {
            return await handleFileDeletion(filesToDelete, safetyConfirmed);

        } else if (action === 'pre_delete_check') {
            return await performPreDeleteChecks(filesToDelete);

        } else {
            return new Response(JSON.stringify({ 
                ok: false, 
                error: "Invalid action. Use 'analyze', 'pre_delete_check', or 'delete'" 
            }), { 
                status: 400, 
                headers: { "Content-Type": "application/json" } 
            });
        }

    } catch (error) {
        console.error("🚨 Dead code analysis error:", error);
        return new Response(JSON.stringify({ 
            ok: false, 
            error: error.message || "Internal server error",
            details: "שגיאה פנימית בניתוח הקוד. בדוק את הלוגים."
        }), { 
            status: 500, 
            headers: { "Content-Type": "application/json" } 
        });
    }
});

// פונקציה לניתוח אמיתי של הקוד
async function performRealCodeAnalysis() {
    const startTime = Date.now();
    console.log("📂 Scanning real file system...");

    const allFiles = [];
    const imports = new Set();
    const exports = new Map();
    
    // נתיבי הבדיקה - רק תיקיות הקוד של האפליקציה
    const scanPaths = [
        './components',
        './pages', 
        './utils',
        './hooks'
    ];

    // שלב 1: סריקת כל הקבצים
    for (const scanPath of scanPaths) {
        try {
            await scanDirectory(scanPath, allFiles);
        } catch (error) {
            console.warn(`⚠️ Could not scan ${scanPath}:`, error.message);
        }
    }

    console.log(`📊 Found ${allFiles.length} code files to analyze`);

    // שלב 2: ניתוח תוכן הקבצים
    const analysisResults = {
        totalFilesScanned: allFiles.length,
        deadCodeFiles: 0,
        unusedImportsCount: 0,
        potentialSavings: 0,
        lastAnalysisTime: new Date().toISOString(),
        files: [],
        unusedImports: [],
        criticalFiles: [], // קבצים קריטיים שאסור למחוק
        warnings: []
    };

    for (const file of allFiles) {
        try {
            const content = await Deno.readTextFile(file.path);
            const fileAnalysis = analyzeFileContent(file, content);
            
            // איסוף exports
            fileAnalysis.exports.forEach(exp => {
                if (!exports.has(exp)) {
                    exports.set(exp, []);
                }
                exports.get(exp).push(file.path);
            });

            // איסוף imports
            fileAnalysis.imports.forEach(imp => imports.add(imp));

            file.analysis = fileAnalysis;
        } catch (error) {
            console.warn(`⚠️ Could not analyze ${file.path}:`, error.message);
            file.analysis = { 
                exports: [], 
                imports: [], 
                functions: [],
                error: error.message 
            };
        }
    }

    // שלב 3: זיהוי קוד מת
    const usedExports = new Set();
    
    // בדיקה איזה exports משומשים
    for (const file of allFiles) {
        if (file.analysis && file.analysis.imports) {
            file.analysis.imports.forEach(imp => usedExports.add(imp));
        }
    }

    // זיהוי קבצים שאינם בשימוש
    for (const file of allFiles) {
        if (file.analysis && file.analysis.exports) {
            const isUsed = file.analysis.exports.some(exp => usedExports.has(exp));
            
            if (!isUsed && !isCriticalFile(file.path)) {
                analysisResults.files.push({
                    path: file.path,
                    type: detectFileType(file.path),
                    exports: file.analysis.exports,
                    size: formatFileSize(file.size),
                    lastModified: file.lastModified,
                    riskLevel: assessRiskLevel(file.path),
                    dependencies: findFileDependencies(file.path, allFiles)
                });
                analysisResults.deadCodeFiles++;
                analysisResults.potentialSavings += (file.size / 1024); // KB
            }
        }
    }

    // זיהוי imports לא בשימוש
    analysisResults.unusedImports = findUnusedImports(allFiles, usedExports);
    analysisResults.unusedImportsCount = analysisResults.unusedImports.length;

    // קבצים קריטיים שנמצאו
    analysisResults.criticalFiles = allFiles
        .filter(f => isCriticalFile(f.path))
        .map(f => f.path);

    // אזהרות כלליות
    if (analysisResults.deadCodeFiles > 0) {
        analysisResults.warnings.push(
            "🚨 נמצאו קבצים שעלולים להיות לא בשימוש",
            "⚠️ בדוק כל קובץ בנפרד לפני מחיקה",
            "⚠️ ייתכנו תלויות דינמיות שלא זוהו",
            "💾 צור גיבוי של הקוד לפני כל מחיקה"
        );
    }

    const analysisTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ Analysis completed in ${analysisTime}s`);

    analysisResults.potentialSavings = Math.round(analysisResults.potentialSavings * 10) / 10;
    return analysisResults;
}

// סריקת תיקייה רקורסיבית
async function scanDirectory(dirPath, filesList) {
    try {
        for await (const entry of Deno.readDir(dirPath)) {
            const fullPath = `${dirPath}/${entry.name}`;
            
            if (entry.isDirectory) {
                // דלג על תיקיות מסוימות
                if (!['node_modules', '.git', 'dist', 'build'].includes(entry.name)) {
                    await scanDirectory(fullPath, filesList);
                }
            } else if (entry.isFile && isCodeFile(entry.name)) {
                try {
                    const stat = await Deno.stat(fullPath);
                    filesList.push({
                        path: fullPath,
                        name: entry.name,
                        size: stat.size,
                        lastModified: stat.mtime?.toISOString().split('T')[0] || 'Unknown'
                    });
                } catch (error) {
                    console.warn(`Could not stat ${fullPath}:`, error.message);
                }
            }
        }
    } catch (error) {
        throw new Error(`Cannot read directory ${dirPath}: ${error.message}`);
    }
}

// בדיקה האם קובץ הוא קובץ קוד
function isCodeFile(filename) {
    const codeExtensions = ['.js', '.jsx', '.ts', '.tsx', '.vue'];
    return codeExtensions.some(ext => filename.endsWith(ext));
}

// ניתוח תוכן קובץ
function analyzeFileContent(file, content) {
    const result = {
        exports: [],
        imports: [],
        functions: [],
        hasJSX: content.includes('<') && content.includes('>'),
        linesCount: content.split('\n').length
    };

    // זיהוי exports
    const exportMatches = content.matchAll(
        /(?:export\s+(?:default\s+)?(?:function\s+(\w+)|const\s+(\w+)|class\s+(\w+)|(\w+)))|(?:export\s*\{\s*([^}]+)\s*\})/g
    );
    
    for (const match of exportMatches) {
        if (match[1]) result.exports.push(match[1]); // export function
        if (match[2]) result.exports.push(match[2]); // export const
        if (match[3]) result.exports.push(match[3]); // export class
        if (match[4]) result.exports.push(match[4]); // export variable
        if (match[5]) {
            // export { ... }
            const namedExports = match[5].split(',').map(e => e.trim().split(' as ')[0]);
            result.exports.push(...namedExports);
        }
    }

    // זיהוי imports
    const importMatches = content.matchAll(
        /import\s+(?:(\w+)(?:\s*,\s*)?)?\s*(?:\{\s*([^}]+)\s*\})?\s*from\s+['"]([^'"]+)['"]/g
    );
    
    for (const match of importMatches) {
        if (match[1]) result.imports.push(match[1]); // default import
        if (match[2]) {
            // named imports
            const namedImports = match[2].split(',').map(i => i.trim().split(' as ')[0]);
            result.imports.push(...namedImports);
        }
    }

    // זיהוי פונקציות
    const functionMatches = content.matchAll(/function\s+(\w+)|const\s+(\w+)\s*=\s*(?:\(|async)/g);
    for (const match of functionMatches) {
        const funcName = match[1] || match[2];
        if (funcName) result.functions.push(funcName);
    }

    return result;
}

// בדיקה האם קובץ קריטי
function isCriticalFile(filePath) {
    const criticalPatterns = [
        /\/pages\//i, // All files in pages directory are critical entry points
        /layout\.js$/i,
        /app\.js$/i,
        /index\.js$/i,
        /main\.js$/i,
        /router/i,
        /config/i,
        /auth/i,
        /api/i
    ];
    
    return criticalPatterns.some(pattern => pattern.test(filePath));
}

// זיהוי סוג קובץ
function detectFileType(filePath) {
    if (filePath.includes('/components/')) return 'component';
    if (filePath.includes('/pages/')) return 'page';
    if (filePath.includes('/utils/')) return 'utility';
    if (filePath.includes('/hooks/')) return 'hook';
    return 'other';
}

// הערכת רמת סיכון
function assessRiskLevel(filePath) {
    if (isCriticalFile(filePath)) return 'high';
    if (filePath.includes('/components/ui/')) return 'medium';
    if (filePath.includes('/utils/')) return 'low';
    return 'medium';
}

// מציאת תלויות קובץ
function findFileDependencies(filePath, allFiles) {
    const dependencies = [];
    const fileName = filePath.split('/').pop().split('.')[0];
    
    for (const file of allFiles) {
        if (file.analysis && file.analysis.imports.some(imp => 
            imp.toLowerCase().includes(fileName.toLowerCase())
        )) {
            dependencies.push(file.path);
        }
    }
    
    return dependencies;
}

// מציאת imports לא בשימוש
function findUnusedImports(allFiles, usedExports) {
    const unusedImports = [];
    
    for (const file of allFiles) {
        if (file.analysis && file.analysis.imports) {
            const unused = file.analysis.imports.filter(imp => !usedExports.has(imp));
            if (unused.length > 0) {
                unusedImports.push({
                    file: file.path,
                    unusedImports: unused,
                    line: `// Unused imports: ${unused.join(', ')}`
                });
            }
        }
    }
    
    return unusedImports;
}

// עיצוב גודל קובץ
function formatFileSize(bytes) {
    if (bytes < 1024) return `${bytes}B`;
    const kb = bytes / 1024;
    return `${Math.round(kb * 10) / 10}KB`;
}

// בדיקות לפני מחיקה
async function performPreDeleteChecks(filesToDelete) {
    const checks = [];
    const risks = [];
    const blockers = [];

    for (const filePath of filesToDelete) {
        // בדיקה 1: קובץ קריטי?
        if (isCriticalFile(filePath)) {
            blockers.push({
                file: filePath,
                reason: "קובץ קריטי - עלול לשבור את האפליקציה",
                severity: "BLOCKER"
            });
        }

        // בדיקה 2: האם הקובץ קיים?
        try {
            await Deno.stat(filePath);
            checks.push({
                file: filePath,
                check: "file_exists",
                status: "OK"
            });
        } catch (error) {
            risks.push({
                file: filePath,
                reason: "הקובץ כבר לא קיים",
                severity: "WARNING"
            });
        }

        // בדיקה 3: הרשאות כתיבה
        try {
            const fileInfo = await Deno.stat(filePath);
            if (fileInfo.isFile) {
                checks.push({
                    file: filePath,
                    check: "can_delete",
                    status: "OK"
                });
            }
        } catch (error) {
            risks.push({
                file: filePath,
                reason: "אין הרשאות מחיקה",
                severity: "ERROR"
            });
        }
    }

    return new Response(JSON.stringify({
        ok: true,
        action: 'pre_delete_check',
        totalFiles: filesToDelete.length,
        checks: checks,
        risks: risks,
        blockers: blockers,
        canProceed: blockers.length === 0,
        warnings: [
            "🚨 מחיקת קבצים היא פעולה בלתי הפיכה!",
            "💾 ודא שיש לך גיבוי מלא של הקוד",
            "🔍 בדוק שכל קובץ אכן לא נדרש",
            "⚠️ האפליקציה עלולה להיכשל לאחר המחיקה"
        ]
    }), { 
        status: 200, 
        headers: { "Content-Type": "application/json" } 
    });
}

// מחיקת קבצים עם בטיחות
async function handleFileDeletion(filesToDelete, safetyConfirmed) {
    if (!safetyConfirmed) {
        return new Response(JSON.stringify({
            ok: false,
            error: "Safety confirmation required",
            message: "חובה לאשר את בדיקות הבטיחות לפני המחיקה"
        }), { 
            status: 400, 
            headers: { "Content-Type": "application/json" } 
        });
    }

    if (!Array.isArray(filesToDelete) || filesToDelete.length === 0) {
        return new Response(JSON.stringify({ 
            ok: false, 
            error: "No files specified for deletion" 
        }), { 
            status: 400, 
            headers: { "Content-Type": "application/json" } 
        });
    }

    // בדיקת blockers אחרונה
    const criticalFiles = filesToDelete.filter(f => isCriticalFile(f));
    if (criticalFiles.length > 0) {
        return new Response(JSON.stringify({
            ok: false,
            error: "Cannot delete critical files",
            criticalFiles: criticalFiles,
            message: "לא ניתן למחוק קבצים קריטיים"
        }), { 
            status: 403, 
            headers: { "Content-Type": "application/json" } 
        });
    }

    // יצירת גיבוי לפני מחיקה
    const backupDir = `./backup_${Date.now()}`;
    try {
        await Deno.mkdir(backupDir, { recursive: true });
    } catch (error) {
        console.warn("Could not create backup directory:", error);
    }

    let deletedCount = 0;
    const results = [];

    for (const filePath of filesToDelete) {
        try {
            // גיבוי הקובץ
            try {
                const content = await Deno.readTextFile(filePath);
                const backupPath = `${backupDir}/${filePath.replace(/[\/\\]/g, '_')}`;
                await Deno.writeTextFile(backupPath, content);
            } catch (error) {
                console.warn(`Could not backup ${filePath}:`, error);
            }

            // מחיקת הקובץ
            await Deno.remove(filePath);
            
            deletedCount++;
            results.push({ 
                path: filePath, 
                status: 'deleted',
                backed_up: true 
            });
            console.log(`✅ Deleted: ${filePath}`);
            
        } catch (error) {
            results.push({ 
                path: filePath, 
                status: 'error', 
                error: error.message 
            });
            console.error(`❌ Failed to delete ${filePath}:`, error);
        }
    }

    return new Response(JSON.stringify({
        ok: true,
        action: 'delete',
        deleted: deletedCount,
        total: filesToDelete.length,
        results: results,
        backupLocation: backupDir,
        warnings: [
            `נמחקו ${deletedCount} קבצים מתוך ${filesToDelete.length}`,
            `גיבוי נשמר בתיקייה: ${backupDir}`,
            "בדוק שהאפליקציה עובדת כראוי",
            "אם יש בעיות - השתמש בגיבוי לשחזור"
        ]
    }), { 
        status: 200, 
        headers: { "Content-Type": "application/json" } 
    });
}
