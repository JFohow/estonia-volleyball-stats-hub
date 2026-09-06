import { useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { totalTopOptions, type PlayerTotals } from "@/lib/total-top.queries";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
type MatchGroupKey = "official" | "competitive" | "nonOfficial" | "all";

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
            <p className="mt-2 text-sm text-muted-foreground">{error.message || "Could not reach the database."}</p>
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

function mapMatchTypeToGroup(matchType: MatchType): MatchGroupKey {
    switch (matchType) {
        case "OFFICIAL":
            return "official";
        case "COMPETITIVE":
            return "competitive";
        case "NON_OFFICIAL":
            return "nonOfficial";
        default:
            return "all";
    }
}

function TotalTopPage() {
    const { t } = useTranslation();
    const { data } = useSuspenseQuery(totalTopOptions());

    const [selectedPosition, setSelectedPosition] = useState<string>("ALL");
    const [matchType, setMatchType] = useState<MatchType>("OFFICIAL");
    const [selectedStat, setSelectedStat] = useState<TotalTopStatKey>("points");
    const [displayMode, setDisplayMode] = useState<SortMode>("total");
    const [visibleCount, setVisibleCount] = useState<number>(10);

    const positions = useMemo(() => ["ALL", ...positionOrder], []);

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
        receptionPositivePct: t("totalTop.metrics.bestReceptionPct"),
        receptionExcellentPct: t("totalTop.metrics.bestIdealReceptionPct"),
        attackTotal: t("totalTop.metrics.mostAttacks"),
        attackErrors: t("totalTop.metrics.mostAttackErrors"),
        attackBlocked: t("totalTop.metrics.mostAttackBlocks"),
        attackKills: t("totalTop.metrics.mostSuccessfulAttack"),
        attackKillPct: t("totalTop.metrics.bestAttackPct"),
        attackEfficiency: t("totalTop.metrics.bestAttackEffPct"),
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
            categories: ["receptionTotal", "receptionErrors", "receptionPositivePct", "receptionExcellentPct"],
        },
        {
            title: t("players.statsGroup.attack"),
            categories: ["attackTotal", "attackErrors", "attackBlocked", "attackKills", "attackKillPct", "attackEfficiency"],
        },
    ];

    const activeGroup = categoryGroups.find((group) => group.categories.includes(selectedStat));
    const selectedGroupKey = mapMatchTypeToGroup(matchType);

    const rows = useMemo(() => {
        const filtered = data.filter((row) => {
            if (selectedPosition !== "ALL" && row.position !== selectedPosition) {
                return false;
            }

            return true;
        });

        const ranked = [...filtered].sort((a, b) => {
            const aGroup = a[selectedGroupKey];
            const bGroup = b[selectedGroupKey];

            const aValue =
                displayMode === "perGame"
                    ? getPerGameValue(aGroup, selectedStat) ?? 0
                    : getStatValue(aGroup, selectedStat) ?? 0;
            const bValue =
                displayMode === "perGame"
                    ? getPerGameValue(bGroup, selectedStat) ?? 0
                    : getStatValue(bGroup, selectedStat) ?? 0;

            if (aValue !== bValue) {
                return bValue - aValue;
            }

            return a.name.localeCompare(b.name);
        });

        return ranked;
    }, [data, selectedPosition, selectedGroupKey, displayMode, selectedStat]);

    useEffect(() => {
        setVisibleCount(10);
    }, [selectedPosition, matchType, selectedStat, displayMode]);

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
            </div>

            <div className="mb-6 grid gap-4 xl:grid-cols-4">
                {categoryGroups.map((group, index) => {
                    const selectedCategory = group.categories.includes(selectedStat) ? selectedStat : "";
                    const isActiveGroup = group.categories.includes(selectedStat);
                    const tone = [
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
                                const group = row[selectedGroupKey];
                                const value =
                                    displayMode === "perGame"
                                        ? getPerGameValue(group, selectedStat)
                                        : getStatValue(group, selectedStat);

                                return (
                                    <TableRow key={row.playerId}>
                                        <TableCell className="p-3 text-center font-medium text-slate-900">{index + 1}</TableCell>
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
                                        <TableCell className="p-3 text-center">{row.position ?? t("positions.Unknown")}</TableCell>
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
