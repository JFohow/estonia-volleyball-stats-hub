import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";

export const Route = createFileRoute("/statistics")({
  head: () => ({
    meta: [
      { title: "Statistics — Estonia Men's Volleyball Archive" },
      {
        name: "description",
        content:
          "Aggregate statistics, ALL vs AM comparisons, and coverage overview for the Estonia Men's National Volleyball Team.",
      },
    ],
  }),
  component: () => (
    <ComingSoon
      title="Statistics"
      description="Aggregate skill stats with ALL vs AM toggles, season splits, and per-competition breakdowns."
    />
  ),
});
