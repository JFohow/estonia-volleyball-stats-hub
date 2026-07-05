import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type PlayerListItem = {
    player_id: number;
    first_name: string;
    last_name: string;
    position: string | null;
    photo_url: string | null;

    appearances: number;
    gamesPlayed: number;
    bench: number;
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
      on_the_bench
    `);

    const stats = new Map<
        number,
        {
            appearances: number;
            gamesPlayed: number;
            bench: number;
        }
    >();

    (apps ?? []).forEach((a) => {
        const current = stats.get(a.player_id) ?? {
            appearances: 0,
            gamesPlayed: 0,
            bench: 0,
        };

        current.appearances += 1;

        if ((a.sets_played ?? 0) > 0)
            current.gamesPlayed += 1;

        if (a.on_the_bench)
            current.bench += 1;

        stats.set(a.player_id, current);
    });

    return (players ?? [])
        .map((p) => ({
            ...p,
            appearances: stats.get(p.player_id)?.appearances ?? 0,
            gamesPlayed: stats.get(p.player_id)?.gamesPlayed ?? 0,
            bench: stats.get(p.player_id)?.bench ?? 0,
        }))
        .sort((a, b) => b.appearances - a.appearances);
}

export const playersOptions = () =>
    queryOptions({
        queryKey: ["players"],
        queryFn: fetchPlayers,
    });