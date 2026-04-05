import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Crown, Check, X, Loader2, ArrowRight, Star,
  BarChart3, Phone, Image, UtensilsCrossed, Shield,
  TrendingUp, Sparkles, AlertCircle
} from "lucide-react";
import { createPageUrl } from "@/utils";

export default function SubscriptionManagement() {
  const [user, setUser] = useState(null);
  const [plans, setPlans] = useState([]);
  const [currentBusiness, setCurrentBusiness] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const urlParams = new URLSearchParams(window.location.search);
  const businessId = urlParams.get("business_id");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      if (!currentUser) {
        base44.auth.redirectToLogin(window.location.href);
        return;
      }
      setUser(currentUser);

      const [plansData, businessData] = await Promise.all([
        base44.entities.SubscriptionPlan.filter({ is_active: true }, "sort_order"),
        businessId
          ? base44.entities.BusinessPage.get(businessId).catch(() => null)
          : null,
      ]);

      setPlans(plansData || []);
      setCurrentBusiness(businessData);
    } catch (err) {
      setError("שגיאה בטעינת נתוני המנויים");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPlan = async (plan) => {
    if (!currentBusiness) {
      setError("יש לבחור עסק לפני שדרוג מנוי");
      return;
    }

    const currentPlan = currentBusiness.subscription_type || 'basic';
    if (plan.plan_key === currentPlan) return;

    const isUpgrade = plans.findIndex(p => p.plan_key === plan.plan_key) >
                      plans.findIndex(p => p.plan_key === currentPlan);
    const action = isUpgrade ? 'שדרוג' : 'שנמוך';

    if (!confirm(`האם ברצונך לבצע ${action} למסלול ${plan.name_he}?`)) return;

    setIsProcessing(true);
    setError("");
    setMessage("");

    try {
      if (isUpgrade && plan.price_monthly > 0) {
        // Redirect to payment for upgrade
        const result = await base44.functions.invoke('createSubscriptionPayment', {
          business_page_id: businessId,
          plan_key: plan.plan_key,
          amount: plan.price_monthly,
          plan_name: plan.name_he,
        });

        if (result?.payment_url) {
          window.location.href = result.payment_url;
          return;
        }
      }

      // Direct update for downgrade or free plans
      await base44.entities.BusinessPage.update(businessId, {
        subscription_type: plan.plan_key,
        is_premium: plan.plan_key !== 'basic',
        is_promoted: plan.has_promoted_listing || false,
      });

      setMessage(`המנוי עודכן בהצלחה ל${plan.name_he}`);
      setCurrentBusiness(prev => ({
        ...prev,
        subscription_type: plan.plan_key
      }));
    } catch (err) {
      setError("שגיאה בעדכון המנוי: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!currentBusiness) return;
    if (!confirm("האם אתה בטוח שברצונך לבטל את המנוי? העסק יעבור למסלול הבסיסי.")) return;

    setIsProcessing(true);
    try {
      await base44.entities.BusinessPage.update(businessId, {
        subscription_type: 'basic',
        is_premium: false,
        is_promoted: false,
        subscription_expires_at: null,
      });
      setMessage("המנוי בוטל. העסק עבר למסלול הבסיסי.");
      setCurrentBusiness(prev => ({
        ...prev,
        subscription_type: 'basic'
      }));
    } catch (err) {
      setError("שגיאה בביטול המנוי");
    } finally {
      setIsProcessing(false);
    }
  };

  const planIcons = {
    basic: Shield,
    premium: Star,
    enterprise: Crown,
  };

  const planColors = {
    basic: "from-slate-400 to-slate-600",
    premium: "from-blue-500 to-indigo-600",
    enterprise: "from-amber-500 to-orange-600",
  };

  const planBorders = {
    basic: "border-slate-200",
    premium: "border-blue-300 ring-2 ring-blue-100",
    enterprise: "border-amber-300 ring-2 ring-amber-100",
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
      </div>
    );
  }

  const currentPlanKey = currentBusiness?.subscription_type || 'basic';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 py-8 px-4" dir="rtl">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-slate-900 mb-3">
            <Crown className="w-10 h-10 inline-block ml-2 text-amber-500" />
            ניהול מנוי
          </h1>
          <p className="text-slate-600 text-lg">
            בחר את המסלול המתאים לעסק שלך
          </p>
          {currentBusiness && (
            <Badge className="mt-3 bg-indigo-100 text-indigo-800 text-sm px-4 py-1">
              {currentBusiness.business_name}
            </Badge>
          )}
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {message && (
          <Alert className="mb-6">
            <Check className="h-4 w-4" />
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {plans.map((plan) => {
            const Icon = planIcons[plan.plan_key] || Shield;
            const isCurrentPlan = plan.plan_key === currentPlanKey;
            const features = Array.isArray(plan.features) ? plan.features : [];

            return (
              <Card
                key={plan.id}
                className={`relative overflow-hidden transition-all duration-300 hover:shadow-xl ${
                  planBorders[plan.plan_key] || "border-slate-200"
                } ${isCurrentPlan ? "ring-2 ring-green-400 border-green-400" : ""}`}
              >
                {isCurrentPlan && (
                  <div className="absolute top-0 left-0 right-0 bg-green-500 text-white text-center text-xs py-1 font-medium">
                    המסלול הנוכחי שלך
                  </div>
                )}

                {plan.plan_key === 'premium' && !isCurrentPlan && (
                  <div className="absolute top-0 left-0 right-0 bg-blue-600 text-white text-center text-xs py-1 font-medium">
                    הכי פופולרי
                  </div>
                )}

                <CardHeader className={`pt-8 ${isCurrentPlan || plan.plan_key === 'premium' ? 'pt-10' : ''}`}>
                  <div className={`w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br ${planColors[plan.plan_key]} flex items-center justify-center mb-4`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-center text-2xl">{plan.name_he}</CardTitle>
                  <div className="text-center mt-2">
                    <span className="text-4xl font-bold text-slate-900">
                      {plan.price_monthly > 0 ? `₪${plan.price_monthly}` : 'חינם'}
                    </span>
                    {plan.price_monthly > 0 && (
                      <span className="text-slate-500 text-sm mr-1">/חודש</span>
                    )}
                  </div>
                  {plan.price_yearly && (
                    <p className="text-center text-sm text-green-600 mt-1">
                      ₪{plan.price_yearly}/שנה (חיסכון!)
                    </p>
                  )}
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {features.map((feature, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm text-slate-700">{feature}</span>
                      </div>
                    ))}

                    <div className="flex items-center gap-2">
                      <Image className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <span className="text-sm text-slate-600">
                        עד {plan.max_images === 999 ? '∞' : plan.max_images} תמונות
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <UtensilsCrossed className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <span className="text-sm text-slate-600">
                        עד {plan.max_menu_items === 999 ? '∞' : plan.max_menu_items} פריטי תפריט
                      </span>
                    </div>

                    {plan.has_analytics && (
                      <div className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-blue-500 flex-shrink-0" />
                        <span className="text-sm text-slate-700">דשבורד אנליטיקס</span>
                      </div>
                    )}

                    {plan.has_promoted_listing && (
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-amber-500 flex-shrink-0" />
                        <span className="text-sm text-slate-700">מיקום מקודם</span>
                      </div>
                    )}

                    {!plan.has_analytics && (
                      <div className="flex items-center gap-2">
                        <X className="w-4 h-4 text-slate-300 flex-shrink-0" />
                        <span className="text-sm text-slate-400">ללא אנליטיקס</span>
                      </div>
                    )}

                    {!plan.has_promoted_listing && (
                      <div className="flex items-center gap-2">
                        <X className="w-4 h-4 text-slate-300 flex-shrink-0" />
                        <span className="text-sm text-slate-400">ללא קידום</span>
                      </div>
                    )}
                  </div>

                  {currentBusiness && (
                    <Button
                      className={`w-full mt-4 ${
                        isCurrentPlan
                          ? "bg-green-100 text-green-800 hover:bg-green-100 cursor-default"
                          : plan.plan_key === 'premium'
                          ? "bg-blue-600 hover:bg-blue-700"
                          : plan.plan_key === 'enterprise'
                          ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                          : "bg-slate-600 hover:bg-slate-700"
                      }`}
                      disabled={isCurrentPlan || isProcessing}
                      onClick={() => handleSelectPlan(plan)}
                    >
                      {isProcessing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : isCurrentPlan ? (
                        <>
                          <Check className="w-4 h-4 ml-1" />
                          המסלול הנוכחי
                        </>
                      ) : (
                        <>
                          <ArrowRight className="w-4 h-4 ml-1" />
                          {plans.findIndex(p => p.plan_key === plan.plan_key) >
                           plans.findIndex(p => p.plan_key === currentPlanKey)
                            ? 'שדרג עכשיו'
                            : 'שנמך מסלול'}
                        </>
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Cancel Subscription */}
        {currentBusiness && currentPlanKey !== 'basic' && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-red-900">ביטול מנוי</h3>
                  <p className="text-sm text-red-700">
                    ביטול המנוי יחזיר את העסק למסלול הבסיסי. הנתונים יישמרו.
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="border-red-300 text-red-700 hover:bg-red-100"
                  onClick={handleCancelSubscription}
                  disabled={isProcessing}
                >
                  בטל מנוי
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* No business selected */}
        {!businessId && (
          <Alert className="mt-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              כדי לנהל מנוי, יש לגשת לעמוד זה מתוך דף ניהול העסק.
              <Button
                variant="link"
                className="pr-2"
                onClick={() => window.location.href = createPageUrl("MyBusinessPages")}
              >
                עבור לעסקים שלי
              </Button>
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
