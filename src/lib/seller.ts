import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useMyShop(userId: string) {
  return useQuery({
    queryKey: ["my-shop", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("sellers").select("*").eq("user_id", userId).single();
      if (error) throw error;
      return data;
    },
  });
}
