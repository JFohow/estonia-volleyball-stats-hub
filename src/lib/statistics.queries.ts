import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const statisticsFields = [
    "points",
    "block_points",
    "plus_minus",
    "serve_total",
    "serve_aces",
    "serve_errors",
    "reception_total",
    "reception_errors",
    "reception_positive_pct",
    "reception_excellent_pct",
    "attack_total",
    "attack_errors",
    "attack_blocked",
    "attack_kills",
    "attack_kill_pct",
    "attack_efficiency",
    "break_points",
] as const;

export type StatisticsField = (typeof statisticsFields)[number];
export type StatisticsMode = "official" | "competitive" | "nonCompetitive" | "all";

const percentageFields = new Set<StatisticsField>([
    "reception_positive_pct",
    "reception_excellent_pct",
    "attack_kill_pct",
    "attack_efficiency",
]);

type TotalsRecord = Record<StatisticsField, number>;
type CountsRecord = Record<StatisticsField, number>;

export type StatisticsGroup = {
    appearances: number;
    totals: TotalsRecord;
    counts: CountsRecord;
};

export type PlayerStatisticsRow = {
    playerId: number;
    name: string;
    position: string | null;
    official: StatisticsGroup;
    competitive: StatisticsGroup;
    nonCompetitive: StatisticsGroup;
    all: StatisticsGroup;
};

type PlayerRow = {
    player_id: number;
    first_name: string;
    last_name: string;
    position: string | null;
};

type AppearanceMatchRow = {
    vm: boolean | null;
    am: boolean | null;
    mam: boolean | null;
};

type AppearanceStatsRow = {
    [K in StatisticsField]: number | null;
};

type AppearanceRow = {
    player_id: number;
    matches: AppearanceMatchRow | AppearanceMatchRow[] | null;
    player_match_stats: AppearanceStatsRow | AppearanceStatsRow[] | null;
};

function normalizeRelation<T>(value: T | T[] | null): T | null {
    if (Array.isArray(value)) {
        return value[0] ?? null;
    }
    return value;
}

function createGroup(): StatisticsGroup {
    const totals = {} as TotalsRecord;
    const counts = {} as CountsRecord;

    for (const field of statisticsFields) {
        totals[field] = 0;
        counts[field] = 0;
    }

    return { appearances: 0, totals, counts };
}

function addStats(group: StatisticsGroup, stats: AppearanceStatsRow) {
    group.appearances += 1;

    for (const field of statisticsFields) {
        const value = stats[field];
        if (typeof value !== "number") continue;

        group.totals[field] += value;
        if (percentageFields.has(field)) {
            group.counts[field] += 1;
        }
    }
}

function isPercentageField(field: StatisticsField) {
    return percentageFields.has(field);
}

async function fetchPlayerStatistics(): Promise<PlayerStatisticsRow[]> {
    const playersResponse = await supabase
        .from("players")
        .select("player_id, first_name, last_name, position");

    if (playersResponse.error) throw playersResponse.error;

    const appearancesResponse = await supabase
        .from("appearances")
        .select(
            `player_id, matches(vm, am, mam), player_match_stats(points, block_points, plus_minus, serve_total, serve_aces, serve_errors, reception_total, reception_errors, reception_positive_pct, reception_excellent_pct, attack_total, attack_errors, attack_blocked, attack_kills, attack_kill_pct, attack_efficiency, break_points)`
        );

    if (appearancesResponse.error) throw appearancesResponse.error;

    const players = (playersResponse.data ?? []) as PlayerRow[];
    const appearances = (appearancesResponse.data ?? []) as AppearanceRow[];

    const rows = new Map<number, PlayerStatisticsRow>();

    for (const player of players) {
        rows.set(player.player_id, {
            playerId: player.player_id,
            name: `${player.first_name} ${player.last_name}`,
            position: player.position,
            official: createGroup(),
            competitive: createGroup(),
            nonCompetitive: createGroup(),
            all: createGroup(),
        });
    }

    for (const appearance of appearances) {
        const row = rows.get(appearance.player_id);
        if (!row) continue;

        const match = normalizeRelation(appearance.matches);
        const stats = normalizeRelation(appearance.player_match_stats);

        if (!stats) continue;

        addStats(row.all, stats);

        if (match?.am) {
            addStats(row.official, stats);
        }
        if (match?.vm) {
            addStats(row.competitive, stats);
        }
        if (match?.mam) {
            addStats(row.nonCompetitive, stats);
        }
    }

    return Array.from(rows.values()).sort((a, b) => {
        const aPoints = getDisplayValue(a.official, "points");
        const bPoints = getDisplayValue(b.official, "points");
        return bPoints - aPoints;
    });
}

export function getDisplayValue(group: StatisticsGroup, field: StatisticsField): number {
    if (!isPercentageField(field)) {
        return group.totals[field];
    }

    const count = group.counts[field];
    if (!count) return 0;
    return group.totals[field] / count;
}

export function formatDisplayValue(group: StatisticsGroup, field: StatisticsField): string {
    const value = getDisplayValue(group, field);
    if (isPercentageField(field)) {
        return value.toFixed(1);
    }
    return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export const statisticsOptions = () =>
    queryOptions({
        queryKey: ["statistics"],
        queryFn: fetchPlayerStatistics,
    });
