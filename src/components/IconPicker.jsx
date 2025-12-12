import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Smile } from "lucide-react";

// מאגר אייקונים וחלוקה לקטגוריות
const iconCategories = {
  business: {
    name: "עסקים ושירותים",
    icons: ["🏪", "🏢", "🏭", "🏬", "🏪", "💼", "💰", "💳", "💎", "🏦", "🏛️", "🏗️", "🔧", "🔨", "⚡", "🔌", "🚗", "🚙", "🚐", "🚛", "✈️", "🚂", "🚌", "🏥", "💊", "🩺", "⚕️", "📱", "💻", "🖥️", "⌚", "📺", "📷", "🎥", "🔍", "📊", "📈", "📉"]
  },
  food: {
    name: "אוכל ומשקאות",
    icons: ["🍕", "🍔", "🍟", "🌭", "🥪", "🌮", "🌯", "🥙", "🧆", "🥘", "🍝", "🍜", "🍲", "🍱", "🍛", "🍣", "🍤", "🍙", "🥟", "🍞", "🥖", "🥨", "🧀", "🥚", "🍳", "🥓", "🥩", "🍗", "🍖", "🌶️", "🥕", "🌽", "🥬", "🥒", "🍅", "🍆", "🥑", "🍊", "🍎", "🍌", "🍇", "🍓", "🥝", "🍑", "🍒", "🥥", "🍍", "🥭", "☕", "🍵", "🧃", "🥤", "🍺", "🍷", "🥂", "🍸", "🧊"]
  },
  home: {
    name: "בית וגן",
    icons: ["🏠", "🏡", "🏘️", "🏰", "🏯", "🏟️", "🗼", "🗽", "⛪", "🕌", "🛕", "🕍", "⛩️", "🏛️", "🏗️", "🧱", "🪨", "🪵", "🛠️", "🔨", "🪚", "🔧", "🪛", "🔩", "⚙️", "🧰", "🪜", "🪣", "🧽", "🧴", "🧷", "🧹", "🧺", "🪑", "🛏️", "🛋️", "🚪", "🪟", "🛁", "🚿", "🚽", "🪞", "💡", "🕯️", "🪔", "🔦", "🏮", "💐", "🌸", "🌺", "🌻", "🌷", "🌹", "🥀", "🌾", "🌿", "☘️", "🍀", "🍃", "🌱", "🌲", "🌳", "🌴", "🎋", "🎍"]
  },
  education: {
    name: "חינוך ולימודים",
    icons: ["📚", "📖", "📝", "✏️", "✒️", "🖊️", "🖋️", "🖍️", "📄", "📃", "📑", "📊", "📈", "📉", "🗒️", "🗓️", "📅", "📆", "🗃️", "🗳️", "🗄️", "📋", "📌", "📍", "📎", "🖇️", "📏", "📐", "✂️", "🗃️", "🗂️", "🗞️", "📰", "📓", "📔", "📒", "📕", "📗", "📘", "📙", "📜", "🎓", "🏫", "🏤", "🖥️", "💻", "⌨️", "🖱️", "🖲️", "💾", "💿", "📀", "🧮", "🔬", "🔭", "📡", "🧪", "⚗️", "🧬", "🔍", "🔎"]
  },
  health: {
    name: "בריאות ורפואה",
    icons: ["🏥", "⚕️", "🩺", "💊", "💉", "🩹", "🦷", "🦴", "🧠", "🫀", "🫁", "🩸", "👁️", "👂", "👃", "👄", "👅", "🦵", "🦶", "👶", "🧒", "👦", "👧", "🧑", "👨", "👩", "🧓", "👴", "👵", "👨‍⚕️", "👩‍⚕️", "🧑‍⚕️", "🚑", "🏃", "🏃‍♀️", "🏃‍♂️", "🧘", "🧘‍♀️", "🧘‍♂️", "🏋️", "🏋️‍♀️", "🏋️‍♂️", "🤸", "🤸‍♀️", "🤸‍♂️", "🚴", "🚴‍♀️", "🚴‍♂️", "🏊", "🏊‍♀️", "🏊‍♂️", "🧖", "🧖‍♀️", "🧖‍♂️", "🧚", "🧚‍♀️", "🧚‍♂️"]
  },
  entertainment: {
    name: "בילוי ונופש",
    icons: ["🎭", "🎪", "🎨", "🎬", "🎤", "🎧", "🎼", "🎵", "🎶", "🎹", "🥁", "🎷", "🎺", "🎸", "🪕", "🎻", "🎲", "♠️", "♥️", "♦️", "♣️", "🃏", "🀄", "🎯", "🎳", "🎮", "🕹️", "🎰", "🧩", "🪀", "🪁", "🔮", "🎪", "🎡", "🎢", "🎠", "🎨", "🖼️", "🎭", "🏟️", "🏛️", "🏗️", "🏘️", "🏙️", "🌃", "🌉", "🌁", "🏔️", "⛰️", "🌋", "🗻", "🏕️", "🏖️", "🏜️", "🏝️", "🏞️", "🎣", "⛵", "🚤", "🛶", "⛱️", "🏄", "🏄‍♀️", "🏄‍♂️", "🏊", "🏊‍♀️", "🏊‍♂️"]
  },
  transport: {
    name: "תחבורה ונסיעות",
    icons: ["🚗", "🚕", "🚙", "🚌", "🚎", "🏎️", "🚓", "🚑", "🚒", "🚐", "🛻", "🚚", "🚛", "🚜", "🏍️", "🛵", "🚲", "🛴", "🛹", "🛼", "🚁", "✈️", "🛩️", "🛫", "🛬", "🪂", "💺", "🚀", "🛸", "🚊", "🚝", "🚞", "🚋", "🚃", "🚟", "🚠", "🚡", "⛴️", "🛥️", "🚤", "⛵", "🛶", "🚢", "⚓", "🛟", "⛽", "🚨", "🚥", "🚦", "🛑", "🚧", "⚠️", "🚸", "⛔", "🚫", "🚳", "🚭", "🚯", "🚱", "🚷", "📵", "🔞", "☢️", "☣️"]
  },
  symbols: {
    name: "סמלים ואותיות",
    icons: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "☮️", "✝️", "☪️", "🕉️", "☸️", "✡️", "🔯", "🕎", "☯️", "☦️", "🛐", "⛎", "♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓", "🆔", "⚛️", "🉑", "☢️", "☣️", "📴", "📳", "🈶", "🈚", "🈸", "🈺", "🈷️", "✴️", "🆚", "💮", "🉐", "㊙️", "㊗️", "🈴", "🈵", "🈹", "🈲", "🅰️", "🅱️", "🆎", "🆑", "🅾️", "🆘", "❌", "⭕", "🛑", "⛔", "📛", "🚫", "💯", "💢", "♨️", "🚷", "🚯", "🚳", "🚱", "🔞", "📵", "🚭"]
  }
};

