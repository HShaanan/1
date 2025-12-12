
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Search, X, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

// --- רכיבים עצמאיים (מוגדרים פעם אחת מחוץ לקומפוננטה הראשית למניעת רינדור מיותר) ---

const CategoryButton = React.memo(({ title, onClick, active }) => (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-right p-4 rounded-xl border-2 transition-all duration-200 font-semibold ${
        active 
          ? 'bg-gradient-to-r from-orange-500 to-red-500 border-orange-400 text-white shadow-lg scale-105' 
          : 'bg-white/70 border-orange-300/50 text-slate-700 hover:bg-orange-50 hover:border-orange-400 hover:shadow-md transform hover:-translate-y-1'
      }`}
    >
      {title}
    </button>
));

const SearchBar = ({ searchTerm, onSearch, onClear }) => (
    <div className="relative mb-4">
      <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-500 pointer-events-none" />
      <input
        value={searchTerm}
        onChange={(e) => onSearch(e.target.value)}
        className="w-full border border-orange-300 rounded-lg px-9 py-2 text-sm bg-white/80 text-slate-700 placeholder:text-orange-400 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors backdrop-blur-sm"
        placeholder="הקלד כאן לחיפוש..."
        autoComplete="off"
      />
      {searchTerm && (
        <button type="button" onClick={onClear} className="absolute left-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-orange-100">
          <X className="w-4 h-4 text-orange-500"/>
        </button>
      )}
    </div>
);

const ResultsGrid = ({ items = [], onSelect, activeId, customButton = null }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map(item => (
            <CategoryButton 
                key={item.id}
                title={item.name}
                onClick={() => onSelect(item.id)}
                active={item.id === activeId}
            />
        ))}
        {customButton}
    </div>
);

const CustomRequestForm = ({ type, value, onChange }) => {
    const isSubSub = type === 'subsub';
    
    const handleFormChange = (field, fieldValue) => {
        onChange({ ...value, [field]: fieldValue });
    };

    return (
        <div className="mt-4 p-4 border border-orange-400/40 bg-orange-50/80 rounded-lg space-y-3 backdrop-blur-sm">
            <h4 className="font-bold" style={{ 
              background: 'linear-gradient(135deg, #f97316, #ea580c)', 
              WebkitBackgroundClip: 'text', 
              WebkitTextFillColor: 'transparent',
              textShadow: '0 1px 1px rgba(0,0,0,0.1)' 
            }}>
                {isSubSub ? "לא מצאת את ההתמחות שלך?" : "לא מצאת את התחום שלך?"}
            </h4>
            <p className="text-sm text-orange-700">
                {isSubSub ? "נשמח להוסיף את ההתמחות המבוקשת." : "אין בעיה! תוכלו להוסיף כאן את התחום המבוקש ואנו נדאג לעדכן."}
            </p>
            {!isSubSub && (
                <>
                    <Input
                        placeholder="שם הקטגוריה הראשית (לדוגמה: אנשי מקצוע)"
                        value={value.custom_category_name || ""}
                        onChange={(e) => handleFormChange('custom_category_name', e.target.value)}
                        className="bg-white/80 border-orange-300 text-slate-700 placeholder:text-orange-400"
                    />
                    <Input
                        placeholder="שם תת-הקטגוריה (לדוגמה: שיפוצים)"
                        value={value.custom_subcategory_name || ""}
                        onChange={(e) => handleFormChange('custom_subcategory_name', e.target.value)}
                        className="bg-white/80 border-orange-300 text-slate-700 placeholder:text-orange-400"
                    />
                </>
            )}
             {isSubSub && (
                <Input
                    placeholder="שם ההתמחות (לדוגמה: עבודות גבס)"
                    value={value.custom_subsubcategory_name || ""}
                    onChange={(e) => handleFormChange('custom_subsubcategory_name', e.target.value)}
                    className="bg-white/80 border-orange-300 text-slate-700 placeholder:text-orange-400"
                />
            )}

            {!isSubSub && (
                 <Textarea
                    placeholder="הערות נוספות (אופציונלי)"
                    value={value.custom_notes || ""}
                    onChange={(e) => handleFormChange('custom_notes', e.target.value)}
                    className="bg-white/80 border-orange-300 text-slate-700 placeholder:text-orange-400"
                />
            )}
        </div>
    );
};

function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
}

// --- הקומפוננטה הראשית ---

export default function StepCategory({
  categories = [],
  value = { category_id: "", subcategory_id: "", subsubcategory_id: "" },
  onChange = () => {},
  professionalsLabelRegex = /אנשי\s*מקצוע|אישי מקצוע/
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const [view, setView] = useState("main");
  
  const professionalsMainId = useMemo(() => {
    const profCat = (categories || []).find(c => !c.parent_id && professionalsLabelRegex.test(c.name || ""));
    return profCat?.id;
  }, [categories, professionalsLabelRegex]);

  useEffect(() => {
    // עדכון הלוגיקה להחלטה על view
    if (value.category_id) {
      if (value.subcategory_id) {
        if (value.subcategory_id === "custom_request") {
          setView("subs"); // Always stay in subs view if custom_request is selected
        } else if (value.category_id === professionalsMainId) {
          setView("subsubs"); // Go to subsubs only if it's professionals and not custom
        } else {
          setView("subs"); // Default for non-professional subcategories
        }
      } else {
        setView("subs"); // If only category is selected, go to subs view
      }
    } else {
      setView("main"); // If no category selected, stay in main view
    }
  }, [value.category_id, value.subcategory_id, professionalsMainId]);

  const filterList = (list, term) => {
    const lowerCaseTerm = term.trim().toLowerCase();
    return !lowerCaseTerm ? list : list.filter(item => (item.name || "").toLowerCase().includes(lowerCaseTerm));
  };

  const mainCats = useMemo(() => filterList((categories || []).filter(c => !c.parent_id && (c.is_active ?? true)), debouncedSearchTerm), [categories, debouncedSearchTerm]);
  const subs = useMemo(() => filterList((categories || []).filter(c => c.parent_id === value.category_id && (c.is_active ?? true)), debouncedSearchTerm), [categories, value.category_id, debouncedSearchTerm]);
  const subsubs = useMemo(() => filterList((categories || []).filter(c => c.parent_id === value.subcategory_id && (c.is_active ?? true)), debouncedSearchTerm), [categories, value.subcategory_id, debouncedSearchTerm]);
  
  const clearSearch = useCallback(() => setSearchTerm(''), []);

   const selectMain = useCallback((id) => {
    onChange({
      category_id: id, subcategory_id: "", subsubcategory_id: "", is_custom_category: false,
      custom_category_name: "", custom_subcategory_name: "", custom_subsubcategory_name: "", custom_notes: ""
    });
    setView("subs");
    clearSearch();
  }, [onChange, clearSearch]);

  const selectSub = useCallback((id) => {
    const isCustom = id === "custom_request";
    onChange({
      ...value, 
      subcategory_id: id, 
      subsubcategory_id: "", 
      is_custom_category: isCustom,
      custom_category_name: isCustom ? value.custom_category_name : "",
      custom_subcategory_name: isCustom ? value.custom_subcategory_name : "",
      custom_subsubcategory_name: "", // איפוס
      custom_notes: isCustom ? value.custom_notes : ""
    });
    
    // אם זה custom request, לא עוברים ל-subsubs גם אם זה אנשי מקצוע
    if (!isCustom && value.category_id === professionalsMainId) {
      setView("subsubs");
    }
    clearSearch();
  }, [onChange, value, professionalsMainId, clearSearch]);
  
  const selectSubsub = useCallback((id) => {
    const isCustom = id === "custom_request_subsub";
    onChange({
      ...value, 
      subsubcategory_id: id,
      is_custom_category: value.subcategory_id === 'custom_request' || isCustom,
      custom_subsubcategory_name: isCustom ? value.custom_subsubcategory_name : ""
    });
  }, [onChange, value]);
  
  const changeView = useCallback((newView) => {
    if (newView === 'main') onChange({ category_id: "", subcategory_id: "", subsubcategory_id: "" });
    else if (newView === 'subs') onChange({ ...value, subcategory_id: "", subsubcategory_id: "" });
    setView(newView);
    clearSearch();
  }, [onChange, value, clearSearch]);
  
  const selectedCatName = useMemo(() => categories.find(c => c.id === value.category_id)?.name, [categories, value.category_id]);
  const selectedSubCatName = useMemo(() => categories.find(c => c.id === value.subcategory_id)?.name, [categories, value.subcategory_id]);

  return (
    <div dir="rtl">
        {view === 'main' && (
          <div>
            <h3 className="font-bold text-lg mb-4" style={{ 
              background: 'linear-gradient(135deg, #f97316, #ea580c)', 
              WebkitBackgroundClip: 'text', 
              WebkitTextFillColor: 'transparent',
              textShadow: '0 1px 2px rgba(0,0,0,0.1)' 
            }}>בחירת קטגוריה ראשית</h3>
            <SearchBar searchTerm={searchTerm} onSearch={setSearchTerm} onClear={clearSearch} />
            <ResultsGrid items={mainCats} onSelect={selectMain} activeId={value.category_id} />
          </div>
        )}

        {view === 'subs' && (
          <div>
            <button onClick={() => changeView('main')} className="flex items-center gap-1 text-sm text-orange-600 hover:text-orange-700 mb-2">
              <ArrowRight className="w-4 h-4" /> חזרה לקטגוריות
            </button>
            <h3 className="font-bold text-lg mb-2" style={{ 
              background: 'linear-gradient(135deg, #f97316, #ea580c)', 
              WebkitBackgroundClip: 'text', 
              WebkitTextFillColor: 'transparent',
              textShadow: '0 1px 2px rgba(0,0,0,0.1)' 
            }}>תת-קטגוריה בתוך "{selectedCatName}"</h3>
            <SearchBar searchTerm={searchTerm} onSearch={setSearchTerm} onClear={clearSearch} />
            <ResultsGrid 
                items={subs} 
                onSelect={selectSub} 
                activeId={value.subcategory_id}
                customButton={
                    <CategoryButton
                        title="אחר / בקשה להוספה"
                        onClick={() => selectSub("custom_request")}
                        active={value.subcategory_id === "custom_request"}
                    />
                }
            />
            
            {/* טופס בקשה מותאם לאנשי מקצוע */}
            {value.subcategory_id === "custom_request" && (
                <div className="mt-4 p-4 border border-orange-400/40 bg-orange-50/80 rounded-lg space-y-3 backdrop-blur-sm">
                    <h4 className="font-bold" style={{ 
                      background: 'linear-gradient(135deg, #f97316, #ea580c)', 
                      WebkitBackgroundClip: 'text', 
                      WebkitTextFillColor: 'transparent',
                      textShadow: '0 1px 1px rgba(0,0,0,0.1)' 
                    }}>
                        {value.category_id === professionalsMainId ? "לא מצאת את המקצוע שלך?" : "לא מצאת את התחום שלך?"}
                    </h4>
                    <p className="text-sm text-orange-700">
                        {value.category_id === professionalsMainId 
                            ? "אנא ציין את המקצוע/שירות שלך ואנחנו נוסיף אותו למערכת." 
                            : "אין בעיה! תוכל להוסיף כאן את התחום המבוקש ואנו נדאג לעדכן."
                        }
                    </p>
                    
                    <Input
                        placeholder={value.category_id === professionalsMainId 
                            ? "המקצוע/שירות שלך (לדוגמה: עיצוב גרפי, תיקוני מחשבים)" 
                            : "שם תת-הקטגוריה (לדוגמה: שיפוצים)"
                        }
                        value={value.custom_subcategory_name || ""}
                        onChange={(e) => onChange({...value, custom_subcategory_name: e.target.value})}
                        className="bg-white/80 border-orange-300 text-slate-700 placeholder:text-orange-400"
                    />
                    
                    <Textarea
                        placeholder={value.category_id === professionalsMainId 
                            ? "תיאור המקצוע/שירות - מה אתה מציע ללקוחות? (זה יעזור למנהל להבין ולהוסיף נכון)" 
                            : "תיאור התחום והצורך (אופציונלי)"
                        }
                        value={value.custom_notes || ""}
                        onChange={(e) => onChange({...value, custom_notes: e.target.value})}
                        className="bg-white/80 border-orange-300 text-slate-700 placeholder:text-orange-400 min-h-[80px]"
                    />
                    
                    <div className="text-xs text-orange-600 bg-orange-100/50 p-2 rounded">
                        💡 הבקשה תישלח למנהל לאישור ותוכל להמשיך בבניית המודעה
                    </div>
                </div>
            )}
        </div>
        )}
        
        {view === 'subsubs' && (
          <div>
             <button onClick={() => changeView('subs')} className="flex items-center gap-1 text-sm text-orange-600 hover:text-orange-700 mb-2">
               <ArrowRight className="w-4 h-4" /> חזרה ל"{selectedCatName}"
             </button>
             <h3 className="font-bold text-lg mb-2" style={{ 
               background: 'linear-gradient(135deg, #f97316, #ea580c)', 
               WebkitBackgroundClip: 'text', 
               WebkitTextFillColor: 'transparent',
               textShadow: '0 1px 2px rgba(0,0,0,0.1)' 
             }}>התמחות בתוך "{selectedSubCatName}"</h3>
             <SearchBar searchTerm={searchTerm} onSearch={setSearchTerm} onClear={clearSearch} />
             <ResultsGrid 
                items={subsubs} 
                onSelect={selectSubsub} 
                activeId={value.subsubcategory_id}
                customButton={
                    <CategoryButton
                        title="אחר / בקשה להוספה"
                        onClick={() => selectSubsub("custom_request_subsub")}
                        active={value.subsubcategory_id === "custom_request_subsub"}
                    />
                }
            />
             {value.subsubcategory_id === "custom_request_subsub" && (
                <CustomRequestForm 
                    type="subsub"
                    value={value}
                    onChange={onChange}
                />
            )}
          </div>
        )}
      </div>
  );
}
