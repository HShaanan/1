import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { MessageCircle, X, Send, Loader2, Bug, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from 'react-markdown';

export default function SupportWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // גלילה אוטומטית למטה
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  // מיקוד על שדה הקלט בפתיחה (נגישות)
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 100);
    }
  }, [isOpen]);

  // יצירת שיחה חדשה או טעינת קיימת
  const initConversation = async () => {
    try {
      setIsLoading(true);
      
      // בדיקה אם המשתמש מחובר
      const isAuth = await base44.auth.isAuthenticated();
      
      if (!isAuth) {
        // משתמש לא מחובר - הצג הודעה שמפנה להתחברות
        setMessages([{
          role: "assistant",
          content: "👋 שלום! כדי לשלוח הודעות לתמיכה, נדרש להתחבר תחילה. זה עוזר לנו לעקוב אחר הפניות שלך ולתת לך מענה טוב יותר."
        }]);
        setIsLoading(false);
        return;
      }
      
      // בדיקה אם יש שיחה שמורה ב-Session Storage
      const savedConvId = sessionStorage.getItem("support_conversation_id");
      
      if (savedConvId) {
        try {
          setConversationId(savedConvId);
          const conv = await base44.agents.getConversation(savedConvId);
          if (conv && conv.messages) {
            setMessages(conv.messages);
          }
        } catch (err) {
          console.warn("Failed to load saved conversation, creating new one", err);
          sessionStorage.removeItem("support_conversation_id");
        }
      }
      
      if (!savedConvId || !conversationId) {
        // יצירת שיחה חדשה
        const conv = await base44.agents.createConversation({
          agent_name: "site_support",
          metadata: {
            source: "web_widget",
            page_url: window.location.href
          }
        });
        
        if (conv && conv.id) {
          setConversationId(conv.id);
          sessionStorage.setItem("support_conversation_id", conv.id);
          
          // הודעת פתיחה אוטומטית מהסוכן
          setMessages([{
            role: "assistant",
            content: "שלום! 👋 אני הסוכן החכם של האתר. אפשר לדווח לי על תקלות 🐛, להציע שיפורים 💡 או לשאול שאלות. איך אוכל לעזור?"
          }]);
        } else {
          throw new Error("Failed to create conversation");
        }
      }
    } catch (error) {
      console.error("Failed to init conversation:", error);
      setMessages([{
        role: "assistant",
        content: "מצטער, נתקלתי בבעיה בפתיחת הצ'אט. פרטי השגיאה: " + (error.message || "שגיאה לא ידועה")
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // האזנה לשינויים בזמן אמת
  useEffect(() => {
    if (!conversationId) return;

    const unsubscribe = base44.agents.subscribeToConversation(conversationId, (data) => {
      if (data && Array.isArray(data.messages) && data.messages.length > 0) {
        setMessages(data.messages);
      }
    });

    return () => unsubscribe();
  }, [conversationId]);

  const handleOpen = async () => {
    if (!isOpen && !conversationId) {
      await initConversation();
    }
    setIsOpen(!isOpen);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    // בדיקה אם המשתמש מחובר
    const isAuth = await base44.auth.isAuthenticated();
    if (!isAuth) {
      setMessages(prev => [...(Array.isArray(prev) ? prev : []), { 
        role: "assistant", 
        content: "נדרש להתחבר כדי לשלוח הודעות. לחץ על כפתור ההתחברות בראש העמוד." 
      }]);
      return;
    }

    const content = inputValue;
    setInputValue("");
    
    // הוספה אופטימית לממשק
    setMessages(prev => [...(Array.isArray(prev) ? prev : []), { role: "user", content }]);
    setIsLoading(true);

    try {
      // אם אין conversation, צור אחד עכשיו
      let currentConvId = conversationId;
      if (!currentConvId) {
        const conv = await base44.agents.createConversation({
          agent_name: "site_support",
          metadata: {
            source: "web_widget",
            page_url: window.location.href
          }
        });
        
        if (!conv || !conv.id) {
          throw new Error("Failed to create conversation");
        }
        
        currentConvId = conv.id;
        setConversationId(conv.id);
        sessionStorage.setItem("support_conversation_id", conv.id);
      }

      // טען את ה-conversation המלא מה-API
      const conv = await base44.agents.getConversation(currentConvId);
      
      if (!conv || !conv.id) {
        throw new Error("Conversation not found");
      }
      
      // שלח הודעה עם האובייקט המלא
      await base44.agents.addMessage(conv, {
        role: "user",
        content: content
      });
    } catch (error) {
      console.error("Error sending message:", error);
      
      sessionStorage.removeItem("support_conversation_id");
      setConversationId(null);

      setMessages(prev => [...(Array.isArray(prev) ? prev : []), { 
        role: "assistant", 
        content: "שגיאה בשליחת ההודעה: " + (error.message || "לא ידועה") 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-start font-sans" dir="rtl">
      {/* חלון הצ'אט */}
      <div 
        className={cn(
          "transition-all duration-300 ease-in-out transform origin-bottom-right mb-4",
          isOpen 
            ? "scale-100 opacity-100 translate-y-0" 
            : "scale-95 opacity-0 translate-y-4 pointer-events-none absolute bottom-0"
        )}
      >
        <Card className="w-[320px] sm:w-[380px] h-[500px] flex flex-col shadow-2xl border-slate-200 overflow-hidden rounded-2xl">
          {/* כותרת */}
          <div className="bg-slate-900 text-white p-4 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <h3 className="font-bold text-lg">תמיכה ודיווח תקלות</h3>
            </div>
            <div className="flex items-center gap-2">
              <a 
                href={base44.agents.getWhatsAppConnectURL('site_support')}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 bg-[#25D366] hover:bg-[#128C7E] text-white text-xs font-bold px-3 py-1.5 rounded-full transition-colors shadow-sm hover:shadow-md ml-2"
                aria-label="המשך בוואטסאפ"
              >
                <span>WhatsApp</span>
                <MessageCircle className="w-3.5 h-3.5" />
              </a>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white hover:bg-slate-800 h-8 w-8 rounded-full"
                onClick={() => setIsOpen(false)}
                aria-label="סגור צ'אט"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* אזור ההודעות */}
          <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-4 scroll-smooth">
            {(messages || []).map((msg, idx) => {
              const isUser = msg.role === "user";
              const isTool = msg.role === "tool" || (msg.tool_calls && msg.tool_calls.length > 0);
              
              // הסתרת הודעות טכניות של קריאת כלים אם רוצים, או הצגה מעודנת
              if (msg.role === "tool") return null; 

              return (
                <div 
                  key={idx} 
                  className={cn(
                    "flex w-full",
                    isUser ? "justify-end" : "justify-start"
                  )}
                >
                  <div 
                    className={cn(
                      "max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm relative group",
                      isUser 
                        ? "bg-blue-600 text-white rounded-bl-none" 
                        : "bg-white text-slate-800 border border-slate-200 rounded-br-none"
                    )}
                  >
                    {msg.content ? (
                      <ReactMarkdown 
                        components={{
                          p: ({node, ...props}) => <p className="m-0" {...props} />,
                          a: ({node, ...props}) => <a className="underline font-bold" target="_blank" {...props} />
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    ) : (
                      isTool ? <span className="italic text-xs opacity-70 flex items-center gap-1"><Bug className="w-3 h-3"/> מבצע פעולה...</span> : null
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* אזור הקלט */}
          <div className="p-3 bg-white border-t border-slate-100 shrink-0">
            <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="הקלד הודעה..."
                className="flex-1 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                disabled={isLoading && !conversationId}
                aria-label="הודעה לצ'אט"
              />
              <Button 
                type="submit" 
                size="icon" 
                disabled={!inputValue.trim() || (isLoading && !conversationId)}
                className="bg-blue-600 hover:bg-blue-700 text-white shrink-0 w-10 h-10 rounded-xl shadow-sm transition-transform active:scale-95"
                aria-label="שלח הודעה"
              >
                {isLoading && !conversationId ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </form>
            <div className="text-[10px] text-center text-slate-400 mt-2 flex justify-center items-center gap-1">
              <HelpCircle className="w-3 h-3" />
              מופעל על ידי Base44 AI
            </div>
          </div>
        </Card>
      </div>

      {/* כפתור צף */}
      <Button
        onClick={handleOpen}
        size="lg"
        className={cn(
          "rounded-full w-14 h-14 shadow-xl transition-all duration-300 hover:scale-110 relative overflow-hidden group border-2 border-white/20",
          isOpen ? "bg-slate-800 rotate-90" : "bg-blue-600 hover:bg-blue-700"
        )}
        aria-expanded={isOpen}
        aria-label="פתח צ'אט תמיכה"
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-black/10 to-transparent pointer-events-none" />
        {isOpen ? (
          <X className="w-6 h-6 text-white relative z-10" />
        ) : (
          <MessageCircle className="w-7 h-7 text-white relative z-10 animate-pulse-slow" />
        )}
      </Button>
    </div>
  );
}