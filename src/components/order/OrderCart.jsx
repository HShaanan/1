import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ShoppingCart, Plus, Minus, Trash2, Send } from 'lucide-react';

export default function OrderCart({ 
  businessPage, 
  isOpen, 
  onClose 
}) {
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [step, setStep] = useState('menu'); // 'menu' | 'details' | 'sent'

  // הוספת פריט לסל
  const addToCart = (categoryName, item) => {
    const cartItem = {
      id: `${Date.now()}-${Math.random()}`,
      categoryName,
      itemName: item.name,
      basePrice: parseFloat(item.price.replace(/[^\d.]/g, '')) || 0,
      quantity: 1,
      selectedAddons: [],
      availableAddons: item.addons || []
    };
    setCart([...cart, cartItem]);
  };

  // עדכון כמות
  const updateQuantity = (cartItemId, delta) => {
    setCart(cart.map(item => {
      if (item.id === cartItemId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  // הוספה/הסרה של תוספת
  const toggleAddon = (cartItemId, addon) => {
    setCart(cart.map(item => {
      if (item.id === cartItemId) {
        const exists = item.selectedAddons.find(a => a.name === addon.name);
        if (exists) {
          return {
            ...item,
            selectedAddons: item.selectedAddons.filter(a => a.name !== addon.name)
          };
        } else {
          return {
            ...item,
            selectedAddons: [...item.selectedAddons, { ...addon }]
          };
        }
      }
      return item;
    }));
  };

  // הסרה מהסל
  const removeFromCart = (cartItemId) => {
    setCart(cart.filter(item => item.id !== cartItemId));
  };

  // חישוב מחיר פריט
  const getItemTotal = (cartItem) => {
    const basePrice = parseFloat(String(cartItem.basePrice || cartItem.price || 0).replace(/[^\d.]/g, '')) || 0;
    const addonsTotal = (cartItem.selectedAddons || []).reduce((sum, addon) => {
      const price = parseFloat(String(addon.price || 0).replace(/[^\d.]/g, '')) || 0;
      return sum + price;
    }, 0);
    const quantity = parseInt(cartItem.quantity) || 1;
    return (basePrice + addonsTotal) * quantity;
  };

  // חישוב סך הכל
  const getTotalPrice = () => {
    return cart.reduce((sum, item) => sum + getItemTotal(item), 0);
  };

  // שליחת הזמנה
  const sendOrder = () => {
    if (!customerName || !customerPhone) {
      alert('נא למלא שם וטלפון');
      return;
    }

    const orderText = formatOrderForWhatsApp();
    const phone = (businessPage.whatsapp_phone || businessPage.contact_phone || '').replace(/\D/g, '');
    const whatsappUrl = `https://wa.me/${phone.replace(/^0/, '972')}?text=${encodeURIComponent(orderText)}`;
    
    window.open(whatsappUrl, '_blank');
    setStep('sent');
    
    // סגירה אוטומטית אחרי 3 שניות
    setTimeout(() => {
      onClose();
      resetCart();
    }, 3000);
  };

  const formatOrderForWhatsApp = () => {
    let text = `🛒 *הזמנה חדשה*\n\n`;
    text += `👤 *לקוח:* ${customerName}\n`;
    text += `📞 *טלפון:* ${customerPhone}\n`;
    if (deliveryAddress) {
      text += `📍 *כתובת למשלוח:* ${deliveryAddress}\n`;
    }
    text += `\n━━━━━━━━━━━━━━\n\n`;

    cart.forEach((item, index) => {
      text += `${index + 1}. *${item.itemName}*\n`;
      text += `   כמות: ${item.quantity}\n`;
      text += `   מחיר בסיס: ${item.basePrice} ₪\n`;
      
      if (item.selectedAddons.length > 0) {
        text += `   תוספות:\n`;
        item.selectedAddons.forEach(addon => {
          text += `   • ${addon.name} (+${addon.price})\n`;
        });
      }
      
      text += `   *סה"כ פריט: ${getItemTotal(item).toFixed(2)} ₪*\n\n`;
    });

    text += `━━━━━━━━━━━━━━\n\n`;
    text += `💰 *סה"כ להזמנה: ${getTotalPrice().toFixed(2)} ₪*\n`;
    
    if (notes) {
      text += `\n📝 *הערות:* ${notes}\n`;
    }

    return text;
  };

  const resetCart = () => {
    setCart([]);
    setCustomerName('');
    setCustomerPhone('');
    setDeliveryAddress('');
    setNotes('');
    setStep('menu');
  };

  const menuCategories = businessPage?.special_fields?.menu || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <ShoppingCart className="w-6 h-6" />
            ביצוע הזמנה - {businessPage?.business_name}
          </DialogTitle>
        </DialogHeader>

        {step === 'menu' && (
          <div className="space-y-6">
            {/* סל קניות עליון */}
            {cart.length > 0 && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border-2 border-green-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-green-700" />
                    <span className="font-bold text-green-900">הסל שלי ({cart.length} פריטים)</span>
                  </div>
                  <Button
                    onClick={() => setStep('details')}
                    className="bg-green-600 hover:bg-green-700 text-white gap-2"
                  >
                    <Send className="w-4 h-4" />
                    לסיום הזמנה
                  </Button>
                </div>

                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {cart.map((item) => (
                    <div key={item.id} className="bg-white p-3 rounded-lg border flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-slate-800">{item.itemName}</div>
                        {item.selectedAddons.length > 0 && (
                          <div className="text-xs text-slate-600 mt-1">
                            תוספות: {item.selectedAddons.map(a => a.name).join(', ')}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 bg-slate-100 rounded-lg">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="p-1 hover:bg-slate-200 rounded"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2 text-sm font-semibold">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="p-1 hover:bg-slate-200 rounded"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="text-sm font-bold text-green-700 w-20 text-left">
                          {getItemTotal(item).toFixed(2)} ₪
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="p-1 hover:bg-red-100 rounded text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-3 pt-3 border-t-2 border-green-300 flex justify-between items-center">
                  <span className="font-bold text-lg text-slate-800">סה"כ:</span>
                  <span className="font-bold text-2xl text-green-700">{getTotalPrice().toFixed(2)} ₪</span>
                </div>
              </div>
            )}

            {/* תפריט */}
            <div className="space-y-4">
              <h3 className="font-bold text-lg text-slate-800">בחר פריטים מהתפריט</h3>
              
              {menuCategories.length === 0 && (
                <div className="text-center p-8 bg-slate-50 rounded-lg">
                  <p className="text-slate-500">אין תפריט זמין להזמנה</p>
                </div>
              )}

              {menuCategories.map((category) => (
                <div key={category.id} className="border rounded-xl overflow-hidden">
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-4 py-3 border-b">
                    <h4 className="font-bold text-slate-800">{category.name}</h4>
                  </div>
                  
                  <div className="p-4 grid gap-3">
                    {(category.items || []).map((item) => (
                      <div key={item.id} className="bg-white border rounded-lg p-3 hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-3">
                          {item.image && (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                            />
                          )}
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="font-semibold text-slate-800">{item.name}</div>
                                {item.note && (
                                  <div className="text-sm text-slate-600 mt-1">{item.note}</div>
                                )}
                                {item.addons && item.addons.length > 0 && (
                                  <div className="text-xs text-indigo-600 mt-1">
                                    ✨ זמין עם תוספות
                                  </div>
                                )}
                              </div>
                              <div className="text-left">
                                <div className="font-bold text-green-600">{item.price}</div>
                                <Button
                                  onClick={() => addToCart(category.name, item)}
                                  size="sm"
                                  className="mt-2 bg-indigo-600 hover:bg-indigo-700 gap-1"
                                >
                                  <Plus className="w-3 h-3" />
                                  הוסף
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* תוספות זמינות */}
                        {cart.some(c => c.itemName === item.name) && item.addons && item.addons.length > 0 && (
                          <div className="mt-3 pt-3 border-t bg-slate-50 -mx-3 -mb-3 p-3 rounded-b-lg">
                            <div className="text-xs font-semibold text-slate-700 mb-2">תוספות זמינות:</div>
                            <div className="flex flex-wrap gap-2">
                              {item.addons.map((addon) => {
                                const cartItem = cart.find(c => c.itemName === item.name);
                                const isSelected = cartItem?.selectedAddons.some(a => a.name === addon.name);
                                
                                return (
                                  <button
                                    key={addon.id}
                                    onClick={() => toggleAddon(cartItem.id, addon)}
                                    className={`text-xs px-3 py-1.5 rounded-full border-2 transition-all ${
                                      isSelected
                                        ? 'bg-indigo-600 text-white border-indigo-600 font-semibold'
                                        : 'bg-white text-slate-700 border-slate-300 hover:border-indigo-400'
                                    }`}
                                  >
                                    {addon.name} (+{addon.price})
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 'details' && (
          <div className="space-y-6">
            {/* סיכום הזמנה */}
            <div className="bg-slate-50 p-4 rounded-xl">
              <h3 className="font-bold text-lg mb-3">סיכום ההזמנה</h3>
              <div className="space-y-2">
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <div>
                      <span className="font-semibold">{item.itemName}</span>
                      {item.selectedAddons.length > 0 && (
                        <span className="text-slate-600"> + {item.selectedAddons.map(a => a.name).join(', ')}</span>
                      )}
                      <span className="text-slate-500"> × {item.quantity}</span>
                    </div>
                    <div className="font-semibold">{getItemTotal(item).toFixed(2)} ₪</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t flex justify-between items-center">
                <span className="font-bold text-lg">סה"כ:</span>
                <span className="font-bold text-2xl text-green-600">{getTotalPrice().toFixed(2)} ₪</span>
              </div>
            </div>

            {/* פרטי לקוח */}
            <div className="space-y-4">
              <h3 className="font-bold text-lg">פרטים ליצירת קשר</h3>
              
              <div>
                <Label>שם מלא *</Label>
                <Input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="הזן שם מלא"
                  className="mt-1"
                />
              </div>

              <div>
                <Label>מספר טלפון *</Label>
                <Input
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="05X-XXXXXXX"
                  className="mt-1"
                />
              </div>

              <div>
                <Label>כתובת למשלוח (אופציונלי)</Label>
                <Input
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="רחוב, מספר בית, עיר"
                  className="mt-1"
                />
              </div>

              <div>
                <Label>הערות (אופציונלי)</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="הערות מיוחדות להזמנה..."
                  rows={3}
                  className="mt-1"
                />
              </div>
            </div>

            {/* כפתורי פעולה */}
            <div className="flex gap-3">
              <Button
                onClick={() => setStep('menu')}
                variant="outline"
                className="flex-1"
              >
                חזור לתפריט
              </Button>
              <Button
                onClick={sendOrder}
                className="flex-1 bg-green-600 hover:bg-green-700 gap-2"
              >
                <Send className="w-4 h-4" />
                שלח הזמנה בוואטסאפ
              </Button>
            </div>
          </div>
        )}

        {step === 'sent' && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Send className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">ההזמנה נשלחה!</h3>
            <p className="text-slate-600">וואטסאפ נפתח עם פרטי ההזמנה</p>
            <p className="text-sm text-slate-500 mt-4">חלון זה ייסגר אוטומטית...</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}