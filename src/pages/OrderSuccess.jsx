import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, ArrowRight } from "lucide-react";
import { createPageUrl } from "@/utils";

export default function OrderSuccessPage() {
  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    processPaymentReturn();
  }, []);

  const processPaymentReturn = async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      
      // Sumit returns these params after successful payment
      const transactionId = urlParams.get('TransactionID') || urlParams.get('transactionid');
      const status = urlParams.get('Status') || urlParams.get('status');
      const customField1 = urlParams.get('CustomField1') || urlParams.get('customfield1'); // orderId
      const customField2 = urlParams.get('CustomField2') || urlParams.get('customfield2'); // businessPageId
      
      console.log("Payment return params:", { transactionId, status, customField1, customField2 });

      // Check if we have pending order data in localStorage
      const pendingOrderData = localStorage.getItem('pendingOrder');
      
      if (pendingOrderData) {
        const orderData = JSON.parse(pendingOrderData);
        
        // Get business name
        let businessName = "העסק";
        if (orderData.business_page_id) {
          try {
            const businesses = await base44.entities.BusinessPage.filter({ id: orderData.business_page_id });
            if (businesses && businesses.length > 0) {
              businessName = businesses[0].business_name || businesses[0].title || "העסק";
            }
          } catch (e) {
            console.warn("Could not fetch business name:", e);
          }
        }
        
        // Create the order in our system
        const newOrder = await base44.entities.Order.create({
          ...orderData,
          status: 'new',
          transaction_id: transactionId
        });

        console.log('Order created:', newOrder);

        // Notify business
        try {
          await base44.functions.invoke('notifyNewOrder', { orderId: newOrder.id });
        } catch (notifyErr) {
          console.warn('Notification error:', notifyErr);
        }

        // Clear pending order
        localStorage.removeItem('pendingOrder');

        setOrderDetails({
          orderNumber: orderData.order_number,
          customerName: orderData.customer_name,
          businessName: businessName,
          businessPageId: orderData.business_page_id,
          totalAmount: orderData.total_amount,
          deliveryType: orderData.delivery_type,
          transactionId
        });
      } else {
        // No pending order data, show generic success
        setOrderDetails({
          transactionId,
          generic: true
        });
      }

    } catch (error) {
      console.error("Error processing payment return:", error);
      setOrderDetails({ error: true });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100" dir="rtl">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">מעבד את התשלום...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-green-50 to-emerald-100" dir="rtl">
      <Card className="max-w-md w-full shadow-2xl border-0 overflow-hidden">
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-6 text-center">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-white">התשלום בוצע בהצלחה!</h1>
        </div>
        
        <CardContent className="p-6 space-y-6">
          {orderDetails?.error ? (
            <div className="text-center text-gray-600">
              <p>התשלום בוצע אך נתקלנו בבעיה בשמירת ההזמנה.</p>
              <p className="text-sm mt-2">אנא צרו קשר עם העסק.</p>
            </div>
          ) : orderDetails?.generic ? (
            <div className="text-center text-gray-600">
              <p className="text-lg font-medium text-gray-800 mb-2">תודה על הרכישה!</p>
              <p>התשלום התקבל בהצלחה.</p>
              {orderDetails.transactionId && (
                <p className="text-sm text-gray-500 mt-2">
                  מזהה עסקה: {orderDetails.transactionId}
                </p>
              )}
            </div>
          ) : (
            <>
              <div className="text-center">
                <p className="text-lg text-gray-800">
                  תודה לך <span className="font-bold">{orderDetails?.customerName}</span> שבחרת ב-<span className="font-bold">{orderDetails?.businessName}</span> משלנו!
                </p>
                <p className="text-gray-600 mt-1">ההזמנה שלך התקבלה בהצלחה</p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">מספר הזמנה:</span>
                  <span className="font-bold text-lg">#{orderDetails?.orderNumber}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">סכום ששולם:</span>
                  <span className="font-bold text-green-600">₪{orderDetails?.totalAmount?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">סוג:</span>
                  <span className="font-medium">
                    {orderDetails?.deliveryType === 'delivery' ? '🚚 משלוח' : '🏪 איסוף עצמי'}
                  </span>
                </div>
              </div>


            </>
          )}

          <div className="flex flex-col gap-3 pt-4">
            <Button
              onClick={() => {
                if (orderDetails?.businessPageId) {
                  window.location.href = createPageUrl('BusinessPage') + `?id=${orderDetails.businessPageId}`;
                } else {
                  window.location.href = createPageUrl('Browse');
                }
              }}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
            >
              <ArrowRight className="w-4 h-4 ml-2" />
              חזור לעמוד העסק
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}