import DOMPurify from "dompurify";
import { Sparkles } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";

export default function ExecutiveSummarySection({ aiSummary }) {
  if (!aiSummary) return null;
  return (
    <ScrollReveal>
      <div className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6 rounded-2xl shadow-lg border border-indigo-100 relative overflow-hidden hover:shadow-xl transition-shadow duration-300">
        <div className="absolute top-0 left-0 p-4 opacity-5 pointer-events-none">
          <Sparkles className="w-32 h-32 text-indigo-600" />
        </div>
        <h3 className="text-xl font-bold text-indigo-900 mb-4 flex items-center gap-2 relative z-10">
          <Sparkles className="w-5 h-5 text-indigo-600" />
          למה לבחור בנו?
        </h3>
        <div
          className="prose prose-sm max-w-none text-slate-700 relative z-10 leading-relaxed [&>ul]:list-disc [&>ul]:pr-4 [&>ul>li]:mb-1"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(aiSummary) }}
        />
      </div>
    </ScrollReveal>
  );
}
