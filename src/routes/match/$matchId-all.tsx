import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { matchOptions } from "@/lib/match-stats.queries";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/match/$matchId-all")({
    loader: ({ context, params }) =>
        context.queryClient.ensureQueryData(
            matchOptions(Number(params.matchId))
        ),

    component: MatchStatsAllPage,
});

function MatchStatsAllPage() {
    const { matchId } = Route.useParams();
    const { t, i18n } = useTranslation();

    const { data } = useSuspenseQuery(
        matchOptions(Number(matchId))
    );

    const match = data.match;
    const players = data.players;
    const currentLanguage = i18n.language?.startsWith("et") ? "et" : "en";

    const opponent = currentLanguage === "et" ? match.opponent : match.opponent_en ?? match.opponent;
    const competition = currentLanguage === "et" ? match.competition : match.competition_en ?? match.competition;
    const city = currentLanguage === "et" ? match.city : match.city_en ?? match.city;
    const estoniaLabel = t("common.estonia");

    const officialSetScores = (match.match_sets ?? [])
        .filter((set) => set.set_number <= 5)
        .map((set) => `${set.estonia_points}:${set.opponent_points}`)
        .join(" • ");

    const additionalSetScores = (match.match_sets ?? [])
        .filter((set) => set.set_number > 5)
        .map((set) => `${set.estonia_points}:${set.opponent_points}`)
        .join(" • ");

    const formatStat = (value: number | null): string => {
        if (value == null) return "-";
        if (typeof value === "number") {
            if (value > 100) return Math.round(value).toString();
            return value % 1 === 0 ? Math.round(value).toString() : value.toFixed(1);
        }
        return "-";
    };

    const setColumns = [1, 2, 3, 4, 5];

    const statColumns = [
        { field: "points", label: "PTS" },
        { field: "block_points", label: "BP" },
        { field: "plus_minus", label: "W-P" },
    ];

    const serveColumns = [
        { field: "serve_total", label: "Tot" },
        { field: "serve_aces", label: "Ace" },
        { field: "serve_errors", label: "Err" },
    ];

    const receptionColumns = [
        { field: "reception_total", label: "Tot" },
        { field: "reception_errors", label: "Err" },
        { field: "reception_positive_pct", label: "Pos%" },
        { field: "reception_excellent_pct", label: "Exc%" },
    ];

    const attackColumns = [
        { field: "attack_total", label: "Tot" },
        { field: "attack_errors", label: "Err" },
        { field: "attack_blocked", label: "Blk" },
        { field: "attack_kills", label: "Exc." },
        { field: "attack_kill_pct", label: "Exc.%" },
        { field: "attack_efficiency", label: "Eff%" },
    ];

    const blockColumns = [
        { field: "break_points", label: "PTS" },
    ];

    // Calculate totals
    const calculateTotals = () => {
        const totals: Record<string, number> = {};
        const counts: Record<string, number> = {};
        const allFields = [...statColumns, ...serveColumns, ...receptionColumns, ...attackColumns, ...blockColumns];

        allFields.forEach((col) => {
            totals[col.field] = 0;
            counts[col.field] = 0;
        });

        players.forEach((player) => {
            const stats = player.player_match_stats?.[0];
            if (!stats) return;

            allFields.forEach((col) => {
                const value = stats[col.field as keyof typeof stats];
                if (typeof value === "number" && value !== null) {
                    if (col.label.includes("%")) {
                        totals[col.field] += value;
                        counts[col.field] += 1;
                    } else {
                        totals[col.field] += value;
                    }
                }
            });
        });

        return { totals, counts };
    };

    const { totals, counts } = calculateTotals();

    const getStatValue = (fieldName: string): string => {
        const value = totals[fieldName];
        if (value === undefined) return "-";
        if (fieldName.includes("pct") || fieldName === "attack_efficiency" || fieldName === "attack_kill_pct") {
            const count = counts[fieldName] || 1;
            return formatStat(value / Math.max(count, 1));
        }
        return formatStat(value);
    };


    return (
        <div className="text-slate-900">
            <div className="mx-auto max-w-7xl px-6 py-10">
                {/* Enhanced Match Header */}
                <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
                    <div className="flex items-center justify-between gap-6">
                        {/* Estonia Flag */}
                        <div className="flex-shrink-0">
                            <div className="text-7xl">🇪🇪</div>
                            <p className="mt-2 text-center text-xs font-semibold text-slate-600">{estoniaLabel}</p>
                        </div>

                        {/* Match Info */}
                        <div className="flex-1 text-center">
                            <h1 className="font-display text-4xl uppercase italic">
                                {match.estonia_sets}–{match.opponent_sets}
                            </h1>

                            {officialSetScores && (
                                <div className="mt-2 text-sm font-mono text-slate-700">
                                    {officialSetScores}
                                </div>
                            )}

                            {additionalSetScores && (
                                <div className="mt-1 text-xs italic text-amber-600">
                                    + {additionalSetScores}
                                </div>
                            )}

                            <p className="mt-4 text-sm font-semibold text-slate-700">
                                {new Date(match.match_date).toLocaleDateString("en-GB", {
                                    day: "2-digit",
                                    month: "long",
                                    year: "numeric",
                                })}
                            </p>

                            <p className="mt-2 text-sm text-slate-600">
                                {competition}
                            </p>

                            {city && (
                                <p className="text-sm text-slate-500">
                                    📍 {city}
                                </p>
                            )}

                            {officialSetScores && (
                                <div className="mt-4 text-sm font-mono text-slate-700">
                                    {officialSetScores}
                                </div>
                            )}

                            {officialSetScores && (
                                <div className="mt-3 text-xs">
                                    <a
                                        href={match.source_row || `https://www.cev.eu/`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center text-estonia-blue hover:text-estonia-dark"
                                    >
                                        📊 {t("matches.sourceLink")}
                                        <span className="ml-1">↗</span>
                                    </a>
                                </div>
                            )}

                            {additionalSetScores && (
                                <div className="mt-2 text-xs italic text-amber-600">
                                    + {additionalSetScores}
                                </div>
                            )}
                        </div>

                        {/* Opponent Flag */}
                        <div className="flex-shrink-0 text-center">
                            <div className="text-7xl">🏐</div>
                            <p className="mt-2 text-center text-xs font-semibold text-slate-600 uppercase">
                                {opponent}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Statistics Table */}
                <div className="mt-8 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                    <table className="w-full border-collapse">
                        <thead>
                            {/* Section Headers */}
                            <tr className="border-b-2 border-slate-300 bg-slate-50">
                                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-600 border-r border-slate-200">
                                    #
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-600 border-r-2 border-slate-300">
                                    Player
                                </th>

                                {/* Sets Section */}
                                <th colSpan={5} className="border-r-2 border-slate-300 px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                    Sets
                                </th>

                                {/* Points Section */}
                                <th colSpan={3} className="border-r-2 border-slate-300 px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                    Points
                                </th>

                                {/* Serve Section */}
                                <th colSpan={3} className="border-r-2 border-slate-300 px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                    Serve
                                </th>

                                {/* Reception Section */}
                                <th colSpan={4} className="border-r-2 border-slate-300 px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                    Reception
                                </th>

                                {/* Attack Section */}
                                <th colSpan={6} className="border-r-2 border-slate-300 px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                    Attack
                                </th>

                                {/* Block Section */}
                                <th colSpan={1} className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                    Block
                                </th>
                            </tr>

                            {/* Column Headers */}
                            <tr className="border-b-2 border-slate-300 bg-slate-50">
                                <th className="border-r border-slate-200 px-4 py-2 text-center text-[10px] font-semibold text-slate-600" />
                                <th className="border-r-2 border-slate-300 px-4 py-2 text-left text-[10px] font-semibold text-slate-600" />

                                {/* Set columns */}
                                {setColumns.map((set, idx) => (
                                    <th
                                        key={`set-${set}`}
                                        className={`px-2 py-2 text-center text-[10px] font-semibold text-slate-600 ${idx === setColumns.length - 1 ? "border-r-2 border-slate-300" : "border-r border-slate-200"}`}
                                    >
                                        {set}
                                    </th>
                                ))}

                                {/* Points columns */}
                                {statColumns.map((col, idx) => (
                                    <th
                                        key={col.field}
                                        className={`px-2 py-2 text-center text-[10px] font-semibold text-slate-600 ${idx === statColumns.length - 1 ? "border-r-2 border-slate-300" : "border-r border-slate-200"
                                            }`}
                                    >
                                        {col.label}
                                    </th>
                                ))}

                                {/* Serve columns */}
                                {serveColumns.map((col) => (
                                    <th
                                        key={col.field}
                                        className={`px-2 py-2 text-center text-[10px] font-semibold text-slate-600 border-r-2 border-slate-300`}
                                    >
                                        {col.label}
                                    </th>
                                ))}

                                {/* Reception columns */}
                                {receptionColumns.map((col) => (
                                    <th
                                        key={col.field}
                                        className={`px-2 py-2 text-center text-[10px] font-semibold text-slate-600 border-r-2 border-slate-300`}
                                    >
                                        {col.label}
                                    </th>
                                ))}

                                {/* Attack columns */}
                                {attackColumns.map((col) => (
                                    <th
                                        key={col.field}
                                        className={`px-2 py-2 text-center text-[10px] font-semibold text-slate-600 border-r-2 border-slate-300`}
                                    >
                                        {col.label}
                                    </th>
                                ))}

                                {/* Block columns */}
                                {blockColumns.map((col) => (
                                    <th
                                        key={col.field}
                                        className="px-2 py-2 text-center text-[10px] font-semibold text-slate-600"
                                    >
                                        {col.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                            {/* Player Rows */}
                            {players.map((player, idx) => {
                                const stats = player.player_match_stats?.[0];

                                return (
                                    <tr key={player.appearance_id} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                                        <td className="border-r border-slate-200 px-4 py-3 text-center font-bold text-slate-900">
                                            {player.shirt_number || "—"}
                                        </td>
                                        <td className="border-r-2 border-slate-300 px-4 py-3 text-left text-sm font-medium text-slate-900">
                                            {Array.isArray(player.players) ? `${player.players[0]?.first_name} ${player.players[0]?.last_name}` : `${player.players?.first_name} ${player.players?.last_name}`}
                                        </td>

                                        {/* Set appearances - showing if they played that set */}
                                        {setColumns.map((set, idx) => (
                                            <td
                                                key={`set-${set}`}
                                                className={`px-2 py-3 text-center text-sm text-slate-700 ${idx === setColumns.length - 1 ? "border-r-2 border-slate-300" : "border-r border-slate-200"}`}
                                            >
                                                {(player.sets_played ?? 0) >= set ? set : "—"}
                                            </td>
                                        ))}

                                        {/* Points Stats */}
                                        {statColumns.map((col, idx) => (
                                            <td
                                                key={col.field}
                                                className={`px-2 py-3 text-center text-sm text-slate-700 ${idx === statColumns.length - 1 ? "border-r-2 border-slate-300" : "border-r border-slate-200"
                                                    }`}
                                            >
                                                {stats ? formatStat(stats[col.field as keyof typeof stats] as number | null) : "-"}
                                            </td>
                                        ))}

                                        {/* Serve Stats */}
                                        {serveColumns.map((col) => (
                                            <td
                                                key={col.field}
                                                className={`px-2 py-3 text-center text-sm text-slate-700 border-r-2 border-slate-300`}
                                            >
                                                {stats ? formatStat(stats[col.field as keyof typeof stats] as number | null) : "-"}
                                            </td>
                                        ))}

                                        {/* Reception Stats */}
                                        {receptionColumns.map((col) => (
                                            <td
                                                key={col.field}
                                                className={`px-2 py-3 text-center text-sm text-slate-700 border-r-2 border-slate-300`}
                                            >
                                                {stats ? formatStat(stats[col.field as keyof typeof stats] as number | null) : "-"}
                                            </td>
                                        ))}

                                        {/* Attack Stats */}
                                        {attackColumns.map((col) => (
                                            <td
                                                key={col.field}
                                                className={`px-2 py-3 text-center text-sm text-slate-700 border-r-2 border-slate-300`}
                                            >
                                                {stats ? formatStat(stats[col.field as keyof typeof stats] as number | null) : "-"}
                                            </td>
                                        ))}

                                        {/* Block Stats */}
                                        {blockColumns.map((col) => (
                                            <td
                                                key={col.field}
                                                className="px-2 py-3 text-center text-sm text-slate-700"
                                            >
                                                {stats ? formatStat(stats[col.field as keyof typeof stats] as number | null) : "-"}
                                            </td>
                                        ))}
                                    </tr>
                                );
                            })}

                            {/* Totals Row */}
                            <tr className="border-t-2 border-slate-300 bg-slate-50 font-bold">
                                <td className="border-r border-slate-200 px-4 py-3 text-center text-slate-900">
                                    Σ
                                </td>
                                <td className="border-r-2 border-slate-300 px-4 py-3 text-left text-slate-900">
                                    TOTALS
                                </td>

                                {/* Set totals - not applicable */}
                                {setColumns.map((set, idx) => (
                                    <td
                                        key={`set-total-${set}`}
                                        className={`px-2 py-3 text-center text-sm text-slate-700 ${idx === setColumns.length - 1 ? "border-r-2 border-slate-300" : "border-r border-slate-200"}`}
                                    >
                                        —
                                    </td>
                                ))}

                                {/* Points totals */}
                                {statColumns.map((col, idx) => (
                                    <td
                                        key={`total-${col.field}`}
                                        className={`px-2 py-3 text-center text-sm text-slate-900 ${idx === statColumns.length - 1 ? "border-r-2 border-slate-300" : "border-r border-slate-200"
                                            }`}
                                    >
                                        {getStatValue(col.field)}
                                    </td>
                                ))}

                                {/* Serve totals */}
                                {serveColumns.map((col) => (
                                    <td
                                        key={`total-${col.field}`}
                                        className={`px-2 py-3 text-center text-sm text-slate-900 border-r-2 border-slate-300`}
                                    >
                                        {getStatValue(col.field)}
                                    </td>
                                ))}

                                {/* Reception totals */}
                                {receptionColumns.map((col) => (
                                    <td
                                        key={`total-${col.field}`}
                                        className={`px-2 py-3 text-center text-sm text-slate-900 border-r-2 border-slate-300`}
                                    >
                                        {getStatValue(col.field)}
                                    </td>
                                ))}

                                {/* Attack totals */}
                                {attackColumns.map((col) => (
                                    <td
                                        key={`total-${col.field}`}
                                        className={`px-2 py-3 text-center text-sm text-slate-900 border-r-2 border-slate-300`}
                                    >
                                        {getStatValue(col.field)}
                                    </td>
                                ))}

                                {/* Block totals */}
                                {blockColumns.map((col) => (
                                    <td
                                        key={`total-${col.field}`}
                                        className="px-2 py-3 text-center text-sm text-slate-900"
                                    >
                                        {getStatValue(col.field)}
                                    </td>
                                ))}
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
