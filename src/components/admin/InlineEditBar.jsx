import { Pencil, Check, X, Loader2, Save } from "lucide-react";

/**
 * InlineEditBar — floating bottom toolbar for admin/owner inline editing.
 * Always visible to canEdit users as a small "Edit Mode" pill.
 * Expands when isEditMode=true with Save / Discard controls.
 */
export default function InlineEditBar({
  isEditMode,
  onToggle,
  hasChanges,
  onSave,
  onDiscard,
  isSaving,
  changeCount = 0,
}) {
  if (!isEditMode) {
    return (
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200]">
        <button
          onClick={onToggle}
          className="flex items-center gap-2 bg-slate-800/95 backdrop-blur-sm hover:bg-slate-900 text-white text-sm font-medium rounded-2xl shadow-2xl px-5 py-3 border border-slate-600/50 transition-all duration-200 hover:scale-105 active:scale-95"
        >
          <Pencil className="w-4 h-4 text-amber-400" />
          <span>מצב עריכה</span>
          <span className="text-xs text-slate-400 mr-1">אדמין</span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center gap-3 bg-slate-900 text-white rounded-2xl shadow-2xl px-5 py-3.5 border border-amber-500/30">
        {/* Mode label */}
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-sm font-semibold text-amber-400">מצב עריכה פעיל</span>
          {changeCount > 0 && (
            <span className="bg-amber-400 text-slate-900 text-xs font-bold px-2 py-0.5 rounded-full">
              {changeCount} שינויים
            </span>
          )}
        </div>

        <div className="w-px h-6 bg-slate-600" />

        {/* Save All */}
        <button
          onClick={onSave}
          disabled={!hasChanges || isSaving}
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl shadow transition-all duration-150 hover:scale-105 active:scale-95"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isSaving ? "שומר..." : "שמור הכל"}
        </button>

        {/* Discard */}
        <button
          onClick={onDiscard}
          disabled={isSaving}
          className="flex items-center gap-1.5 px-3 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-white text-sm font-medium rounded-xl transition-all duration-150"
        >
          <X className="w-4 h-4" />
          בטל שינויים
        </button>

        {/* Exit edit mode */}
        <button
          onClick={onToggle}
          disabled={isSaving}
          title="יצא ממצב עריכה"
          className="p-1.5 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-700 disabled:opacity-40"
        >
          <Check className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
