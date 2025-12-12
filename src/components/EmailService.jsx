import { base44 } from "@/api/base44Client";

export const EmailService = {
  generateWelcomeEmailTemplate: (userName, appSettings) => {
    return `
      <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa;">
        <header style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-align: center; padding: 40px 20px;">
          <img src="${appSettings.logo_url}" alt="${appSettings.company_name}" style="height: 60px; margin-bottom: 20px;" />
          <h1 style="margin: 0; font-size: 28px;">ברוכים הבאים ל${appSettings.company_name}! 🎉</h1>
        </header>
        
        <main style="padding: 40px 20px; background: white;">
          <p style="font-size: 18px; color: #333; line-height: 1.6;">שלום ${userName},</p>
          
          <p style="font-size: 16px; color: #555; line-height: 1.8;">
            תודה שהצטרפת לקהילה שלנו! אנחנו שמחים שאת/ה כאן ומחכים לראות איך תעזור/י לקהילה להתפתח.
          </p>
          
          <div style="background: #f8f9ff; border-radius: 12px; padding: 24px; margin: 30px 0; border-right: 4px solid #667eea;">
            <h3 style="color: #667eea; margin-top: 0;">מה אפשר לעשות עכשיו?</h3>
            <ul style="color: #555; line-height: 1.8;">
              <li>📝 פרסם את המודעה הראשונה שלך</li>
              <li>🔍 חפש מוצרים ושירותים מקומיים</li>
              <li>❤️ שמור מודעות למועדפים</li>
              <li>⭐ דרג ושתף חוות דעת</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 40px 0;">
            <a href="${appSettings.website_url}" 
               style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                      color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; 
                      font-weight: bold; font-size: 16px;">
              התחל לגלות →
            </a>
          </div>
        </main>
        
        <footer style="background: #f8f9fa; padding: 30px 20px; text-align: center; color: #666; font-size: 14px;">
          <p style="margin: 10px 0;">
            <strong>${appSettings.company_name}</strong><br/>
            ${appSettings.company_address}<br/>
            טלפון: ${appSettings.company_phone} | אימייל: ${appSettings.support_email}
          </p>
          <p style="margin: 10px 0; font-size: 12px;">
            ח.פ: ${appSettings.company_tax_id}
          </p>
        </footer>
      </div>
    `;
  },

  generateListingConfirmationTemplate: (userName, listingTitle, appSettings) => {
    return `
      <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa;">
        <header style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; text-align: center; padding: 40px 20px;">
          <img src="${appSettings.logo_url}" alt="${appSettings.company_name}" style="height: 60px; margin-bottom: 20px;" />
          <h1 style="margin: 0; font-size: 28px;">המודעה שלך פורסמה! ✅</h1>
        </header>
        
        <main style="padding: 40px 20px; background: white;">
          <p style="font-size: 18px; color: #333; line-height: 1.6;">שלום ${userName},</p>
          
          <p style="font-size: 16px; color: #555; line-height: 1.8;">
            המודעה "<strong>${listingTitle}</strong>" אושרה ופורסמה בהצלחה באתר!
          </p>
          
          <div style="background: #f0fdf4; border-radius: 12px; padding: 24px; margin: 30px 0; border-right: 4px solid #10b981;">
            <h3 style="color: #059669; margin-top: 0;">מה הלאה?</h3>
            <ul style="color: #555; line-height: 1.8;">
              <li>📈 עקוב אחר מספר הצפיות במודעה</li>
              <li>📞 התכונן לקבלת פניות מעוניינים</li>
              <li>✏️ תמיד אפשר לערוך ולעדכן את המודעה</li>
              <li>💬 תגיב על חוות דעת שתקבל</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 40px 0;">
            <a href="${appSettings.website_url}" 
               style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
                      color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; 
                      font-weight: bold; font-size: 16px;">
              צפה במודעה →
            </a>
          </div>
        </main>
        
        <footer style="background: #f8f9fa; padding: 30px 20px; text-align: center; color: #666; font-size: 14px;">
          <p style="margin: 10px 0;">
            <strong>${appSettings.company_name}</strong><br/>
            ${appSettings.company_address}<br/>
            טלפון: ${appSettings.company_phone} | אימייל: ${appSettings.support_email}
          </p>
        </footer>
      </div>
    `;
  },

  sendEmailWithLogging: async (emailData, metadata = {}) => {
    try {
      await base44.integrations.Core.SendEmail({
        from_name: emailData.from_name || 'משלנו',
        to: emailData.to,
        subject: emailData.subject,
        body: emailData.body
      });

      // Log the email
      if (base44.entities.EmailLog) {
        await base44.entities.EmailLog.create({
          user_email: emailData.to,
          email_type: emailData.email_type || 'general',
          subject: emailData.subject,
          status: 'sent',
          sent_at: new Date().toISOString(),
          metadata: metadata
        }).catch(err => console.warn('Failed to log email:', err));
      }

      return { success: true };
    } catch (error) {
      console.error('Error sending email:', error);
      
      // Log failed email
      if (base44.entities.EmailLog) {
        await base44.entities.EmailLog.create({
          user_email: emailData.to,
          email_type: emailData.email_type || 'general',
          subject: emailData.subject,
          status: 'failed',
          sent_at: new Date().toISOString(),
          error_message: error.message,
          metadata: metadata
        }).catch(err => console.warn('Failed to log email error:', err));
      }

      return { success: false, error: error.message };
    }
  }
};