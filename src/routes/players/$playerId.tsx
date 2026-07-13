import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { fetchPlayer } from "@/lib/players.queries";
import { useTranslation } from "react-i18next";

type RawMatchRecord = {
    match_date: string;
    opponent: string;
    competition: string | null;
    estonia_sets: number;
    opponent_sets: number;
    vm: boolean | null;
    am: boolean | null;
    mam: boolean | null;
};

type MatchRecord = RawMatchRecord & {
    match_type: "VM" | "AM" | "MAM" | null;
};

type PlayerAppearance = {
    appearance_id: number;
    player_id: number;
    match_id: number;
    sets_played: number;
    on_the_bench: boolean;
    shirt_number: number | null;
    matches: RawMatchRecord | RawMatchRecord[] | null;
    player_match_stats:
    | Array<{
        attack_blocked: number | null;
        attack_efficiency: number | null;
        attack_errors: number | null;
        attack_kill_pct: number | null;
        attack_kills: number | null;
        attack_total: number | null;
        block_points: number | null;
        break_points: number | null;
        plus_minus: number | null;
        points: number | null;
        reception_errors: number | null;
        reception_excellent_pct: number | null;
        reception_positive_pct: number | null;
        reception_total: number | null;
        serve_aces: number | null;
        serve_errors: number | null;
        serve_total: number | null;
    }>
    | null;
};

type PlayerPageData = {
    player: {
        player_id: number;
        first_name: string;
        last_name: string;
        position: string | null;
        photo_url: string | null;
        height_cm: number | null;
        birth_date: string | null;
        place_of_birth: string | null;
        birth_county: string | null;
        handedness: string | null;
    };
    appearances: PlayerAppearance[];
    statsSummary: {
        matchCount: number;
        totals: Record<string, number>;
        averages: Record<string, number | null>;
    };
};

export const Route = createFileRoute("/players/$playerId")({
    component: PlayerPage,
});

