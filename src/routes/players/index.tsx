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

    const [selectedPositions, setSelectedPositions] =
        useState<string[]>([]);

    function togglePosition(position: string) {
        setSelectedPositions((current) =>
            current.includes(position)
                ? current.filter((p) => p !== position)
                : [...current, position]
        );
    }

    function handleSort(
        field:
            | "amAppearances"
            | "amGamesPlayed"
            | "amBench"
            | "vmAppearances"
            | "vmGamesPlayed"
            | "vmBench"
            | "allAppearances"
            | "allGamesPlayed"
            | "allBench"
    ) {
        if (sortField === field) {
            setSortDirection(
                sortDirection === "asc"
                    ? "desc"
                    : "asc"
            );
        } else {
            setSortField(field);
            setSortDirection("desc");
        }
    }

    function SortIcon(field: string) {
        if (sortField !== field) {
            return " ⇅";
        }

        return sortDirection === "asc"
            ? " ↑"
            : " ↓";
    }

    const [sortField, setSortField] = useState<
        | "amAppearances"
        | "amGamesPlayed"
        | "amBench"
        | "vmAppearances"
        | "vmGamesPlayed"
        | "vmBench"
        | "allAppearances"
        | "allGamesPlayed"
        | "allBench"
    >("amAppearances");

    const [sortDirection, setSortDirection] =
        useState<"asc" | "desc">("desc");

    const positionOrder = ["SET", "OPP", "OH", "MB", "LIB"];

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

        let result = players;

        if (q) {
            result = result.filter((p) =>
                `${p.first_name} ${p.last_name}`
                    .toLowerCase()
                    .includes(q)
            );
        }

        if (selectedPositions.length > 0) {
            result = result.filter((p) =>
                selectedPositions.includes(
                    p.position ?? "Unknown"
                )
            );
        }

        return result;
    }, [players, search, selectedPositions]);

    const sortedPlayers = [...filtered].sort((a, b) => {
        const aValue = Number(a[sortField]);
        const bValue = Number(b[sortField]);

        return sortDirection === "asc"
            ? aValue - bValue
            : bValue - aValue;
    });

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
                                    {t(`positions.${position}`)}
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
                <div className="mb-6 flex flex-wrap items-center gap-3">
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={t("players.search")}
                        className="w-full max-w-sm rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-estonia-blue"
                    />

                    {positionOrder
                        .filter((p) => p !== "Unknown")
                        .map((position) => (
                            <button
                                key={position}
                                type="button"
                                onClick={() => togglePosition(position)}
                                className={`rounded-md border px-3 py-2 text-sm transition-colors ${selectedPositions.includes(position)
                                    ? "border-estonia-blue bg-estonia-blue text-white"
                                    : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                                    }`}
                            >
                                {position}
                            </button>
                        ))}
                </div>

                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

                    <div className="sticky top-0 z-20 border-b border-slate-200 bg-slate-50">

                        <div className="grid grid-cols-13 px-6 pt-4 text-[10px] font-bold uppercase tracking-widest">
                            <div className="col-span-4" />

                            <div className="col-span-3 text-center text-estonia-dark">
                                {t("common.official")}
                            </div>

                            <div className="col-span-3 text-center text-estonia-dark">
                                {t("common.competitive")}
                            </div>

                            <div className="col-span-3 text-center text-estonia-dark">
                                {t("common.allMatches")}
                            </div>
                        </div>

                        <div className="grid grid-cols-13 gap-3 px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">

                            <div className="col-span-4" />

                            <button
                                onClick={() => handleSort("amAppearances")}
                                className={`text-center transition-colors hover:text-estonia-blue ${sortField === "amAppearances"
                                    ? "text-estonia-blue"
                                    : ""
                                    }`}
                            >
                                {t("players.apps").toUpperCase()}{SortIcon("amAppearances")}
                            </button>

                            <button
                                onClick={() => handleSort("amGamesPlayed")}
                                className={`text-center transition-colors hover:text-estonia-blue ${sortField === "amGamesPlayed"
                                    ? "text-estonia-blue"
                                    : ""
                                    }`}
                            >
                                {t("players.gp").toUpperCase()}{SortIcon("amGamesPlayed")}
                            </button>

                            <button
                                onClick={() => handleSort("amBench")}
                                className={`text-center transition-colors hover:text-estonia-blue ${sortField === "amBench"
                                    ? "text-estonia-blue"
                                    : ""
                                    }`}
                            >
                                {t("players.bench").toUpperCase()}{SortIcon("amBench")}

                            </button>

                            <button
                                onClick={() => handleSort("vmAppearances")}
                                className={`text-center transition-colors hover:text-estonia-blue ${sortField === "vmAppearances"
                                    ? "text-estonia-blue"
                                    : ""
                                    }`}
                            >
                                {t("players.apps").toUpperCase()}{SortIcon("vmAppearances")}
                            </button>

                            <button
                                onClick={() => handleSort("vmGamesPlayed")}
                                className={`text-center transition-colors hover:text-estonia-blue ${sortField === "vmGamesPlayed"
                                    ? "text-estonia-blue"
                                    : ""
                                    }`}
                            >
                                {t("players.gp").toUpperCase()}{SortIcon("vmGamesPlayed")}
                            </button>

                            <button
                                onClick={() => handleSort("vmBench")}
                                className={`text-center transition-colors hover:text-estonia-blue ${sortField === "vmBench"
                                    ? "text-estonia-blue"
                                    : ""
                                    }`}
                            >
                                {t("players.bench").toUpperCase()}{SortIcon("vmBench")}
                            </button>

                            <button
                                onClick={() => handleSort("allAppearances")}
                                className={`text-center transition-colors hover:text-estonia-blue ${sortField === "allAppearances"
                                    ? "text-estonia-blue"
                                    : ""
                                    }`}
                            >
                                {t("players.apps").toUpperCase()}{SortIcon("allAppearances")}
                            </button>

                            <button
                                onClick={() => handleSort("allGamesPlayed")}
                                className={`text-center transition-colors hover:text-estonia-blue ${sortField === "allGamesPlayed"
                                    ? "text-estonia-blue"
                                    : ""
                                    }`}
                            >
                                {t("players.gp").toUpperCase()}{SortIcon("allGamesPlayed")}
                            </button>

                            <button
                                onClick={() => handleSort("allBench")}
                                className={`text-center transition-colors hover:text-estonia-blue ${sortField === "allBench"
                                    ? "text-estonia-blue"
                                    : ""
                                    }`}
                            >
                                {t("players.bench").toUpperCase()}{SortIcon("allBench")}
                            </button>
                        </div>
                    </div>



                    {filtered.length === 0 ? (
                        <div className="p-12 text-center">
                            <p className="font-display text-xl uppercase italic text-slate-400">
                                {t("players.noPlayersFound")}
                            </p>
                        </div>
                    ) : (
                        sortedPlayers.map((player) => (
                            <PlayerRow
                                key={player.player_id}
                                player={player}
                            />
                        ))
                    )}
                </div>
            </main >
            <Outlet />
        </div >
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
        <div className="grid grid-cols-13 gap-3 border-t border-slate-100 px-6 py-4 transition-colors hover:bg-slate-50">
            <div className="col-span-4 flex items-center gap-3 border-r border-slate-200 pr-2">
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

                    <div className="mt-1 text-xs uppercase tracking-wider text-slate-500">
                        {player.position ?? "—"}
                    </div>
                </div>
            </div>

            <div className="text-center font-semibold">
                {player.amAppearances}
            </div>

            <div className="text-center">
                {player.amGamesPlayed}
            </div>

            <div className="border-r border-slate-200 text-center">
                {player.amBench}
            </div>

            <div className="text-center font-semibold">
                {player.vmAppearances}
            </div>

            <div className="text-center">
                {player.vmGamesPlayed}
            </div>

            <div className="border-r border-slate-200 text-center">
                {player.vmBench}
            </div>

            <div className="text-center font-semibold">
                {player.allAppearances}
            </div>

            <div className="text-center">
                {player.allGamesPlayed}
            </div>

            <div className="text-center">
                {player.allBench}
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