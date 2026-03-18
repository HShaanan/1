import MenuItem from "@/components/business/MenuItem";

export default function MenuSection({
  menuCategories,
  isBlackTheme,
  scrollToCategory,
  menuSectionRefs,
  theme,
  handleOpenModifications,
}) {
  if (!menuCategories || menuCategories.length === 0) return null;
  return (
    <>
      {/* Tab navigation */}
      <div className="bg-transparent py-4 sticky top-0 z-10 border-b">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs text-slate-500 italic">
            * התמונות להמחשה בלבד
          </div>
        </div>
        <div className="bg-transparent pb-2 flex items-center space-x-3 overflow-x-auto hide-scrollbar">
          {menuCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => scrollToCategory(category.id)}
              className={`text-slate-50 px-6 py-3 text-sm font-semibold rounded-full whitespace-nowrap transition-all duration-300 hover:scale-105 shadow-md hover:bg-gray-50 hover:shadow-lg border ${
                isBlackTheme
                  ? 'bg-red-600 hover:bg-red-500 border-red-500'
                  : 'border-gray-200'
              }`}
              style={!isBlackTheme ? { backgroundColor: 'var(--theme-primary)', color: 'white' } : {}}
              onMouseEnter={(e) => {
                if (!isBlackTheme) e.currentTarget.style.color = 'var(--theme-primary-hover)';
              }}
              onMouseLeave={(e) => {
                if (!isBlackTheme) e.currentTarget.style.color = 'white';
              }}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Menu items */}
      <div className="space-y-12">
        {menuCategories.map((category) => (
          <div key={category.id} ref={(el) => menuSectionRefs.current[category.id] = el}>
            <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <div className="rounded-full w-2 h-8" style={{ backgroundColor: 'var(--theme-primary-hover)' }} />
              {category.name}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {category.items?.map((item) => (
                <MenuItem
                  key={item.id || item.name}
                  item={{ ...item, categoryName: category.name }}
                  theme={theme}
                  isBlackTheme={isBlackTheme}
                  onOpenModifications={handleOpenModifications}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
