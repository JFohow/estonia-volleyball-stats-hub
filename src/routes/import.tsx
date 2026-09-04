import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const ADMIN_EMAILS = new Set(["karl_juhkami@hotmail.com", "mjuhkami@gmail.com"]);
const IMPORT_OPEN_IN_DEV = import.meta.env.DEV;

function isAdminUser(user: { app_metadata?: Record<string, unknown> | null; email?: string | null } | null) {
    if (!user) return false;
    const appRole = user.app_metadata?.role;
    const appAdmin = user.app_metadata?.admin;
    const email = user.email?.toLowerCase() ?? "";
    return appRole === "admin" || appAdmin === true || ADMIN_EMAILS.has(email);
}

function csvEscape(value: string | number | boolean | null | undefined) {
    if (value === null || value === undefined) return "";
    const stringValue = String(value);
    if (/[",\n]/.test(stringValue)) {
        return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
}

function normalizeKey(value: string) {
    return value.trim().toLowerCase();
}

type MatchImportRow = {
    match_date: string;
    opponent: string;
    opponent_en: string;
    estonia_sets: string;
    opponent_sets: string;
    est_set1: string;
    opp_set1: string;
    est_set2: string;
    opp_set2: string;
    est_set3: string;
    opp_set3: string;
    est_set4: string;
    opp_set4: string;
    est_set5: string;
    opp_set5: string;
    additional_sets: boolean;
    est_add_set1: string;
    opp_add_set1: string;
    est_add_set2: string;
    opp_add_set2: string;
    vm: boolean;
    am: boolean;
    mam: boolean;
    coach: string;
    competition: string;
    competition_en: string;
    match_city: string;
    city_en: string;
};

type SuggestionLookups = {
    opponent: Record<string, string>;
    competition: Record<string, string>;
    city: Record<string, string>;
};

type ImportMode = "match" | "statistics";

type StatisticsImportRow = {
    shirt_number: string;
    first_name: string;
    last_name: string;
    set1_position: string;
    set2_position: string;
    set3_position: string;
    set4_position: string;
    set5_position: string;
    player_position_in_match: string;
    points: string;
    break_points: string;
    plus_minus: string;
    serve_total: string;
    serve_errors: string;
    serve_aces: string;
    reception_total: string;
    reception_errors: string;
    reception_positive_pct: string;
    reception_excellent_pct: string;
    attack_total: string;
    attack_errors: string;
    attack_blocked: string;
    attack_kills: string;
    attack_kill_pct: string;
    block_points: string;
    player_id: string;
    match_id: string;
    stats_version: "ALL" | "AM";
};

function createEmptyMatchRow(): MatchImportRow {
    return {
        match_date: "",
        opponent: "",
        opponent_en: "",
        estonia_sets: "",
        opponent_sets: "",
        est_set1: "",
        opp_set1: "",
        est_set2: "",
        opp_set2: "",
        est_set3: "",
        opp_set3: "",
        est_set4: "",
        opp_set4: "",
        est_set5: "",
        opp_set5: "",
        additional_sets: false,
        est_add_set1: "",
        opp_add_set1: "",
        est_add_set2: "",
        opp_add_set2: "",
        vm: false,
        am: true,
        mam: false,
        coach: "",
        competition: "",
        competition_en: "",
        match_city: "",
        city_en: "",
    };
}

function createEmptyStatisticsRow(): StatisticsImportRow {
    return {
        shirt_number: "",
        first_name: "",
        last_name: "",
        set1_position: "",
        set2_position: "",
        set3_position: "",
        set4_position: "",
        set5_position: "",
        player_position_in_match: "",
        points: "",
        break_points: "",
        plus_minus: "",
        serve_total: "",
        serve_errors: "",
        serve_aces: "",
        reception_total: "",
        reception_errors: "",
        reception_positive_pct: "",
        reception_excellent_pct: "",
        attack_total: "",
        attack_errors: "",
        attack_blocked: "",
        attack_kills: "",
        attack_kill_pct: "",
        block_points: "",
        player_id: "",
        match_id: "",
        stats_version: "AM",
    };
}

function normalizeBooleanSet(row: MatchImportRow, selected: "VM" | "AM" | "MAM"): MatchImportRow {
    return {
        ...row,
        vm: selected === "VM",
        am: selected === "AM",
        mam: selected === "MAM",
    };
}

function cleanNumber(value: string): string | number {
    if (value.trim() === "") return "";
    const num = Number(value);
    return Number.isFinite(num) ? num : "";
}

function parseOptionalNumber(value: string): number | null {
    if (value.trim() === "") return null;
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
}

const SET_FIELD_PAIRS = [
    ["est_set1", "opp_set1", "Set 1"],
    ["est_set2", "opp_set2", "Set 2"],
    ["est_set3", "opp_set3", "Set 3"],
    ["est_set4", "opp_set4", "Set 4"],
    ["est_set5", "opp_set5", "Set 5"],
] as const;

export const Route = createFileRoute("/import")({
    component: ImportPage,
});

function ImportPage() {
    const [isAdmin, setIsAdmin] = useState(false);
    const [mode, setMode] = useState<ImportMode>("match");
    const [matchCountInput, setMatchCountInput] = useState("1");
    const [rows, setRows] = useState<MatchImportRow[]>([createEmptyMatchRow()]);
    const [statsCountInput, setStatsCountInput] = useState("1");
    const [statsRows, setStatsRows] = useState<StatisticsImportRow[]>([createEmptyStatisticsRow()]);
    const [nextMatchIdStart, setNextMatchIdStart] = useState<number | null>(null);
    const [existingDates, setExistingDates] = useState<Set<string>>(new Set());
    const [metaLoadError, setMetaLoadError] = useState<string>("");
    const [suggestions, setSuggestions] = useState<SuggestionLookups>({
        opponent: {},
        competition: {},
        city: {},
    });

    useEffect(() => {
        let isMounted = true;

        void supabase.auth.getSession().then(({ data }) => {
            if (!isMounted) return;
            setIsAdmin(isAdminUser(data.session?.user ?? null));
        });

        const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
            setIsAdmin(isAdminUser(session?.user ?? null));
        });

        return () => {
            isMounted = false;
            listener.subscription.unsubscribe();
        };
    }, []);

    useEffect(() => {
        let isMounted = true;

        async function loadMetadata() {
            const { data, error } = await supabase
                .from("matches")
                .select("match_id, match_date, opponent, opponent_en, competition, competition_en, city, city_en")
                .order("match_id", { ascending: false })
                .limit(5000);

            if (!isMounted) return;

            if (error) {
                setMetaLoadError(error.message);
                return;
            }

            const maxMatchId = (data ?? []).reduce((max, row) => Math.max(max, row.match_id), 0);
            setNextMatchIdStart(maxMatchId + 1);

            const dateSet = new Set<string>();
            const lookup: SuggestionLookups = { opponent: {}, competition: {}, city: {} };

            for (const row of data ?? []) {
                if (row.match_date) dateSet.add(row.match_date);

                const opponentKey = normalizeKey(row.opponent ?? "");
                if (opponentKey && row.opponent_en && !lookup.opponent[opponentKey]) {
                    lookup.opponent[opponentKey] = row.opponent_en;
                }

                const competitionKey = normalizeKey(row.competition ?? "");
                if (competitionKey && row.competition_en && !lookup.competition[competitionKey]) {
                    lookup.competition[competitionKey] = row.competition_en;
                }

                const cityKey = normalizeKey(row.city ?? "");
                if (cityKey && row.city_en && !lookup.city[cityKey]) {
                    lookup.city[cityKey] = row.city_en;
                }
            }

            setExistingDates(dateSet);
            setSuggestions(lookup);
        }

        void loadMetadata();

        return () => {
            isMounted = false;
        };
    }, []);

    function applyMatchCount() {
        const parsed = Number(matchCountInput);
        if (!Number.isInteger(parsed) || parsed < 1) return;
        setRows((current) => {
            if (parsed === current.length) return current;
            if (parsed < current.length) return current.slice(0, parsed);
            const next = [...current];
            while (next.length < parsed) next.push(createEmptyMatchRow());
            return next;
        });
    }

    function updateRow(index: number, patch: Partial<MatchImportRow>) {
        setRows((current) => current.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row)));
    }

    function setMatchType(index: number, selected: "AM" | "VM" | "MAM") {
        setRows((current) => current.map((row, rowIndex) => (rowIndex === index ? normalizeBooleanSet(row, selected) : row)));
    }

    function applyStatsCount() {
        const parsed = Number(statsCountInput);
        if (!Number.isInteger(parsed) || parsed < 1) return;
        setStatsRows((current) => {
            if (parsed === current.length) return current;
            if (parsed < current.length) return current.slice(0, parsed);
            const next = [...current];
            while (next.length < parsed) next.push(createEmptyStatisticsRow());
            return next;
        });
    }

    function updateStatsRow(index: number, patch: Partial<StatisticsImportRow>) {
        setStatsRows((current) => current.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row)));
    }

    function handleOpponentChange(index: number, value: string) {
        const suggestion = suggestions.opponent[normalizeKey(value)];
        setRows((current) =>
            current.map((row, rowIndex) => {
                if (rowIndex !== index) return row;
                const shouldAutofill = row.opponent_en.trim() === "" && !!suggestion;
                return {
                    ...row,
                    opponent: value,
                    opponent_en: shouldAutofill ? suggestion : row.opponent_en,
                };
            })
        );
    }

    function handleCompetitionChange(index: number, value: string) {
        const suggestion = suggestions.competition[normalizeKey(value)];
        setRows((current) =>
            current.map((row, rowIndex) => {
                if (rowIndex !== index) return row;
                const shouldAutofill = row.competition_en.trim() === "" && !!suggestion;
                return {
                    ...row,
                    competition: value,
                    competition_en: shouldAutofill ? suggestion : row.competition_en,
                };
            })
        );
    }

    function handleCityChange(index: number, value: string) {
        const suggestion = suggestions.city[normalizeKey(value)];
        setRows((current) =>
            current.map((row, rowIndex) => {
                if (rowIndex !== index) return row;
                const shouldAutofill = row.city_en.trim() === "" && !!suggestion;
                return {
                    ...row,
                    match_city: value,
                    city_en: shouldAutofill ? suggestion : row.city_en,
                };
            })
        );
    }

    const generatedMatchIds = useMemo(() => {
        if (nextMatchIdStart == null) return rows.map(() => "");
        return rows.map((_, index) => String(nextMatchIdStart + index));
    }, [rows, nextMatchIdStart]);

    const matchValidationError = useMemo(() => {
        if (metaLoadError) return metaLoadError;
        if (nextMatchIdStart == null) return "Loading existing match IDs and date checks...";

        const localDates = new Set<string>();

        for (let i = 0; i < rows.length; i += 1) {
            const row = rows[i];
            if (!row.match_date) return `Row ${i + 1}: match_date is required.`;
            if (existingDates.has(row.match_date)) return "Match with this date already exists in the database";
            if (localDates.has(row.match_date)) return `Row ${i + 1}: duplicate match_date in this import batch.`;
            localDates.add(row.match_date);

            if (!row.opponent.trim()) return `Row ${i + 1}: opponent is required.`;
            if (!row.opponent_en.trim()) return `Row ${i + 1}: opponent_en is required.`;
            if (!row.estonia_sets.trim()) return `Row ${i + 1}: estonia_sets is required.`;
            if (!row.opponent_sets.trim()) return `Row ${i + 1}: opponent_sets is required.`;

            const estSets = Number(row.estonia_sets);
            const oppSets = Number(row.opponent_sets);
            if (!Number.isFinite(estSets) || estSets < 0) return `Row ${i + 1}: estonia_sets must be a non-negative number.`;
            if (!Number.isFinite(oppSets) || oppSets < 0) return `Row ${i + 1}: opponent_sets must be a non-negative number.`;

            if (!Number.isInteger(estSets) || !Number.isInteger(oppSets)) return "Check set scores";

            const requiredSetCount = estSets + oppSets;
            if (requiredSetCount > 5) return "Check set scores";

            const setChecks: Array<[string, string, number]> = [
                [row.est_set1, row.opp_set1, 25],
                [row.est_set2, row.opp_set2, 25],
                [row.est_set3, row.opp_set3, 25],
                [row.est_set4, row.opp_set4, 25],
                [row.est_set5, row.opp_set5, 15],
            ];

            for (let setIndex = 0; setIndex < setChecks.length; setIndex += 1) {
                const [estRaw, oppRaw, threshold] = setChecks[setIndex];
                const est = parseOptionalNumber(estRaw);
                const opp = parseOptionalNumber(oppRaw);
                const isRequiredSet = setIndex < requiredSetCount;

                if (isRequiredSet && (est === null || opp === null)) return "Check set scores";

                if (est === null && opp === null) continue;
                if (est === null || opp === null) return "Check set scores";
                if (est < 0 || opp < 0) return "Check set scores";
                if (Math.max(est, opp) < threshold) return "Check set scores";
                const deuceFloor = threshold - 2;
                if (Math.max(est, opp) > threshold && Math.min(est, opp) < deuceFloor) return "Check set scores";
                if (Math.abs(est - opp) < 2) return "Check set scores";
            }
        }

        return null;
    }, [rows, nextMatchIdStart, existingDates, metaLoadError]);

    const matchCsvContent = useMemo(() => {
        if (matchValidationError) return "";

        const header = [
            "match_id",
            "match_date",
            "opponent",
            "opponent_en",
            "estonia_sets",
            "opponent_sets",
            "est_set1",
            "opp_set1",
            "est_set2",
            "opp_set2",
            "est_set3",
            "opp_set3",
            "est_set4",
            "opp_set4",
            "est_set5",
            "opp_set5",
            "additional_sets",
            "est_add_set1",
            "opp_add_set1",
            "est_add_set2",
            "opp_add_set2",
            "vm",
            "am",
            "mam",
            "coach",
            "competition",
            "competition_en",
            "match_city",
            "city_en",
        ];

        const csvRows = rows.map((row, index) => [
            Number(generatedMatchIds[index]),
            row.match_date,
            row.opponent.trim(),
            row.opponent_en.trim(),
            cleanNumber(row.estonia_sets),
            cleanNumber(row.opponent_sets),
            cleanNumber(row.est_set1),
            cleanNumber(row.opp_set1),
            cleanNumber(row.est_set2),
            cleanNumber(row.opp_set2),
            cleanNumber(row.est_set3),
            cleanNumber(row.opp_set3),
            cleanNumber(row.est_set4),
            cleanNumber(row.opp_set4),
            cleanNumber(row.est_set5),
            cleanNumber(row.opp_set5),
            row.additional_sets,
            row.additional_sets ? cleanNumber(row.est_add_set1) : "",
            row.additional_sets ? cleanNumber(row.opp_add_set1) : "",
            row.additional_sets ? cleanNumber(row.est_add_set2) : "",
            row.additional_sets ? cleanNumber(row.opp_add_set2) : "",
            row.vm,
            row.am,
            row.mam,
            row.coach.trim(),
            row.competition.trim(),
            row.competition_en.trim(),
            row.match_city.trim(),
            row.city_en.trim(),
        ]);

        return [header.map(csvEscape).join(","), ...csvRows.map((row) => row.map(csvEscape).join(","))].join("\n");
    }, [rows, matchValidationError, generatedMatchIds]);

    const statisticsValidationError = useMemo(() => {
        for (let i = 0; i < statsRows.length; i += 1) {
            const row = statsRows[i];
            if (!row.shirt_number.trim()) return `Row ${i + 1}: shirt_number is required.`;
            if (!row.first_name.trim()) return `Row ${i + 1}: first_name is required.`;
            if (!row.last_name.trim()) return `Row ${i + 1}: last_name is required.`;
            if (!row.player_id.trim()) return `Row ${i + 1}: player_id is required.`;
            if (!row.match_id.trim()) return `Row ${i + 1}: match_id is required.`;
        }

        return null;
    }, [statsRows]);

    const statisticsCsvContent = useMemo(() => {
        if (statisticsValidationError) return "";

        const header = [
            "shirt_number",
            "first_name",
            "last_name",
            "set1_position",
            "set2_position",
            "set3_position",
            "set4_position",
            "set5_position",
            "player_position_in_match",
            "points",
            "break_points",
            "plus_minus",
            "serve_total",
            "serve_errors",
            "serve_aces",
            "reception_total",
            "reception_errors",
            "reception_positive_pct",
            "reception_excellent_pct",
            "attack_total",
            "attack_errors",
            "attack_blocked",
            "attack_kills",
            "attack_kill_pct",
            "block_points",
            "player_id",
            "match_id",
            "stats_version",
        ];

        const csvRows = statsRows.map((row) => [
            cleanNumber(row.shirt_number),
            row.first_name.trim(),
            row.last_name.trim(),
            row.set1_position.trim(),
            row.set2_position.trim(),
            row.set3_position.trim(),
            row.set4_position.trim(),
            row.set5_position.trim(),
            row.player_position_in_match.trim(),
            cleanNumber(row.points),
            cleanNumber(row.break_points),
            cleanNumber(row.plus_minus),
            cleanNumber(row.serve_total),
            cleanNumber(row.serve_errors),
            cleanNumber(row.serve_aces),
            cleanNumber(row.reception_total),
            cleanNumber(row.reception_errors),
            cleanNumber(row.reception_positive_pct),
            cleanNumber(row.reception_excellent_pct),
            cleanNumber(row.attack_total),
            cleanNumber(row.attack_errors),
            cleanNumber(row.attack_blocked),
            cleanNumber(row.attack_kills),
            cleanNumber(row.attack_kill_pct),
            cleanNumber(row.block_points),
            cleanNumber(row.player_id),
            cleanNumber(row.match_id),
            row.stats_version,
        ]);

        return [header.map(csvEscape).join(","), ...csvRows.map((row) => row.map(csvEscape).join(","))].join("\n");
    }, [statsRows, statisticsValidationError]);

    function downloadMatchCsv() {
        if (!matchCsvContent) return;
        const blob = new Blob([matchCsvContent], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "matches_import.csv";
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    }

    function downloadStatisticsCsv() {
        if (!statisticsCsvContent) return;
        const blob = new Blob([statisticsCsvContent], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "statistics_import.csv";
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    }

    const canAccessImport = isAdmin || IMPORT_OPEN_IN_DEV;

    if (!canAccessImport) {
        return (
            <main className="mx-auto max-w-3xl px-6 py-12">
                <h1 className="text-center font-display text-4xl uppercase italic text-estonia-dark">Import</h1>
                <p className="mt-3 text-center text-sm text-slate-600">Admin login is required to access import tools.</p>
            </main>
        );
    }

    return (
        <main className="mx-auto max-w-6xl px-6 py-12">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm [&_input]:text-center">
                {IMPORT_OPEN_IN_DEV && !isAdmin && (
                    <p className="mb-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                        Dev mode: Import is temporarily visible to everyone for testing.
                    </p>
                )}

                <div className="text-center text-[11px] font-bold uppercase tracking-[0.18em] text-estonia-blue">Import Starter</div>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                    <button
                        type="button"
                        onClick={() => setMode("match")}
                        className={`rounded-md px-4 py-2 text-sm font-semibold uppercase tracking-wide ${mode === "match" ? "bg-estonia-blue text-white" : "border border-slate-300 bg-white text-slate-700"}`}
                    >
                        Insert Match
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode("statistics")}
                        className={`rounded-md px-4 py-2 text-sm font-semibold uppercase tracking-wide ${mode === "statistics" ? "bg-estonia-blue text-white" : "border border-slate-300 bg-white text-slate-700"}`}
                    >
                        Insert Statistics
                    </button>
                </div>

                {mode === "match" && (
                    <>
                        <h1 className="mt-4 text-center font-display text-4xl uppercase italic text-estonia-dark">Insert Match</h1>
                        <p className="mt-2 text-center text-sm text-slate-600">Fill matches_import fields for multiple matches and export one CSV file.</p>

                        <div className="mt-4 flex flex-wrap items-end gap-3">
                            <div>
                                <label className="block text-center text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Number of matches</label>
                                <input
                                    type="number"
                                    min={1}
                                    value={matchCountInput}
                                    onChange={(event) => setMatchCountInput(event.target.value)}
                                    className="mt-1 h-10 w-44 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-estonia-blue"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={applyMatchCount}
                                className="h-10 rounded-md border border-slate-300 bg-slate-50 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                            >
                                Apply
                            </button>
                        </div>

                        <div className="mt-6 space-y-6">
                            {rows.map((row, index) => {
                                const opponentSuggestion = suggestions.opponent[normalizeKey(row.opponent)] ?? "";
                                const competitionSuggestion = suggestions.competition[normalizeKey(row.competition)] ?? "";
                                const citySuggestion = suggestions.city[normalizeKey(row.match_city)] ?? "";

                                return (
                                    <section key={index} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                        <h2 className="text-center text-sm font-bold uppercase tracking-wide text-slate-700">Match {index + 1}</h2>

                                        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                                            <input
                                                type="date"
                                                value={row.match_date}
                                                onChange={(event) => updateRow(index, { match_date: event.target.value })}
                                                className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-estonia-blue"
                                            />
                                            <div>
                                                <input
                                                    type="text"
                                                    placeholder="opponent"
                                                    value={row.opponent}
                                                    onChange={(event) => handleOpponentChange(index, event.target.value)}
                                                    className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-estonia-blue"
                                                />
                                                {opponentSuggestion && row.opponent_en.trim() !== opponentSuggestion && (
                                                    <button
                                                        type="button"
                                                        onClick={() => updateRow(index, { opponent_en: opponentSuggestion })}
                                                        className="mt-1 text-xs text-estonia-blue hover:underline"
                                                    >
                                                        Suggestion: {opponentSuggestion}
                                                    </button>
                                                )}
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="opponent_en"
                                                value={row.opponent_en}
                                                onChange={(event) => updateRow(index, { opponent_en: event.target.value })}
                                                className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-estonia-blue"
                                            />
                                            <input
                                                type="number"
                                                min={0}
                                                placeholder="estonia_sets"
                                                value={row.estonia_sets}
                                                onChange={(event) => updateRow(index, { estonia_sets: event.target.value })}
                                                className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-estonia-blue"
                                            />
                                            <input
                                                type="number"
                                                min={0}
                                                placeholder="opponent_sets"
                                                value={row.opponent_sets}
                                                onChange={(event) => updateRow(index, { opponent_sets: event.target.value })}
                                                className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-estonia-blue"
                                            />
                                            <div>
                                                <input
                                                    type="text"
                                                    placeholder="competition"
                                                    value={row.competition}
                                                    onChange={(event) => handleCompetitionChange(index, event.target.value)}
                                                    className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-estonia-blue"
                                                />
                                                {competitionSuggestion && row.competition_en.trim() !== competitionSuggestion && (
                                                    <button
                                                        type="button"
                                                        onClick={() => updateRow(index, { competition_en: competitionSuggestion })}
                                                        className="mt-1 text-xs text-estonia-blue hover:underline"
                                                    >
                                                        Suggestion: {competitionSuggestion}
                                                    </button>
                                                )}
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="competition_en"
                                                value={row.competition_en}
                                                onChange={(event) => updateRow(index, { competition_en: event.target.value })}
                                                className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-estonia-blue"
                                            />

                                            <div>
                                                <input
                                                    type="text"
                                                    placeholder="match_city"
                                                    value={row.match_city}
                                                    onChange={(event) => handleCityChange(index, event.target.value)}
                                                    className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-estonia-blue"
                                                />
                                                {citySuggestion && row.city_en.trim() !== citySuggestion && (
                                                    <button
                                                        type="button"
                                                        onClick={() => updateRow(index, { city_en: citySuggestion })}
                                                        className="mt-1 text-xs text-estonia-blue hover:underline"
                                                    >
                                                        Suggestion: {citySuggestion}
                                                    </button>
                                                )}
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="coach"
                                                value={row.coach}
                                                onChange={(event) => updateRow(index, { coach: event.target.value })}
                                                className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-estonia-blue"
                                            />

                                            <input
                                                type="text"
                                                placeholder="city_en"
                                                value={row.city_en}
                                                onChange={(event) => updateRow(index, { city_en: event.target.value })}
                                                className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-estonia-blue"
                                            />
                                        </div>

                                        <div className="mt-5">
                                            <p className="text-center text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Sets</p>
                                            <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                                                {SET_FIELD_PAIRS.map(([estKey, oppKey, label]) => (
                                                    <div key={label} className="rounded-md border border-slate-200 bg-white p-2">
                                                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
                                                        <div className="mt-1 grid grid-cols-2 gap-2">
                                                            <input
                                                                type="number"
                                                                min={0}
                                                                placeholder="EST"
                                                                value={row[estKey]}
                                                                onChange={(event) => updateRow(index, { [estKey]: event.target.value })}
                                                                className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm outline-none focus:border-estonia-blue"
                                                            />
                                                            <input
                                                                type="number"
                                                                min={0}
                                                                placeholder="OPP"
                                                                value={row[oppKey]}
                                                                onChange={(event) => updateRow(index, { [oppKey]: event.target.value })}
                                                                className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm outline-none focus:border-estonia-blue"
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="mt-4 flex flex-wrap items-center gap-4">
                                            <label className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-700">
                                                <input
                                                    type="checkbox"
                                                    checked={row.additional_sets}
                                                    onChange={(event) => updateRow(index, { additional_sets: event.target.checked })}
                                                />
                                                Additional sets
                                            </label>

                                            <div className="flex flex-wrap gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setMatchType(index, "AM")}
                                                    className={`rounded-md px-3 py-1.5 text-xs font-semibold ${row.am ? "bg-estonia-blue text-white" : "border border-slate-300 bg-white text-slate-700"}`}
                                                >
                                                    Official Game
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setMatchType(index, "VM")}
                                                    className={`rounded-md px-3 py-1.5 text-xs font-semibold ${row.vm ? "bg-estonia-blue text-white" : "border border-slate-300 bg-white text-slate-700"}`}
                                                >
                                                    Competitive Game
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setMatchType(index, "MAM")}
                                                    className={`rounded-md px-3 py-1.5 text-xs font-semibold ${row.mam ? "bg-estonia-blue text-white" : "border border-slate-300 bg-white text-slate-700"}`}
                                                >
                                                    Non-Official Game
                                                </button>
                                            </div>
                                        </div>

                                        {row.additional_sets && (
                                            <div className="mt-4">
                                                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                                                    <div className="rounded-md border border-slate-200 bg-white p-2">
                                                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Additional Set 1</p>
                                                        <div className="mt-1 grid grid-cols-2 gap-2">
                                                            <input
                                                                type="number"
                                                                min={0}
                                                                placeholder="EST"
                                                                value={row.est_add_set1}
                                                                onChange={(event) => updateRow(index, { est_add_set1: event.target.value })}
                                                                className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm outline-none focus:border-estonia-blue"
                                                            />
                                                            <input
                                                                type="number"
                                                                min={0}
                                                                placeholder="OPP"
                                                                value={row.opp_add_set1}
                                                                onChange={(event) => updateRow(index, { opp_add_set1: event.target.value })}
                                                                className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm outline-none focus:border-estonia-blue"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="rounded-md border border-slate-200 bg-white p-2">
                                                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Additional Set 2</p>
                                                        <div className="mt-1 grid grid-cols-2 gap-2">
                                                            <input
                                                                type="number"
                                                                min={0}
                                                                placeholder="EST"
                                                                value={row.est_add_set2}
                                                                onChange={(event) => updateRow(index, { est_add_set2: event.target.value })}
                                                                className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm outline-none focus:border-estonia-blue"
                                                            />
                                                            <input
                                                                type="number"
                                                                min={0}
                                                                placeholder="OPP"
                                                                value={row.opp_add_set2}
                                                                onChange={(event) => updateRow(index, { opp_add_set2: event.target.value })}
                                                                className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm outline-none focus:border-estonia-blue"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </section>
                                );
                            })}
                        </div>

                        {matchValidationError ? (
                            <p className="mt-4 text-sm text-red-600">{matchValidationError}</p>
                        ) : (
                            <p className="mt-4 text-sm text-green-700">CSV is ready for download.</p>
                        )}

                        <button
                            type="button"
                            onClick={downloadMatchCsv}
                            disabled={Boolean(matchValidationError)}
                            className="mt-4 h-10 rounded-md bg-green-600 px-4 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            DOWNLOAD CSV
                        </button>

                        <div className="mt-5">
                            <label className="mb-2 block text-center text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Generated CSV</label>
                            <textarea
                                readOnly
                                value={matchCsvContent}
                                rows={8}
                                className="w-full rounded-md border border-slate-200 bg-slate-50 p-3 text-center font-mono text-xs text-slate-700"
                            />
                        </div>
                    </>
                )}

                {mode === "statistics" && (
                    <>
                        <h1 className="mt-4 text-center font-display text-4xl uppercase italic text-estonia-dark">Insert Statistics</h1>
                        <p className="mt-2 text-center text-sm text-slate-600">First draft statistics import table editor and CSV export.</p>

                        <div className="mt-4 flex flex-wrap items-end gap-3">
                            <div>
                                <label className="block text-center text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Number of rows</label>
                                <input
                                    type="number"
                                    min={1}
                                    value={statsCountInput}
                                    onChange={(event) => setStatsCountInput(event.target.value)}
                                    className="mt-1 h-10 w-44 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-estonia-blue"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={applyStatsCount}
                                className="h-10 rounded-md border border-slate-300 bg-slate-50 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                            >
                                Apply
                            </button>
                        </div>

                        <div className="mt-6 space-y-6">
                            {statsRows.map((row, index) => (
                                <section key={index} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                    <h2 className="text-center text-sm font-bold uppercase tracking-wide text-slate-700">Statistics Row {index + 1}</h2>

                                    <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                                        <input type="number" min={0} placeholder="shirt_number" value={row.shirt_number} onChange={(event) => updateStatsRow(index, { shirt_number: event.target.value })} className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-estonia-blue" />
                                        <input type="text" placeholder="first_name" value={row.first_name} onChange={(event) => updateStatsRow(index, { first_name: event.target.value })} className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-estonia-blue" />
                                        <input type="text" placeholder="last_name" value={row.last_name} onChange={(event) => updateStatsRow(index, { last_name: event.target.value })} className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-estonia-blue" />
                                        <input type="text" placeholder="set1_position" value={row.set1_position} onChange={(event) => updateStatsRow(index, { set1_position: event.target.value })} className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-estonia-blue" />
                                        <input type="text" placeholder="set2_position" value={row.set2_position} onChange={(event) => updateStatsRow(index, { set2_position: event.target.value })} className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-estonia-blue" />
                                        <input type="text" placeholder="set3_position" value={row.set3_position} onChange={(event) => updateStatsRow(index, { set3_position: event.target.value })} className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-estonia-blue" />
                                        <input type="text" placeholder="set4_position" value={row.set4_position} onChange={(event) => updateStatsRow(index, { set4_position: event.target.value })} className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-estonia-blue" />
                                        <input type="text" placeholder="set5_position" value={row.set5_position} onChange={(event) => updateStatsRow(index, { set5_position: event.target.value })} className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-estonia-blue" />
                                        <input type="text" placeholder="player_position_in_match" value={row.player_position_in_match} onChange={(event) => updateStatsRow(index, { player_position_in_match: event.target.value })} className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-estonia-blue" />
                                        <input type="number" placeholder="points" value={row.points} onChange={(event) => updateStatsRow(index, { points: event.target.value })} className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-estonia-blue" />
                                        <input type="number" placeholder="break_points" value={row.break_points} onChange={(event) => updateStatsRow(index, { break_points: event.target.value })} className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-estonia-blue" />
                                        <input type="number" placeholder="plus_minus" value={row.plus_minus} onChange={(event) => updateStatsRow(index, { plus_minus: event.target.value })} className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-estonia-blue" />
                                        <input type="number" placeholder="serve_total" value={row.serve_total} onChange={(event) => updateStatsRow(index, { serve_total: event.target.value })} className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-estonia-blue" />
                                        <input type="number" placeholder="serve_errors" value={row.serve_errors} onChange={(event) => updateStatsRow(index, { serve_errors: event.target.value })} className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-estonia-blue" />
                                        <input type="number" placeholder="serve_aces" value={row.serve_aces} onChange={(event) => updateStatsRow(index, { serve_aces: event.target.value })} className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-estonia-blue" />
                                        <input type="number" placeholder="reception_total" value={row.reception_total} onChange={(event) => updateStatsRow(index, { reception_total: event.target.value })} className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-estonia-blue" />
                                        <input type="number" placeholder="reception_errors" value={row.reception_errors} onChange={(event) => updateStatsRow(index, { reception_errors: event.target.value })} className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-estonia-blue" />
                                        <input type="number" placeholder="reception_positive_pct" value={row.reception_positive_pct} onChange={(event) => updateStatsRow(index, { reception_positive_pct: event.target.value })} className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-estonia-blue" />
                                        <input type="number" placeholder="reception_excellent_pct" value={row.reception_excellent_pct} onChange={(event) => updateStatsRow(index, { reception_excellent_pct: event.target.value })} className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-estonia-blue" />
                                        <input type="number" placeholder="attack_total" value={row.attack_total} onChange={(event) => updateStatsRow(index, { attack_total: event.target.value })} className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-estonia-blue" />
                                        <input type="number" placeholder="attack_errors" value={row.attack_errors} onChange={(event) => updateStatsRow(index, { attack_errors: event.target.value })} className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-estonia-blue" />
                                        <input type="number" placeholder="attack_blocked" value={row.attack_blocked} onChange={(event) => updateStatsRow(index, { attack_blocked: event.target.value })} className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-estonia-blue" />
                                        <input type="number" placeholder="attack_kills" value={row.attack_kills} onChange={(event) => updateStatsRow(index, { attack_kills: event.target.value })} className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-estonia-blue" />
                                        <input type="number" placeholder="attack_kill_pct" value={row.attack_kill_pct} onChange={(event) => updateStatsRow(index, { attack_kill_pct: event.target.value })} className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-estonia-blue" />
                                        <input type="number" placeholder="block_points" value={row.block_points} onChange={(event) => updateStatsRow(index, { block_points: event.target.value })} className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-estonia-blue" />
                                        <input type="number" min={1} placeholder="player_id" value={row.player_id} onChange={(event) => updateStatsRow(index, { player_id: event.target.value })} className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-estonia-blue" />
                                        <input type="number" min={1} placeholder="match_id" value={row.match_id} onChange={(event) => updateStatsRow(index, { match_id: event.target.value })} className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-estonia-blue" />
                                        <select
                                            value={row.stats_version}
                                            onChange={(event) => updateStatsRow(index, { stats_version: event.target.value as "ALL" | "AM" })}
                                            className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-estonia-blue"
                                        >
                                            <option value="AM">AM</option>
                                            <option value="ALL">ALL</option>
                                        </select>
                                    </div>
                                </section>
                            ))}
                        </div>

                        {statisticsValidationError ? (
                            <p className="mt-4 text-sm text-red-600">{statisticsValidationError}</p>
                        ) : (
                            <p className="mt-4 text-sm text-green-700">CSV is ready for download.</p>
                        )}

                        <button
                            type="button"
                            onClick={downloadStatisticsCsv}
                            disabled={Boolean(statisticsValidationError)}
                            className="mt-4 h-10 rounded-md bg-green-600 px-4 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            DOWNLOAD CSV
                        </button>

                        <div className="mt-5">
                            <label className="mb-2 block text-center text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Generated CSV</label>
                            <textarea
                                readOnly
                                value={statisticsCsvContent}
                                rows={8}
                                className="w-full rounded-md border border-slate-200 bg-slate-50 p-3 text-center font-mono text-xs text-slate-700"
                            />
                        </div>
                    </>
                )}
            </div>
        </main>
    );
}
