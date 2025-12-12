import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, Plus, Tag } from "lucide-react";

export default function TagsInput({ 
  value = [], 
  onChange = () => {}, 
  placeholder = "הוסף תגית...",
  maxTags = 10 
}) {
  const [inputValue, setInputValue] = React.useState("");
  const tags = Array.isArray(value) ? value : [];

  const addTag = () => {
    const newTag = inputValue.trim();
    if (newTag && !tags.includes(newTag) && tags.length < maxTags) {
      onChange([...tags, newTag]);
      setInputValue("");
    }
  };

  const removeTag = (tagToRemove) => {
    onChange(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <div className="space-y-3">
      {/* תגיות קיימות */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag, index) => (
            <div
              key={index}
              className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm border"
            >
              <Tag className="w-3 h-3" />
              <span>{tag}</span>
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* הוספת תגית חדשה */}
      {tags.length < maxTags && (
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            className="flex-1"
          />
          <Button
            type="button"
            onClick={addTag}
            disabled={!inputValue.trim()}
            size="sm"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      )}

      {tags.length >= maxTags && (
        <p className="text-xs text-slate-500">
          הגעת למספר המקסימלי של תגיות ({maxTags})
        </p>
      )}
    </div>
  );
}