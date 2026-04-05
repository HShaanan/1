import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { CheckCircle, Store, ArrowLeft } from "lucide-react";

export default function RegistrationSuccess() {
  const navigate = useNavigate();
  const [registrationData, setRegistrationData] = useState(null);
  const [creating, setCreating] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const processRegistration = async () => {
      try {
        // Get pending registration from localStorage
        const pending = localStorage.getItem("pendingRegistration");
        if (!pending) {
          setCreating(false);
          return;
        }

        const data = JSON.parse(pending);
        setRegistrationData(data);

        // Get transaction info from URL params (Sumit callback)
        const urlParams = new URLSearchParams(window.location.search);
        const transactionId = urlParams.get("TransactionID") || urlParams.get("transactionid");

        // Create the business listing in Supabase
        const businessData = {
          title: data.businessName,
          listing_type: data.listingType || "business",
          category_id: data.categoryId,
          city: data.city,
          address: data.address,
          phone: data.phone,
          email: data.email,
          website: data.website,
          description: data.description,
          price_range: data.priceRange,
          images: data.images || [],
          preview_image: data.coverImage || data.images?.[0] || "",
          logo_url: data.logoUrl,
          is_active: true,
          approval_status: "pending",
          payment_transaction_id: transactionId,
          professional_title: data.professionalTitle,
          specialties: data.specialties || [],
          service_area: data.serviceArea || [],
          years_experience: data.yearsExperience,
        };

        // Remove undefined/null fields
        Object.keys(businessData).forEach(key => {
          if (businessData[key] === undefined || businessData[key] === null || businessData[key] === "") {
            delete businessData[key];
          }
        });

        await base44.entities.BusinessPage.create(businessData);

        // Clean up
        localStorage.removeItem("pendingRegistration");
        setCreating(false);
      } catch (err) {
        console.error("Registration processing error:", err);
        setError("אירעה שגיאה ביצירת העסק. אנא פנו לתמיכה.");
        setCreating(false);
      }
    };

    processRegistration();
  }, []);

  if (creating) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">יוצרים את העמוד שלכם...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" dir="rtl">
        <div className="max-w-md w-full text-center bg-white rounded-2xl shadow-lg p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Store className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">שגיאה</h1>
          <p className="text-slate-600 mb-6">{error}</p>
          <Button onClick={() => navigate(createPageUrl("Browse"))}>
            חזרה לדף הראשי
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" dir="rtl">
      <div className="max-w-md w-full text-center bg-white rounded-2xl shadow-lg p-8">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>

        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          ההרשמה הושלמה בהצלחה! 🎉
        </h1>

        <p className="text-slate-600 mb-2">
          {registrationData?.businessName && (
            <span className="font-semibold text-slate-800">{registrationData.businessName}</span>
          )}
        </p>

        <p className="text-slate-500 mb-8">
          העסק שלכם נמצא בבדיקה ויאושר בקרוב.
          <br />
          תקבלו הודעה כשהעסק יעלה לאוויר.
        </p>

        <div className="space-y-3">
          <Button
            className="w-full"
            onClick={() => navigate(createPageUrl("MyBusinessPages"))}
          >
            <Store className="w-4 h-4 ml-2" />
            העסקים שלי
          </Button>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => navigate(createPageUrl("Browse"))}
          >
            <ArrowLeft className="w-4 h-4 ml-2" />
            חזרה לדף הראשי
          </Button>
        </div>
      </div>
    </div>
  );
}
