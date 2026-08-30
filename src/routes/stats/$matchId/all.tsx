import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/stats/$matchId/all")({
  beforeLoad: ({ params, navigate }) => {
    navigate({
      to: `/match/${params.matchId}/all`,
      replace: true,
    });
  },
})
