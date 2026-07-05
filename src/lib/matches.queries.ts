import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type MatchListItem = {
  match_id: number;
  match_date: string;
  opponent: string;
  competition: string | null;
  city: string | null;
  estonia_sets: number;
  opponent_sets: number;
  match_type: "VM" | "AM" | "MAM";
  has_additional_sets: boolean;
  additional_sets_count: number;
};

async function fetchAllMatches(): Promise<MatchListItem[]> {
  const { data, error } = await supabase
    .from("matches")
    .select(
      "match_id, match_date, opponent, competition, city, estonia_sets, opponent_sets, match_type, has_additional_sets, additional_sets_count",
    )
    .order("match_date", { ascending: false });
  if (error) throw error;
  return (data ?? []) as MatchListItem[];
}

export const allMatchesOptions = () =>
  queryOptions({
    queryKey: ["matches", "all"],
    queryFn: fetchAllMatches,
  });
