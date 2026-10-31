"use client";

import { useParams } from "next/navigation";
import { BookReader } from "@/components/inkverse/debut-shelf";

export default function BookPage() {
  const { slug } = useParams<{ slug: string }>();
  return <BookReader key={slug} slug={slug} />;
}