export default function IconPicker({ value, onChange, onClose }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("business");

  const filteredIcons = iconCategories[selectedCategory].icons.filter(icon =>
    !searchTerm || icon.includes(searchTerm)
  );

  const allIcons = Object.values(iconCategories).flatMap(cat => cat.icons);
  const searchResults = searchTerm 
    ? allIcons.filter(icon => icon.includes(searchTerm))
    : [];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Smile className="w-5 h-5" />
              בחירת אייקון
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
          </div>
          
          {/* חיפוש */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="חפש אייקון..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>
        </CardHeader>

        <CardContent className="overflow-y-auto">
          {searchTerm ? (
            // תוצאות חיפוש
            <div>
              <h3 className="font-semibold mb-3">תוצאות חיפוש ({searchResults.length})</h3>
              <div className="grid grid-cols-8 md:grid-cols-12 gap-2">
                {searchResults.map((icon, index) => (
                  <Button
                    key={index}
                    variant={value === icon ? "default" : "ghost"}
                    className={`p-3 h-12 text-xl hover:scale-110 transition-all duration-200 ${
                      value === icon ? 'ring-2 ring-cyan-500 bg-cyan-100' : ''
                    }`}
                    onClick={() => {
                      onChange(icon);
                      onClose();
                    }}
                  >
                    {icon}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            // קטגוריות
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
              <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
                {Object.entries(iconCategories).map(([key, category]) => (
                  <TabsTrigger key={key} value={key} className="text-xs">
                    {category.name.split(' ')[0]}
                  </TabsTrigger>
                ))}
              </TabsList>

              {Object.entries(iconCategories).map(([key, category]) => (
                <TabsContent key={key} value={key} className="mt-4">
                  <div className="mb-3">
                    <h3 className="font-semibold">{category.name}</h3>
                    <p className="text-sm text-gray-600">{category.icons.length} אייקונים</p>
                  </div>
                  
                  <div className="grid grid-cols-8 md:grid-cols-12 gap-2 max-h-96 overflow-y-auto">
                    {category.icons.map((icon, index) => (
                      <Button
                        key={index}
                        variant={value === icon ? "default" : "ghost"}
                        className={`p-3 h-12 text-xl hover:scale-110 transition-all duration-200 ${
                          value === icon ? 'ring-2 ring-cyan-500 bg-cyan-100' : ''
                        }`}
                        onClick={() => {
                          onChange(icon);
                          onClose();
                        }}
                      >
                        {icon}
                      </Button>
                    ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}