import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type PlayerListItem = {
    player_id: number;
    first_name: string;
    last_name: string;
    position: string | null;
    photo_url: string | null;

    amAppearances: number;
    amGamesPlayed: number;
    amBench: number;

    vmAppearances: number;
    vmGamesPlayed: number;
    vmBench: number;

    allAppearances: number;
    allGamesPlayed: number;
    allBench: number;
};

async function fetchPlayers(): Promise<PlayerListItem[]> {
    const { data: players, error } = await supabase
        .from("players")
        .select(`
      player_id,
      first_name,
      last_name,
      position,
      photo_url
    `);

    if (error) throw error;

    const { data: apps } = await supabase
        .from("appearances")
        .select(`
      player_id,
      sets_played,
      on_the_bench,
      matches(
        vm,
        am,
        mam
      )
    `);

    const stats = new Map<
        number,
        {
            amAppearances: number;
            amGamesPlayed: number;
            amBench: number;

            vmAppearances: number;
            vmGamesPlayed: number;
            vmBench: number;

            allAppearances: number;
            allGamesPlayed: number;
            allBench: number;
        }
    >();

    (apps ?? []).forEach((a) => {
        const match = Array.isArray(a.matches)
            ? a.matches[0]
            : a.matches;

        const current = stats.get(a.player_id) ?? {
            amAppearances: 0,
            amGamesPlayed: 0,
            amBench: 0,

            vmAppearances: 0,
            vmGamesPlayed: 0,
            vmBench: 0,

            allAppearances: 0,
            allGamesPlayed: 0,
            allBench: 0,
        };

        // Official (AM)

        if (match?.am) {
            current.amAppearances += 1;

            if ((a.sets_played ?? 0) > 0) {
                current.amGamesPlayed += 1;
            }

            if (a.on_the_bench) {
                current.amBench += 1;
            }
        }

        // Competitive (VM)

        if (match?.vm) {
            current.vmAppearances += 1;

            if ((a.sets_played ?? 0) > 0) {
                current.vmGamesPlayed += 1;
            }

            if (a.on_the_bench) {
                current.vmBench += 1;
            }
        }

        // All Matches (AM + MAM)

        if (match?.am || match?.mam) {
            current.allAppearances += 1;

            if ((a.sets_played ?? 0) > 0) {
                current.allGamesPlayed += 1;
            }

            if (a.on_the_bench) {
                current.allBench += 1;
            }
        }

        stats.set(a.player_id, current);
    });

    return (players ?? [])
        .map((p) => ({
            ...p,

            amAppearances:
                stats.get(p.player_id)?.amAppearances ?? 0,

            amGamesPlayed:
                stats.get(p.player_id)?.amGamesPlayed ?? 0,

            amBench:
                stats.get(p.player_id)?.amBench ?? 0,

            vmAppearances:
                stats.get(p.player_id)?.vmAppearances ?? 0,

            vmGamesPlayed:
                stats.get(p.player_id)?.vmGamesPlayed ?? 0,

            vmBench:
                stats.get(p.player_id)?.vmBench ?? 0,

            allAppearances:
                stats.get(p.player_id)?.allAppearances ?? 0,

            allGamesPlayed:
                stats.get(p.player_id)?.allGamesPlayed ?? 0,

            allBench:
                stats.get(p.player_id)?.allBench ?? 0,
        }))
        .sort(
            (a, b) =>
                b.amAppearances - a.amAppearances
        );
}

export const playersOptions = () =>
    queryOptions({
        queryKey: ["players"],
        queryFn: fetchPlayers,
    });

export async function fetchPlayer(playerId: number) {
    const { data: player, error } = await supabase
        .from("players")
        .select("*")
        .eq("player_id", playerId)
        .single();

    if (error) throw error;

    const { data: appearances, error: appError } = await supabase
        .from("appearances")
        .select(`
      *,
      matches(
        match_id,
        match_date,
        opponent,
        competition,
        estonia_sets,
        opponent_sets,
        vm,
        am,
        mam
      )
    `)
        .eq("player_id", playerId);

    if (appError) throw appError;

    return {
        player,
        appearances: appearances ?? [],
    };
}

export const playerOptions = (playerId: number) =>
    queryOptions({
        queryKey: ["player", playerId],
        queryFn: () => fetchPlayer(playerId),
    });