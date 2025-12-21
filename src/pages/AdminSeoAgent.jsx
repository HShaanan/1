import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, Send, Bot, CheckCircle2, AlertCircle, ArrowRight, Zap } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function AdminSeoAgentPage() {
  const navigate = useNavigate();
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({ categories: 0, kashrut: 0, businesses: 0 });
  const messagesEndRef = useRef(null);

  // טעינת או יצירת שיחה
  useEffect(() => {
    const initConversation = async () => {
      try {
        // חיפוש שיחה קיימת
        const conversations = await base44.agents.listConversations({ agent_name: "seo_landing_pages_generator" });
        
        if (conversations.length > 0) {
          const latest = conversations[0];
          setConversation(latest);
          setMessages(latest.messages || []);
        } else {
          // יצירת שיחה חדשה
          const newConv = await base44.agents.createConversation({
            agent_name: "seo_landing_pages_generator",
            metadata: { name: "SEO Landing Pages Generator", description: "אוטומציה ליצירת דפי נחיתה" }
          });
          setConversation(newConv);
          setMessages([]);
        }

        // טעינת סטטיסטיקות
        const [cats, kashrut, businesses] = await Promise.all([
          base44.entities.Category.list(),
          base44.entities.Kashrut.list(),
          base44.entities.BusinessPage.filter({ is_active: true })
        ]);
        setStats({ categories: cats.length, kashrut: kashrut.length, businesses: businesses.length });
      } catch (error) {
        console.error("Error initializing conversation:", error);
      }
    };
    initConversation();
  }, []);

  // גלילה אוטומטית להודעה האחרונה
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // מנוי לעדכונים בזמן אמת
  useEffect(() => {
    if (!conversation?.id) return;

    const unsubscribe = base44.agents.subscribeToConversation(conversation.id, (data) => {
      setMessages(data.messages || []);
    });

    return () => unsubscribe();
  }, [conversation?.id]);

  // שליחת הודעה
  const sendMessage = async () => {
    if (!inputMessage.trim() || !conversation) return;

    setIsLoading(true);
    try {
      await base44.agents.addMessage(conversation, {
        role: "user",
        content: inputMessage
      });
      setInputMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      alert("שגיאה בשליחת ההודעה");
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = [
    {
      icon: Zap,
      text: "צור 10 דפי נחיתה למסעדות בשר בביתר עילית לפי הכשרויות השונות",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: Sparkles,
      text: "נתח את כל תתי הקטגוריות תחת 'אוכל' ותצור דף לכל שילוב עם כשרות",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: ArrowRight,
      text: "צור דפים לכל העסקים הפעילים עם דירוג מעל 4 כוכבים",
      color: "from-orange-500 to-red-500"
    },
    {
      icon: Bot,
      text: "הצע לי אסטרטגיית SEO מלאה - אילו דפים כדאי ליצור קודם?",
      color: "from-green-500 to-emerald-500"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl shadow-lg">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">AI SEO Generator</h1>
              <p className="text-slate-600">יצירה אוטומטית של דפי נחיתה ממוקדי המרה</p>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Store className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{stats.categories}</p>
                  <p className="text-xs text-slate-600">קטגוריות</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{stats.kashrut}</p>
                  <p className="text-xs text-slate-600">כשרויות</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Bot className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{stats.businesses}</p>
                  <p className="text-xs text-slate-600">עסקים פעילים</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Prompts */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">פעולות מהירות</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {quickPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => setInputMessage(prompt.text)}
                  className={`w-full text-right p-4 rounded-xl bg-gradient-to-r ${prompt.color} text-white hover:shadow-lg transition-all duration-300 hover:scale-105 group`}
                >
                  <div className="flex items-start gap-3">
                    <prompt.icon className="w-5 h-5 mt-0.5 group-hover:rotate-12 transition-transform" />
                    <span className="text-sm font-medium leading-snug">{prompt.text}</span>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Chat Interface */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-purple-600" />
                שיחה עם ה-AI
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Messages */}
              <div className="h-96 overflow-y-auto bg-slate-50 rounded-xl p-4 space-y-3">
                {messages.length === 0 && (
                  <div className="text-center text-slate-500 py-12">
                    <Sparkles className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p className="font-medium">התחל שיחה עם הסוכן</p>
                    <p className="text-sm mt-1">בחר פעולה מהירה או כתוב בקשה מותאמת אישית</p>
                  </div>
                )}
                
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                        <Bot className="w-5 h-5 text-white" />
                      </div>
                    )}
                    <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      msg.role === 'user' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-white border border-slate-200 text-slate-900'
                    }`}>
                      <div className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                      
                      {/* Tool Calls Display */}
                      {msg.tool_calls && msg.tool_calls.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {msg.tool_calls.map((tool, toolIdx) => (
                            <div key={toolIdx} className="bg-slate-50 rounded-lg p-2 text-xs">
                              <div className="flex items-center gap-2 font-mono text-slate-700">
                                {tool.status === 'completed' ? (
                                  <CheckCircle2 className="w-3 h-3 text-green-600" />
                                ) : (
                                  <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
                                )}
                                <span>{tool.name}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {msg.role === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-slate-300 flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-sm">א</span>
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="flex gap-2">
                <Textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="כתוב הנחיה לסוכן ה-AI... למשל: 'צור 5 דפים למסעדות כשרות בביתר עילית'"
                  className="flex-1 min-h-[80px] resize-none"
                  disabled={isLoading}
                />
                <Button 
                  onClick={sendMessage} 
                  disabled={!inputMessage.trim() || isLoading}
                  className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </Button>
              </div>

              <Alert className="bg-blue-50 border-blue-200">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-sm text-blue-900">
                  <strong>טיפ:</strong> ספר לסוכן באיזו עיר, כשרות או תת-קטגוריה להתמקד. הסוכן ייצור דפים אופטימליים עם תוכן SEO מלא.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>

        {/* Examples Guide */}
        <Card className="mt-6 bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              דוגמאות לבקשות
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2 text-sm text-slate-700">
              <div className="flex items-start gap-2">
                <Badge className="bg-blue-100 text-blue-700 mt-0.5">קטגוריה</Badge>
                <span>"צור דפים לכל תתי הקטגוריות של מסעדות בביתר עילית"</span>
              </div>
              <div className="flex items-start gap-2">
                <Badge className="bg-green-100 text-green-700 mt-0.5">כשרות</Badge>
                <span>"יצור דפים למסעדות בשר עם כל רמות הכשרות השונות"</span>
              </div>
              <div className="flex items-start gap-2">
                <Badge className="bg-purple-100 text-purple-700 mt-0.5">עיר</Badge>
                <span>"צור דפים לעסקים בבית שמש לפי קטגוריות"</span>
              </div>
              <div className="flex items-start gap-2">
                <Badge className="bg-orange-100 text-orange-700 mt-0.5">משולב</Badge>
                <span>"נתח את כל השילובים האפשריים של פיצריות + כשרות + ערים ותיצור דפים"</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}