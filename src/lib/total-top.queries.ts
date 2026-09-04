import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type PlayerTotals = {
  appearances: number;
  games: number;
  sets: number;
  bench: number;
  points: number;
  blockPoints: number;
  plusMinus: number;
  serveTotal: number;
  serveAces: number;
  serveErrors: number;
  receptionTotal: number;
  receptionErrors: number;
  receptionPositivePct: number;
  receptionExcellentPct: number;
  attackTotal: number;
  attackErrors: number;
  attackBlocked: number;
  attackKills: number;
  attackKillPct: number;
  attackEfficiency: number;
  breakPoints: number;
};

export type TotalTopRow = {
  playerId: number;
  name: string;
  position: string | null;
  photoUrl: string | null;
  official: PlayerTotals;
  competitive: PlayerTotals;
  nonOfficial: PlayerTotals;
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
    block_points: number | null;
    plus_minus: number | null;
    serve_total: number | null;
    serve_aces: number | null;
    serve_errors: number | null;
    reception_total: number | null;
    reception_errors: number | null;
    reception_positive_pct: number | null;
    reception_excellent_pct: number | null;
    attack_total: number | null;
    attack_errors: number | null;
    attack_blocked: number | null;
    attack_kills: number | null;
    attack_kill_pct: number | null;
    attack_efficiency: number | null;
    break_points: number | null;
  }
  | Array<{
    points: number | null;
    block_points: number | null;
    plus_minus: number | null;
    serve_total: number | null;
    serve_aces: number | null;
    serve_errors: number | null;
    reception_total: number | null;
    reception_errors: number | null;
    reception_positive_pct: number | null;
    reception_excellent_pct: number | null;
    attack_total: number | null;
    attack_errors: number | null;
    attack_blocked: number | null;
    attack_kills: number | null;
    attack_kill_pct: number | null;
    attack_efficiency: number | null;
    break_points: number | null;
  }>
  | null;
};

type PlayerMatchStatsRow = {
  points: number | null;
  block_points: number | null;
  plus_minus: number | null;
  serve_total: number | null;
  serve_aces: number | null;
  serve_errors: number | null;
  reception_total: number | null;
  reception_errors: number | null;
  reception_positive_pct: number | null;
  reception_excellent_pct: number | null;
  attack_total: number | null;
  attack_errors: number | null;
  attack_blocked: number | null;
  attack_kills: number | null;
  attack_kill_pct: number | null;
  attack_efficiency: number | null;
  break_points: number | null;
};

type PlayerRow = {
  player_id: number;
  first_name: string;
  last_name: string;
  position: string | null;
  photo_url: string | null;
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
    blockPoints: 0,
    plusMinus: 0,
    serveTotal: 0,
    serveAces: 0,
    serveErrors: 0,
    receptionTotal: 0,
    receptionErrors: 0,
    receptionPositivePct: 0,
    receptionExcellentPct: 0,
    attackTotal: 0,
    attackErrors: 0,
    attackBlocked: 0,
    attackKills: 0,
    attackKillPct: 0,
    attackEfficiency: 0,
    breakPoints: 0,
  };
}

function updateTotals(totals: PlayerTotals, appearance: AppearanceRow, stats: PlayerMatchStatsRow) {
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
  totals.blockPoints += stats.block_points ?? 0;
  totals.plusMinus += stats.plus_minus ?? 0;
  totals.serveTotal += stats.serve_total ?? 0;
  totals.serveAces += stats.serve_aces ?? 0;
  totals.serveErrors += stats.serve_errors ?? 0;
  totals.receptionTotal += stats.reception_total ?? 0;
  totals.receptionErrors += stats.reception_errors ?? 0;
  totals.receptionPositivePct += stats.reception_positive_pct ?? 0;
  totals.receptionExcellentPct += stats.reception_excellent_pct ?? 0;
  totals.attackTotal += stats.attack_total ?? 0;
  totals.attackErrors += stats.attack_errors ?? 0;
  totals.attackBlocked += stats.attack_blocked ?? 0;
  totals.attackKills += stats.attack_kills ?? 0;
  totals.breakPoints += stats.break_points ?? 0;
}

