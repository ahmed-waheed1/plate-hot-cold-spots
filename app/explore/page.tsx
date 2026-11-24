import type { Metadata } from "next";
import ExploreClient from "@/components/ExploreClient";

export const metadata: Metadata = {
  title: "3D plate",
  description: "Interactive 3D surface of T(x, y) = 50 + x³ − 3x − y³ + 3y with its critical points.",
};

export default function ExplorePage() {
  return <ExploreClient />;
}
