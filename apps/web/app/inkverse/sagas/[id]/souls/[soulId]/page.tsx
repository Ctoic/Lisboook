"use client";

import { useParams } from "next/navigation";
import { CreatorGate } from "@/components/inkverse/creator-gate";
import { SoulDetail } from "@/components/inkverse/soul-detail";

export default function SoulPage() {
  const { id, soulId } = useParams<{ id: string; soulId: string }>();
  return <CreatorGate>{(api) => <SoulDetail api={api} sagaId={id} soulId={soulId} />}</CreatorGate>;
}
