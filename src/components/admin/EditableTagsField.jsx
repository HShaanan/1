import { useState, useEffect } from "react";
import { X, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

/**
 * EditableTagsField — renders tags with add/remove UI when isEditMode is true.
 */
export default function EditableTagsField({ tags, onSave, isEditMode }) {
  const [localTags, setLocalTags] = useState(tags || []);
  const [newTag, setNewTag] = useState("");

  // Sync when parent changes (e.g. after discard)
  useEffect(() => { setLocalTags(tags || []); }, [tags]);

  const handleRemove = (idx) => {
    const updated = localTags.filter((_, i) => i !== idx);
    setLocalTags(updated);
    onSave(updated);
  };

  const handleAdd = () => {
    const trimmed = newTag.trim().replace(/^#/, "");
    if (!trimmed || localTags.includes(trimmed)) return;
    const updated = [...localTags, trimmed];
    setLocalTags(updated);
    onSave(updated);
    setNewTag("");
  };

  const displayTags = isEditMode ? localTags : (tags || []);

  if (!displayTags.length && !isEditMode) return null;

  return (
    <div className={`p-6 rounded-2xl shadow-xl border ${isEditMode ? 'border-indigo-200 bg-indigo-50/30' : 'border-slate-200/80 bg-transparent'}`}>
      <h3 className="text-xl font-bold text-slate-800 mb-3 flex items-center gap-2">
        תגיות
        {isEditMode && (
          <span className="text-xs font-normal text-indigo-500 bg-indigo-100 px-2 py-0.5 rounded-full">ניתן לעריכה</span>
        )}
      </h3>
      <div className="flex flex-wrap gap-2 items-center">
        {displayTags.map((tag, idx) => (
          <Badge
            key={idx}
            variant="secondary"
            className="text-white px-3 py-2 text-sm font-medium rounded-full inline-flex items-center gap-1.5 border transition-all duration-300"
            style={{ backgroundColor: 'var(--theme-primary)', color: 'white', borderColor: 'transparent' }}
          >
            #{tag}
            {isEditMode && (
              <button
                onClick={() => handleRemove(idx)}
                className="hover:text-red-200 transition-colors ml-0.5"
                aria-label={`הסר תגית ${tag}`}
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </Badge>
        ))}

        {isEditMode && (
          <div className="flex items-center gap-2 mt-1">
            <input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="תגית חדשה..."
              className="border-2 border-dashed border-indigo-300 focus:border-indigo-500 rounded-full px-3 py-1.5 text-sm focus:outline-none bg-white w-32"
              onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
            />
            <button
              onClick={handleAdd}
              className="flex items-center gap-1 px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-sm rounded-full transition-colors shadow"
              aria-label="הוסף תגית"
            >
              <Plus className="w-3.5 h-3.5" />
              הוסף
            </button>
          </div>
        )}

        {isEditMode && displayTags.length === 0 && (
          <span className="text-slate-400 text-sm italic">אין תגיות — הוסף תגית ראשונה</span>
        )}
      </div>
    </div>
  );
}