function computeAttackKillPct(totals: PlayerTotals): number {
  if (!totals.attackTotal) {
    return 0;
  }
  return (totals.attackKills / totals.attackTotal) * 100;
}

function computeAttackEfficiency(totals: PlayerTotals): number {
  if (!totals.attackTotal) {
    return 0;
  }
  return ((totals.attackKills - totals.attackBlocked - totals.attackErrors) / totals.attackTotal) * 100;
}

async function fetchTotalTop(): Promise<TotalTopRow[]> {
  const playersResponse = await supabase
    .from("players")
    .select("player_id, first_name, last_name, position, photo_url");

  if (playersResponse.error) throw playersResponse.error;

  const appearancesResponse = await supabase
    .from("appearances")
    .select(
      `player_id, sets_played, on_the_bench, matches(vm, am, mam), player_match_stats!inner(points, block_points, plus_minus, serve_total, serve_aces, serve_errors, reception_total, reception_errors, reception_positive_pct, reception_excellent_pct, attack_total, attack_errors, attack_blocked, attack_kills, attack_kill_pct, attack_efficiency, break_points)`
    );

  if (appearancesResponse.error) throw appearancesResponse.error;

  const totalsByPlayer = new Map<number, { official: PlayerTotals; competitive: PlayerTotals; nonOfficial: PlayerTotals; all: PlayerTotals }>();
  const appearances = (appearancesResponse.data ?? []) as AppearanceRow[];

  for (const appearance of appearances) {
    const match = normalizeRelation(appearance.matches);
    const stats = normalizeRelation(appearance.player_match_stats);

    if (!match || !stats) {
      continue;
    }

    const isOfficial = match.am === true;
    const isCompetitive = match.vm === true;
    const isNonOfficial = match.am !== true;

    const totals = totalsByPlayer.get(appearance.player_id) ?? {
      official: createTotals(),
      competitive: createTotals(),
      nonOfficial: createTotals(),
      all: createTotals(),
    };

    if (isOfficial) {
      updateTotals(totals.official, appearance, stats);
    }

    if (isCompetitive) {
      updateTotals(totals.competitive, appearance, stats);
    }

    if (isNonOfficial) {
      updateTotals(totals.nonOfficial, appearance, stats);
    }

    updateTotals(totals.all, appearance, stats);

    totalsByPlayer.set(appearance.player_id, totals);
  }

  const players = (playersResponse.data ?? []) as PlayerRow[];

  const rows: TotalTopRow[] = players.map((player) => {
    const totals = totalsByPlayer.get(player.player_id) ?? {
      official: createTotals(),
      competitive: createTotals(),
      nonOfficial: createTotals(),
      all: createTotals(),
    };

    totals.official.attackKillPct = computeAttackKillPct(totals.official);
    totals.competitive.attackKillPct = computeAttackKillPct(totals.competitive);
    totals.nonOfficial.attackKillPct = computeAttackKillPct(totals.nonOfficial);
    totals.all.attackKillPct = computeAttackKillPct(totals.all);

    totals.official.attackEfficiency = computeAttackEfficiency(totals.official);
    totals.competitive.attackEfficiency = computeAttackEfficiency(totals.competitive);
    totals.nonOfficial.attackEfficiency = computeAttackEfficiency(totals.nonOfficial);
    totals.all.attackEfficiency = computeAttackEfficiency(totals.all);

    return {
      playerId: player.player_id,
      name: `${player.first_name} ${player.last_name}`,
      position: player.position,
      photoUrl: player.photo_url,
      official: totals.official,
      competitive: totals.competitive,
      nonOfficial: totals.nonOfficial,
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