function PlayerPage() {
    const { playerId } = Route.useParams();

    const { t } = useTranslation();

    const { data } = useSuspenseQuery<PlayerPageData>({
        queryKey: ["player", Number(playerId)],
        queryFn: () => fetchPlayer(Number(playerId)),
    });

    if (!data) {
        return null;
    }

    const player = data.player;
    const appearances = data.appearances;
    const statsSummary = data.statsSummary;

    const getMatch = (appearance: PlayerAppearance): MatchRecord | null => {
        const rawMatch = appearance.matches;
        if (!rawMatch) return null;

        const normalized = Array.isArray(rawMatch)
            ? rawMatch[0]
            : rawMatch;

        if (!normalized) return null;

        const match_type = normalized.vm
            ? "VM"
            : normalized.am
                ? "AM"
                : normalized.mam
                    ? "MAM"
                    : null;

        return {
            ...normalized,
            match_type,
        };
    };

    const [statsMode, setStatsMode] = useState<"official" | "competitive" | "all">("official");
    const [selectedYear, setSelectedYear] = useState<string>("all");
    const [selectedCompetition, setSelectedCompetition] = useState<string>("all");
    const [selectedOpponent, setSelectedOpponent] = useState<string>("all");

    const statColumns = [
        { field: "points", label: "PTS" },
        { field: "block_points", label: "BP" },
        { field: "plus_minus", label: "W-P" },
        { field: "serve_total", label: "Tot" },
        { field: "serve_aces", label: "Ace" },
        { field: "serve_errors", label: "Err" },
        { field: "reception_total", label: "Tot" },
        { field: "reception_errors", label: "Err" },
        { field: "reception_positive_pct", label: "Pos%" },
        { field: "reception_excellent_pct", label: "Exc%" },
        { field: "attack_total", label: "Tot" },
        { field: "attack_errors", label: "Err" },
        { field: "attack_blocked", label: "Blk" },
        { field: "attack_efficiency", label: "Eff%" },
        { field: "block_points", label: "BPS" },
    ] as const;

    const appearanceMatchesWithStats = useMemo(() => {
        return appearances.filter((a) => {
            const stats = Array.isArray(a.player_match_stats)
                ? a.player_match_stats[0]
                : a.player_match_stats;
            if (!stats) return false;

            const match = getMatch(a);
            if (!match) return false;

            if (statsMode === "official") {
                return (
                    match.match_type === "AM" ||
                    match.match_type === "MAM" ||
                    match.match_type === "VM"
                );
            }

            if (statsMode === "competitive") {
                return match.match_type === "VM";
            }

            return true;
        });
    }, [appearances, statsMode]);

    const yearOptions = useMemo(() => {
        const values = new Set<string>();
        appearanceMatchesWithStats.forEach((a) => {
            const match = getMatch(a);
            if (match?.match_date) {
                values.add(new Date(match.match_date).getFullYear().toString());
            }
        });
        return [...values].sort();
    }, [appearanceMatchesWithStats]);

    const competitionOptions = useMemo(() => {
        const values = new Set<string>();
        appearanceMatchesWithStats.forEach((a) => {
            const match = getMatch(a);
            if (match?.competition) {
                values.add(match.competition);
            }
        });
        return [...values].sort();
    }, [appearanceMatchesWithStats]);

    const opponentOptions = useMemo(() => {
        const values = new Set<string>();
        appearanceMatchesWithStats.forEach((a) => {
            const match = getMatch(a);
            if (match?.opponent) {
                values.add(match.opponent);
            }
        });
        return [...values].sort();
    }, [appearanceMatchesWithStats]);

    const filteredAppearances = useMemo(() => {
        return appearanceMatchesWithStats.filter((a) => {
            const match = getMatch(a);
            if (!match) return false;

            if (selectedYear !== "all") {
                const year = new Date(match.match_date).getFullYear().toString();
                if (year !== selectedYear) return false;
            }

            if (selectedCompetition !== "all") {
                if (!match.competition || match.competition !== selectedCompetition) {
                    return false;
                }
            }

            if (selectedOpponent !== "all") {
                if (!match.opponent || match.opponent !== selectedOpponent) {
                    return false;
                }
            }

            return true;
        });
    }, [appearanceMatchesWithStats, selectedYear, selectedCompetition, selectedOpponent]);

    const playedCount = filteredAppearances.filter(
        (a) => (a.sets_played ?? 0) > 0
    ).length;
    const benchCount = filteredAppearances.filter((a) => a.on_the_bench).length;
    const totalSets = filteredAppearances.reduce(
        (sum, a) => sum + (a.sets_played ?? 0),
        0
    );

    const filteredSummary = useMemo(() => {
        const totals: Record<string, number> = {};
        const counts: Record<string, number> = {};

        statColumns.forEach((column) => {
            totals[column.field] = 0;
            counts[column.field] = 0;
        });

        filteredAppearances.forEach((a) => {
            const stats = Array.isArray(a.player_match_stats)
                ? a.player_match_stats[0]
                : a.player_match_stats;
            if (!stats) return;

            statColumns.forEach((column) => {
                const value = stats[column.field];
                if (typeof value === "number") {
                    totals[column.field] += value;
                    counts[column.field] += 1;
                }
            });
        });

        const averages: Record<string, number | null> = {};
        statColumns.forEach((column) => {
            averages[column.field] = counts[column.field] > 0 ? totals[column.field] / counts[column.field] : null;
        });

        return {
            totals,
            averages,
        };
    }, [filteredAppearances, statColumns]);

    const filteredCount = filteredAppearances.length;
    const availableCount = appearanceMatchesWithStats.length;

    const formatStatValue = (value: number | null) =>
        value == null ? "-" : Number(value.toFixed(1)).toString();

    const sortedAppearances = [...appearances].sort((a, b) => {
        const aMatch = getMatch(a);
        const bMatch = getMatch(b);
        return (
            (aMatch ? new Date(aMatch.match_date).getTime() : 0) -
            (bMatch ? new Date(bMatch.match_date).getTime() : 0)
        );
    });

    const debutMatch = sortedAppearances[0] ?? null;
    const lastMatch = sortedAppearances[sortedAppearances.length - 1] ?? null;

    const debutMatchRecord = debutMatch ? getMatch(debutMatch) : null;
    const lastMatchRecord = lastMatch ? getMatch(lastMatch) : null;

    const shirtNumbers = [
        ...new Set(
            appearances
                .map((a) => a.shirt_number)
                .filter(Boolean)
        ),
    ].sort((a, b) => Number(a) - Number(b));

    const amApps = appearances.filter((a) => {
        const match = getMatch(a);
        return (
            match?.match_type === "AM" ||
            match?.match_type === "MAM" ||
            match?.match_type === "VM"
        );
    }).length;

    const age = player.birth_date
        ? Math.floor(
            (Date.now() -
                new Date(player.birth_date).getTime()) /
            (365.25 * 24 * 60 * 60 * 1000)
        )
        : null;

    const positionLabels: Record<string, string> = {
        SET: "Setter",
        OPP: "Opposite",
        OH: "Outside Hitter",
        MB: "Middle Blocker",
        LIB: "Libero",
    };

    return (
        <div>
            <header className="bg-estonia-dark px-6 py-12 text-white">
                <div className="mx-auto max-w-7xl">
                    <div className="grid gap-8 lg:grid-cols-[220px_260px_260px_340px]">
                        <img
                            src={
                                player.photo_url ??
                                `https://lrdblxldprvfylcyoxvb.supabase.co/storage/v1/object/public/player-photos/${player.player_id}.jpg`
                            }
                            alt={`${player.first_name} ${player.last_name}`}
                            className="h-63 w-48 rounded-2xl border-2 border-white/20 object-cover"
                        />
                        <div className="col-span-2">

                            <h1 className="font-display text-5xl uppercase italic">
                                {player.first_name} {player.last_name}
                            </h1>

                            <div className="mt-8 grid gap-x-16 gap-y-4 text-white/80 md:grid-cols-2">

                                <div className="space-y-5">

                                    <div>
                                        <div className="text-xs uppercase tracking-widest text-white/50">
                                            {t("players.position")}
                                        </div>
                                        <div className="mt-1">
                                            🏐 {
                                                positionLabels[player.position ?? ""] ??
                                                player.position ??
                                                "N/A"
                                            }
                                        </div>
                                    </div>

                                    <div>
                                        <div className="text-xs uppercase tracking-widest text-white/50">
                                            {t("players.height")}
                                        </div>
                                        <div className="mt-1">
                                            📏 {
                                                player.height_cm
                                                    ? `${player.height_cm} cm`
                                                    : "N/A"
                                            }
                                        </div>
                                    </div>

                                    <div>
                                        <div className="text-xs uppercase tracking-widest text-white/50">
                                            {t("players.birth_date")}
                                        </div>
                                        <div className="mt-1">
                                            🎂 {
                                                player.birth_date
                                                    ? new Date(
                                                        player.birth_date
                                                    ).toLocaleDateString("en-GB")
                                                    : "N/A"
                                            }
                                            {age ? ` (${age})` : ""}
                                        </div>
                                    </div>

                                </div>

                                <div className="space-y-5">

                                    <div>
                                        <div className="text-xs uppercase tracking-widest text-white/50">
                                            {t("players.place_of_birth")}
                                        </div>
                                        <div className="mt-1">
                                            📍 {player.place_of_birth ?? "N/A"}
                                            {player.birth_county
                                                ? `, ${player.birth_county}`
                                                : ""}
                                        </div>
                                    </div>

                                    <div>
                                        <div className="text-xs uppercase tracking-widest text-white/50">
                                            {t("players.handedness")}
                                        </div>
                                        <div className="mt-1">
                                            ✋ {player.handedness ?? "N/A"}
                                        </div>
                                    </div>

                                    <div>
                                        <div className="text-xs uppercase tracking-widest text-white/50">
                                            {t("players.shirt_numbers")}
                                        </div>
                                        <div className="mt-1">
                                            👕 {
                                                shirtNumbers.length > 0
                                                    ? shirtNumbers.join(", ")
                                                    : "N/A"
                                            }
                                        </div>
                                    </div>

                                </div>

                            </div>

                        </div>

                        <div className="space-y-4">

                            <InfoCard
                                title={t("players.national_team_debut")}
                                date={debutMatchRecord?.match_date}
                                opponent={debutMatchRecord?.opponent ?? undefined}
                                competition={debutMatchRecord?.competition ?? undefined}
                            />

                            <InfoCard
                                title={t("players.last_match")}
                                date={lastMatchRecord?.match_date}
                                opponent={lastMatchRecord?.opponent ?? undefined}
                                competition={lastMatchRecord?.competition ?? undefined}
                            />
                        </div>
                    </div>
                </div>
            </header >

            <main className="mx-auto max-w-7xl px-6 py-10">
                <section className="mb-10 rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
                    <div className="mb-6 grid gap-4">
                        <div>
                            <h2 className="font-display text-3xl uppercase italic">
                                {t("players.statsOverviewTitle")}
                            </h2>
                            <p className="mt-2 text-sm text-slate-600">
                                {t("players.statsOverviewSubtitle")}
                            </p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-4">
                            <div className="rounded-2xl bg-white px-4 py-3 text-center text-sm font-semibold text-slate-700 shadow-sm">
                                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
                                    {t("players.statsMatches")}
                                </div>
                                <div className="mt-1 text-2xl">{filteredCount}</div>
                            </div>
                            <div className="rounded-2xl bg-white px-4 py-3 text-center text-sm font-semibold text-slate-700 shadow-sm">
                                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
                                    {t("players.statsPlayed")}
                                </div>
                                <div className="mt-1 text-2xl">{playedCount}</div>
                            </div>
                            <div className="rounded-2xl bg-white px-4 py-3 text-center text-sm font-semibold text-slate-700 shadow-sm">
                                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
                                    {t("players.statsBench")}
                                </div>
                                <div className="mt-1 text-2xl">{benchCount}</div>
                            </div>
                            <div className="rounded-2xl bg-white px-4 py-3 text-center text-sm font-semibold text-slate-700 shadow-sm">
                                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
                                    {t("players.statsSets")}
                                </div>
                                <div className="mt-1 text-2xl">{totalSets}</div>
                            </div>
                        </div>

                        <div className="rounded-2xl bg-white px-4 py-3 text-center text-sm font-semibold text-slate-700 shadow-sm">
                            {filteredCount} {t("players.matchesWithStats")} {filteredCount !== availableCount ? `(${availableCount} ${t("players.totalMatchesWithStats")})` : ""}
                        </div>
                    </div>

                    <div className="mb-6 grid gap-2">
                        <div className="grid gap-2">
                            {(["official", "competitive", "all"] as const).map((mode) => (
                                <button
                                    key={mode}
                                    onClick={() => setStatsMode(mode)}
                                    className={`rounded-full border px-2.5 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] transition ${statsMode === mode ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"}`}
                                >
                                    {t(`common.${mode === "official" ? "official" : mode === "competitive" ? "competitive" : "allMatches"}`)}
                                </button>
                            ))}
                        </div>

                        <div className="grid gap-2 sm:grid-cols-3">
                            <div>
                                <span className="sr-only">
                                    {t("players.statsFilter.year")}
                                </span>
                                <select
                                    aria-label={t("players.statsFilter.year")}
                                    value={selectedYear}
                                    onChange={(event) => setSelectedYear(event.target.value)}
                                    className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold uppercase tracking-wide text-slate-500 shadow-sm"
                                >
                                    <option value="all">{t("players.statsFilter.allYears")}</option>
                                    {yearOptions.map((year) => (
                                        <option key={year} value={year}>
                                            {year}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <span className="sr-only">
                                    {t("players.statsFilter.competition")}
                                </span>
                                <select
                                    aria-label={t("players.statsFilter.competition")}
                                    value={selectedCompetition}
                                    onChange={(event) => setSelectedCompetition(event.target.value)}
                                    className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold uppercase tracking-wide text-slate-500 shadow-sm"
                                >
                                    <option value="all">{t("players.statsFilter.allCompetitions")}</option>
                                    {competitionOptions.map((competition) => (
                                        <option key={competition} value={competition}>
                                            {competition}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <span className="sr-only">
                                    {t("players.statsFilter.opponent")}
                                </span>
                                <select
                                    aria-label={t("players.statsFilter.opponent")}
                                    value={selectedOpponent}
                                    onChange={(event) => setSelectedOpponent(event.target.value)}
                                    className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold uppercase tracking-wide text-slate-500 shadow-sm"
                                >
                                    <option value="all">{t("players.statsFilter.allOpponents")}</option>
                                    {opponentOptions.map((opponent) => (
                                        <option key={opponent} value={opponent}>
                                            {opponent}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
                        <table className="min-w-full border-collapse text-sm">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-[0.24em] text-slate-500">
                                    <th className="px-4 py-3"></th>
                                    <th className="px-4 py-3"></th>
                                    <th className="px-4 py-3"></th>
                                    <th className="px-4 py-3"></th>
                                    <th className="px-4 py-3 text-right" colSpan={2}>
                                        {t("players.statsGroup.serve")}
                                    </th>
                                    <th className="px-4 py-3 text-right" colSpan={4}>
                                        {t("players.statsGroup.reception")}
                                    </th>
                                    <th className="px-4 py-3 text-right" colSpan={4}>
                                        {t("players.statsGroup.attack")}
                                    </th>
                                    <th className="px-4 py-3 text-right">
                                        {t("players.statsGroup.blocks")}
                                    </th>
                                </tr>
                                <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-[0.24em] text-slate-500">
                                    <th className="px-4 py-3"></th>
                                    {statColumns.map((column) => (
                                        <th key={column.field} className="px-4 py-3 text-right">
                                            {column.label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-b border-slate-100 bg-slate-50 font-semibold uppercase tracking-[0.16em] text-slate-600">
                                    <td className="px-4 py-3">AVG</td>
                                    {statColumns.map((column) => (
                                        <td key={`${column.field}-avg`} className="px-4 py-3 text-right">
                                            {formatStatValue(filteredSummary.averages[column.field])}
                                        </td>
                                    ))}
                                </tr>
                                <tr className="font-semibold text-slate-900">
                                    <td className="px-4 py-3">TOT</td>
                                    {statColumns.map((column) => (
                                        <td key={`${column.field}-tot`} className="px-4 py-3 text-right">
                                            {formatStatValue(filteredSummary.totals[column.field])}
                                        </td>
                                    ))}
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                <h2 className="mb-6 font-display text-3xl uppercase italic">
                    Match History
                </h2>

                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="grid grid-cols-12 gap-3 border-b border-slate-100 bg-slate-50 px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                        <div className="col-span-2">Date</div>
                        <div className="col-span-3">Opponent</div>
                        <div className="col-span-2 text-center">Score</div>
                        <div className="col-span-4">Competition</div>
                        <div className="col-span-1 text-center">Sets</div>
                    </div>

                    {appearances.map((a) => {
                        const match = getMatch(a);
                        if (!match) return null;

                        return (
                            <div
                                key={a.appearance_id}
                                className="grid grid-cols-12 gap-3 border-t border-slate-100 px-6 py-4"
                            >
                                <div className="col-span-2">
                                    {new Date(
                                        match.match_date
                                    ).toLocaleDateString("en-GB")}
                                </div>

                                <div className="col-span-3">
                                    {match.opponent}
                                </div>

                                <div className="col-span-2 text-center">
                                    {match.estonia_sets}–
                                    {match.opponent_sets}
                                </div>

                                <div className="col-span-4">
                                    {match.competition}
                                </div>

                                <div className="col-span-1 text-center">
                                    {a.sets_played}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </main>
        </div >
    );
}

function InfoCard({
    title,
    date,
    opponent,
    competition,
}: {
    title: string;
    date?: string;
    opponent?: string;
    competition?: string;
}) {
    return (
        <div className="rounded-lg border border-white/20 bg-white/5 p-3">
            <div className="text-center text-[12px] uppercase tracking-[0.2em] text-white/60">
                {title}
            </div>

            <div className="mt-2 text-center">
                <div className="font-semibold">
                    {date
                        ? new Date(date).toLocaleDateString("en-GB")
                        : "N/A"}
                </div>

                <div className="mt-1 text-sm text-white/80">
                    {opponent
                        ? `vs ${opponent}`
                        : "N/A"}
                </div>

                <div className="mt-1 text-xs text-white/60">
                    {competition ?? "N/A"}
                </div>
            </div>
        </div>
    );
}
