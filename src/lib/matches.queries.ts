import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type MatchListItem = {
  match_id: number;
  match_date: string;
  opponent: string;
  competition: string | null;
  city: string | null;
  notes: string | null;
  estonia_sets: number;
  opponent_sets: number;
  vm: boolean | null;
  am: boolean | null;
  mam: boolean | null;
  has_additional_sets: boolean;
  additional_sets_count: number;
};

async function fetchAllMatches(): Promise<MatchListItem[]> {
  const { data, error } = await supabase
    .from("matches")
    .select(
      "match_id, match_date, opponent, competition, city, notes, estonia_sets, opponent_sets, vm, am, mam, has_additional_sets, additional_sets_count",
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
