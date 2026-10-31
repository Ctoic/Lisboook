"use client";

import { useParams } from "next/navigation";
import { Atlas } from "@/components/inkverse/atlas";
import { CreatorGate } from "@/components/inkverse/creator-gate";

export default function AtlasPage() {
  const { id } = useParams<{ id: string }>();
  return <CreatorGate>{(api) => <Atlas api={api} sagaId={id} />}</CreatorGate>;
}
