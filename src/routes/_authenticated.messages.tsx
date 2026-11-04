import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, initials } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/messages")({
  head: () => ({ meta: [{ title: "Messages | HomeLink Rwanda" }] }),
  component: MessagesPage,
});

type Chat = {
  id: string;
  client_id: string;
  vendor_id: string;
  listing_id: string | null;
  last_message: string | null;
  last_message_at: string | null;
  client_unread: number;
  vendor_unread: number;
  listing: { title: string; cover_image_url: string | null } | null;
};

function MessagesPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: chats, isLoading } = useQuery({
    queryKey: ["chats", user?.id],
    refetchInterval: 15000,
    queryFn: async () => {
      const { data } = await supabase
        .from("chats")
        .select("*, listing:listings(title, cover_image_url)")
        .or(`client_id.eq.${user!.id},vendor_id.eq.${user!.id}`)
        .order("last_message_at", { ascending: false, nullsFirst: false });
      return (data ?? []) as unknown as Chat[];
    },
  });
  const otherId = (c: Chat) => (c.client_id === user?.id ? c.vendor_id : c.client_id);
  const { data: people } = useQuery({
    queryKey: ["chat-people", chats?.map(otherId).join()],
    enabled: !!chats?.length,
    queryFn: async () =>
      (
        await supabase
          .from("profiles")
          .select("id, full_name, avatar_url")
          .in("id", chats!.map(otherId))
      ).data ?? [],
  });
  const person = (c: Chat) => people?.find((p) => p.id === otherId(c));
  const active = chats?.find((c) => c.id === activeId);

  const { data: messages } = useQuery({
    queryKey: ["messages", activeId],
    enabled: !!activeId,
    queryFn: async () =>
      (await supabase.from("messages").select("*").eq("chat_id", activeId!).order("created_at"))
        .data ?? [],
  });

  useEffect(() => {
    if (!activeId) return;
    void supabase.rpc("mark_chat_read", { _chat_id: activeId }).then(() => {
      qc.invalidateQueries({ queryKey: ["unread"] });
      qc.invalidateQueries({ queryKey: ["chats"] });
    });
    const ch = supabase
      .channel(`chat-${activeId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `chat_id=eq.${activeId}` },
        () => qc.invalidateQueries({ queryKey: ["messages", activeId] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [activeId, qc]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = draft.trim();
    if (!content || !activeId || !user) return;
    setDraft("");
    const { error } = await supabase
      .from("messages")
      .insert({ chat_id: activeId, sender_id: user.id, content });
    if (error) {
      setDraft(content);
      toast.error(t("chat.sendFailed"));
      return;
    }
    qc.invalidateQueries({ queryKey: ["messages", activeId] });
    qc.invalidateQueries({ queryKey: ["chats"] });
  };

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      <h1 className="mb-4 text-3xl font-bold">{t("nav.messages")}</h1>
      <div className="grid h-[calc(100vh-13rem)] min-h-[420px] overflow-hidden rounded-lg border bg-card md:grid-cols-[320px_1fr]">
        <aside className={`min-h-0 overflow-y-auto border-r ${activeId ? "hidden md:block" : ""}`}>
          {!isLoading && !chats?.length && (
            <div className="p-6 text-center">
              <p className="text-muted-foreground">{t("chat.empty")}</p>
              <Button asChild className="mt-3" size="sm">
                <Link to="/search">{t("listing.searchHomes")}</Link>
              </Button>
            </div>
          )}
          {chats?.map((c) => {
            const unread = c.client_id === user?.id ? c.client_unread : c.vendor_unread;
            const p = person(c);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setActiveId(c.id)}
                aria-current={activeId === c.id}
                className={`flex w-full items-center gap-3 border-b p-3 text-left hover:bg-muted ${activeId === c.id ? "bg-muted" : ""}`}
              >
                {p?.avatar_url ? (
                  <img src={p.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground">
                    {initials(p?.full_name)}
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="flex justify-between gap-2">
                    <span className={`truncate text-sm ${unread ? "font-bold" : "font-medium"}`}>
                      {p?.full_name ?? t("listing.vendor")}
                    </span>
                    {c.last_message_at && (
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {new Date(c.last_message_at).toLocaleDateString(
                          i18n.resolvedLanguage === "rw" ? "en" : i18n.resolvedLanguage,
                          { day: "numeric", month: "short" },
                        )}
                      </span>
                    )}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {c.listing?.title}
                  </span>
                  <span className="block truncate text-sm text-muted-foreground">
                    {c.last_message ?? t("chat.noMessages")}
                  </span>
                </span>
                {unread > 0 && (
                  <span className="rounded-full bg-primary px-1.5 text-xs font-bold text-primary-foreground">
                    {unread}
                  </span>
                )}
              </button>
            );
          })}
        </aside>
        <section className={`min-h-0 flex-col ${activeId ? "flex" : "hidden md:flex"}`}>
          {!active ? (
            <div className="grid flex-1 place-items-center p-6 text-muted-foreground">
              {t("chat.select")}
            </div>
          ) : (
            <>
              <header className="flex items-center gap-2 border-b p-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  aria-label={t("chat.back")}
                  onClick={() => setActiveId(null)}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="min-w-0">
                  <p className="truncate font-semibold">{person(active)?.full_name}</p>
                  {active.listing_id && (
                    <Link
                      to="/listing/$id"
                      params={{ id: active.listing_id }}
                      className="block truncate text-sm text-primary hover:underline"
                    >
                      {active.listing?.title}
                    </Link>
                  )}
                </div>
              </header>
              <div
                ref={scrollRef}
                className="flex-1 space-y-2 overflow-y-auto p-4"
                aria-live="polite"
              >
                {messages?.length === 0 && (
                  <p className="text-center text-muted-foreground">{t("chat.start")}</p>
                )}
                {messages?.map((m) => {
                  const mine = m.sender_id === user?.id;
                  return (
                    <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[75%] rounded-lg px-3 py-2 ${mine ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                      >
                        <p className="whitespace-pre-wrap break-words">{m.content}</p>
                        <p
                          className={`mt-0.5 text-xs ${mine ? "text-white/70" : "text-muted-foreground"}`}
                        >
                          {formatDate(m.created_at, i18n.resolvedLanguage, true)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <form onSubmit={send} className="flex gap-2 border-t p-3">
                <Input
                  value={draft}
                  aria-label={t("chat.placeholder")}
                  placeholder={t("chat.placeholder")}
                  onChange={(e) => setDraft(e.target.value)}
                />
                <Button
                  type="submit"
                  size="icon"
                  aria-label={t("chat.send")}
                  disabled={!draft.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
