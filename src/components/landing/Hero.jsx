import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { createPageUrl } from "@/utils";

export default function Hero() {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = createPageUrl(`Search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <section 
      className="relative h-[60vh] lg:h-[70vh] flex items-center justify-center text-center text-white overflow-hidden" 
      dir="rtl"
      aria-label="גיבור - חיפוש עסקים"
    >
      {/* תמונת רקע סטטית */}
      <div className="absolute inset-0 z-0" aria-hidden="true">
        <img
          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68815c70a48dd08622dbaf69/d70f3bd45_image3.jpg"
          alt=""
          className="w-full h-full object-cover"
          role="presentation"
        />
      </div>
      
      <div className="relative z-10 p-4 max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-6xl font-extrabold leading-tight text-shadow-lg">
          משלנו: הכי קרוב אליך
        </h1>
        <p className="mt-4 text-lg md:text-xl max-w-2xl mx-auto text-shadow">
          הפלטפורמה שמחברת אותך לעסקים ובעלי מקצוע איכותיים בקהילה. קרוב לבית, קרוב ללב.
        </p>

        <div className="mt-8 max-w-xl mx-auto">
          <form onSubmit={handleSearch} role="search" aria-label="חיפוש עסקים">
            <div className="relative">
              <label htmlFor="hero-search" className="sr-only">
                חיפוש עסקים או שירותים
              </label>
              <Input
                id="hero-search"
                type="search"
                placeholder="לדוגמה: חשמלאי, גן ילדים, קייטרינג..."
                className="h-14 text-lg pr-12 rounded-full shadow-lg bg-white/90 text-slate-800 placeholder:text-slate-500 focus:ring-2 focus:ring-blue-400"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="שדה חיפוש עסקים"
              />
              <Search 
                className="absolute top-1/2 right-4 transform -translate-y-1/2 w-6 h-6 text-slate-400" 
                aria-hidden="true"
              />
              <Button
                type="submit"
                className="absolute top-1/2 left-2 transform -translate-y-1/2 h-10 px-6 rounded-full bg-blue-600 hover:bg-blue-700 transition-all"
                aria-label="ביצוע חיפוש"
              >
                חיפוש
              </Button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}