import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ShoppingCart, ChevronRight, ChevronLeft, Truck, Store } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function OrderSidebar({ 
  businessPage,
  cart,
  onUpdateQuantity,
  onRemoveFromCart,
  onToggleAddon,
  onClearCart,
  theme,
  businessOpenStatus
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [deliveryType, setDeliveryType] = useState('pickup'); // 'delivery' or 'pickup'
  const navigate = useNavigate();
  const DELIVERY_FEE = 15;

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
    const itemsTotal = cart.reduce((sum, item) => sum + getItemTotal(item), 0);
    return deliveryType === 'delivery' ? itemsTotal + DELIVERY_FEE : itemsTotal;
  };

  const handleContinueToCheckout = () => {
    const cartData = {
      items: cart,
      deliveryType,
      deliveryFee: deliveryType === 'delivery' ? DELIVERY_FEE : 0,
      businessPageId: businessPage?.id
    };
    navigate(createPageUrl(`OrderCheckout?cart=${encodeURIComponent(JSON.stringify(cartData))}`));
  };

  // כפתור מצומצם
  if (!isExpanded) {
    return (
      <div className="fixed left-4 bottom-24 z-40">
        <button
          onClick={() => setIsExpanded(true)}
          className="relative text-white p-4 rounded-full shadow-2xl transition-all hover:scale-110 hover:opacity-90"
          style={{
            background: `linear-gradient(135deg, ${theme?.colors?.primary || '#6366f1'}, ${theme?.colors?.primaryHover || '#4f46e5'})`
          }}
        >
          <ShoppingCart className="w-6 h-6" />
          {cart.length > 0 && (
            <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-6 h-6 flex items-center justify-center rounded-full">
              {cart.length}
            </Badge>
          )}
        </button>
      </div>
    );
  }

  return (
    <div 
      className="fixed left-4 bottom-24 z-40 w-80 bg-white shadow-2xl rounded-2xl border-2 flex flex-col overflow-hidden"
      style={{ 
        maxHeight: '70vh',
        borderColor: theme?.colors?.primary || '#6366f1'
      }}
      dir="rtl"
    >
      {/* כותרת */}
      <div 
        className="text-white p-4 flex items-center justify-between"
        style={{
          background: `linear-gradient(135deg, ${theme?.colors?.primary || '#6366f1'}, ${theme?.colors?.primaryHover || '#4f46e5'})`
        }}
      >
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5" />
          <div>
            <h3 className="font-bold">הזמנה</h3>
            <p className="text-xs opacity-90">{cart.length} פריטים</p>
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(false)}
          className="hover:bg-white/20 p-2 rounded-lg transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* תוכן */}
      <div className="flex-1 overflow-y-auto p-4">
        {cart.length === 0 ? (
          <div className="text-center py-8">
            <ShoppingCart className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500 text-sm">הסל ריק</p>
          </div>
        ) : (
          <>
            {/* סוג משלוח */}
            <div className="mb-4 p-3 bg-slate-50 rounded-lg">
              <div className="text-sm font-semibold text-slate-700 mb-2">סוג משלוח:</div>
              <div className="flex gap-2">
                <button
                  onClick={() => setDeliveryType('pickup')}
                  className={`flex-1 p-2 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${
                    deliveryType === 'pickup'
                      ? 'text-white'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                  style={deliveryType === 'pickup' ? {
                    backgroundColor: theme?.colors?.primary || '#6366f1',
                    borderColor: theme?.colors?.primary || '#6366f1'
                  } : {}}
                >
                  <Store className="w-4 h-4" />
                  <span className="text-sm font-medium">איסוף עצמי</span>
                </button>
                <button
                  onClick={() => setDeliveryType('delivery')}
                  className={`flex-1 p-2 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${
                    deliveryType === 'delivery'
                      ? 'text-white'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                  style={deliveryType === 'delivery' ? {
                    backgroundColor: theme?.colors?.primary || '#6366f1',
                    borderColor: theme?.colors?.primary || '#6366f1'
                  } : {}}
                >
                  <Truck className="w-4 h-4" />
                  <span className="text-sm font-medium">משלוח</span>
                </button>
              </div>
              {deliveryType === 'delivery' && (
                <div className="mt-2 text-xs text-slate-600 bg-amber-50 border border-amber-200 rounded p-2">
                  💡 דמי משלוח: {DELIVERY_FEE} ₪
                </div>
              )}
            </div>

            {/* פריטים */}
            <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
              {cart.map((item) => (
                <div key={item.id} className="bg-slate-50 rounded-lg p-2 border text-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-800 truncate">
                        {businessPage?.business_name || businessPage?.display_title} - {item.itemName || item.name || 'פריט'}
                      </div>
                      {item.selectedAddons && item.selectedAddons.length > 0 && (
                        <div className="text-xs text-slate-600 mt-0.5 truncate">
                          {item.selectedAddons.map(a => a.name).join(', ')}
                        </div>
                      )}
                    </div>
                    <div className="text-left mr-2">
                      <div className="text-xs text-slate-500">× {item.quantity}</div>
                      <div className="font-bold text-green-600 text-sm">
                        {getItemTotal(item).toFixed(2)} ₪
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* סיכום */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm text-slate-600">
                <span>סה"כ פריטים:</span>
                <span>{cart.reduce((sum, item) => sum + getItemTotal(item), 0).toFixed(2)} ₪</span>
              </div>
              {deliveryType === 'delivery' && (
                <div className="flex justify-between text-sm text-slate-600">
                  <span>דמי משלוח:</span>
                  <span>{DELIVERY_FEE} ₪</span>
                </div>
              )}
              <div className="pt-2 border-t-2 flex justify-between items-center">
                <span className="font-bold text-slate-800">סה"כ:</span>
                <span className="font-bold text-2xl text-green-700">{getTotalPrice().toFixed(2)} ₪</span>
              </div>
            </div>

            {/* התראה אם סגור */}
            {businessOpenStatus && !businessOpenStatus.isOpen && (
              <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-center">
                <div className="text-red-700 font-semibold text-sm">🔴 העסק סגור כעת</div>
                <div className="text-red-600 text-xs mt-1">{businessOpenStatus.message}</div>
              </div>
            )}

            {/* כפתור המשך */}
            <Button
              onClick={handleContinueToCheckout}
              disabled={businessOpenStatus && !businessOpenStatus.isOpen}
              className="w-full bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-400 disabled:cursor-not-allowed"
              title={businessOpenStatus && !businessOpenStatus.isOpen ? 'לא ניתן להזמין כשהעסק סגור' : ''}
            >
              {businessOpenStatus && !businessOpenStatus.isOpen ? 'העסק סגור' : 'המשך להזמנה'}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}