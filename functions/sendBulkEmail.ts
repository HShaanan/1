import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify admin
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all users
    const users = await base44.asServiceRole.entities.User.list();
    
    const emailSubject = "הצטרפו למהפכת המשלוחים של משלנו!";
    const emailBody = `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2563eb; text-align: center;">שלום רב,</h2>
        
        <p>אנו שמחים ונרגשים לפנות אליכם היום מטעם "משלנו" – פלטפורמת משלוחים חדשה, שנוצרה במיוחד עבור הציבור בביתר עילית.</p>
        
        <p>אחרי עבודה מאומצת, אנו יוצאים לדרך ומביאים אליכם את מיטב העסקים המקומיים בלחיצת כפתור, עם דגש על נוחות, כשרות ופרטיות.</p>
        
        <p>כחלק משלב ההשקה הרך, אנו מזמינים אתכם להצטרף לחוויה ולסייע לנו לבנות את הקהילה שלנו. ההזמנה הראשונה שלכם היא הזדמנות עבורכם לפנק את עצמכם ואת משפחתכם, וגם עבורנו – ללמוד ולצמוח. אנו ממליצים לכם להתחיל עם הזמנה מבית העסק "פרוטוסט" – המשלב איכות ושירות נפלא. זו ההזדמנות שלכם לטעום מהמוצרים שלהם בנוחות מרבית דרך "משלנו".</p>
        
        <p>השימוש שלכם בפלטפורמה בשלבים אלו הוא קריטי עבורנו. אם נתקלתם בקושי, בנקודה לשיפור באתר, או סתם יש לכם רעיון נפלא – נשמח מאוד לשמוע! כל משוב מכם יסייע לנו לתקן, לשפר ולהתאים את "משלנו" בצורה הטובה ביותר לצרכים שלכם ושל הקהילה.</p>
        
        <p>בואו להיות שותפים בהצלחה, לעזור לנו להרחיב את מעגל המשתמשים ולתקן יחד את הפלטפורמה שתשרת את כולנו.</p>
        
        <p style="margin-top: 30px;">תודה רבה מראש על שיתוף הפעולה, ובתקווה שנזכה לראות אתכם אצלנו בקרוב,</p>
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="https://www.meshelanu.co.il" style="display: inline-block; background-color: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">היכנסו לאתר משלנו</a>
        </div>
        
        <p style="text-align: center; color: #666; font-size: 12px; margin-top: 30px;">צוות משלנו</p>
      </div>
    `;

    let successCount = 0;
    let failCount = 0;
    const errors = [];

    // Send emails in batches to avoid rate limits
    for (const u of users) {
      if (u.email) {
        try {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: u.email,
            subject: emailSubject,
            body: emailBody,
            from_name: "משלנו"
          });
          successCount++;
          
          // Small delay to avoid rate limits
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          failCount++;
          errors.push({ email: u.email, error: error.message });
          console.error(`Failed to send email to ${u.email}:`, error);
        }
      }
    }

    return Response.json({ 
      success: true,
      totalUsers: users.length,
      successCount,
      failCount,
      errors
    });

  } catch (error) {
    console.error('Error sending bulk email:', error);
    return Response.json({ 
      error: error.message,
      success: false 
    }, { status: 500 });
  }
});