"use client";

import { useParams } from "next/navigation";
import { CreatorGate } from "@/components/inkverse/creator-gate";
import { SagaOverview } from "@/components/inkverse/saga-overview";

export default function SagaPage() {
  const { id } = useParams<{ id: string }>();
  return <CreatorGate>{(api) => <SagaOverview api={api} sagaId={id} />}</CreatorGate>;
}
