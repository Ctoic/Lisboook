"use client";

import { useParams } from "next/navigation";
import { CreatorGate } from "@/components/inkverse/creator-gate";
import { Loom } from "@/components/inkverse/loom";

export default function LoomPage() {
  const { id } = useParams<{ id: string }>();
  return <CreatorGate>{(api) => <Loom api={api} sagaId={id} />}</CreatorGate>;
}
