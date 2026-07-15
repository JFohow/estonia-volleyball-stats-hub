import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type PlayerTotals = {
  appearances: number;
  games: number;
  sets: number;
  bench: number;
  points: number;
  pointsPerGame: number;
  efficiencyTop: number | null;
  efficiencyBottom: number | null;
};

export type TotalTopRow = {
  playerId: number;
  name: string;
  position: string | null;
  official: PlayerTotals;
  competitive: PlayerTotals;
  all: PlayerTotals;
};

type AppearanceRow = {
  player_id: number;
  sets_played: number | null;
  on_the_bench: boolean | null;
  matches:
    | {
        vm: boolean | null;
        am: boolean | null;
        mam: boolean | null;
      }
    | Array<{
        vm: boolean | null;
        am: boolean | null;
        mam: boolean | null;
      }>
    | null;
  player_match_stats:
    | {
        points: number | null;
        attack_efficiency: number | null;
      }
    | Array<{
        points: number | null;
        attack_efficiency: number | null;
      }>
    | null;
};

type PlayerRow = {
  player_id: number;
  first_name: string;
  last_name: string;
  position: string | null;
};

function normalizeRelation<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }
  return value;
}

function createTotals(): PlayerTotals {
  return {
    appearances: 0,
    games: 0,
    sets: 0,
    bench: 0,
    points: 0,
    pointsPerGame: 0,
    efficiencyTop: null,
    efficiencyBottom: null,
  };
}

function updateTotals(totals: PlayerTotals, appearance: AppearanceRow, stats: NonNullable<ReturnType<typeof normalizeRelation<AppearanceRow["player_match_stats"]>>>) {
  totals.appearances += 1;
  const sets = appearance.sets_played ?? 0;
  totals.sets += sets;

  if (sets > 0) {
    totals.games += 1;
  }

  if (appearance.on_the_bench) {
    totals.bench += 1;
  }

  totals.points += stats.points ?? 0;

  const efficiency = stats.attack_efficiency;
  if (efficiency != null) {
    totals.efficiencyTop = totals.efficiencyTop === null ? efficiency : Math.max(totals.efficiencyTop, efficiency);
    totals.efficiencyBottom = totals.efficiencyBottom === null ? efficiency : Math.min(totals.efficiencyBottom, efficiency);
  }
}

async function fetchTotalTop(): Promise<TotalTopRow[]> {
  const playersResponse = await supabase
    .from("players")
    .select("player_id, first_name, last_name, position");

  if (playersResponse.error) throw playersResponse.error;

  const appearancesResponse = await supabase
    .from("appearances")
    .select(
      `player_id, sets_played, on_the_bench, matches(vm, am, mam), player_match_stats(points, attack_efficiency)`
    );

  if (appearancesResponse.error) throw appearancesResponse.error;

  const totalsByPlayer = new Map<number, { official: PlayerTotals; competitive: PlayerTotals; all: PlayerTotals }>();
  const appearances = (appearancesResponse.data ?? []) as AppearanceRow[];

  for (const appearance of appearances) {
    const match = normalizeRelation(appearance.matches);
    const stats = normalizeRelation(appearance.player_match_stats);

    if (!match || !stats) {
      continue;
    }

    const isOfficial = match.am === true;
    const isCompetitive = match.vm === true;
    const isAll = match.am === true || match.mam === true;

    if (!isOfficial && !isCompetitive && !isAll) {
      continue;
    }

    const totals = totalsByPlayer.get(appearance.player_id) ?? {
      official: createTotals(),
      competitive: createTotals(),
      all: createTotals(),
    };

    if (isOfficial) {
      updateTotals(totals.official, appearance, stats);
    }

    if (isCompetitive) {
      updateTotals(totals.competitive, appearance, stats);
    }

    if (isAll) {
      updateTotals(totals.all, appearance, stats);
    }

    totalsByPlayer.set(appearance.player_id, totals);
  }

  const players = (playersResponse.data ?? []) as PlayerRow[];

  const rows: TotalTopRow[] = players.map((player) => {
    const totals = totalsByPlayer.get(player.player_id) ?? {
      official: createTotals(),
      competitive: createTotals(),
      all: createTotals(),
    };

    [totals.official, totals.competitive, totals.all].forEach((group) => {
      group.pointsPerGame = group.games > 0 ? Number((group.points / group.games).toFixed(2)) : 0;
    });

    return {
      playerId: player.player_id,
      name: `${player.first_name} ${player.last_name}`,
      position: player.position,
      official: totals.official,
      competitive: totals.competitive,
      all: totals.all,
    };
  });

  return rows.sort((a, b) => b.all.points - a.all.points);
}

export const totalTopOptions = () =>
  queryOptions({
    queryKey: ["total-top"],
    queryFn: fetchTotalTop,
  });
