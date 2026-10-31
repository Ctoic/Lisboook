"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import type { ReactNode, SVGProps } from "react";
import { useAuth } from "../lib/auth";
import { Button } from "./ui/button";

function Icon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      fill="none"
      height="18"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.75"
      viewBox="0 0 24 24"
      width="18"
      {...props}
    />
  );
}

const icons: Record<string, (props: SVGProps<SVGSVGElement>) => ReactNode> = {
  dashboard: (props) => (
    <Icon {...props}>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </Icon>
  ),
  audiobooks: (props) => (
    <Icon {...props}>
      <path d="M4 19.5V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v14" />
      <path d="M6 21a2 2 0 0 1 0-4h13v4Z" />
    </Icon>
  ),
  catalog: (props) => (
    <Icon {...props}>
      <rect x="3" y="3" width="8" height="8" rx="1.5" />
      <rect x="13" y="3" width="8" height="8" rx="1.5" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" />
      <rect x="13" y="13" width="8" height="8" rx="1.5" />
    </Icon>
  ),
  content: (props) => (
    <Icon {...props}>
      <path d="M6 3h9l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
      <path d="M9 13h6M9 17h6M9 9h2" />
    </Icon>
  ),
  website: (props) => (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3a15 15 0 0 1 0 18" />
      <path d="M12 3a15 15 0 0 0 0 18" />
    </Icon>
  ),
  engagement: (props) => (
    <Icon {...props}>
      <circle cx="9" cy="8" r="3.25" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
      <path d="M16.5 5.5a3.25 3.25 0 0 1 0 6.3" />
      <path d="M18.5 14.2a6.5 6.5 0 0 1 3 5.8" />
    </Icon>
  ),
  users: (props) => (
    <Icon {...props}>
      <circle cx="8.5" cy="8" r="3" />
      <circle cx="16.5" cy="9.5" r="2.5" />
      <path d="M3 20a5.5 5.5 0 0 1 11 0" />
      <path d="M14 20a4.5 4.5 0 0 1 7 0" />
    </Icon>
  ),
  assets: (props) => (
    <Icon {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="8.5" cy="10" r="1.5" />
      <path d="M21 16l-5.5-5.5L7 19" />
    </Icon>
  ),
  settings: (props) => (
    <Icon {...props}>
      <circle cx="12" cy="12" r="3.25" />
      <path d="M19.4 15a1.8 1.8 0 0 0 .36 1.98l.06.06a2.17 2.17 0 1 1-3.07 3.07l-.06-.06a1.8 1.8 0 0 0-1.98-.36 1.8 1.8 0 0 0-1.1 1.65V21.5a2.17 2.17 0 1 1-4.34 0v-.09a1.8 1.8 0 0 0-1.17-1.65 1.8 1.8 0 0 0-1.98.36l-.06.06a2.17 2.17 0 1 1-3.07-3.07l.06-.06a1.8 1.8 0 0 0 .36-1.98 1.8 1.8 0 0 0-1.65-1.1H2.5a2.17 2.17 0 1 1 0-4.34h.09a1.8 1.8 0 0 0 1.65-1.17 1.8 1.8 0 0 0-.36-1.98l-.06-.06a2.17 2.17 0 1 1 3.07-3.07l.06.06a1.8 1.8 0 0 0 1.98.36H9a1.8 1.8 0 0 0 1.1-1.65V2.5a2.17 2.17 0 1 1 4.34 0v.09a1.8 1.8 0 0 0 1.1 1.65 1.8 1.8 0 0 0 1.98-.36l.06-.06a2.17 2.17 0 1 1 3.07 3.07l-.06.06a1.8 1.8 0 0 0-.36 1.98V9a1.8 1.8 0 0 0 1.65 1.1h.16a2.17 2.17 0 1 1 0 4.34h-.09a1.8 1.8 0 0 0-1.65 1.1Z" />
    </Icon>
  ),
  logout: (props) => (
    <Icon {...props}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </Icon>
  )
};

const navigationSections = [
  {
    title: "Overview",
    items: [{ href: "/dashboard", label: "Dashboard", icon: "dashboard" }]
  },
  {
    title: "Catalog",
    items: [
      { href: "/audiobooks", label: "Audiobooks", icon: "audiobooks" },
      { href: "/catalog", label: "Catalog Ops", icon: "catalog" }
    ]
  },
  {
    title: "Content",
    items: [
      { href: "/website", label: "Website", icon: "website" },
      { href: "/users", label: "Users & Roles", icon: "users" },
      { href: "/engagement", label: "Engagement", icon: "engagement" }
    ]
  },
  {
    title: "Platform",
    items: [
      { href: "/assets", label: "Assets", icon: "assets" },
      { href: "/settings", label: "Settings", icon: "settings" }
    ]
  }
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isHydrated, session, signOut } = useAuth();

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isHydrated, router]);

  if (!isHydrated) {
    return (
      <main className="auth-loading">
        <div className="panel">
          <p className="eyebrow">Lisbook Admin</p>
          <h1>Loading workspace</h1>
          <p>Restoring your operator session and workspace state.</p>
        </div>
      </main>
    );
  }

  if (!isAuthenticated || !session) {
    return null;
  }

  const initials = session.user.displayName
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="admin-frame">
      <aside className="sidebar">
        <div className="sidebar__brand">
          <div className="sidebar__mark">L</div>
          <div>
            <h1>Lisbook</h1>
            <span>Admin console</span>
          </div>
        </div>

        <nav className="sidebar__nav" aria-label="Primary">
          {navigationSections.map((section) => (
            <div className="sidebar__section" key={section.title}>
              <p>{section.title}</p>
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                const ItemIcon = icons[item.icon];
                return (
                  <Link
                    className={isActive ? "sidebar__link sidebar__link--active" : "sidebar__link"}
                    href={item.href}
                    key={item.href}
                  >
                    <ItemIcon />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="sidebar__footer">
          <div className="sidebar__account">
            <div className="sidebar__account-avatar">{initials}</div>
            <div className="sidebar__account-meta">
              <strong>{session.user.displayName}</strong>
              <span>{session.user.roles.join(" · ")}</span>
            </div>
          </div>
          <Button icon={<icons.logout />} onClick={signOut} variant="secondary" fullWidth>
            Log out
          </Button>
        </div>
      </aside>

      <div className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Operational workspace</p>
            <h2>{pathname === "/dashboard" ? "Dashboard" : pathname.replace("/", "")}</h2>
          </div>
        </header>
        <main className="workspace__content">{children}</main>
      </div>
    </div>
  );
}
