import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type TriviaMatchBase = {
    match_id: number;
    match_date: string;
    opponent: string;
    opponent_en: string | null;
    competition: string | null;
    competition_en: string | null;
    city: string | null;
    city_en: string | null;
    estonia_sets: number;
    opponent_sets: number;
    has_additional_sets: boolean;
    vm: boolean | null;
    am: boolean | null;
    mam: boolean | null;
};

type MatchSetRow = {
    match_id: number;
    set_number: number;
    estonia_points: number;
    opponent_points: number;
    set_duration: number | null;
};

const PAGE_SIZE = 1000;

export type TriviaMode = "official" | "competitive" | "nonCompetitive" | "all";

export type TriviaCityRow = {
    city: string;
    cityEn: string | null;
    count: number;
};

export type TriviaMatchTotalRow = {
    matchId: number;
    matchDate: string;
    opponent: string;
    opponentEn: string | null;
    competition: string | null;
    competitionEn: string | null;
    estoniaSets: number;
    opponentSets: number;
    hasAdditionalSets: boolean;
    estoniaPoints: number;
    opponentPoints: number;
    totalPoints: number;
};

export type TriviaSetRow = {
    matchId: number;
    matchDate: string;
    estoniaSets: number;
    opponentSets: number;
    hasAdditionalSets: boolean;
    setNumber: number;
    estoniaPoints: number;
    opponentPoints: number;
    totalPoints: number;
    setDuration: number | null;
    opponent: string;
    opponentEn: string | null;
    competition: string | null;
    competitionEn: string | null;
};

export type TriviaMatchDurationRow = {
    matchId: number;
    matchDate: string;
    opponent: string;
    opponentEn: string | null;
    competition: string | null;
    competitionEn: string | null;
    estoniaSets: number;
    opponentSets: number;
    hasAdditionalSets: boolean;
    durationMinutes: number;
};

export type TriviaModeData = {
    topCities: TriviaCityRow[];
    topAbroadCities: TriviaCityRow[];
    mostEstoniaPointsMatches: TriviaMatchTotalRow[];
    leastEstoniaPointsMatches: TriviaMatchTotalRow[];
    mostOpponentPointsMatches: TriviaMatchTotalRow[];
    leastOpponentPointsMatches: TriviaMatchTotalRow[];
    highestScoringSets: TriviaSetRow[];
    lowestScoringSets: TriviaSetRow[];
    shortestSets: TriviaSetRow[];
    longestSets: TriviaSetRow[];
    shortestMatches: TriviaMatchDurationRow[];
    longestMatches: TriviaMatchDurationRow[];
};

export type TriviaData = Record<TriviaMode, TriviaModeData>;

const estoniaHomeCities = new Set([
    "tallinn",
    "parnu",
    "pärnu",
    "rakvere",
    "tartu",
    "voru",
    "võru",
    "kuressaare",
]);

function normalizeText(value: string | null | undefined): string | null {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
}

function topBy<T>(items: T[], getValue: (item: T) => number, direction: "asc" | "desc") {
    const sorted = [...items].sort((a, b) => {
        const aValue = getValue(a);
        const bValue = getValue(b);

        if (aValue !== bValue) {
            return direction === "asc" ? aValue - bValue : bValue - aValue;
        }

        return 0;
    });

    return sorted.slice(0, 10);
}

async function fetchAllMatches(): Promise<TriviaMatchBase[]> {
    const rows: TriviaMatchBase[] = [];
    let from = 0;

    while (true) {
        const { data, error } = await supabase
            .from("matches")
            .select(
                "match_id, match_date, opponent, opponent_en, competition, competition_en, city, city_en, estonia_sets, opponent_sets, has_additional_sets, vm, am, mam"
            )
            .order("match_id", { ascending: true })
            .range(from, from + PAGE_SIZE - 1);

        if (error) throw error;

        const page = (data ?? []) as TriviaMatchBase[];
        rows.push(...page);

        if (page.length < PAGE_SIZE) break;
        from += PAGE_SIZE;
    }

    return rows;
}

async function fetchAllMatchSets(): Promise<MatchSetRow[]> {
    const rows: MatchSetRow[] = [];
    let from = 0;

    while (true) {
        const { data, error } = await supabase
            .from("match_sets")
            .select("match_id, set_number, estonia_points, opponent_points, set_duration")
            .order("match_set_id", { ascending: true })
            .range(from, from + PAGE_SIZE - 1);

        if (error) throw error;

        const page = (data ?? []) as MatchSetRow[];
        rows.push(...page);

        if (page.length < PAGE_SIZE) break;
        from += PAGE_SIZE;
    }

    return rows;
}

