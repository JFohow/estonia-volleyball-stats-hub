import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/player/$playerId")({
    component: PlayerPage,
});

function playerOptions(playerId: number) {
    return queryOptions({
        queryKey: ["player", playerId],
        queryFn: async () => {
            const [{ data: player }, { data: appearances }] =
                await Promise.all([
                    supabase
                        .from("players")
                        .select("*")
                        .eq("player_id", playerId)
                        .single(),

                    supabase
                        .from("appearances")
                        .select(
                            `
              *,
              matches (
                match_id,
                match_date,
                opponent,
                competition,
                estonia_sets,
                opponent_sets
              )
            `
                        )
                        .eq("player_id", playerId),
                ]);

            let captaincies = 0;
            let setsPlayed = 0;
            let setsStarted = 0;

            appearances?.forEach((a) => {
                if (a.captain) captaincies++;
                setsPlayed += a.sets_played ?? 0;
                setsStarted += a.sets_started ?? 0;
            });

            return {
                player,
                appearances: appearances ?? [],
                captaincies,
                setsPlayed,
                setsStarted,
            };
        },
    });
}

function PlayerPage() {
    const { playerId } = Route.useParams();

    const { data } = useSuspenseQuery(
        playerOptions(Number(playerId))
    );

    if (!data.player) {
        return (
            <div className="mx-auto max-w-5xl px-6 py-12">
                Player not found
            </div>
        );
    }

    const p = data.player;

    return (
        <div className="mx-auto max-w-6xl px-6 py-10">
            <div className="rounded-xl border border-slate-200 bg-white p-8">
                <div className="flex flex-col md:flex-row gap-8">
                    <div className="flex h-32 w-32 items-center justify-center rounded-xl bg-estonia-dark text-4xl font-bold text-white">
                        {p.first_name?.[0]}
                        {p.last_name?.[0]}
                    </div>

                    <div className="flex-1">
                        <h1 className="font-display text-4xl uppercase italic">
                            {p.first_name} {p.last_name}
                        </h1>

                        <div className="mt-3 flex flex-wrap gap-2">
                            {p.position && (
                                <span className="rounded bg-estonia-blue/10 px-3 py-1 text-sm font-medium text-estonia-blue">
                                    {p.position}
                                </span>
                            )}

                            {p.height_cm && (
                                <span className="rounded bg-slate-100 px-3 py-1 text-sm">
                                    {p.height_cm} cm
                                </span>
                            )}

                            {p.handedness && (
                                <span className="rounded bg-slate-100 px-3 py-1 text-sm capitalize">
                                    {p.handedness}-handed
                                </span>
                            )}
                        </div>

                        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
                            <StatCard
                                label="Appearances"
                                value={data.appearances.length}
                            />

                            <StatCard
                                label="Sets Played"
                                value={data.setsPlayed}
                            />

                            <StatCard
                                label="Sets Started"
                                value={data.setsStarted}
                            />

                            <StatCard
                                label="Captaincies"
                                value={data.captaincies}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <section className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white">
                <div className="border-b border-slate-100 px-6 py-4">
                    <h2 className="font-display text-xl uppercase italic">
                        Match History
                    </h2>
                </div>

                <div className="divide-y divide-slate-100">
                    {data.appearances
                        .sort((a: any, b: any) =>
                            (b.matches?.match_date ?? "").localeCompare(
                                a.matches?.match_date ?? ""
                            )
                        )
                        .map((appearance: any) => (
                            <div
                                key={appearance.appearance_id}
                                className="flex items-center justify-between px-6 py-4"
                            >
                                <div>
                                    <div className="font-semibold">
                                        vs {appearance.matches?.opponent}
                                    </div>

                                    <div className="text-sm text-slate-500">
                                        {appearance.matches?.competition ?? "—"}
                                    </div>

                                    <div className="mt-1 text-xs text-slate-400">
                                        {appearance.matches?.match_date}
                                    </div>
                                </div>

                                <div className="text-right">
                                    <div className="font-bold">
                                        {appearance.matches?.estonia_sets}
                                        {" - "}
                                        {appearance.matches?.opponent_sets}
                                    </div>

                                    <div className="text-xs text-slate-500">
                                        {appearance.sets_played} sets played
                                    </div>
                                </div>
                            </div>
                        ))}
                </div>
            </section>
        </div>
    );
}

function StatCard({
    label,
    value,
}: {
    label: string;
    value: number;
}) {
    return (
        <div className="rounded-lg border border-slate-200 p-4">
            <div className="font-display text-3xl">
                {value.toLocaleString()}
            </div>

            <div className="mt-1 text-xs font-bold uppercase text-slate-400">
                {label}
            </div>
        </div>
    );
}