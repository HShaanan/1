import React from "react";
import { agentSDK } from "@/agents";
import { User } from "@/entities/User";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, MessageSquare, Lock, Unlock, RefreshCw } from "lucide-react";

export default function AdminSupport() {
  const [me, setMe] = React.useState(null);
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [refreshing, setRefreshing] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      try {
        const u = await User.me().catch(() => null);
        if (!u || u.role !== "admin") {
          await User.loginWithRedirect(window.location.href);
          return;
        }
        setMe(u);
        await loadConversations();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const loadConversations = async () => {
    try {
      setRefreshing(true);
      const list = agentSDK.listConversations({ agent_name: "support_agent" }) || [];
      // Sort by recent (if available)
      setItems(
        list.slice().sort((a, b) => {
          const ta = new Date(a?.updated_at || a?.created_at || 0).getTime();
          const tb = new Date(b?.updated_at || b?.created_at || 0).getTime();
          return tb - ta;
        })
      );
    } finally {
      setRefreshing(false);
    }
  };

  const toggleStatus = (conv) => {
    const id = conv?.id || conv?.conversation_id;
    if (!id) return;
    const meta = conv?.metadata || {};
    const closing = (meta.status || "open") !== "closed";
    const updated = {
      ...meta,
      status: closing ? "closed" : "open",
      closed_by: closing ? me?.email : null,
      closed_at: closing ? new Date().toISOString() : null
    };
    try {
      agentSDK.updateConversation(id, { metadata: updated });
      // Update local list optimistically
      setItems(prev => prev.map(c => ( (c.id||c.conversation_id) === id ? { ...c, metadata: updated } : c )));
    } catch (e) {
      console.error("Failed to update conversation:", e);
    }
  };

  const filtered = items.filter((c) => {
    const meta = c?.metadata || {};
    const q = search.trim().toLowerCase();
    const byStatus = statusFilter === "all" || (meta.status || "open") === statusFilter;
    if (!q) return byStatus;
    const hay = [
      meta?.name, meta?.user_name, meta?.user_email, meta?.key,
      c?.id, c?.conversation_id
    ].map(x => String(x || "").toLowerCase()).join(" ");
    return byStatus && hay.includes(q);
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-600">
          <RefreshCw className="w-5 h-5 animate-spin" /> טוען שיחות...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8" dir="rtl">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-indigo-600" />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">ניהול שיחות בוט</h1>
              <p className="text-slate-600 text-sm">סגירה/פתיחה של שיחות + חיפוש לפי שם/אימייל/מפתח</p>
            </div>
          </div>
          <Button variant="outline" onClick={loadConversations} disabled={refreshing} className="gap-2">
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            רענן
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="חיפוש לפי שם, מייל או מפתח..."
                  className="pr-9"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={statusFilter === "all" ? "default" : "outline"}
                  onClick={() => setStatusFilter("all")}
                >
                  הכל
                </Button>
                <Button
                  variant={statusFilter === "open" ? "default" : "outline"}
                  onClick={() => setStatusFilter("open")}
                >
                  פתוחות
                </Button>
                <Button
                  variant={statusFilter === "closed" ? "default" : "outline"}
                  onClick={() => setStatusFilter("closed")}
                >
                  סגורות
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {filtered.length === 0 ? (
              <div className="text-center text-slate-500 py-10">אין שיחות להצגה</div>
            ) : (
              filtered.map((c) => {
                const id = c?.id || c?.conversation_id;
                const meta = c?.metadata || {};
                const status = meta.status || "open";
                return (
                  <div key={id} className="flex items-center justify-between p-3 rounded-xl border bg-white">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold truncate">{meta.name || "שיחת תמיכה"}</span>
                        <Badge variant={status === "closed" ? "secondary" : "outline"}>
                          {status === "closed" ? "סגורה" : "פתוחה"}
                        </Badge>
                      </div>
                      <div className="text-sm text-slate-600 mt-0.5 truncate">
                        {meta.user_name || "—"} · {meta.user_email || meta.key || "—"}
                      </div>
                      <div className="text-xs text-slate-400 truncate">ID: {id}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {status === "closed" ? (
                        <Button variant="outline" onClick={() => toggleStatus(c)} className="gap-2">
                          <Unlock className="w-4 h-4" /> פתח
                        </Button>
                      ) : (
                        <Button onClick={() => toggleStatus(c)} className="gap-2">
                          <Lock className="w-4 h-4" /> סגור
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}