import { useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { totalTopOptions, type PlayerTotals } from "@/lib/total-top.queries";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import MultiSelect from "@/components/ui/multi-select";
import { useTranslation } from "react-i18next";

const positionOrder = ["SET", "OPP", "OH", "MB", "LIB"];

type TotalTopStatKey =
    | "appearances"
    | "sets"
    | "points"
    | "blockPoints"
    | "plusMinus"
    | "serveTotal"
    | "serveAces"
    | "serveErrors"
    | "receptionTotal"
    | "receptionErrors"
    | "receptionPositivePct"
    | "receptionExcellentPct"
    | "attackTotal"
    | "attackErrors"
    | "attackBlocked"
    | "attackKills"
    | "attackKillPct"
    | "attackEfficiency"
    | "breakPoints";

type MatchType = "OFFICIAL" | "COMPETITIVE" | "NON_OFFICIAL" | "ALL";
type SortMode = "perGame" | "total";

export const Route = createFileRoute("/total-top")({
    head: () => ({
        meta: [
            { title: "Total TOP — Eesti Vorkpall DB" },
            {
                name: "description",
                content:
                    "Leaderboards for total career match statistics by position, separated across competitive, official, and all matches.",
            },
        ],
    }),
    loader: ({ context }) => context.queryClient.ensureQueryData(totalTopOptions()),
    component: TotalTopPage,
    errorComponent: TotalTopError,
});

function TotalTopError({ error, reset }: { error: Error; reset: () => void }) {
    return (
        <div className="mx-auto max-w-2xl px-6 py-24 text-center">
            <h1 className="font-display text-3xl uppercase italic">Data unavailable</h1>
            <p className="mt-2 text-sm text-muted-foreground">
                {error.message || "Could not reach the database."}
            </p>
            <button
                onClick={reset}
                className="mt-6 rounded-md bg-estonia-dark px-4 py-2 text-sm font-medium text-white hover:bg-estonia-blue"
            >
                Try again
            </button>
        </div>
    );
}

function getStatValue(group: PlayerTotals, stat: TotalTopStatKey) {
    return group[stat];
}

function getPerGameValue(group: PlayerTotals, stat: TotalTopStatKey) {
    if (
        stat === "attackKillPct" ||
        stat === "attackEfficiency" ||
        stat === "receptionPositivePct" ||
        stat === "receptionExcellentPct"
    ) {
        const total = getStatValue(group, stat);
        return total == null ? null : Number(total.toFixed(2));
    }

    if (group.games <= 0) {
        return null;
    }

    const total = getStatValue(group, stat);
    return total == null ? null : Number((total / group.games).toFixed(2));
}

function formatStatValue(value: number | null | undefined) {
    if (value == null) {
        return "—";
    }

    return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function createEmptyTotals(): PlayerTotals {
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

function countSetsFromPositions(stats: Record<string, unknown> | null): number {
    if (!stats) {
        return 0;
    }

    const positions = [
        stats["set1_position"],
        stats["set2_position"],
        stats["set3_position"],
        stats["set4_position"],
        stats["set5_position"],
    ];

    return positions.filter((value) => typeof value === "string" && value.trim() !== "").length;
}

function matchesSelectedType(
    matchType: MatchType,
    appearance: {
        am: boolean | null;
        vm: boolean | null;
        mam: boolean | null;
    },
): boolean {
    if (matchType === "OFFICIAL") return appearance.am === true;
    if (matchType === "COMPETITIVE") return appearance.vm === true;
    if (matchType === "NON_OFFICIAL") return appearance.mam === true;
    return true;
}

function pickStatsRowForType(
    rows: Array<{ stats_version: string | null }> | null | undefined,
    matchType: MatchType,
) {
    if (!rows || rows.length === 0) {
        return null;
    }

    if (matchType === "ALL") {
        return (
            rows.find((row) => row.stats_version === "ALL") ??
            rows.find((row) => row.stats_version === "AM") ??
            rows[0] ??
            null
        );
    }

    return (
        rows.find((row) => row.stats_version === "AM") ??
        rows.find((row) => row.stats_version === "ALL") ??
        rows[0] ??
        null
    );
}

function TotalTopPage() {
    const { t, i18n } = useTranslation();
    const { data } = useSuspenseQuery(totalTopOptions());

    const [selectedPosition, setSelectedPosition] = useState<string>("ALL");
    const [matchType, setMatchType] = useState<MatchType>("OFFICIAL");
    const [selectedYear, setSelectedYear] = useState<string[]>(["all"]);
    const [selectedCompetition, setSelectedCompetition] = useState<string[]>(["all"]);
    const [selectedOpponent, setSelectedOpponent] = useState<string[]>(["all"]);
    const [selectedStat, setSelectedStat] = useState<TotalTopStatKey>("points");
    const [displayMode, setDisplayMode] = useState<SortMode>("total");
    const [visibleCount, setVisibleCount] = useState<number>(10);

    const positions = useMemo(() => ["ALL", ...positionOrder], []);
    const currentLanguage = i18n.language?.toLowerCase() ?? "et";
    const isEstonian = currentLanguage.startsWith("et");
    const minReceptionsLabel = isEstonian ? "(min 10 vastuvõttu)" : "(min 10 receptions)";
    const minAttacksLabel = isEstonian ? "(min 10 rünnakut)" : "(min 10 attacks)";

    const categoryLabel: Record<TotalTopStatKey, string> = {
        appearances: t("totalTop.metrics.mostAppearances"),
        sets: t("totalTop.metrics.mostSets"),
        points: t("totalTop.metrics.mostPoints"),
        breakPoints: t("totalTop.metrics.mostBreakPoints"),
        plusMinus: t("totalTop.metrics.bestPlusMinus"),
        blockPoints: t("totalTop.metrics.mostBlockPoints"),
        serveTotal: t("totalTop.metrics.mostServes"),
        serveAces: t("totalTop.metrics.mostServeAces"),
        serveErrors: t("totalTop.metrics.mostServeErrors"),
        receptionTotal: t("totalTop.metrics.mostReceptions"),
        receptionErrors: t("totalTop.metrics.mostReceptionErrors"),
        receptionPositivePct: `${t("totalTop.metrics.bestReceptionPct")} ${minReceptionsLabel}`,
        receptionExcellentPct: `${t("totalTop.metrics.bestIdealReceptionPct")} ${minReceptionsLabel}`,
        attackTotal: t("totalTop.metrics.mostAttacks"),
        attackErrors: t("totalTop.metrics.mostAttackErrors"),
        attackBlocked: t("totalTop.metrics.mostAttackBlocks"),
        attackKills: t("totalTop.metrics.mostSuccessfulAttack"),
        attackKillPct: `${t("totalTop.metrics.bestAttackPct")} ${minAttacksLabel}`,
        attackEfficiency: `${t("totalTop.metrics.bestAttackEffPct")} ${minAttacksLabel}`,
    };

    const categoryGroups: Array<{ title: string; categories: TotalTopStatKey[] }> = [
        {
            title: t("gameHighs.groups.general"),
            categories: ["appearances", "sets", "points", "breakPoints", "plusMinus", "blockPoints"],
        },
        {
            title: t("players.statsGroup.serve"),
            categories: ["serveTotal", "serveAces", "serveErrors"],
        },
        {
            title: t("players.statsGroup.reception"),
            categories: [
                "receptionTotal",
                "receptionErrors",
                "receptionPositivePct",
                "receptionExcellentPct",
            ],
        },
        {
            title: t("players.statsGroup.attack"),
            categories: [
                "attackTotal",
                "attackErrors",
                "attackBlocked",
                "attackKills",
                "attackKillPct",
                "attackEfficiency",
            ],
        },
    ];

    const activeGroup = categoryGroups.find((group) => group.categories.includes(selectedStat));

    const positionFilteredEntries = useMemo(() => {
        return data.flatMap((row) => {
            if (selectedPosition !== "ALL" && row.position !== selectedPosition) {
                return [];
            }

            return row.appearances.map((appearance) => ({
                playerId: row.playerId,
                appearance,
            }));
        });
    }, [data, selectedPosition]);

    const matchTypeFilteredEntries = useMemo(() => {
        return positionFilteredEntries.filter(({ appearance }) =>
            matchesSelectedType(matchType, appearance),
        );
    }, [positionFilteredEntries, matchType]);

    const getLocalizedOpponent = (appearance: { opponent: string; opponentEn: string | null }) =>
        isEstonian ? appearance.opponent : (appearance.opponentEn ?? appearance.opponent);

    const getLocalizedCompetition = (appearance: {
        competition: string | null;
        competitionEn: string | null;
    }) =>
        isEstonian ? appearance.competition : (appearance.competitionEn ?? appearance.competition);

    const yearOptions = useMemo(() => {
        const values = new Set<string>();

        matchTypeFilteredEntries.forEach(({ appearance }) => {
            const localizedCompetition = getLocalizedCompetition(appearance);
            const localizedOpponent = getLocalizedOpponent(appearance);

            if (
                !selectedCompetition.includes("all") &&
                localizedCompetition &&
                !selectedCompetition.includes(localizedCompetition)
            )
                return;
            if (
                !selectedOpponent.includes("all") &&
                localizedOpponent &&
                !selectedOpponent.includes(localizedOpponent)
            )
                return;

            values.add(new Date(appearance.matchDate).getFullYear().toString());
        });

        return [...values].sort();
    }, [matchTypeFilteredEntries, selectedCompetition, selectedOpponent, currentLanguage]);

    const competitionOptions = useMemo(() => {
        const values = new Set<string>();

        matchTypeFilteredEntries.forEach(({ appearance }) => {
            const localizedCompetition = getLocalizedCompetition(appearance);
            const localizedOpponent = getLocalizedOpponent(appearance);

            if (!selectedYear.includes("all")) {
                const year = new Date(appearance.matchDate).getFullYear().toString();
                if (!selectedYear.includes(year)) return;
            }
            if (
                !selectedOpponent.includes("all") &&
                localizedOpponent &&
                !selectedOpponent.includes(localizedOpponent)
            )
                return;

            if (localizedCompetition) values.add(localizedCompetition);
        });

        return [...values].sort();
    }, [matchTypeFilteredEntries, selectedYear, selectedOpponent, currentLanguage]);

    const opponentOptions = useMemo(() => {
        const values = new Set<string>();

        matchTypeFilteredEntries.forEach(({ appearance }) => {
            const localizedCompetition = getLocalizedCompetition(appearance);
            const localizedOpponent = getLocalizedOpponent(appearance);

            if (!selectedYear.includes("all")) {
                const year = new Date(appearance.matchDate).getFullYear().toString();
                if (!selectedYear.includes(year)) return;
            }
            if (
                !selectedCompetition.includes("all") &&
                localizedCompetition &&
                !selectedCompetition.includes(localizedCompetition)
            )
                return;

            if (localizedOpponent) values.add(localizedOpponent);
        });

        return [...values].sort();
    }, [matchTypeFilteredEntries, selectedYear, selectedCompetition, currentLanguage]);

    const filteredEntries = useMemo(() => {
        return matchTypeFilteredEntries.filter(({ appearance }) => {
            const localizedCompetition = getLocalizedCompetition(appearance);
            const localizedOpponent = getLocalizedOpponent(appearance);

            if (!selectedYear.includes("all") && selectedYear.length > 0) {
                const year = new Date(appearance.matchDate).getFullYear().toString();
                if (!selectedYear.includes(year)) return false;
            }

            if (!selectedCompetition.includes("all") && selectedCompetition.length > 0) {
                if (!localizedCompetition || !selectedCompetition.includes(localizedCompetition))
                    return false;
            }

            if (!selectedOpponent.includes("all") && selectedOpponent.length > 0) {
                if (!localizedOpponent || !selectedOpponent.includes(localizedOpponent)) return false;
            }

            return true;
        });
    }, [
        matchTypeFilteredEntries,
        selectedYear,
        selectedCompetition,
        selectedOpponent,
        currentLanguage,
    ]);

    const rows = useMemo(() => {
        const groupedTotals = new Map<
            number,
            {
                totals: PlayerTotals;
                receptionPositiveCount: number;
                receptionExcellentCount: number;
                qualifiedReceptionTotal: number;
                qualifiedAttackTotal: number;
                qualifiedAttackKills: number;
                qualifiedAttackBlocked: number;
                qualifiedAttackErrors: number;
            }
        >();

        filteredEntries.forEach(({ playerId, appearance }) => {
            const stats = pickStatsRowForType(appearance.statsRows, matchType) as Record<
                string,
                number | string | null
            > | null;
            if (!stats) {
                return;
            }

            const bucket = groupedTotals.get(playerId) ?? {
                totals: createEmptyTotals(),
                receptionPositiveCount: 0,
                receptionExcellentCount: 0,
                qualifiedReceptionTotal: 0,
                qualifiedAttackTotal: 0,
                qualifiedAttackKills: 0,
                qualifiedAttackBlocked: 0,
                qualifiedAttackErrors: 0,
            };

            bucket.totals.appearances += 1;
            const setsPlayed = countSetsFromPositions(stats);
            bucket.totals.sets += setsPlayed;

            if (setsPlayed > 0) {
                bucket.totals.games += 1;
            }

            if (appearance.onTheBench) {
                bucket.totals.bench += 1;
            }

            bucket.totals.points += Number(stats.points ?? 0);
            bucket.totals.blockPoints += Number(stats.block_points ?? 0);
            bucket.totals.plusMinus += Number(stats.plus_minus ?? 0);
            bucket.totals.serveTotal += Number(stats.serve_total ?? 0);
            bucket.totals.serveAces += Number(stats.serve_aces ?? 0);
            bucket.totals.serveErrors += Number(stats.serve_errors ?? 0);
            bucket.totals.receptionTotal += Number(stats.reception_total ?? 0);
            bucket.totals.receptionErrors += Number(stats.reception_errors ?? 0);
            bucket.totals.attackTotal += Number(stats.attack_total ?? 0);
            bucket.totals.attackErrors += Number(stats.attack_errors ?? 0);
            bucket.totals.attackBlocked += Number(stats.attack_blocked ?? 0);
            bucket.totals.attackKills += Number(stats.attack_kills ?? 0);
            bucket.totals.breakPoints += Number(stats.break_points ?? 0);

            const receptionTotal = Number(stats.reception_total ?? 0);
            const positivePct =
                typeof stats.reception_positive_pct === "number" ? stats.reception_positive_pct : null;
            const excellentPct =
                typeof stats.reception_excellent_pct === "number" ? stats.reception_excellent_pct : null;

            if (receptionTotal >= 10 && positivePct !== null) {
                bucket.receptionPositiveCount += receptionTotal * (positivePct / 100);
                bucket.qualifiedReceptionTotal += receptionTotal;
            }

            if (receptionTotal >= 10 && excellentPct !== null) {
                bucket.receptionExcellentCount += receptionTotal * (excellentPct / 100);
                if (positivePct === null) {
                    bucket.qualifiedReceptionTotal += receptionTotal;
                }
            }

            const attackTotal = Number(stats.attack_total ?? 0);
            if (attackTotal >= 10) {
                bucket.qualifiedAttackTotal += attackTotal;
                bucket.qualifiedAttackKills += Number(stats.attack_kills ?? 0);
                bucket.qualifiedAttackBlocked += Number(stats.attack_blocked ?? 0);
                bucket.qualifiedAttackErrors += Number(stats.attack_errors ?? 0);
            }

            groupedTotals.set(playerId, bucket);
        });

        const hasActiveDetailFilters =
            !selectedYear.includes("all") ||
            !selectedCompetition.includes("all") ||
            !selectedOpponent.includes("all");

        const ranked = data
            .filter((row) => selectedPosition === "ALL" || row.position === selectedPosition)
            .map((row) => {
                const bucket = groupedTotals.get(row.playerId) ?? {
                    totals: createEmptyTotals(),
                    receptionPositiveCount: 0,
                    receptionExcellentCount: 0,
                    qualifiedReceptionTotal: 0,
                    qualifiedAttackTotal: 0,
                    qualifiedAttackKills: 0,
                    qualifiedAttackBlocked: 0,
                    qualifiedAttackErrors: 0,
                };

                if (bucket.qualifiedReceptionTotal > 0) {
                    bucket.totals.receptionPositivePct =
                        (bucket.receptionPositiveCount / bucket.qualifiedReceptionTotal) * 100;
                    bucket.totals.receptionExcellentPct =
                        (bucket.receptionExcellentCount / bucket.qualifiedReceptionTotal) * 100;
                }

                if (bucket.qualifiedAttackTotal > 0) {
                    bucket.totals.attackKillPct =
                        (bucket.qualifiedAttackKills / bucket.qualifiedAttackTotal) * 100;
                    bucket.totals.attackEfficiency =
                        ((bucket.qualifiedAttackKills -
                            bucket.qualifiedAttackBlocked -
                            bucket.qualifiedAttackErrors) /
                            bucket.qualifiedAttackTotal) *
                        100;
                }

                return {
                    ...row,
                    filteredTotals: bucket.totals,
                };
            })
            .filter((row) => (hasActiveDetailFilters ? row.filteredTotals.appearances > 0 : true));

        ranked.sort((a, b) => {
            const aGroup = a.filteredTotals;
            const bGroup = b.filteredTotals;

            const aValue =
                displayMode === "perGame"
                    ? (getPerGameValue(aGroup, selectedStat) ?? 0)
                    : (getStatValue(aGroup, selectedStat) ?? 0);
            const bValue =
                displayMode === "perGame"
                    ? (getPerGameValue(bGroup, selectedStat) ?? 0)
                    : (getStatValue(bGroup, selectedStat) ?? 0);

            if (aValue !== bValue) {
                return bValue - aValue;
            }

            return a.name.localeCompare(b.name);
        });

        return ranked;
    }, [
        data,
        filteredEntries,
        matchType,
        selectedPosition,
        displayMode,
        selectedStat,
        selectedYear,
        selectedCompetition,
        selectedOpponent,
    ]);

    useEffect(() => {
        setVisibleCount(10);
    }, [
        selectedPosition,
        matchType,
        selectedYear,
        selectedCompetition,
        selectedOpponent,
        selectedStat,
        displayMode,
    ]);

    const visibleRows = rows.slice(0, visibleCount);

    return (
        <main className="mx-auto w-full max-w-[1400px] px-6 py-10 text-slate-900">
            <div className="mb-6 rounded-2xl bg-estonia-dark p-6 text-white shadow-sm md:p-8">
                <div className="grid gap-5 lg:grid-cols-3">
                    <div className="text-center">
                        <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/60">
                            {t("gameHighs.filters.matchType")}
                        </div>
                        <div className="mx-auto grid w-full max-w-[440px] grid-cols-2 gap-2">
                            {[
                                { value: "OFFICIAL", label: t("gameHighs.filters.official") },
                                { value: "COMPETITIVE", label: t("gameHighs.filters.competitive") },
                                { value: "NON_OFFICIAL", label: t("gameHighs.filters.nonCompetitive") },
                                { value: "ALL", label: t("gameHighs.filters.all") },
                            ].map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => setMatchType(option.value as MatchType)}
                                    className={`w-full rounded-md border px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition ${matchType === option.value
                                            ? "border-estonia-blue bg-estonia-blue text-white"
                                            : "border-white/30 bg-white/10 text-white/90 hover:bg-white/20"
                                        }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="text-center">
                        <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/60">
                            {t("gameHighs.filters.position")}
                        </div>
                        <div className="mx-auto grid w-full max-w-[440px] grid-cols-3 gap-2">
                            {positions.map((position) => (
                                <button
                                    key={position}
                                    type="button"
                                    onClick={() => setSelectedPosition(position)}
                                    className={`w-full rounded-md border px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition ${selectedPosition === position
                                            ? "border-estonia-blue bg-estonia-blue text-white"
                                            : "border-white/30 bg-white/10 text-white/90 hover:bg-white/20"
                                        }`}
                                >
                                    {position === "ALL" ? "ALL" : position}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="text-center">
                        <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/60">
                            {t("totalTop.table.totals")} / {t("totalTop.table.perGame")}
                        </div>
                        <div className="mx-auto grid w-full max-w-[440px] grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setDisplayMode("total")}
                                className={`w-full rounded-md border px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition ${displayMode === "total"
                                        ? "border-estonia-blue bg-estonia-blue text-white"
                                        : "border-white/30 bg-white/10 text-white/90 hover:bg-white/20"
                                    }`}
                            >
                                {t("totalTop.table.totals")}
                            </button>
                            <button
                                type="button"
                                onClick={() => setDisplayMode("perGame")}
                                className={`w-full rounded-md border px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition ${displayMode === "perGame"
                                        ? "border-estonia-blue bg-estonia-blue text-white"
                                        : "border-white/30 bg-white/10 text-white/90 hover:bg-white/20"
                                    }`}
                            >
                                {t("totalTop.table.perGame")}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="mt-5 grid gap-2 sm:grid-cols-3">
                    <div>
                        <span className="sr-only">{t("players.statsFilter.year")}</span>
                        <MultiSelect
                            options={yearOptions.map((year) => ({ value: year, label: year }))}
                            value={selectedYear}
                            onChange={(value) =>
                                setSelectedYear(
                                    value.length === 0 ? ["all"] : value.includes("all") ? ["all"] : value,
                                )
                            }
                            placeholder={t("players.statsFilter.allYears")}
                            className="w-full"
                        />
                    </div>

                    <div>
                        <span className="sr-only">{t("players.statsFilter.competition")}</span>
                        <MultiSelect
                            options={competitionOptions.map((competition) => ({
                                value: competition,
                                label: competition,
                            }))}
                            value={selectedCompetition}
                            onChange={(value) =>
                                setSelectedCompetition(
                                    value.length === 0 ? ["all"] : value.includes("all") ? ["all"] : value,
                                )
                            }
                            placeholder={t("players.statsFilter.allCompetitions")}
                            className="w-full"
                        />
                    </div>

                    <div>
                        <span className="sr-only">{t("players.statsFilter.opponent")}</span>
                        <MultiSelect
                            options={opponentOptions.map((opponent) => ({ value: opponent, label: opponent }))}
                            value={selectedOpponent}
                            onChange={(value) =>
                                setSelectedOpponent(
                                    value.length === 0 ? ["all"] : value.includes("all") ? ["all"] : value,
                                )
                            }
                            placeholder={t("players.statsFilter.allOpponents")}
                            className="w-full"
                        />
                    </div>
                </div>
            </div>

            <div className="mb-6 grid gap-4 xl:grid-cols-4">
                {categoryGroups.map((group, index) => {
                    const selectedCategory = group.categories.includes(selectedStat) ? selectedStat : "";
                    const isActiveGroup = group.categories.includes(selectedStat);
                    const tone =
                        [
                            "from-sky-50 to-white border-sky-200",
                            "from-emerald-50 to-white border-emerald-200",
                            "from-amber-50 to-white border-amber-200",
                            "from-rose-50 to-white border-rose-200",
                        ][index] ?? "from-slate-50 to-white border-slate-200";

                    return (
                        <section
                            key={group.title}
                            className={`rounded-xl border bg-gradient-to-br p-4 shadow-sm transition ${tone} ${isActiveGroup ? "ring-2 ring-estonia-blue/40" : ""
                                }`}
                        >
                            <h2 className="mb-3 text-center text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-600">
                                {group.title}
                            </h2>
                            <select
                                value={selectedCategory}
                                onChange={(event) => setSelectedStat(event.target.value as TotalTopStatKey)}
                                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-estonia-blue"
                            >
                                <option value="">{t("gameHighs.filters.selectMetric")}</option>
                                {group.categories.map((category) => (
                                    <option key={category} value={category}>
                                        {categoryLabel[category]}
                                    </option>
                                ))}
                            </select>
                        </section>
                    );
                })}
            </div>

            {activeGroup && (
                <p className="mb-6 rounded-lg border border-slate-200 bg-slate-50 px-6 py-4 text-center text-base font-medium text-estonia-dark md:text-lg">
                    {categoryLabel[selectedStat]}
                </p>
            )}

            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="min-w-[860px]">
                    <Table className="min-w-full">
                        <TableHeader>
                            <TableRow className="bg-slate-50">
                                <TableHead className="p-3 text-center">{t("gameHighs.table.rank")}</TableHead>
                                <TableHead className="p-3 text-center">{t("gameHighs.table.name")}</TableHead>
                                <TableHead className="p-3 text-center">{t("gameHighs.table.value")}</TableHead>
                                <TableHead className="p-3 text-center">{t("gameHighs.table.position")}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {visibleRows.map((row, index) => {
                                const group = row.filteredTotals;
                                const value =
                                    displayMode === "perGame"
                                        ? getPerGameValue(group, selectedStat)
                                        : getStatValue(group, selectedStat);

                                return (
                                    <TableRow key={row.playerId}>
                                        <TableCell className="p-3 text-center font-medium text-slate-900">
                                            {index + 1}
                                        </TableCell>
                                        <TableCell className="p-3 text-center font-medium text-slate-900">
                                            <a
                                                href={`/players/${row.playerId}`}
                                                className="text-estonia-dark underline-offset-2 hover:text-estonia-blue hover:underline"
                                            >
                                                {row.name}
                                            </a>
                                        </TableCell>
                                        <TableCell className="p-3 text-center font-semibold text-estonia-dark">
                                            {formatStatValue(value)}
                                        </TableCell>
                                        <TableCell className="p-3 text-center">
                                            {row.position ?? t("positions.Unknown")}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {visibleCount < rows.length && (
                <div className="mt-6 flex justify-center">
                    <button
                        type="button"
                        onClick={() => setVisibleCount((count) => count + 10)}
                        className="rounded-md border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700 transition hover:border-estonia-blue hover:text-estonia-blue"
                    >
                        {t("common.loadMore")}
                    </button>
                </div>
            )}
        </main>
    );
}
