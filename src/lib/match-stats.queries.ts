import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type MatchDetails = Awaited<
    ReturnType<
        NonNullable<ReturnType<typeof matchOptions>["queryFn"]>
    >
>;

export function matchOptions(matchId: number) {
    return queryOptions({
        queryKey: ["match-stats", matchId],

        queryFn: async () => {
            const { data, error } = await supabase
                .from("matches")
                .select(`
          *,
          match_sets (
            *
          )
        `)
                .eq("match_id", matchId)
                .single();

            if (error) {
                throw error;
            }

            return data;
        },
    });
}