import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/stats/$matchId-all")({
    component: MatchStatsAllPage,
});

function MatchStatsAllPage() {
    const { matchId } = Route.useParams();

    return (
        <div className="mx-auto max-w-6xl px-6 py-12">
            <h1 className="font-display text-4xl uppercase italic">
                Match Statistics + Additional Sets
            </h1>

            <p className="mt-4 text-slate-500">
                Match ID: {matchId}
            </p>
        </div>
    );
}