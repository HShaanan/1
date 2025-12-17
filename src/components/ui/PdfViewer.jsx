import React from 'react';
import { Button } from "@/components/ui/button";
import { ExternalLink, FileText, Download } from 'lucide-react';

/**
 * רכיב להצגת מסמכי PDF בצורה נגישה ורספונסיבית.
 * משתמש ביכולות הדפדפן המובנות לביצועים אופטימליים.
 */
export default function PdfViewer({ url, title = "מסמך PDF", height = "600px", className = "" }) {
  if (!url) return null;

  return (
    <div className={`w-full border rounded-xl overflow-hidden bg-gray-50 shadow-sm ${className}`}>
      {/* סרגל כלים עליון */}
      <div className="bg-white p-3 flex justify-between items-center border-b px-4">
        <div className="flex items-center gap-2 text-gray-700 font-medium">
            <FileText className="w-5 h-5 text-red-500" />
            <h3 className="text-sm font-bold">{title}</h3>
        </div>
        <div className="flex gap-2">
            <a href={url} download target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="h-8 text-xs gap-1">
                    <Download className="w-3 h-3" />
                    <span className="hidden sm:inline">הורדה</span>
                </Button>
            </a>
            <a href={url} target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="sm" className="h-8 text-xs gap-1 text-blue-600 hover:bg-blue-50">
                    <ExternalLink className="w-3 h-3" />
                    <span className="hidden sm:inline">פתח בחלון חדש</span>
                </Button>
            </a>
        </div>
      </div>

      {/* אזור הצפייה */}
      <div className="relative w-full bg-gray-200" style={{ height }}>
        <iframe
          src={`https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`}
          title={title}
          width="100%"
          height="100%"
          className="w-full h-full block"
          style={{ border: 'none' }}
          loading="lazy"
        >
          {/* תוכן חלופי למקרה שהדפדפן לא תומך */}
          <div className="flex flex-col items-center justify-center h-full p-8 text-center text-gray-500 bg-white">
              <FileText className="w-12 h-12 text-gray-300 mb-4" />
              <p className="font-medium">לא ניתן להציג את התצוגה המקדימה.</p>
              <a href={url} target="_blank" rel="noopener noreferrer">
                  <Button className="mt-4">
                    פתח את הקובץ
                  </Button>
              </a>
          </div>
        </iframe>
      </div>
    </div>
  );
}