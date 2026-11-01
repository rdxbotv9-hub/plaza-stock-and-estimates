import { createFileRoute } from "@tanstack/react-router";
import { GracewareCollection } from "@/components/GracewareCollection";
import catalogue from "@/lib/graceware-products.json";
import type { GracewareProduct } from "@/lib/graceware";

export const Route = createFileRoute("/graceware")({
  head: () => ({
    meta: [
      { title: "Graceware Collection — Plaza Steel & Crockery" },
      { name: "description", content: "Browse original Graceware dinner sets, gift sets, tray sets, bath sets, hot pots and household items at Plaza Steel & Crockery, with authentic product names and photographs — order on WhatsApp." },
      { property: "og:title", content: "Graceware Collection — Plaza Steel & Crockery" },
      { property: "og:description", content: "Explore Graceware dinner sets, gift sets, tray sets, bath sets, hot pots and household items in our photo collection." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <GracewareCollection products={catalogue as GracewareProduct[]} />,
});