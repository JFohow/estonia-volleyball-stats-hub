import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type GameHighRow = {
  appearanceId: number;
  matchId: number;
  playerId: number;
  name: string;
  position: string | null;
  points: number;
  serveTotal: number | null;
  serveAces: number | null;
  serveErrors: number | null;
  receptionTotal: number | null;
  receptionErrors: number | null;
  receptionPositivePct: number | null;
  receptionExcellentPct: number | null;
  attackTotal: number | null;
  attackErrors: number | null;
  attackBlocked: number | null;
  attackKills: number | null;
  attackKillPct: number | null;
  attackEfficiency: number | null;
  blockPoints: number | null;
  opponent: string;
  competition: string | null;
  matchDate: string;
  score: string;
  vm: boolean | null;
  am: boolean | null;
  mam: boolean | null;
};

type GameHighAppearanceRow = {
  appearance_id: number;
  player_position_in_match: string | null;
  match_id: number;
  players:
    | {
        player_id: number;
        first_name: string;
        last_name: string;
        position: string | null;
      }
    | Array<{
        player_id: number;
        first_name: string;
        last_name: string;
        position: string | null;
      }>
    | null;
  player_match_stats:
    | {
        points: number | null;
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
        block_points: number | null;
      }
    | Array<{
        points: number | null;
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
        block_points: number | null;
      }>
    | null;
};

type MatchRow = {
  match_id: number;
  match_date: string;
  opponent: string;
  competition: string | null;
  estonia_sets: number;
  opponent_sets: number;
  vm: boolean | null;
  am: boolean | null;
  mam: boolean | null;
};

function normalizeRelation<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }
  return value;
}

async function fetchGameHighs(): Promise<GameHighRow[]> {
  const { data, error } = await supabase
    .from("appearances")
    .select(
      `appearance_id, player_position_in_match, match_id, players(player_id, first_name, last_name, position), player_match_stats(points, serve_total, serve_aces, serve_errors, reception_total, reception_errors, reception_positive_pct, reception_excellent_pct, attack_total, attack_errors, attack_blocked, attack_kills, attack_kill_pct, attack_efficiency, block_points)`
    );

  if (error) throw error;

  const appearanceRows = (data ?? []) as GameHighAppearanceRow[];
  const matchIds = [...new Set(appearanceRows.map((item) => item.match_id))];

  const { data: matchesData, error: matchError } = await supabase
    .from("matches")
    .select("match_id, match_date, opponent, competition, estonia_sets, opponent_sets, vm, am, mam")
    .in("match_id", matchIds);

  if (matchError) throw matchError;

  const matchesById = new Map(
    ((matchesData ?? []) as MatchRow[]).map((match) => [match.match_id, match])
  );

  const rows: GameHighRow[] = [];

  for (const item of appearanceRows) {
    const player = normalizeRelation(item.players);
    const match = matchesById.get(item.match_id);
    const stats = normalizeRelation(item.player_match_stats);

    if (!player || !match || !stats || stats.points == null) {
      continue;
    }

    rows.push({
      appearanceId: item.appearance_id,
      matchId: item.match_id,
      playerId: player.player_id,
      name: `${player.first_name} ${player.last_name}`,
      position: player.position ?? item.player_position_in_match ?? "Unknown",
      points: stats.points,
      serveTotal: stats.serve_total,
      serveAces: stats.serve_aces,
      serveErrors: stats.serve_errors,
      receptionTotal: stats.reception_total,
      receptionErrors: stats.reception_errors,
      receptionPositivePct: stats.reception_positive_pct,
      receptionExcellentPct: stats.reception_excellent_pct,
      attackTotal: stats.attack_total,
      attackErrors: stats.attack_errors,
      attackBlocked: stats.attack_blocked,
      attackKills: stats.attack_kills,
      attackKillPct: stats.attack_kill_pct,
      attackEfficiency: stats.attack_efficiency,
      blockPoints: stats.block_points,
      opponent: match.opponent,
      competition: match.competition,
      matchDate: match.match_date,
      score: `${match.estonia_sets}-${match.opponent_sets}`,
      vm: match.vm,
      am: match.am,
      mam: match.mam,
    });
  }

  return rows.sort((a, b) => b.points - a.points);
}

export const gameHighsOptions = () =>
  queryOptions({
    queryKey: ["game-highs"],
    queryFn: fetchGameHighs,
  });