async function fetchTriviaData(): Promise<TriviaData> {
    const [matches, sets] = await Promise.all([fetchAllMatches(), fetchAllMatchSets()]);

    const setsByMatch = new Map<number, MatchSetRow[]>();
    for (const set of sets) {
        const current = setsByMatch.get(set.match_id) ?? [];
        current.push(set);
        setsByMatch.set(set.match_id, current);
    }

    const matchesById = new Map(matches.map((item) => [item.match_id, item]));
    const allSetRows = sets
        .map((set) => {
            const match = matchesById.get(set.match_id);
            if (!match) return null;

            return {
                matchId: match.match_id,
                matchDate: match.match_date,
                estoniaSets: match.estonia_sets,
                opponentSets: match.opponent_sets,
                hasAdditionalSets: match.has_additional_sets,
                setNumber: set.set_number,
                estoniaPoints: set.estonia_points,
                opponentPoints: set.opponent_points,
                totalPoints: set.estonia_points + set.opponent_points,
                setDuration: set.set_duration,
                opponent: match.opponent,
                opponentEn: match.opponent_en,
                competition: match.competition,
                competitionEn: match.competition_en,
            } satisfies TriviaSetRow;
        })
        .filter((row): row is TriviaSetRow => row !== null);

    function buildModeData(predicate: (match: TriviaMatchBase) => boolean): TriviaModeData {
        const filteredMatches = matches.filter(predicate);
        const filteredMatchIds = new Set(filteredMatches.map((match) => match.match_id));
        const filteredSetRows = allSetRows.filter((row) => filteredMatchIds.has(row.matchId));

        const cityMap = new Map<string, { city: string; cityEnCounts: Map<string, number>; count: number }>();
        for (const match of filteredMatches) {
            const city = normalizeText(match.city);
            const cityEn = normalizeText(match.city_en);

            if (!city) continue;

            const current = cityMap.get(city) ?? { city, cityEnCounts: new Map<string, number>(), count: 0 };
            current.count += 1;
            if (cityEn) {
                current.cityEnCounts.set(cityEn, (current.cityEnCounts.get(cityEn) ?? 0) + 1);
            }
            cityMap.set(city, current);
        }

        const cityRows = [...cityMap.values()].map((item) => {
            let cityEn: string | null = null;
            let best = 0;

            for (const [name, count] of item.cityEnCounts.entries()) {
                if (count > best) {
                    best = count;
                    cityEn = name;
                }
            }

            return {
                city: item.city,
                cityEn,
                count: item.count,
            };
        });

        const matchTotals: TriviaMatchTotalRow[] = [];
        const matchDurations: TriviaMatchDurationRow[] = [];

        for (const match of filteredMatches) {
            const matchSets = setsByMatch.get(match.match_id) ?? [];
            if (matchSets.length === 0) continue;

            const estoniaPoints = matchSets.reduce((sum, set) => sum + (set.estonia_points ?? 0), 0);
            const opponentPoints = matchSets.reduce((sum, set) => sum + (set.opponent_points ?? 0), 0);

            matchTotals.push({
                matchId: match.match_id,
                matchDate: match.match_date,
                opponent: match.opponent,
                opponentEn: match.opponent_en,
                competition: match.competition,
                competitionEn: match.competition_en,
                estoniaSets: match.estonia_sets,
                opponentSets: match.opponent_sets,
                hasAdditionalSets: match.has_additional_sets,
                estoniaPoints,
                opponentPoints,
                totalPoints: estoniaPoints + opponentPoints,
            });

            const durationValues = matchSets
                .map((set) => set.set_duration)
                .filter((duration): duration is number => typeof duration === "number" && Number.isFinite(duration));

            if (durationValues.length > 0) {
                const durationMinutes = durationValues.reduce((sum, duration) => sum + duration, 0);
                matchDurations.push({
                    matchId: match.match_id,
                    matchDate: match.match_date,
                    opponent: match.opponent,
                    opponentEn: match.opponent_en,
                    competition: match.competition,
                    competitionEn: match.competition_en,
                    estoniaSets: match.estonia_sets,
                    opponentSets: match.opponent_sets,
                    hasAdditionalSets: match.has_additional_sets,
                    durationMinutes,
                });
            }
        }

        const setsWithDuration = filteredSetRows.filter(
            (row) => typeof row.setDuration === "number" && Number.isFinite(row.setDuration)
        );

        return {
            topCities: topBy(cityRows, (item) => item.count, "desc"),
            topAbroadCities: topBy(
                cityRows.filter((item) => !estoniaHomeCities.has(item.city.toLocaleLowerCase("et-EE"))),
                (item) => item.count,
                "desc"
            ),
            mostEstoniaPointsMatches: topBy(matchTotals, (item) => item.estoniaPoints, "desc"),
            leastEstoniaPointsMatches: topBy(matchTotals, (item) => item.estoniaPoints, "asc"),
            mostOpponentPointsMatches: topBy(matchTotals, (item) => item.opponentPoints, "desc"),
            leastOpponentPointsMatches: topBy(matchTotals, (item) => item.opponentPoints, "asc"),
            highestScoringSets: topBy(filteredSetRows, (item) => item.totalPoints, "desc"),
            lowestScoringSets: topBy(filteredSetRows, (item) => item.totalPoints, "asc"),
            shortestSets: topBy(setsWithDuration, (item) => item.setDuration ?? 0, "asc"),
            longestSets: topBy(setsWithDuration, (item) => item.setDuration ?? 0, "desc"),
            shortestMatches: topBy(matchDurations, (item) => item.durationMinutes, "asc"),
            longestMatches: topBy(matchDurations, (item) => item.durationMinutes, "desc"),
        };
    }

    return {
        official: buildModeData((match) => Boolean(match.am)),
        competitive: buildModeData((match) => Boolean(match.vm)),
        nonCompetitive: buildModeData((match) => Boolean(match.mam)),
        all: buildModeData(() => true),
    };
}

export const triviaOptions = () =>
    queryOptions({
        queryKey: ["trivia"],
        queryFn: fetchTriviaData,
    });
