
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Check, X, MenuIcon, Tag } from 'lucide-react';

const renderFieldValue = (fieldConfig, value) => {
    const fieldType = fieldConfig?.type;
    const fieldId = fieldConfig?.id;

    if (value === null || value === undefined || value === '') {
        return <p className="text-sm text-slate-500">לא צוין</p>;
    }

    // Handle new menu format (still kept here for general `renderFieldValue` usage outside of SpecialFieldsDisplay direct rendering)
    if (fieldType === 'menu' || fieldId === 'menu') {
        
        if (Array.isArray(value) && value.length > 0) {
            return (
                <div className="space-y-4">
                    {value.map((category, catIndex) => (
                        <div key={catIndex} className="border border-slate-200 rounded-lg overflow-hidden">
                            <div className="bg-slate-100 px-4 py-2">
                                <h4 className="font-semibold text-slate-800">{category.name}</h4>
                            </div>
                            <div className="p-4 space-y-3">
                                {category.items?.map((item, itemIndex) => (
                                    <div key={itemIndex} className="flex items-start gap-4">
                                        {item.image && (
                                            <img
                                                src={item.image}
                                                alt={item.name}
                                                className="w-12 h-12 object-cover rounded-lg"
                                            />
                                        )}
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <span className="font-medium text-slate-800">{item.name}</span>
                                                <Badge variant="secondary" className="bg-green-100 text-green-800">
                                                    {item.price}
                                                </Badge>
                                            </div>
                                            {item.note && (
                                                <p className="text-sm text-slate-600 mt-1">{item.note}</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            );
        }
        
        return <p className="text-sm text-slate-500">תפריט ריק</p>;
    }

    // Handle old pricing_list format for backward compatibility
    if (fieldType === 'pricing_list' || fieldId === 'pricing_list' || fieldId === 'price_list') {
        
        if (Array.isArray(value)) {
            if (value.length > 0 && value[0] && value[0].items && Array.isArray(value[0].items)) {
                // Convert old format to new for display
                const convertedMenu = [{
                    name: 'מחירון',
                    items: value[0].items.map(item => ({
                        name: item.name || '',
                        price: item.price || '',
                        note: item.note || '',
                        image: item.image_url || ''
                    }))
                }];
                return renderFieldValue({ type: 'menu' }, convertedMenu);
            }
            const convertedMenu = [{
                name: 'מחירון',
                items: value.map(item => ({
                    name: item.name || '',
                    price: item.price || '',
                    note: item.note || '',
                    image: item.image_url || item.image || ''
                }))
            }];
            return renderFieldValue({ type: 'menu' }, convertedMenu);
        }
        
        if (typeof value === 'string') {
            try {
                const parsed = JSON.parse(value);
                return renderFieldValue({ type: 'pricing_list' }, parsed); // Recursively call with parsed array
            } catch (e) {
                console.error('❌ Failed to parse pricing_list in renderFieldValue:', e);
            }
        }
        
        return <p className="text-sm text-red-500">נתוני מחירון לא תקינים</p>;
    }

    // Check by type or specific ID for built-in fields
    if (fieldType === 'tags_input' || fieldId === 'tags') {
        if (Array.isArray(value) && value.length > 0) {
            return (
                <div className="flex flex-wrap gap-2">
                    {value.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="bg-indigo-100 text-indigo-800 px-3 py-1 text-sm font-medium hover:bg-indigo-200 cursor-pointer">
                            {tag}
                        </Badge>
                    ))}
                </div>
            );
        }
    }

    if (fieldType === 'boolean') {
        return (
            <Badge variant={value ? 'default' : 'secondary'} className={value ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-700'}>
                {value ? <Check className="w-4 h-4 mr-1" /> : <X className="w-4 h-4 mr-1" />}
                {value ? 'כן' : 'לא'}
            </Badge>
        );
    }
    
    if (Array.isArray(value)) {
        return (
             <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                {value.join(', ')}
            </p>
        );
    }

    if (typeof value === 'object' && value !== null) {
        return <p className="text-sm text-slate-500">[מידע מורכב - לא ניתן להצגה]</p>;
    }

    return (
        <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
            {String(value)}
        </p>
    );
};

const findFieldConfig = (fieldId, config) => {
    if (!config || !config.steps) return null;
    for (const step of config.steps) {
        if (step.fields) {
            const field = step.fields.find(f => f.id === fieldId);
            if (field) return field;
        }
    }
    return null;
};

const MenuDisplay = ({ menu }) => {
  if (!Array.isArray(menu) || menu.length === 0) {
      return null;
  }

  return (
    <section className="space-y-6" aria-labelledby="menu-heading">
      <h3 id="menu-heading" className="text-xl font-bold text-slate-800 flex items-center gap-2">
        <MenuIcon className="w-6 h-6 text-indigo-600" aria-hidden="true" />
        מחירון / תפריט
      </h3>
      
      <div className="space-y-4">
        {menu.map((category, categoryIdx) => (
          <article key={category.id || categoryIdx} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <header className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-4 border-b border-slate-200">
              <h4 className="text-lg font-bold text-slate-800">{category.name || 'ללא שם'}</h4>
            </header>
            
            <div className="p-6">
              {category.items && category.items.length > 0 ? (
                <ul className="grid gap-4" role="list">
                  {category.items.map((item, itemIdx) => (
                    <li key={item.id || itemIdx} className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                      {item.image && (
                        <div className="flex-shrink-0">
                          <img
                            src={item.image}
                            alt={`תמונה של ${item.name}`}
                            className="w-16 h-16 object-cover rounded-lg border"
                          />
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <h5 className="font-semibold text-slate-800 text-base leading-tight">
                              {item.name || 'ללא שם'}
                            </h5>
                            {item.note && (
                              <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                                {item.note}
                              </p>
                            )}
                          </div>
                          
                          {item.price && (
                            <div className="flex-shrink-0">
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-green-100 text-green-800 border border-green-200" aria-label={`מחיר: ${item.price}`}>
                                {item.price}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-8 text-slate-500" role="status">
                  <MenuIcon className="w-12 h-12 mx-auto mb-3 opacity-30" aria-hidden="true" />
                  <p>אין פריטים בקטגוריה זו</p>
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

const TagsDisplay = ({ tags }) => {
  if (!Array.isArray(tags) || tags.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4" aria-labelledby="tags-heading">
      <h3 id="tags-heading" className="text-xl font-bold text-slate-800 flex items-center gap-2">
        <Tag className="w-6 h-6 text-indigo-600" aria-hidden="true" />
        תגיות
      </h3>
      <ul className="flex flex-wrap gap-2" role="list" aria-label="רשימת תגיות">
        {tags.map((tag, index) => (
          <li key={index}>
            <Badge 
              variant="secondary" 
              className="bg-indigo-100 text-indigo-800 px-3 py-2 text-sm font-medium hover:bg-indigo-200 cursor-pointer rounded-full"
              role="button"
              tabIndex={0}>
              #{tag}
            </Badge>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default function SpecialFieldsDisplay({ 
  specialFields = {}, 
  categoryId,
  subcategoryId
}) {
  
  if (!specialFields || Object.keys(specialFields).length === 0) {
    return null;
  }

  // Process menu data
  let menuData = null;
  if (specialFields.menu) {
      menuData = specialFields.menu;
  } else if (specialFields.pricing_list || specialFields.price_list) {
      const value = specialFields.pricing_list || specialFields.price_list;
      try {
          let parsedValue = value;
          if (typeof value === 'string') {
              parsedValue = JSON.parse(value);
          }

          if (Array.isArray(parsedValue)) {
              if (parsedValue.length > 0 && parsedValue[0] && parsedValue[0].items && Array.isArray(parsedValue[0].items)) {
                  menuData = [{
                      name: 'מחירון',
                      items: parsedValue[0].items.map(item => ({
                          name: item.name || '',
                          price: item.price || '',
                          note: item.note || '',
                          image: item.image_url || ''
                      }))
                  }];
              } else {
                  menuData = [{
                      name: 'מחירון',
                      items: parsedValue.map(item => ({
                          name: item.name || '',
                          price: item.price || '',
                          note: item.note || '',
                          image: item.image_url || item.image || ''
                      }))
                  }];
              }
          }
      } catch (e) {
          console.error('❌ Failed to parse pricing_list in SpecialFieldsDisplay (for MenuDisplay):', e);
      }
  }

  // Process tags data
  const tagsData = specialFields.tags;

  // Process other fields (dynamic)
  const otherFields = Object.entries(specialFields)
    .filter(([key, value]) => !['menu', 'pricing_list', 'price_list', 'tags'].includes(key))
    .filter(([key, value]) => value !== null && value !== undefined && value !== '');

  return (
    <div className="space-y-8">
      {/* Menu Display */}
      {menuData && <MenuDisplay menu={menuData} />}

      {/* Tags Display */}
      {tagsData && <TagsDisplay tags={tagsData} />}

      {/* Other Fields Display */}
      {otherFields.length > 0 && (
        <section className="space-y-4" aria-labelledby="additional-info-heading">
          <h3 id="additional-info-heading" className="text-xl font-bold text-slate-800">מידע נוסף</h3>
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            {otherFields.map(([fieldKey, fieldValue]) => (
              <div key={fieldKey} className="border-b border-slate-100 last:border-b-0 pb-4 last:pb-0">
                <h4 className="font-semibold text-slate-800 mb-2 capitalize">
                  {fieldKey.replace(/_/g, ' ')}
                </h4>
                {renderFieldValue({ id: fieldKey }, fieldValue)}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
