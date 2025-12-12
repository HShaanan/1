
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import HorizontalScroller from './HorizontalScroller';

export function buildProfessionalsGroups(categories = []) {
    // יצירת קטגוריית "אנשי מקצוע" ידנית לצורך הדגמה
    const professionalsCategoryId = 'professionals-main-cat-id'; 
    const ProfessionalsCategory = { id: professionalsCategoryId, name: 'אנשי מקצוע', is_active: true, parent_id: null };

    // אסוף את כל תתי־הקטגוריות הישירים של "אנשי מקצוע"
    const subs = Array.isArray(categories)
        ? categories.filter(c => c.parent_id === professionalsCategoryId && c.is_active)
        : [];
        
    // אם אין תתי-קטגוריות מוגדרות, נחזיר מערך ריק
    if (subs.length === 0) {
        return [];
    }

    const groupsConfig = [
        { id: "health-medicine", label: "בריאות ורפואה", icon: "🩺", keywords: /(רופא(ים)?|רופאי שינ|שיניים|דנט|אחות|פיזיו|פיזיותר|פסיכו|דיאט|תזונ|אופטומטר|רוקח|וטרינר|מרפאה|קליניק|מטפל(ים)?)/i },
        { id: "education-teaching", label: "חינוך והוראה", icon: "📚", keywords: /(מורה(ים)?|מורים פרט|פרטי|גננת|גננות|קשיי? למידה|הוראה|חינוך|מוזיק|נהיגה|מדריך(ים)?|מאמן(ים)?|קואצ'?)/i },
        { id: "law-business", label: "משפט ועסקים", icon: "⚖️", keywords: /(עו.?ד|עריכת דין|משפט|רו.?ח|ראיית חשבון|נוטריון|יועץ מס|יועצ(ים)? עסק|עסקים|מתווך|תיווך|שמאי)/i },
        { id: "construction-maintenance", label: "בנייה ותחזוקה", icon: "🏗️", keywords: /(קבלנ|בני(י)?ה|חשמל|חשמלא|אינסטלט|צבע(י|ים)?|נגר(ים)?|רצף|ריצוף|מזג|מיזוג|גננ|גינון|שיפוץ)/i },
        { id: "auto-repair", label: "רכב ותיקונים", icon: "🚗", keywords: /(רכב|מכונא|מוסך|צמיג(ים)?|פנצ'?ר(יה)?|גרירה|שטיפ(ת|ה) רכב|בדיק(ת|ה) רכב|טסט|נהיגה)/i },
        { id: "beauty-care", label: "יופי וטיפוח", icon: "💄", keywords: /(מספר(ה|ה)?|ספר(ית)?|קוסמטיק|מניקור|פדיקור|עיצוב גבות|גבות|הסרת שיער|לייזר|איפור|מאפר(ת)?|מעס(ה)?|עיסוי|טיפוח)/i },
        { id: "tech-computers", label: "טכנולוגיה ומחשבים", icon: "💻", keywords: /(מחשב|טכנאי מחשבים|פיתוח|מפתח|אתר|בניית אתרים|UX|UI|גרפ(י|ה)?|סלולר|סמארטפון|רשת(ות)?|תקשורת|IT|טכנולוג)/i },
        { id: "home-services", label: "שירותי בית", icon: "🏠", keywords: /(ניקי[ו|ו]ן|ניקוי|עוזרת|עוזר|שמרטפ|בייביסיטר|גיהוץ|סידור|ארגון|מכשירי חשמל|מדיח|מכונת כביסה|תיקוני בית)/i },
        { id: "food-catering", label: "מזון וקייטרינג", icon: "🍽️", keywords: /(שף|טבח(ים)?|קייטרינג|עוג(ה|ות)|קונדיטור|מזון|תזונ(ה|אי)|קינוח|אופה)/i },
        { id: "fashion-clothing", label: "בגדים ואופנה", icon: "👗", keywords: /(תפיר(ה|ת)|תופר(ת)?|אופנה|מעצב(ת)? אופנה|תיקוני בגדים|בגדים|סטייל(יסט)?|הלבשה)/i },
        { id: "realestate-build", label: "נדל\"ן ובנייה", icon: "🏢", keywords: /(נדל.?ן|תיווך|מתווך|שמאי נדל.?ן|אדריכל|מהנדס|נכס(ים)?|משכנתא|ניהול נכסים)/i },
        { id: "logistics-shipping", label: "הובלה ומשלוחים", icon: "🚚", keywords: /(הובלה|משלוח(ים)?|שליח(ים)?|קורייר|משאית|העברה|אחסון)/i },
        { id: "art-design", label: "אמנות ועיצוב", icon: "🎨", keywords: /(צילום|צלמ(ת|ים)?|אמן|אמנות|עיצוב פנים|מסגר(יה)?|גרפיק(ה|אי)|מעצב(ת)?|תכשיט(ים)?|פסל)/i },
        { id: "sport-leisure", label: "ספורט ופנאי", icon: "🏃", keywords: /(מאמן(ים)?|כושר|שחיי?ה|מדריך כושר|פיזיותרפיסט ספורט|עיסוי ספורט|ספורט)/i },
        { id: "agri-animals", label: "חקלאות ובעלי חיים", icon: "🐾", keywords: /(חקלא(י|ות)|גננ|גינון|וטרינר|בעלי חיים|מאלף|כלב(ן|ים)?|דייג)/i },
        { id: "industry-manufacturing", label: "תעשייה וייצור", icon: "🏭", keywords: /(תעש(י|יי)ה|ייצור|מפעיל מכונות|מכונ(ה|ות)|בקר(ת)? איכות|מהנדס ייצור|חשמלאי תעשייתי)/i },
        { id: "transport-driving", label: "תחבורה ונהיגה", icon: "🚌", keywords: /(נהג(ים)?|מונית|אוטובוס|משאית|אמבולנס|נהיגה|מורה נהיגה)/i },
        { id: "finance-insurance", label: "כספים וביטוח", icon: "💼", keywords: /(פיננס(י|ים)?|ביטוח|פנס(יה|יוני)|השקעות|בנק(אי)?|הלווא(ה|ות)|יועץ פיננסי)/i },
        { id: "media-communication", label: "תקשורת ומדיה", icon: "🗞️", keywords: /(תקשורת|מדיה|עיתונ(אִי|אי|ות)|עורך(ים)?|קולנוע|רדיו|טלוויזיה|כתב)/i },
        { id: "religion-services", icon: "✡️", label: "שירותי דת", keywords: /(רב(נים)?|מוהל|חזן|סו?פר סת.?ם|סת.?ם|הלכה|מורה הוראה|כשרות)/i },
        { id: "security-safety", label: "אבטחה ובטיחות", icon: "🛡️", keywords: /(אבטח(ה|ים)?|ביטחון|מצלמות|אזעק(ה|ות)|בטיחות|כיבוי אש|גלא(י|ים))/i },
        { id: "personal-services", label: "שירותים אישיים", icon: "🤝", keywords: /(שידו?ך|אירוע|ארגון אירועים|מפעיל(ים)?|הורות|משפחת(י|ית)|ייעוץ אישי|יעוץ אישי)/i },
        { id: "environment-clean", label: "סביבה וניקיון", icon: "♻️", keywords: /(ניקי[ו|ו]ן|ניקוי|הדבר(ה|ה)?|סביבה|פסולת|מחזור)/i },
        { id: "sales-marketing", label: "מכירות ושיווק", icon: "📈", keywords: /(מכיר(ה|ות)|שיווק|נציג(י)? שירות|סוכן(ים)?|טלמרקטינג|קידום מכירות)/i },
        { id: "science-research", label: "מדע ומחקר", icon: "🔬", keywords: /(מחקר|מדע|מעבד(ה|ות)|אנליסט|נתונ(ים)?|דאטה|חוק(ר|רת))/i },
        { id: "other", label: "כללי", icon: "✨", keywords: null }
    ];

    const results = groupsConfig.map(g => ({ id: g.id, label: g.label, icon: g.icon, subIds: [] }));

    subs.forEach(sc => {
        const name = String(sc.name || "");
        let matched = false;
        for (let i = 0; i < groupsConfig.length - 1; i++) {
            const g = groupsConfig[i];
            if (g.keywords && g.keywords.test && g.keywords.test(name)) {
                const target = results.find(r => r.id === g.id);
                if (target) target.subIds.push(sc.id);
                matched = true;
                break;
            }
        }
        if (!matched) {
            const other = results.find(r => r.id === "other");
            if (other) other.subIds.push(sc.id);
        }
    });

    return results.filter(g => g.subIds.length > 0);
}

export default function ProfessionalsGrouping({ groups = [], loading, onSelect }) {
    if (loading) {
        return (
            <div className="relative" dir="rtl">
                <div className="flex gap-4 overflow-x-auto hide-scrollbar px-1 py-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="w-[180px] h-24 rounded-2xl" />
                    ))}
                </div>
            </div>
        );
    }
    
    if (!Array.isArray(groups) || groups.length === 0) {
      return null;
    }

    return (
        <div dir="rtl">
            <h2 className="text-xl font-bold mb-4">קבוצות אנשי מקצוע</h2>
            <HorizontalScroller ariaLabel="קבוצות אנשי מקצוע" itemWidth={180} gap={16}>
                {groups.map((group) => (
                    <button
                        key={group.id}
                        onClick={() => onSelect?.(group)}
                        className="shrink-0 w-[180px] h-24 p-4 flex flex-col justify-between items-center bg-white border rounded-2xl text-center group hover:shadow-lg hover:-translate-y-0.5 transition-all"
                        type="button"
                    >
                        <span className="text-3xl">{group.icon}</span>
                        <span className="text-sm font-semibold text-slate-800 line-clamp-1">{group.label}</span>
                    </button>
                ))}
            </HorizontalScroller>
        </div>
    );
}
