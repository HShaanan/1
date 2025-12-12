import { useEffect } from 'react';
import { BusinessPage } from '@/entities/BusinessPage';
import { createIsraeliDate, isExpired } from '@/components/utils/dateUtils';

// קומפוננטה שבודקת פקיעת תוקף עמודי עסק בצד הלקוח
export default function ListingExpiryChecker({ isAdmin = false }) {
  useEffect(() => {
    // מריצים רק למנהלים ובמצב אונליין כדי למנוע שגיאות רשת
    if (!isAdmin || (typeof navigator !== "undefined" && navigator && navigator.onLine === false)) {
      return;
    }

    const checkExpiredBusinessPages = async () => {
      try {
        const now = createIsraeliDate();

        const activePages = await BusinessPage.filter({
          is_active: true,
          approval_status: 'approved'
        });

        for (const page of activePages) {
          if (page.expire_at && isExpired(page.expire_at)) {
            await BusinessPage.update(page.id, {
              is_active: false,
              approval_status: 'expired',
              auto_expired_at: now.toISOString()
            });
          }
        }
      } catch (error) {
        // שקט: לא נזרוק לשמר שקט בצד הלקוח
        console.error('Error checking expired business pages (admin only):', error);
      }
    };

    // בדיקה ראשונית
    checkExpiredBusinessPages();

    // בדיקה כל 10 דקות
    const interval = setInterval(checkExpiredBusinessPages, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, [isAdmin]);

  return null; // קומפוננטה שקטה
}