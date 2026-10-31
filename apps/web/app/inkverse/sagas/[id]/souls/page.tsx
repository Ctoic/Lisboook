"use client";

import { useParams } from "next/navigation";
import { CreatorGate } from "@/components/inkverse/creator-gate";
import { Soulforge } from "@/components/inkverse/soulforge";

export default function SoulforgePage() {
  const { id } = useParams<{ id: string }>();
  return <CreatorGate>{(api) => <Soulforge api={api} sagaId={id} />}</CreatorGate>;
}
