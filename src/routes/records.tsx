import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";

export const Route = createFileRoute("/records")({
  head: () => ({
    meta: [
      { title: "Records — Estonia Men's Volleyball Archive" },
      {
        name: "description",
        content:
          "All-time individual and team records for the Estonia Men's National Volleyball Team.",
      },
    ],
  }),
  component: () => (
    <ComingSoon
      title="All-Time Records"
      description="Leaders in appearances, points, aces, blocks, and attack efficiency across the full national team history."
    />
  ),
});
