import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { matchOptions } from "@/lib/match-stats.queries";
import { MatchHeader } from "@/components/matches/MatchHeader";

export const Route = createFileRoute(
    "/stats/$matchId"
)({
    loader: ({ context, params }) =>
        context.queryClient.ensureQueryData(
            matchOptions(Number(params.matchId))
        ),

    component: MatchStatsPage,
});

function MatchStatsPage() {
    const { matchId } = Route.useParams();

    const { data: match } = useSuspenseQuery(
        matchOptions(Number(matchId))
    );

    return (
        <>
            <div className="mx-auto max-w-7xl px-6 py-10">
                <MatchHeader
                    match={match}
                    showAdditionalSets={false}
                />

                <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6">
                    Statistics coming soon
                </div>
            </div>
        </>
    );
}