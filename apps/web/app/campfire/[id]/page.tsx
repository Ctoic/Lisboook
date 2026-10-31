"use client";

import { useParams } from "next/navigation";
import { CampfireThread } from "@/components/inkverse/campfire";

export default function CampfireThreadPage() {
  const { id } = useParams<{ id: string }>();
  return <CampfireThread key={id} id={id} />;
}
