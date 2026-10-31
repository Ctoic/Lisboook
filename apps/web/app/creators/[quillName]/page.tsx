"use client";

import { useParams } from "next/navigation";
import { CreatorPage } from "@/components/inkverse/creator-page";

export default function CreatorRoute() {
  const { quillName } = useParams<{ quillName: string }>();
  return <CreatorPage key={quillName} quillName={decodeURIComponent(quillName)} />;
}
