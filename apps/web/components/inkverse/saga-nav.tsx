"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookIcon, GlobeIcon, LayersIcon, QuillIcon, SparkleIcon, UserIcon } from "@/components/ui/icons";

/** Moves between a Saga's rooms: overview, Quill Room, Soulforge, Atlas, Loom and Lantern Press. */
export function SagaNav({ sagaId }: { sagaId: string }) {
  const pathname = usePathname();
  const base = `/inkverse/sagas/${sagaId}`;
  const rooms = [
    { href: base, label: "Overview", icon: <BookIcon size={16} />, active: pathname === base },
    { href: `${base}/quill`, label: "Quill Room", icon: <QuillIcon size={16} />, active: pathname.startsWith(`${base}/quill`) },
    { href: `${base}/souls`, label: "Soulforge", icon: <UserIcon size={16} />, active: pathname.startsWith(`${base}/souls`) },
    { href: `${base}/atlas`, label: "Atlas", icon: <GlobeIcon size={16} />, active: pathname.startsWith(`${base}/atlas`) },
    { href: `${base}/loom`, label: "Loom", icon: <LayersIcon size={16} />, active: pathname.startsWith(`${base}/loom`) },
    { href: `${base}/press`, label: "Lantern Press", icon: <SparkleIcon size={16} />, active: pathname.startsWith(`${base}/press`) }
  ];
  return (
    <nav className="ink-tabs" aria-label="Saga sections">
      {rooms.map((room) => (
        <Link key={room.href} href={room.href} className="ink-tab" aria-current={room.active ? "page" : undefined}>
          {room.icon}
          {room.label}
        </Link>
      ))}
    </nav>
  );
}
