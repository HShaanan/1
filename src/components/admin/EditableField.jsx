import { useState, useEffect, useRef } from "react";
import { Pencil, Check, X } from "lucide-react";

/**
 * EditableField — wraps any display element for inline admin editing.
 * When isEditMode=false: renders children (or plain value) unchanged.
 * When isEditMode=true:
 *   - Hover shows pencil hint
 *   - Click activates input/textarea
 *   - Enter/✓ saves, Escape/✗ cancels
 */
export default function EditableField({
  value,
  onSave,
  isEditMode,
  type = "text",        // "text" | "textarea" | "phone" | "url"
  placeholder = "לחץ לעריכה",
  label = "",
  children,
  className = "",
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");
  const inputRef = useRef(null);

  useEffect(() => { setDraft(value ?? ""); }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if (type !== "textarea") inputRef.current.select();
    }
  }, [isEditing, type]);

  // Not in edit mode — render as-is
  if (!isEditMode) {
    return children ?? <span className={className}>{value}</span>;
  }

  // In edit mode, showing the editor
  if (isEditing) {
    return (
      <div className="relative flex flex-col gap-2 w-full my-1 z-20" onClick={(e) => e.stopPropagation()}>
        {label && <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full w-fit">{label}</span>}
        {type === "textarea" ? (
          <textarea
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={4}
            className="w-full border-2 border-indigo-400 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-600 bg-white shadow-xl resize-y"
            placeholder={placeholder}
            onKeyDown={(e) => { if (e.key === "Escape") { setDraft(value ?? ""); setIsEditing(false); } }}
          />
        ) : (
          <input
            ref={inputRef}
            type={type === "phone" ? "tel" : type === "url" ? "url" : "text"}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="w-full border-2 border-indigo-400 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-600 bg-white shadow-xl"
            placeholder={placeholder}
            onKeyDown={(e) => {
              if (e.key === "Enter") { onSave(draft); setIsEditing(false); }
              if (e.key === "Escape") { setDraft(value ?? ""); setIsEditing(false); }
            }}
          />
        )}
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => { onSave(draft); setIsEditing(false); }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-medium rounded-lg shadow transition-colors"
          >
            <Check className="w-3.5 h-3.5" /> שמור
          </button>
          <button
            onClick={() => { setDraft(value ?? ""); setIsEditing(false); }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-400 hover:bg-slate-500 text-white text-xs font-medium rounded-lg shadow transition-colors"
          >
            <X className="w-3.5 h-3.5" /> בטל
          </button>
        </div>
      </div>
    );
  }

  // In edit mode, not yet editing — show with hover hint
  return (
    <div
      className={`relative group cursor-pointer rounded-xl ring-2 ring-transparent hover:ring-indigo-400 hover:bg-indigo-50/40 transition-all duration-150 px-2 py-1 -mx-2 -my-1 ${className}`}
      onClick={() => setIsEditing(true)}
      title={label ? `ערוך: ${label}` : "לחץ לעריכה"}
    >
      {children ?? (
        <span>{value || <span className="text-slate-400 italic text-sm">{placeholder}</span>}</span>
      )}
      <span className="absolute -top-2.5 -right-2 hidden group-hover:flex items-center gap-0.5 bg-indigo-500 text-white text-[10px] px-1.5 py-0.5 rounded-full shadow-lg z-10 whitespace-nowrap">
        <Pencil className="w-2.5 h-2.5" />
        {label || "ערוך"}
      </span>
    </div>
  );
}
