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
};

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
    setNumber: number;
    estoniaPoints: number;
    opponentPoints: number;
    totalPoints: number;
    opponent: string;
    opponentEn: string | null;
    competition: string | null;
    competitionEn: string | null;
};

export type TriviaData = {
    topCities: TriviaCityRow[];
    topAbroadCities: TriviaCityRow[];
    mostEstoniaPointsMatches: TriviaMatchTotalRow[];
    leastEstoniaPointsMatches: TriviaMatchTotalRow[];
    mostOpponentPointsMatches: TriviaMatchTotalRow[];
    leastOpponentPointsMatches: TriviaMatchTotalRow[];
    highestScoringSets: TriviaSetRow[];
    lowestScoringSets: TriviaSetRow[];
};

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

async function fetchTriviaData(): Promise<TriviaData> {
    const [matchesResult, matchSetsResult] = await Promise.all([
        supabase
            .from("matches")
            .select(
                "match_id, match_date, opponent, opponent_en, competition, competition_en, city, city_en, estonia_sets, opponent_sets, has_additional_sets, vm, am, mam"
            ),
        supabase
            .from("match_sets")
            .select("match_id, set_number, estonia_points, opponent_points"),
    ]);

    if (matchesResult.error) throw matchesResult.error;
    if (matchSetsResult.error) throw matchSetsResult.error;

    const matches = (matchesResult.data ?? []) as TriviaMatchBase[];
    const sets = (matchSetsResult.data ?? []) as MatchSetRow[];

    const setsByMatch = new Map<number, MatchSetRow[]>();
    for (const set of sets) {
        const current = setsByMatch.get(set.match_id) ?? [];
        current.push(set);
        setsByMatch.set(set.match_id, current);
    }

    const cityMap = new Map<string, { city: string; cityEnCounts: Map<string, number>; count: number }>();
    const matchTotals: TriviaMatchTotalRow[] = [];

    for (const match of matches) {
        const city = normalizeText(match.city);
        const cityEn = normalizeText(match.city_en);

        if (city) {
            const current = cityMap.get(city) ?? { city, cityEnCounts: new Map<string, number>(), count: 0 };
            current.count += 1;
            if (cityEn) {
                current.cityEnCounts.set(cityEn, (current.cityEnCounts.get(cityEn) ?? 0) + 1);
            }
            cityMap.set(city, current);
        }

        const matchSets = setsByMatch.get(match.match_id) ?? [];
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

    const topCities = topBy(
        cityRows,
        (item) => item.count,
        "desc"
    );

    const topAbroadCities = topBy(
        cityRows.filter((item) => !estoniaHomeCities.has(item.city.toLocaleLowerCase("et-EE"))),
        (item) => item.count,
        "desc"
    );

    const matchesById = new Map(matches.map((item) => [item.match_id, item]));
    const setRows = sets
        .map((set) => {
            const match = matchesById.get(set.match_id);
            if (!match) return null;

            return {
                matchId: match.match_id,
                matchDate: match.match_date,
                estoniaSets: match.estonia_sets,
                opponentSets: match.opponent_sets,
                setNumber: set.set_number,
                estoniaPoints: set.estonia_points,
                opponentPoints: set.opponent_points,
                totalPoints: set.estonia_points + set.opponent_points,
                opponent: match.opponent,
                opponentEn: match.opponent_en,
                competition: match.competition,
                competitionEn: match.competition_en,
            } satisfies TriviaSetRow;
        })
        .filter((row): row is TriviaSetRow => row !== null);

    const highestScoringSets = topBy(
        setRows,
        (item) => item.totalPoints,
        "desc"
    );

    const lowestScoringSets = topBy(
        setRows,
        (item) => item.totalPoints,
        "asc"
    );

    return {
        topCities,
        topAbroadCities,
        mostEstoniaPointsMatches: topBy(matchTotals, (item) => item.estoniaPoints, "desc"),
        leastEstoniaPointsMatches: topBy(matchTotals, (item) => item.estoniaPoints, "asc"),
        mostOpponentPointsMatches: topBy(matchTotals, (item) => item.opponentPoints, "desc"),
        leastOpponentPointsMatches: topBy(matchTotals, (item) => item.opponentPoints, "asc"),
        highestScoringSets,
        lowestScoringSets,
    };
}

export const triviaOptions = () =>
    queryOptions({
        queryKey: ["trivia"],
        queryFn: fetchTriviaData,
    });
