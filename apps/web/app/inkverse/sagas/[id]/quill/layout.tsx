"use client";

import { useParams } from "next/navigation";
import type { ReactNode } from "react";
import { CreatorGate } from "@/components/inkverse/creator-gate";
import { QuillRoom } from "@/components/inkverse/quill-room";

// The Quill Room lives in the layout so it stays mounted while the writer moves between chapters:
// the Muse's threads and any queued writing survive the URL change.
export default function QuillRoomLayout({ children }: { children: ReactNode }) {
  const { id, folioId } = useParams<{ id: string; folioId: string }>();
  // /quill on its own is a redirect to the first chapter (see page.tsx).
  if (!folioId) return <>{children}</>;
  return (
    <>
      <CreatorGate>{(api) => <QuillRoom key={id} api={api} sagaId={id} folioId={folioId} />}</CreatorGate>
      {children}
    </>
  );
}
