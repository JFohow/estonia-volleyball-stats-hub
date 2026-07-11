import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type CoachListItem = {
    coach_id: number;
    first_name: string;
    last_name: string;
    photo_url: string | null;

    vmMatches: number;
    vmWinPct: number;

    amMatches: number;
    amWinPct: number;

    allMatches: number;
    allWinPct: number;
};

async function fetchCoaches(): Promise<CoachListItem[]> {
    const { data: coaches, error: coachesError } = await supabase
        .from("coaches")
        .select("*");

    if (coachesError) throw coachesError;

    const { data: matches, error: matchesError } = await supabase
        .from("matches")
        .select(`
      coach_id,
      estonia_sets,
      opponent_sets,
      vm,
      am,
      mam
    `);

    if (matchesError) throw matchesError;

    return (coaches ?? [])
        .map((coach) => {
            const coachMatches = (matches ?? []).filter(
                (m) => m.coach_id === coach.coach_id
            );

            const vmMatches = coachMatches.filter((m) => m.vm);

            const vmWins = vmMatches.filter(
                (m) => (m.estonia_sets ?? 0) > (m.opponent_sets ?? 0)
            ).length;

            const amMatches = coachMatches.filter((m) => m.am);

            const amWins = amMatches.filter(
                (m) => (m.estonia_sets ?? 0) > (m.opponent_sets ?? 0)
            ).length;

            const allMatches = coachMatches.filter(
                (m) => m.am || m.mam
            );

            const allWins = allMatches.filter(
                (m) => (m.estonia_sets ?? 0) > (m.opponent_sets ?? 0)
            ).length;

            return {
                coach_id: coach.coach_id,
                first_name: coach.first_name,
                last_name: coach.last_name,
                photo_url: coach.photo_url,

                vmMatches: vmMatches.length,
                vmWinPct:
                    vmMatches.length > 0
                        ? Math.round((vmWins / vmMatches.length) * 1000) / 10
                        : 0,

                amMatches: amMatches.length,
                amWinPct:
                    amMatches.length > 0
                        ? Math.round((amWins / amMatches.length) * 1000) / 10
                        : 0,

                allMatches: allMatches.length,
                allWinPct:
                    allMatches.length > 0
                        ? Math.round((allWins / allMatches.length) * 1000) / 10
                        : 0,
            };
        })
        .sort((a, b) => b.amMatches - a.amMatches);
}

export const coachesOptions = () =>
    queryOptions({
        queryKey: ["coaches"],
        queryFn: fetchCoaches,
    });