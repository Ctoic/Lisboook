"use client";

import { useParams } from "next/navigation";
import { CreatorGate } from "@/components/inkverse/creator-gate";
import { LanternPress } from "@/components/inkverse/lantern-press";

export default function PressPage() {
  const { id } = useParams<{ id: string }>();
  return <CreatorGate>{(api) => <LanternPress api={api} sagaId={id} />}</CreatorGate>;
}
