import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
    playersOptions,
    type PlayerListItem,
} from "@/lib/players.queries";

export const Route = createFileRoute("/players")({
    component: PlayersPage,
});

function PlayersPage() {
    const { data: players } = useSuspenseQuery(playersOptions());

    const [search, setSearch] = useState("");

    const filtered = useMemo(() => {
        const q = search.toLowerCase().trim();

        if (!q) return players;

        return players.filter((p) =>
            `${p.first_name} ${p.last_name}`
                .toLowerCase()
                .includes(q)
        );
    }, [players, search]);

    return (
        <div className="text-slate-900">
            <header className="bg-estonia-dark px-6 py-12 text-white">
                <div className="mx-auto max-w-7xl">

                    <h1 className="mt-2 font-display text-4xl uppercase italic md:text-5xl">
                        Players
                    </h1>

                    <p className="mt-2 max-w-2xl text-sm text-white/60">
                        Every player who has represented the Estonia Men's National Volleyball Team.
                    </p>

                    <div className="mt-8">
                        <div className="border-l-2 border-estonia-blue pl-4">
                            <div className="font-display text-3xl">
                                {players.length}
                            </div>
                            <div className="mt-1 text-[10px] uppercase tracking-widest opacity-60">
                                Players
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-7xl px-6 py-10">
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search player..."
                    className="mb-6 w-full max-w-sm rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-estonia-blue"
                />

                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="grid grid-cols-12 gap-3 border-b border-slate-100 bg-slate-50 px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                        <div className="col-span-5">Player</div>
                        <div className="col-span-2 text-center">Appearances</div>
                        <div className="col-span-2 text-center">Games Played</div>
                        <div className="col-span-2 text-center">On Bench</div>
                        <div className="col-span-1 text-center">Pos</div>
                    </div>

                    {filtered.length === 0 ? (
                        <div className="p-12 text-center">
                            <p className="font-display text-xl uppercase italic text-slate-400">
                                No players found
                            </p>
                        </div>
                    ) : (
                        filtered.map((player) => (
                            <PlayerRow
                                key={player.player_id}
                                player={player}
                            />
                        ))
                    )}
                </div>
            </main>
        </div>
    );
}
function PlayerRow({
    player,
}: {
    player: PlayerListItem;
}) {
    return (
        <div className="grid grid-cols-12 gap-3 border-t border-slate-100 px-6 py-4 transition-colors hover:bg-slate-50">
            <div className="col-span-5 flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-estonia-dark text-sm font-bold text-white">
                    {player.first_name[0]}
                    {player.last_name[0]}
                </div>

                <div>
                    <div className="font-semibold uppercase">
                        {player.first_name} {player.last_name}
                    </div>
                </div>
            </div>

            <div className="col-span-2 text-center font-semibold">
                {player.appearances}
            </div>

            <div className="col-span-2 text-center">
                {player.gamesPlayed}
            </div>

            <div className="col-span-2 text-center">
                {player.bench}
            </div>

            <div className="col-span-1 text-center text-sm text-slate-500">
                {player.position ?? "—"}
            </div>
        </div>
    );
}
