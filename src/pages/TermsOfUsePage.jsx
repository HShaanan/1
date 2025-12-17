import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useNavigate, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { FileText, ArrowRight, CheckCircle, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import PdfViewer from "@/components/ui/PdfViewer";

export default function TermsOfUsePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState(null);
  
  // Parse mode from URL
  const queryParams = new URLSearchParams(location.search);
  const mode = queryParams.get('mode'); // 'accept' or null
  const isAcceptMode = mode === 'accept';

  const TERMS_VERSION = '1.0';
  const TERMS_PDF_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68815c70a48dd08622dbaf69/7ce6298d6_-.pdf";

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const handleAgree = async () => {
    if (!agreed) {
        toast.error("יש לאשר את תנאי השימוש כדי להמשיך");
        return;
    }
    
    setSubmitting(true);
    try {
        // Use backend function to record acceptance with IP
        await base44.functions.invoke('acceptTerms', {
            version: TERMS_VERSION,
            text: 'User agreed to PDF terms version ' + TERMS_VERSION,
            userAgent: navigator.userAgent
        });

        // Update local cache to prevent redirect loop
        sessionStorage.setItem(`terms_accepted_${TERMS_VERSION}`, 'true');
        
        toast.success("תנאי השימוש אושרו בהצלחה");
        navigate(createPageUrl("Browse"));
    } catch (error) {
        console.error("Error accepting terms:", error);
        toast.error("אירעה שגיאה באישור התנאים. אנא נסה שנית.");
    } finally {
        setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 bg-slate-50" dir="rtl">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <FileText className="w-10 h-10 text-blue-600" />
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
              תקנון ותנאי שימוש
            </h1>
          </div>
          <p className="text-gray-600">משלנו - הפלטפורמה הקהילתית</p>
          <p className="text-sm text-gray-500 mt-1">גרסה {TERMS_VERSION} | עודכן: דצמבר 2025</p>
        </div>

        {/* Content Card */}
        <Card className="bg-white shadow-lg mb-6 overflow-hidden">
          <CardContent className="p-0">
            {/* PDF Viewer */}
            <div className="border-b bg-gray-50">
                <PdfViewer 
                    url={TERMS_PDF_URL} 
                    title="תקנון ותנאי שימוש - משלנו" 
                    height="65vh"
                    className="border-0 rounded-none"
                />
            </div>

            {/* Action Area */}
            <div className="p-6 md:p-8 bg-white">
                {isAcceptMode ? (
                    <div className="space-y-6 max-w-2xl mx-auto">
                        <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100 shadow-sm transition-colors hover:bg-blue-100/50">
                            <Checkbox 
                                id="agree-terms" 
                                checked={agreed}
                                onCheckedChange={(c) => setAgreed(!!c)}
                                className="mt-1 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                            />
                            <label 
                                htmlFor="agree-terms" 
                                className="text-sm md:text-base text-slate-800 cursor-pointer font-medium leading-tight select-none"
                            >
                                קראתי ואני מסכים ל<a href={TERMS_PDF_URL} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-bold mx-1" onClick={(e) => e.stopPropagation()}>תקנון האתר</a> (מדיניות הפרטיות + תנאי שימוש).
                            </label>
                        </div>

                        <div className="space-y-3">
                            <Button 
                                onClick={handleAgree}
                                disabled={!agreed || submitting}
                                className={`w-full py-6 text-lg font-bold shadow-md transition-all rounded-xl
                                    ${agreed 
                                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white transform hover:scale-[1.01]' 
                                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'}
                                `}
                            >
                                {submitting ? (
                                    <><Loader2 className="w-5 h-5 ml-2 animate-spin" /> מעבד...</>
                                ) : (
                                    <>המשך <ArrowRight className="w-5 h-5 mr-2" /></>
                                )}
                            </Button>
                            
                            <p className="text-xs text-center text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100">
                                * בלחיצה על כפתור "המשך" אני מצהיר/ה כי קראתי את התקנון, הבנתי את תוכנו ואני מסכים/ה לכל תנאיו, לרבות מדיניות הפרטיות.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="text-center">
                        <p className="text-green-600 font-medium mb-4 flex items-center justify-center gap-2">
                            <CheckCircle className="w-5 h-5" />
                            תנאי השימוש הינם לידיעה כללית.
                        </p>
                        <Button 
                            variant="outline"
                            onClick={() => navigate(createPageUrl("Browse"))}
                            className="bg-white border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl px-8"
                        >
                            חזרה לדף הבית
                        </Button>
                    </div>
                )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}