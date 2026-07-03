import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";

export const Route = createFileRoute("/players")({
  head: () => ({
    meta: [
      { title: "Players — Estonia Men's Volleyball Archive" },
      {
        name: "description",
        content:
          "Every player who has represented the Estonia Men's National Volleyball Team, with career stats and appearances.",
      },
    ],
  }),
  component: () => (
    <ComingSoon
      title="Player Index"
      description="Search every player who has worn the Estonia jersey, with career appearances, sets played, and per-position breakdowns."
    />
  ),
});
