import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { 
  ArrowRight, ShoppingCart, User, Phone, Mail,
  MessageCircle, Truck, Store, CreditCard, Shield, Loader2
} from "lucide-react";

export default function OrderCheckoutPage() {
  const [cart, setCart] = useState([]);
  const [deliveryType, setDeliveryType] = useState('pickup');
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [businessPage, setBusinessPage] = useState(null);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [deliveryStreet, setDeliveryStreet] = useState("");
  const [deliveryHouseNumber, setDeliveryHouseNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const navigate = useNavigate();

  const getItemTotal = (item) => {
    const basePrice = parseFloat(String(item.basePrice || item.price || 0).replace(/[^\d.]/g, '')) || 0;
    const addonsTotal = item.selectedAddons?.reduce((sum, addon) => {
      const price = parseFloat(String(addon.price || 0).replace(/[^\d.]/g, '')) || 0;
      return sum + price;
    }, 0) || 0;
    const quantity = parseInt(item.quantity) || 1;
    return (basePrice + addonsTotal) * quantity;
  };

  const getSubtotal = () => {
    return cart.reduce((sum, item) => sum + getItemTotal(item), 0);
  };

  const getTotalAmount = () => {
    const subtotal = getSubtotal();
    const delivery = deliveryType === 'delivery' ? (parseFloat(deliveryFee) || 0) : 0;
    return subtotal + delivery;
  };

  useEffect(() => {
    const checkAuthAndLoadData = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        // Pre-fill user data
        if (currentUser?.full_name) setCustomerName(currentUser.full_name);
        if (currentUser?.email) setCustomerEmail(currentUser.email);
        if (currentUser?.phone) setCustomerPhone(currentUser.phone);
      } catch (error) {
        // User not logged in - redirect to login
        console.log("User not logged in, redirecting...");
        base44.auth.redirectToLogin(window.location.href);
        return;
      } finally {
        setAuthChecked(true);
      }
      
      // Load cart data
      const urlParams = new URLSearchParams(window.location.search);
      const cartData = urlParams.get('cart');
      if (cartData) {
        try {
          const parsed = JSON.parse(decodeURIComponent(cartData));
          setCart(parsed.items || []);
          setDeliveryType(parsed.deliveryType || 'pickup');
          setDeliveryFee(parsed.deliveryFee || 0);
          
          if (parsed.businessPageId) {
            loadBusinessPage(parsed.businessPageId);
          }
        } catch (error) {
          console.error("Error parsing cart data:", error);
        }
      }
    };
    
    checkAuthAndLoadData();
  }, []);

  const loadBusinessPage = async (id) => {
    try {
      const pages = await base44.entities.BusinessPage.filter({ id });
      if (pages && pages.length > 0) {
        setBusinessPage(pages[0]);
      }
    } catch (error) {
      console.error("Error loading business page:", error);
    }
  };

  const theme = businessPage?.theme_settings?.custom_colors || {
    primary: '#6366f1',
    primaryHover: '#4f46e5',
    primaryLight: '#e0e7ff',
    primaryDark: '#3730a3'
  };

  const handleProceedToPayment = async () => {
    // Validation
    if (!customerName.trim() || !customerPhone.trim() || !customerEmail.trim()) {
      alert("אנא מלא את כל הפרטים (שם, טלפון ואימייל)");
      return;
    }
    
    if (deliveryType === 'delivery' && (!deliveryStreet.trim() || !deliveryHouseNumber.trim())) {
      alert("אנא מלא את כתובת המשלוח");
      return;
    }

    if (cart.length === 0) {
      alert("העגלה ריקה");
      return;
    }

    setIsSubmitting(true);

    try {
      const orderNumber = Math.floor(100 + Math.random() * 900);
      const fullAddress = deliveryType === 'delivery' 
        ? `${deliveryStreet.trim()} ${deliveryHouseNumber.trim()}, ביתר עילית`
        : null;

      // Prepare items for Sumit payment page
      const businessDisplayName = businessPage?.business_name || businessPage?.display_title || 'העסק';
      const paymentItems = cart.map(item => {
        // שם הפריט (ללא שם העסק - יתווסף ב-backend)
        let itemName = item.itemName || item.name || 'פריט';

        // Add addons to description
        if (item.selectedAddons && item.selectedAddons.length > 0) {
          const addonsText = item.selectedAddons.map(a => a.name).join(', ');
          itemName += ` (${addonsText})`;
        }

        return {
          name: itemName,
          description: item.notes || '',
          price: getItemTotal(item) / (item.quantity || 1), // Unit price including addons
          quantity: item.quantity || 1
        };
      });

      console.log('📦 Payment items prepared:', paymentItems);
      console.log('🏪 Business name:', businessDisplayName);

      // Prepare order data to save in localStorage (will be created after successful payment)
      const orderData = {
        business_page_id: businessPage?.id,
        order_number: orderNumber,
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        customer_address: fullAddress,
        items: cart.map(item => ({
          menu_item_id: String(item.id || item.menu_item_id || 'no-id'),
          menu_item_name: item.itemName || '',
          quantity: item.quantity || 1,
          price: item.basePrice || 0,
          selected_modifications: item.selectedAddons || [],
          item_final_price: getItemTotal(item)
        })),
        total_amount: getTotalAmount(),
        order_date: new Date().toISOString().split('T')[0],
        notes: notes.trim() || null,
        delivery_type: deliveryType,
        delivery_fee: deliveryType === 'delivery' ? deliveryFee : 0
      };

      // Save order data to localStorage (will be used after payment success)
      localStorage.setItem('pendingOrder', JSON.stringify(orderData));

      // Create payment page via Sumit Redirect API
      const { data } = await base44.functions.invoke('createPaymentPage', {
        items: paymentItems,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim() || undefined,
        deliveryType,
        deliveryFee: deliveryType === 'delivery' ? deliveryFee : 0,
        deliveryAddress: fullAddress,
        businessPageId: businessPage?.id,
        businessName: businessDisplayName,
        orderId: `order_${orderNumber}`,
        successUrl: `${window.location.origin}/OrderSuccess`,
        cancelUrl: window.location.href
      });

      console.log('📤 Sent to createPaymentPage with businessName:', businessDisplayName);

      console.log("Payment page response:", data);

      if (data?.success && data?.redirectUrl) {
        // Redirect to Sumit payment page
        window.location.href = data.redirectUrl;
      } else {
        throw new Error(data?.error || 'שגיאה ביצירת דף התשלום');
      }

    } catch (error) {
      console.error('Error creating payment:', error);
      alert('שגיאה: ' + (error.message || 'אנא נסה שוב'));
      setIsSubmitting(false);
    }
  };

  // Show loading while checking auth
  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-indigo-600" />
          <p className="text-gray-600">בודק התחברות...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8" dir="rtl" style={{ backgroundColor: theme.primaryLight + '20' }}>
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center font-medium mb-4 hover:opacity-80"
            style={{ color: theme.primary }}
          >
            <ArrowRight className="w-4 h-4 ml-2" />
            חזור לתפריט
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">אישור הזמנה</h1>
          <p className="text-gray-600">בדוק את פרטי ההזמנה ומלא את הפרטים שלך</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* סיכום הזמנה */}
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-6 h-6" style={{ color: theme.primary }} />
                סיכום ההזמנה
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* סוג משלוח */}
              <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: theme.primaryLight + '40' }}>
                <div className="flex gap-3 mb-2">
                  <div 
                    className={`flex-1 p-3 rounded-lg border-2 transition-all flex items-center justify-center gap-2 cursor-default ${
                      deliveryType === 'pickup' ? 'font-semibold' : 'opacity-60'
                    }`}
                    style={{
                      borderColor: deliveryType === 'pickup' ? theme.primary : '#e5e7eb',
                      backgroundColor: deliveryType === 'pickup' ? theme.primaryLight + '60' : 'white'
                    }}
                  >
                    <Store className="w-4 h-4" />
                    <span className="text-sm">איסוף עצמי</span>
                  </div>
                  <div 
                    className={`flex-1 p-3 rounded-lg border-2 transition-all flex items-center justify-center gap-2 cursor-default ${
                      deliveryType === 'delivery' ? 'font-semibold' : 'opacity-60'
                    }`}
                    style={{
                      borderColor: deliveryType === 'delivery' ? theme.primary : '#e5e7eb',
                      backgroundColor: deliveryType === 'delivery' ? theme.primaryLight + '60' : 'white'
                    }}
                  >
                    <Truck className="w-4 h-4" />
                    <span className="text-sm">משלוח ({deliveryFee} ₪)</span>
                  </div>
                </div>
              </div>

              {/* פריטים */}
              <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                {cart.map((item, index) => (
                  <div key={item.id || `item-${index}`} className="py-3 border-b border-gray-100">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{businessPage?.business_name || businessPage?.display_title} - {item.itemName}</h4>
                        {item.selectedAddons && item.selectedAddons.length > 0 && (
                          <div className="mt-2 text-xs text-gray-500 space-y-1">
                            {item.selectedAddons.map((mod, idx) => (
                              <div key={idx}>+ {mod.name} ({mod.price})</div>
                            ))}
                          </div>
                        )}
                        <div className="text-sm text-gray-600 mt-2">
                          כמות: {item.quantity}
                        </div>
                      </div>
                      <div className="text-left">
                        <p className="font-bold" style={{ color: theme.primary }}>
                          ₪{getItemTotal(item).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* סיכום מחירים */}
              <div className="border-t border-gray-200 pt-4 space-y-2">
                <div className="flex justify-between text-gray-600">
                  <span>סה"כ פריטים:</span>
                  <span>₪{getSubtotal().toFixed(2)}</span>
                </div>
                {deliveryType === 'delivery' && (
                  <div className="flex justify-between text-gray-600">
                    <span>דמי משלוח:</span>
                    <span>₪{deliveryFee.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-xl font-bold pt-2 border-t">
                  <span>סכום כולל:</span>
                  <span style={{ color: theme.primary }}>₪{getTotalAmount().toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* פרטי לקוח */}
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle>פרטי הזמנה</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="font-medium flex items-center gap-2">
                  <User className="w-4 h-4" style={{ color: theme.primary }} />
                  שם מלא *
                </Label>
                <Input
                  id="name"
                  placeholder="הכנס את שמך המלא"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="text-lg py-3"
                  required
                  autoComplete="name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="font-medium flex items-center gap-2">
                  <Phone className="w-4 h-4" style={{ color: theme.primary }} />
                  מספר טלפון *
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="05X-XXXXXXX"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="text-lg py-3"
                  required
                  autoComplete="tel"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="font-medium flex items-center gap-2">
                  <Mail className="w-4 h-4" style={{ color: theme.primary }} />
                  אימייל (לקבלת קבלה) *
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="text-lg py-3"
                  autoComplete="email"
                  dir="ltr"
                  required
                />
              </div>

              {deliveryType === 'delivery' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="font-medium flex items-center gap-2">
                      <Truck className="w-4 h-4" style={{ color: theme.primary }} />
                      כתובת למשלוח *
                    </Label>
                    
                    <div className="p-3 bg-gray-50 rounded-lg border">
                      <p className="text-sm text-gray-600">עיר:</p>
                      <p className="font-semibold text-gray-900">ביתר עילית</p>
                    </div>

                    <Input
                      id="street"
                      placeholder="רחוב"
                      value={deliveryStreet}
                      onChange={(e) => setDeliveryStreet(e.target.value)}
                      className="text-lg py-3"
                      required
                      autoComplete="address-line1"
                    />

                    <Input
                      id="houseNumber"
                      placeholder="מספר בית"
                      value={deliveryHouseNumber}
                      onChange={(e) => setDeliveryHouseNumber(e.target.value)}
                      className="text-lg py-3"
                      required
                      autoComplete="address-line2"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="notes" className="font-medium flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" style={{ color: theme.primary }} />
                  הערות (אופציונלי)
                </Label>
                <Textarea
                  id="notes"
                  placeholder="הערות מיוחדות להזמנה..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>

              {/* Payment Info */}
              <div className="pt-4 border-t border-gray-100">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 mb-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                      <Shield className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">תשלום מאובטח</p>
                      <p className="text-sm text-gray-600">מועבר לדף תשלום מאובטח של Sumit</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 justify-center">
                    <div className="flex items-center gap-1 bg-white px-3 py-1.5 rounded-full text-xs font-medium text-gray-700 shadow-sm">
                      💳 אשראי
                    </div>
                    <div className="flex items-center gap-1 bg-white px-3 py-1.5 rounded-full text-xs font-medium text-gray-700 shadow-sm">
                      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
                        <path d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z" fill="#4285F4"/>
                      </svg>
                      Google Pay
                    </div>
                    <div className="flex items-center gap-1 bg-white px-3 py-1.5 rounded-full text-xs font-medium text-gray-700 shadow-sm">
                      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                        <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                      </svg>
                      Apple Pay
                    </div>
                    <div className="flex items-center gap-1 bg-white px-3 py-1.5 rounded-full text-xs font-medium text-gray-700 shadow-sm">
                      <div className="w-4 h-4 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                        <span className="text-white font-bold text-[8px]">bit</span>
                      </div>
                      Bit
                    </div>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleProceedToPayment}
                disabled={isSubmitting || !customerName.trim() || !customerPhone.trim() || !customerEmail.trim() || (deliveryType === 'delivery' && (!deliveryStreet.trim() || !deliveryHouseNumber.trim())) || cart.length === 0}
                className="w-full py-4 text-lg font-bold text-white disabled:opacity-50 transition-all"
                style={{ backgroundColor: theme.primary }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                    מעביר לדף התשלום...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5 ml-2" />
                    עבור לתשלום מאובטח (₪{getTotalAmount().toFixed(2)})
                  </>
                )}
              </Button>

              <p className="text-sm text-gray-500 text-center leading-relaxed">
                תועבר לדף תשלום מאובטח עם כל אמצעי התשלום
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}