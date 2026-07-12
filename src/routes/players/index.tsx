import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
    playersOptions,
    type PlayerListItem,
} from "@/lib/players.queries";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "@tanstack/react-router";
import { Outlet } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/players/")({
    component: PlayersPage,
});

function PlayersPage() {

    const { t } = useTranslation();

    const { data: players } = useSuspenseQuery(playersOptions());

    const [search, setSearch] = useState("");

    const positionOrder = ["SET", "OPP", "OH", "MB", "LIB", "Unknown"];

    const positionCounts = useMemo(() => {
        const counts = new Map<string, number>();

        players.forEach((p) => {
            const pos = p.position ?? "Unknown";
            counts.set(pos, (counts.get(pos) ?? 0) + 1);
        });



        return [...counts.entries()].sort(
            ([a], [b]) =>
                positionOrder.indexOf(a) - positionOrder.indexOf(b)
        );
    }, [players]);

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
                        {t("players.title")}
                    </h1>

                    <p className="mt-2 max-w-2xl text-sm text-white/60">
                        {t("players.subtitle")}
                    </p>

                    <div className="mt-8 grid gap-4 md:grid-cols-6">
                        <div className="rounded-lg border border-white/20 bg-white/5 p-4">
                            <div className="text-center text-[10px] uppercase tracking-[0.2em] text-white/60">
                                {t("players.totalPlayers")}
                            </div>
                            <div className="mt-2 text-center font-display text-3xl">
                                {players.length}
                            </div>
                        </div>

                        {positionCounts.map(([position, count]) => (
                            <div
                                key={position}
                                className="rounded-lg border border-white/20 bg-white/5 p-4"
                            >
                                <div className="text-center text-[10px] uppercase tracking-[0.2em] text-white/60">
                                    {t(`players.positions.${position}`)}
                                </div>

                                <div className="mt-2 text-center font-display text-3xl">
                                    {count}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-7xl px-6 py-10">
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t("players.search")}
                    className="mb-6 w-full max-w-sm rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-estonia-blue"
                />

                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="grid grid-cols-12 gap-3 border-b border-slate-100 bg-slate-50 px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                        <div className="col-span-5">{t("players.player")}</div>
                        <div className="col-span-2 text-center">{t("players.appearances")}</div>
                        <div className="col-span-2 text-center">{t("players.gamesPlayed")}</div>
                        <div className="col-span-2 text-center">{t("players.bench")}</div>
                        <div className="col-span-1 text-center">{t("players.pos")}</div>
                    </div>

                    {filtered.length === 0 ? (
                        <div className="p-12 text-center">
                            <p className="font-display text-xl uppercase italic text-slate-400">
                                {t("players.noPlayersFound")}
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
            <Outlet />
        </div>
    );
}

function getPlayerPhotoUrl(playerId: number) {
    const { data } = supabase.storage
        .from("player-photos")
        .getPublicUrl(`${playerId}.jpg`);

    return data.publicUrl;
}

function PlayerRow({
    player,
}: {
    player: PlayerListItem;
}) {
    return (
        <div className="grid grid-cols-12 gap-3 border-t border-slate-100 px-6 py-4 transition-colors hover:bg-slate-50">
            <div className="col-span-5 flex items-center gap-3">
                <PlayerAvatar player={player} />

                <div>
                    <Link
                        to="/players/$playerId"
                        params={{
                            playerId: String(player.player_id),
                        }}
                        className="font-semibold uppercase hover:text-estonia-blue"
                    >
                        {player.first_name} {player.last_name}
                    </Link>
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
function PlayerAvatar({
    player,
}: {
    player: PlayerListItem;
}) {
    const [showFallback, setShowFallback] = useState(false);

    const photoUrl = getPlayerPhotoUrl(player.player_id);

    if (showFallback) {
        return (
            <div className="grid h-10 w-10 place-items-center rounded-full bg-estonia-dark text-sm font-bold text-white">
                {player.first_name[0]}
                {player.last_name[0]}
            </div>
        );
    }

    return (
        <img
            src={photoUrl}
            alt={`${player.first_name} ${player.last_name}`}
            className="h-10 w-10 rounded-full object-cover"
            onError={() => setShowFallback(true)}
        />
    );
}