import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";

export const Route = createFileRoute("/matches")({
  head: () => ({
    meta: [
      { title: "Matches — Estonia Men's Volleyball Archive" },
      {
        name: "description",
        content:
          "Complete match archive for the Estonia Men's National Volleyball Team, filterable by opponent, competition, and match type.",
      },
    ],
  }),
  component: () => (
    <ComingSoon
      title="Match Archive"
      description="Browse every match in the database with filters for opponent, competition, year, and match type (VM / AM / MAM)."
    />
  ),
});
