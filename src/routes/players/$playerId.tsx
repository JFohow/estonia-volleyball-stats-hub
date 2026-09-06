import { Link, createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import MultiSelect from "@/components/ui/multi-select";
import { fetchPlayer } from "@/lib/players.queries";
import { useTranslation } from "react-i18next";

type RawMatchRecord = {
    match_id: number;
    match_date: string;
    opponent: string;
    opponent_en: string | null;
    competition: string | null;
    competition_en: string | null;
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
        stats_version: string | null;
    }>
    | null;
};

type PlayerPageData = {
    player: {
        player_id: number;
        first_name: string;
        last_name: string;
        position: string | null;
        position_name: string | null;
        position_name_ee: string | null;
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

    const { t, i18n } = useTranslation();
    const currentLanguage = i18n.language?.startsWith("et") ? "et" : "en";

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

    const getLocalizedOpponent = (match: MatchRecord) =>
        currentLanguage === "et"
            ? match.opponent
            : match.opponent_en ?? match.opponent;

    const getLocalizedCompetition = (match: MatchRecord) =>
        currentLanguage === "et"
            ? match.competition
            : match.competition_en ?? match.competition;

    const [statsMode, setStatsMode] = useState<"official" | "competitive" | "all">("official");
    const [selectedYear, setSelectedYear] = useState<string[]>(["all"]);
    const [selectedCompetition, setSelectedCompetition] = useState<string[]>(["all"]);
    const [selectedOpponent, setSelectedOpponent] = useState<string[]>(["all"]);
    const [selectedMatches, setSelectedMatches] = useState<string[]>([]);

    const statColumns = [
        { field: "points", label: "PTS" },
        { field: "break_points", label: "b-P" },
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
        { field: "attack_kills", label: "Exc." },
        { field: "attack_kill_pct", label: "Exc.%" },
        { field: "attack_efficiency", label: "Eff%" },
        { field: "block_points", label: "BP" },
    ] as const;

    const isPercentField = (field: string) =>
        field === "reception_positive_pct" ||
        field === "reception_excellent_pct" ||
        field === "attack_kill_pct" ||
        field === "attack_efficiency";

    const safeInt = (v: any) => (typeof v === "number" && Number.isInteger(v) ? v : 0);

    const computeAttackEff = (stats: any) => {
        if (!stats) return null;
        const attackTotRaw = stats.attack_total;
        const attackTot = safeInt(attackTotRaw);

        if (attackTotRaw == null || attackTot === 0) return null;

        const attackExc = safeInt(stats.attack_kills);
        const attackBlk = safeInt(stats.attack_blocked);
        const attackErr = safeInt(stats.attack_errors);

        const eff = ((attackExc - attackBlk - attackErr) / attackTot) * 100;
        return eff;
    };

    const computeAttackKillPctFromTotals = (totals: Record<string, number>) => {
        const attackTot = totals["attack_total"] ?? 0;
        if (!attackTot) return null;
        const attackExc = totals["attack_kills"] ?? 0;
        return (attackExc / attackTot) * 100;
    };

    const computeAttackEffFromTotals = (totals: Record<string, number>) => {
        const attackTot = totals["attack_total"] ?? 0;
        if (!attackTot) return null;
        const attackExc = totals["attack_kills"] ?? 0;
        const attackBlk = totals["attack_blocked"] ?? 0;
        const attackErr = totals["attack_errors"] ?? 0;
        return ((attackExc - attackBlk - attackErr) / attackTot) * 100;
    };

    const pickStatsRowForMode = (rows: PlayerAppearance["player_match_stats"]) => {
        if (!rows || rows.length === 0) return null;

        if (statsMode === "all") {
            return rows.find((row) => row?.stats_version === "ALL") ?? rows.find((row) => row?.stats_version === "AM") ?? rows[0] ?? null;
        }

        return rows.find((row) => row?.stats_version === "AM") ?? rows.find((row) => row?.stats_version === "ALL") ?? rows[0] ?? null;
    };

    const appearanceMatchesWithStats = useMemo(() => {
        return appearances.filter((a) => {
            const stats = pickStatsRowForMode(a.player_match_stats);
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
            if (!match) return;
            const localizedCompetition = getLocalizedCompetition(match);
            const localizedOpponent = getLocalizedOpponent(match);

            // adaptive: respect selected competition/opponent when building year list
            if (!selectedCompetition.includes("all") && localizedCompetition && !selectedCompetition.includes(localizedCompetition)) return;
            if (!selectedOpponent.includes("all") && localizedOpponent && !selectedOpponent.includes(localizedOpponent)) return;

            if (match.match_date) {
                values.add(new Date(match.match_date).getFullYear().toString());
            }
        });
        return [...values].sort();
    }, [appearanceMatchesWithStats, selectedCompetition, selectedOpponent, currentLanguage]);

    const competitionOptions = useMemo(() => {
        const values = new Set<string>();
        appearanceMatchesWithStats.forEach((a) => {
            const match = getMatch(a);
            if (!match) return;
            const localizedCompetition = getLocalizedCompetition(match);
            const localizedOpponent = getLocalizedOpponent(match);

            // adaptive: respect selected year/opponent when building competition list
            if (!selectedYear.includes("all")) {
                const year = new Date(match.match_date).getFullYear().toString();
                if (!selectedYear.includes(year)) return;
            }
            if (!selectedOpponent.includes("all") && localizedOpponent && !selectedOpponent.includes(localizedOpponent)) return;

            if (localizedCompetition) {
                values.add(localizedCompetition);
            }
        });
        return [...values].sort();
    }, [appearanceMatchesWithStats, selectedYear, selectedOpponent, currentLanguage]);

    const opponentOptions = useMemo(() => {
        const values = new Set<string>();
        appearanceMatchesWithStats.forEach((a) => {
            const match = getMatch(a);
            if (!match) return;
            const localizedCompetition = getLocalizedCompetition(match);
            const localizedOpponent = getLocalizedOpponent(match);

            // adaptive: respect selected year/competition when building opponent list
            if (!selectedYear.includes("all")) {
                const year = new Date(match.match_date).getFullYear().toString();
                if (!selectedYear.includes(year)) return;
            }
            if (!selectedCompetition.includes("all") && localizedCompetition && !selectedCompetition.includes(localizedCompetition)) return;

            if (localizedOpponent) {
                values.add(localizedOpponent);
            }
        });
        return [...values].sort();
    }, [appearanceMatchesWithStats, selectedYear, selectedCompetition, currentLanguage]);

    const matchOptions = useMemo(() => {
        const values: Array<{ id: number; label: string }> = [];
        const seen = new Set<number>();
        appearanceMatchesWithStats.forEach((a) => {
            const match = getMatch(a);
            if (!match) return;
            const localizedCompetition = getLocalizedCompetition(match);
            const localizedOpponent = getLocalizedOpponent(match);

            // adaptive: respect selected year/competition/opponent when building match list
            if (!selectedYear.includes("all")) {
                const year = new Date(match.match_date).getFullYear().toString();
                if (!selectedYear.includes(year)) return;
            }
            if (!selectedCompetition.includes("all") && localizedCompetition && !selectedCompetition.includes(localizedCompetition)) return;
            if (!selectedOpponent.includes("all") && localizedOpponent && !selectedOpponent.includes(localizedOpponent)) return;

            if (!seen.has(a.match_id)) {
                seen.add(a.match_id);
                const dateLabel = new Date(match.match_date).toLocaleDateString("en-GB");
                const scoreLabel = `${match.estonia_sets}-${match.opponent_sets}`;
                values.push({ id: a.match_id, label: `${dateLabel} | ${localizedOpponent} | ${scoreLabel}` });
            }
        });
        return values.sort((l, r) => l.label.localeCompare(r.label));
    }, [appearanceMatchesWithStats, selectedYear, selectedCompetition, selectedOpponent, currentLanguage]);

    useEffect(() => {
        const allowedIds = new Set(matchOptions.map((m) => String(m.id)));
        setSelectedMatches((current) => current.filter((id) => allowedIds.has(id)));
    }, [matchOptions]);

    const filteredAppearances = useMemo(() => {
        return appearanceMatchesWithStats.filter((a) => {
            const match = getMatch(a);
            if (!match) return false;
            const localizedCompetition = getLocalizedCompetition(match);
            const localizedOpponent = getLocalizedOpponent(match);

            // year filter (multi)
            if (!selectedYear.includes("all") && selectedYear.length > 0) {
                const year = new Date(match.match_date).getFullYear().toString();
                if (!selectedYear.includes(year)) return false;
            }

            // competition filter (multi)
            if (!selectedCompetition.includes("all") && selectedCompetition.length > 0) {
                if (!localizedCompetition || !selectedCompetition.includes(localizedCompetition)) {
                    return false;
                }
            }

            // opponent filter (multi)
            if (!selectedOpponent.includes("all") && selectedOpponent.length > 0) {
                if (!localizedOpponent || !selectedOpponent.includes(localizedOpponent)) {
                    return false;
                }
            }

            // match specific filter (by match id strings)
            if (selectedMatches.length > 0) {
                if (!selectedMatches.includes(String(a.match_id))) return false;
            }

            return true;
        });
    }, [appearanceMatchesWithStats, selectedYear, selectedCompetition, selectedOpponent, selectedMatches]);

    const filteredSummary = useMemo(() => {
        const totals: Record<string, number> = {};
        const counts: Record<string, number> = {};
        let receptionPositiveCount = 0;
        let receptionExcellentCount = 0;

        statColumns.forEach((column) => {
            totals[column.field] = 0;
            counts[column.field] = 0;
        });

        filteredAppearances.forEach((a) => {
            const stats = pickStatsRowForMode(a.player_match_stats);
            if (!stats) return;

            statColumns.forEach((column) => {
                let value: any = null;
                if (column.field === "attack_efficiency") {
                    value = computeAttackEff(stats);
                } else {
                    value = stats[column.field as keyof typeof stats];
                }

                if (typeof value === "number") {
                    totals[column.field] += value;
                    counts[column.field] += 1;
                }
            });

            const receptionTotal = stats.reception_total;
            if (typeof receptionTotal === "number" && receptionTotal > 0) {
                if (typeof stats.reception_positive_pct === "number") {
                    receptionPositiveCount += receptionTotal * (stats.reception_positive_pct / 100);
                }

                if (typeof stats.reception_excellent_pct === "number") {
                    receptionExcellentCount += receptionTotal * (stats.reception_excellent_pct / 100);
                }
            }
        });

        const averages: Record<string, number | null> = {};
        statColumns.forEach((column) => {
            averages[column.field] = counts[column.field] > 0 ? totals[column.field] / counts[column.field] : null;
        });

        // Always derive attack percentages from attack totals, never from stored pct sums/averages.
        averages["attack_kill_pct"] = computeAttackKillPctFromTotals(totals);
        averages["attack_efficiency"] = computeAttackEffFromTotals(totals);

        const weightedReceptionPositivePct =
            totals["reception_total"] > 0 ? (receptionPositiveCount / totals["reception_total"]) * 100 : null;
        const weightedReceptionExcellentPct =
            totals["reception_total"] > 0 ? (receptionExcellentCount / totals["reception_total"]) * 100 : null;

        averages["reception_positive_pct"] = weightedReceptionPositivePct;
        averages["reception_excellent_pct"] = weightedReceptionExcellentPct;
        totals["reception_positive_pct"] = weightedReceptionPositivePct ?? 0;
        totals["reception_excellent_pct"] = weightedReceptionExcellentPct ?? 0;

        return {
            totals,
            averages,
        };
    }, [filteredAppearances, statColumns]);

    const formatStatValue = (field: string, value: number | null) => {
        if (value == null) return "";
        if (isPercentField(field)) {
            return `${Math.round(value)}%`;
        }
        return Number(value.toFixed(1)).toString();
    };

    const getSetCountFromPositions = (appearance: PlayerAppearance) => {
        const statsRows = appearance.player_match_stats ?? [];
        const stats =
            statsRows.find((row) => row?.stats_version === "ALL") ??
            statsRows.find((row) => row?.stats_version === "AM") ??
            statsRows[0];

        if (!stats) {
            return appearance.sets_played ?? 0;
        }

        const row = stats as Record<string, string | null | undefined>;
        const positions = [
            row["set1_position"],
            row["set2_position"],
            row["set3_position"],
            row["set4_position"],
            row["set5_position"],
        ];

        const count = positions.filter((position) => typeof position === "string" && position.trim() !== "").length;
        return count;
    };

    const allSortedAppearances = [...appearances].sort((a, b) => {
        const aMatch = getMatch(a);
        const bMatch = getMatch(b);
        return (
            (aMatch ? new Date(aMatch.match_date).getTime() : 0) -
            (bMatch ? new Date(bMatch.match_date).getTime() : 0)
        );
    });

    const debutMatch = allSortedAppearances[0] ?? null;
    const lastMatch = allSortedAppearances[allSortedAppearances.length - 1] ?? null;

    const debutMatchRecord = debutMatch ? getMatch(debutMatch) : null;
    const lastMatchRecord = lastMatch ? getMatch(lastMatch) : null;

    const sortedAppearances = useMemo(() => {
        return [...filteredAppearances].sort((a, b) => {
            const aMatch = getMatch(a);
            const bMatch = getMatch(b);
            return (
                (aMatch ? new Date(aMatch.match_date).getTime() : 0) -
                (bMatch ? new Date(bMatch.match_date).getTime() : 0)
            );
        });
    }, [filteredAppearances]);

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

    const debutOpponent = currentLanguage === "et"
        ? debutMatchRecord?.opponent
        : debutMatchRecord?.opponent_en ?? debutMatchRecord?.opponent;
    const debutCompetition = currentLanguage === "et"
        ? debutMatchRecord?.competition
        : debutMatchRecord?.competition_en ?? debutMatchRecord?.competition;
    const lastOpponent = currentLanguage === "et"
        ? lastMatchRecord?.opponent
        : lastMatchRecord?.opponent_en ?? lastMatchRecord?.opponent;
    const lastCompetition = currentLanguage === "et"
        ? lastMatchRecord?.competition
        : lastMatchRecord?.competition_en ?? lastMatchRecord?.competition;

    const localizedPosition =
        currentLanguage === "et"
            ? player.position_name_ee ??
            player.position_name ??
            positionLabels[player.position ?? ""] ??
            player.position ??
            "N/A"
            : player.position_name ??
            positionLabels[player.position ?? ""] ??
            player.position ??
            "N/A";

    const matchHistoryTitle = currentLanguage === "et" ? "Kõik mängud" : "Match History";
    const matchHistoryDateLabel = currentLanguage === "et" ? "Kuupäev" : "Date";
    const matchHistoryOpponentLabel = currentLanguage === "et" ? "Vastane" : "Opponent";
    const matchHistoryScoreLabel = currentLanguage === "et" ? "Tulemus" : "Score";
    const matchHistoryCompetitionLabel = currentLanguage === "et" ? "Võistlus" : "Competition";
    const matchHistorySetsLabel = currentLanguage === "et" ? "Geime" : "Sets";

    return (
        <div>
            <header className="bg-estonia-dark px-4 py-10 text-white sm:px-6 sm:py-12 lg:px-14">
                <div className="mx-auto max-w-[1480px]">
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
                                            🏐 {localizedPosition}
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
                                opponent={debutOpponent ?? undefined}
                                competition={debutCompetition ?? undefined}
                            />

                            <InfoCard
                                title={t("players.last_match")}
                                date={lastMatchRecord?.match_date}
                                opponent={lastOpponent ?? undefined}
                                competition={lastCompetition ?? undefined}
                            />
                        </div>
                    </div>
                </div>
            </header >

            <main className="mx-auto max-w-[1480px] px-4 py-8 sm:px-6 sm:py-10 lg:px-14">
                <section className="mb-10 rounded-3xl border border-slate-200 bg-slate-50 p-4 shadow-sm sm:p-6">
                    <div className="mb-6 grid gap-2">
                        <div className="grid grid-cols-3 gap-2">
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
                                <MultiSelect
                                    options={yearOptions.map((y) => ({ value: y, label: y }))}
                                    value={selectedYear}
                                    onChange={(v) => setSelectedYear(v.length === 0 ? ["all"] : v.includes("all") ? ["all"] : v)}
                                    placeholder={t("players.statsFilter.allYears")}
                                    className="w-full"
                                />
                            </div>

                            <div>
                                <span className="sr-only">
                                    {t("players.statsFilter.competition")}
                                </span>
                                <MultiSelect
                                    options={competitionOptions.map((c) => ({ value: c, label: c }))}
                                    value={selectedCompetition}
                                    onChange={(v) => setSelectedCompetition(v.length === 0 ? ["all"] : v.includes("all") ? ["all"] : v)}
                                    placeholder={t("players.statsFilter.allCompetitions")}
                                    className="w-full"
                                />
                            </div>

                            <div>
                                <span className="sr-only">
                                    {t("players.statsFilter.opponent")}
                                </span>
                                <MultiSelect
                                    options={opponentOptions.map((o) => ({ value: o, label: o }))}
                                    value={selectedOpponent}
                                    onChange={(v) => setSelectedOpponent(v.length === 0 ? ["all"] : v.includes("all") ? ["all"] : v)}
                                    placeholder={t("players.statsFilter.allOpponents")}
                                    className="w-full"
                                />
                            </div>
                        </div>
                        <div className="mt-2">
                            <label className="sr-only">{t("players.statsFilter.matches")}</label>
                            <MultiSelect
                                options={matchOptions.map((m) => ({ value: String(m.id), label: m.label }))}
                                value={selectedMatches}
                                onChange={(v) => setSelectedMatches(v)}
                                placeholder={t("players.statsFilter.matches")}
                                className="w-full"
                                maxDisplay={2}
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
                        <table className="w-full table-fixed border-collapse">
                            <thead className="bg-slate-50">
                                <tr className="border-b-2 border-slate-300">
                                    <th rowSpan={2} className="sticky left-0 z-10 border-r-2 border-slate-300 bg-slate-50 px-3 py-2 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-slate-600"></th>

                                    <th colSpan={3} className="border-r-2 border-slate-300 px-1.5 py-2 text-center text-[9px] font-bold uppercase tracking-[0.16em] text-slate-500"></th>

                                    <th colSpan={3} className="border-r-2 border-slate-300 px-1.5 py-2 text-center text-[9px] font-bold uppercase tracking-[0.16em] text-slate-500">{t("players.statsGroup.serve")}</th>

                                    <th colSpan={4} className="border-r-2 border-slate-300 px-1.5 py-2 text-center text-[9px] font-bold uppercase tracking-[0.16em] text-slate-500">{t("players.statsGroup.reception")}</th>

                                    <th colSpan={6} className="border-r-2 border-slate-300 px-1.5 py-2 text-center text-[9px] font-bold uppercase tracking-[0.16em] text-slate-500">{t("players.statsGroup.attack")}</th>

                                    <th colSpan={1} className="px-1.5 py-2 text-center text-[9px] font-bold uppercase tracking-[0.16em] text-slate-500">{t("players.statsGroup.blocks")}</th>
                                </tr>

                                <tr className="border-b-2 border-slate-300">
                                    {statColumns.map((column) => (
                                        <th key={column.field} className={`whitespace-nowrap px-1.5 py-2 text-center text-[9px] font-bold uppercase tracking-[0.16em] text-slate-600 ${column.field === "plus_minus" || column.field === "serve_errors" || column.field === "reception_excellent_pct" || column.field === "attack_efficiency" ? "border-r-2 border-slate-300" : "border-r border-slate-200"}`}>
                                            {column.label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">
                                <tr className="bg-slate-50 font-semibold uppercase tracking-[0.16em] text-slate-600">
                                    <td className="sticky left-0 z-10 border-r-2 border-slate-300 bg-inherit px-3 py-2 text-xs">AVG</td>
                                    {statColumns.map((column) => (
                                        <td key={`${column.field}-avg`} className={`whitespace-nowrap px-1.5 py-2 text-center text-xs text-slate-700 ${column.field === "plus_minus" || column.field === "serve_errors" || column.field === "reception_excellent_pct" || column.field === "attack_efficiency" ? "border-r-2 border-slate-300" : "border-r border-slate-200"}`}>
                                            {formatStatValue(column.field, filteredSummary.averages[column.field])}
                                        </td>
                                    ))}
                                </tr>

                                <tr className="bg-white font-semibold text-slate-900">
                                    <td className="sticky left-0 z-10 border-r-2 border-slate-300 bg-inherit px-3 py-2 text-xs">TOT</td>
                                    {statColumns.map((column) => (
                                        <td key={`${column.field}-tot`} className={`whitespace-nowrap px-1.5 py-2 text-center text-xs text-slate-700 ${column.field === "plus_minus" || column.field === "serve_errors" || column.field === "reception_excellent_pct" || column.field === "attack_efficiency" ? "border-r-2 border-slate-300" : "border-r border-slate-200"}`}>
                                            {formatStatValue(
                                                column.field,
                                                isPercentField(column.field)
                                                    ? filteredSummary.averages[column.field]
                                                    : filteredSummary.totals[column.field]
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                <h2 className="mb-6 font-display text-3xl uppercase italic">
                    {matchHistoryTitle}
                </h2>

                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="min-w-[920px]">
                        <div className="grid grid-cols-13 gap-3 border-b border-slate-100 bg-slate-50 px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                            <div className="col-span-1 text-center">#</div>
                            <div className="col-span-2">{matchHistoryDateLabel}</div>
                            <div className="col-span-3">{matchHistoryOpponentLabel}</div>
                            <div className="col-span-2 text-center">{matchHistoryScoreLabel}</div>
                            <div className="col-span-4">{matchHistoryCompetitionLabel}</div>
                            <div className="col-span-1 text-center">{matchHistorySetsLabel}</div>
                        </div>

                        {sortedAppearances.map((a, index) => {
                            const match = getMatch(a);
                            if (!match) return null;

                            const scoreTarget =
                                match.match_type === "MAM"
                                    ? "/match/$matchId/all"
                                    : "/match/$matchId";
                            const resultStyle =
                                match.estonia_sets > match.opponent_sets
                                    ? "text-estonia-blue"
                                    : match.estonia_sets === match.opponent_sets
                                        ? "text-green-700"
                                        : "text-red-700";

                            return (
                                <div
                                    key={a.appearance_id}
                                    className="grid grid-cols-13 gap-3 border-t border-slate-100 px-6 py-4"
                                >
                                    <div className="col-span-1 text-center text-slate-500">
                                        {index + 1}
                                    </div>

                                    <div className="col-span-2">
                                        {new Date(
                                            match.match_date
                                        ).toLocaleDateString("en-GB")}
                                    </div>

                                    <div className="col-span-3">
                                        {getLocalizedOpponent(match)}
                                    </div>

                                    <div className="col-span-2 text-center">
                                        <Link
                                            to={scoreTarget}
                                            params={{
                                                matchId: String(a.match_id),
                                            }}
                                            className={`font-semibold hover:underline ${resultStyle}`}
                                        >
                                            {match.estonia_sets}–
                                            {match.opponent_sets}
                                        </Link>
                                    </div>

                                    <div className="col-span-4">
                                        {getLocalizedCompetition(match)}
                                    </div>

                                    <div className="col-span-1 text-center">
                                        {getSetCountFromPositions(a)}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
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
