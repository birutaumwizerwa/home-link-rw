import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { initials } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/messages")({
  head: () => ({ meta: [{ title: "Messages" }] }),
  component: MessagesPage,
});

type Chat = { id: string; client_id: string; vendor_id: string; listing_id: string | null; last_message: string | null; last_message_at: string | null };
type Message = { id: string; chat_id: string; sender_id: string; content: string; created_at: string };

function MessagesPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: chats } = useQuery<Chat[]>({
    queryKey: ["chats", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("chats").select("*").or(`client_id.eq.${user!.id},vendor_id.eq.${user!.id}`).order("last_message_at", { ascending: false, nullsFirst: false });
      return (data ?? []) as Chat[];
    },
  });

  const { data: messages } = useQuery<Message[]>({
    queryKey: ["messages", activeId],
    enabled: !!activeId,
    queryFn: async () => {
      const { data } = await supabase.from("messages").select("*").eq("chat_id", activeId!).order("created_at");
      return (data ?? []) as Message[];
    },
  });

  useEffect(() => {
    if (!activeId) return;
    const ch = supabase.channel(`chat-${activeId}`).on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `chat_id=eq.${activeId}` }, () => {
      qc.invalidateQueries({ queryKey: ["messages", activeId] });
    }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [activeId, qc]);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }); }, [messages]);

  const send = async () => {
    if (!draft.trim() || !activeId || !user) return;
    const content = draft.trim();
    setDraft("");
    await supabase.from("messages").insert({ chat_id: activeId, sender_id: user.id, content });
    await supabase.from("chats").update({ last_message: content, last_message_at: new Date().toISOString() }).eq("id", activeId);
    qc.invalidateQueries({ queryKey: ["messages", activeId] });
    qc.invalidateQueries({ queryKey: ["chats"] });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
        <h1 className="mb-4 text-2xl font-bold">Messages</h1>
        <div className="grid h-[70vh] gap-0 overflow-hidden rounded-xl border bg-card md:grid-cols-[300px_1fr]">
          <aside className="overflow-y-auto border-r">
            {(chats ?? []).length === 0 && <div className="p-6 text-sm text-muted-foreground">No conversations yet.</div>}
            {(chats ?? []).map((c) => (
              <button key={c.id} onClick={() => setActiveId(c.id)} className={`flex w-full items-center gap-3 border-b p-3 text-left hover:bg-muted ${activeId === c.id ? "bg-muted" : ""}`}>
                <span className="grid h-10 w-10 place-items-center rounded-full bg-primary/15 text-primary text-sm font-semibold">{initials("Chat")}</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">Conversation</div>
                  <div className="truncate text-xs text-muted-foreground">{c.last_message ?? "No messages yet"}</div>
                </div>
              </button>
            ))}
          </aside>
          <section className="flex flex-col">
            {!activeId ? (
              <div className="grid flex-1 place-items-center text-sm text-muted-foreground">Select a conversation</div>
            ) : (
              <>
                <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
                  {(messages ?? []).map((m) => {
                    const mine = m.sender_id === user?.id;
                    return (
                      <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${mine ? "bg-primary text-primary-foreground" : "bg-muted"}`}>{m.content}</div>
                      </div>
                    );
                  })}
                </div>
                <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex gap-2 border-t p-3">
                  <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Type a message..." />
                  <Button type="submit" size="icon" disabled={!draft.trim()}><Send className="h-4 w-4" /></Button>
                </form>
              </>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
