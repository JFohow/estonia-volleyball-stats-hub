import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type RecentMatch = {
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
  match_sets: {
    set_number: number;
    estonia_points: number;
    opponent_points: number;
  }[];
};

export type HomeSummary = {
  totalMatches: number;
  totalPlayers: number;
  totalAppearances: number;
  totalSets: number;
  recentMatches: RecentMatch[];
  topAppearance: {
    first_name: string;
    last_name: string;
    position: string | null;
    matches: number;
    sets: number;
  } | null;
  statsCoverage: {
    matchesWithStats: number;
    totalMatches: number;
  };
};

async function fetchHomeSummary(): Promise<HomeSummary> {
  const { data: matchList } = await supabase.from("matches").select("match_id");
  const filteredMatchIds = (matchList ?? []).map((m) => m.match_id);
  const totalMatches = filteredMatchIds.length;

  const [playersCount, apps, sets, recent, statCoverage] = await Promise.all([
    supabase.from("players").select("*", { count: "exact", head: true }),
    filteredMatchIds.length
      ? supabase.from("appearances").select("player_id, sets_played, match_id").in("match_id", filteredMatchIds)
      : Promise.resolve({ data: [] as any[] }),
    filteredMatchIds.length
      ? supabase.from("match_sets").select("match_set_id", { count: "exact", head: true }).in("match_id", filteredMatchIds)
      : Promise.resolve({ count: 0 }),
    supabase
      .from("matches")
      .select(
        "match_id, match_date, opponent, competition, city, estonia_sets, opponent_sets, match_type, has_additional_sets, additional_sets_count, match_sets(set_number, estonia_points, opponent_points)",
      )
      .order("match_date", { ascending: false })
      .limit(6),
    filteredMatchIds.length
      ? supabase
          .from("player_match_stats")
          .select("appearance_id, appearances!inner(match_id)", { count: "exact", head: true })
          .in("appearances.match_id", filteredMatchIds)
      : Promise.resolve({ count: 0 }),
  ]);

  const totalPlayers = playersCount.count ?? 0;
  const totalAppearances = (apps as any).data?.length ?? 0;
  const totalSets = (sets as any).count ?? 0;

  let topAppearance: HomeSummary["topAppearance"] = null;
  const appsData = (apps as any).data as { player_id: number; sets_played: number | null }[] | undefined;
  if (appsData && appsData.length) {
    const agg = new Map<number, { matches: number; sets: number }>();
    for (const a of appsData) {
      const cur = agg.get(a.player_id) ?? { matches: 0, sets: 0 };
      cur.matches += 1;
      cur.sets += a.sets_played ?? 0;
      agg.set(a.player_id, cur);
    }
    const sorted = [...agg.entries()].sort((a, b) => b[1].matches - a[1].matches);
    if (sorted.length) {
      const [topId, top] = sorted[0];
      const { data: p } = await supabase
        .from("players")
        .select("first_name, last_name, position")
        .eq("player_id", topId)
        .maybeSingle();
      if (p) topAppearance = { ...p, matches: top.matches, sets: top.sets };
    }
  }

  return {
    totalMatches,
    totalPlayers,
    totalAppearances,
    totalSets,
    recentMatches: ((recent.data ?? []) as unknown) as RecentMatch[],
    topAppearance,
    statsCoverage: {
      matchesWithStats: (statCoverage as any).count ?? 0,
      totalMatches,
    },
  };
}

export const homeSummaryOptions = () =>
  queryOptions({
    queryKey: ["home-summary"],
    queryFn: () => fetchHomeSummary(),
  });
