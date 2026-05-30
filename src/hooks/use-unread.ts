import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export function useUnreadCount() {
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ["unread", user?.id],
    enabled: !!user,
    refetchInterval: 30000,
    queryFn: async () => {
      const { data } = await supabase
        .from("chats")
        .select("client_unread, vendor_unread, client_id, vendor_id")
        .or(`client_id.eq.${user!.id},vendor_id.eq.${user!.id}`);
      return (data ?? []).reduce((sum, c) => {
        if (c.client_id === user!.id) return sum + (c.client_unread ?? 0);
        return sum + (c.vendor_unread ?? 0);
      }, 0);
    },
  });
  return data ?? 0;
}
