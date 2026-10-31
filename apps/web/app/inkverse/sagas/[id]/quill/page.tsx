"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { CreatorGate, InkverseSkeleton } from "@/components/inkverse/creator-gate";
import type { InkverseClient } from "@/lib/inkverse-client";

function OpenFirstChapter({ api, sagaId }: { api: InkverseClient; sagaId: string }) {
  const router = useRouter();
  useEffect(() => {
    api.saga(sagaId).then(
      (saga) => router.replace(`/inkverse/sagas/${sagaId}/quill/${saga.folios[0].id}`),
      () => router.replace(`/inkverse/sagas/${sagaId}`)
    );
  }, [api, router, sagaId]);
  return <InkverseSkeleton />;
}

// /quill without a chapter opens the Saga's first chapter.
export default function QuillIndexPage() {
  const { id } = useParams<{ id: string }>();
  return <CreatorGate>{(api) => <OpenFirstChapter api={api} sagaId={id} />}</CreatorGate>;
}
