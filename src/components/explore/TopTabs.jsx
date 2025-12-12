import React from "react";
import { Button } from "@/components/ui/button";
import { Utensils, ShoppingBag } from "lucide-react";

export default function TopTabs({ active = "food", onChange }) {
  const tabs = [
    { key: "food", label: "אוכל", icon: Utensils },
    { key: "shopping", label: "קניות", icon: ShoppingBag }
  ];
  return (
    <div className="flex items-center gap-2">
      {tabs.map(t => {
        const Icon = t.icon;
        const isActive = active === t.key;
        return (
          <Button
            key={t.key}
            variant={isActive ? "default" : "outline"}
            className={`rounded-full px-4 ${isActive ? "bg-blue-600 hover:bg-blue-600 text-white" : ""}`}
            onClick={() => onChange?.(t.key)}
          >
            <Icon className={`w-4 h-4 ml-2 ${isActive ? "text-white" : "text-blue-600"}`} />
            {t.label}
          </Button>
        );
      })}
    </div>
  );
}