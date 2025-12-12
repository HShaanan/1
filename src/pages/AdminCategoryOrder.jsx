
import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Category } from "@/entities/Category";
import { User } from "@/entities/User";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Layers, GripVertical, Loader2, CheckCircle, AlertTriangle } from "lucide-react";
import { createPageUrl } from "@/utils";

export default function AdminCategoryOrderPage() {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const userData = await User.me().catch(() => null);
      if (!userData || userData.role !== 'admin') {
        window.location.href = createPageUrl("Browse");
        return;
      }
      await loadCategories();
    } catch (err) {
      setError("שגיאה באימות הרשאות");
    } finally {
      setIsLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const allCategories = await Category.list("sort_order");
      const mainCategories = allCategories.filter(cat => !cat.parent_id && cat.is_active);
      setCategories(mainCategories);
    } catch (err) {
      setError("שגיאה בטעינת הקטגוריות");
    }
  };

  const handleOnDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(categories);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setCategories(items);
  };

  const handleSaveOrder = async () => {
    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      const updatePromises = categories.map((category, index) =>
        Category.update(category.id, { sort_order: index })
      );
      await Promise.all(updatePromises);
      setSuccess("סדר הקטגוריות נשמר בהצלחה!");
    } catch (err) {
      setError("שגיאה בשמירת הסדר החדש.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-slate-50" dir="rtl">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Layers className="w-8 h-8 text-indigo-600" />
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-l from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              סידור תצוגת הקטגוריות
            </h1>
            <p className="text-gray-600">גרור ושחרר כדי לסדר את הקטגוריות כפי שיופיעו בעמוד הבית</p>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="mb-4 bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">{success}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>רשימת קטגוריות ראשיות</CardTitle>
          </CardHeader>
          <CardContent>
            <DragDropContext onDragEnd={handleOnDragEnd}>
              <Droppable droppableId="categories">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                    {categories.map((category, index) => (
                      <Draggable key={category.id} draggableId={category.id} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="flex items-center p-3 bg-white rounded-lg border shadow-sm cursor-grab active:cursor-grabbing"
                          >
                            <GripVertical className="w-5 h-5 text-gray-400 ml-4" />
                            <div className="flex items-center gap-3">
                              <span className="text-lg">{category.icon || "📁"}</span>
                              <span className="font-medium text-gray-800">{category.name}</span>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </CardContent>
        </Card>

        <div className="mt-6 flex justify-end">
          <Button onClick={handleSaveOrder} disabled={isSaving} size="lg">
            {isSaving ? (
              <Loader2 className="w-5 h-5 animate-spin ml-2" />
            ) : (
              <CheckCircle className="w-5 h-5 ml-2" />
            )}
            שמור סדר
          </Button>
        </div>
      </div>
    </div>
  );
}
