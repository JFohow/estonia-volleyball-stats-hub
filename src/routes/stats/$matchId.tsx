import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/stats/$matchId")({
    beforeLoad: ({ params, navigate }) => {
        navigate({
            to: `/match/$${params.matchId}`,
            replace: true,
        });
    },
});