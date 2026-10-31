"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button, ButtonLink } from "@/components/ui/button";
import { CloseIcon, LogOutIcon, LogoMark, MenuIcon, MoonIcon, QuillIcon, SearchIcon, SunIcon, UserIcon } from "@/components/ui/icons";
import { initials } from "@/lib/format";
import { useAuth } from "@/providers/auth-provider";
import { useTheme } from "@/providers/theme-provider";

const links = [
  { href: "/", label: "Home" },
  { href: "/explore", label: "Explore" },
  { href: "/inkverse", label: "Inkverse" },
  { href: "/campfire", label: "Campfire" },
  { href: "/scan", label: "Scan" },
  { href: "/about", label: "About" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" }
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function Brand() {
  return (
    <Link href="/" className="brand" aria-label="Lisbook home">
      <span className="brand__mark">
        <LogoMark size={22} />
      </span>
      Lisbook
    </Link>
  );
}

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const next = theme === "dark" ? "light" : "dark";
  return (
    <Button variant="ghost" icon onClick={toggleTheme} aria-label={`Switch to ${next} theme`} title={`Switch to ${next} theme`}>
      {theme === "dark" ? <SunIcon size={19} /> : <MoonIcon size={19} />}
    </Button>
  );
}

function AccountMenu() {
  const { session, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(event: MouseEvent) {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!session) return null;
  const { user } = session;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        className="avatar"
        style={{ border: 0, cursor: "pointer" }}
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu for ${user.displayName}`}
      >
        {initials(user.displayName)}
      </button>
      {open ? (
        <div className="menu glass glass--strong" role="menu">
          <div className="menu__header">
            <p style={{ fontWeight: 600 }}>{user.displayName}</p>
            <p className="muted" style={{ fontSize: "0.85rem" }}>
              {user.email}
            </p>
          </div>
          <Link href="/profile" className="menu__item" role="menuitem" onClick={() => setOpen(false)}>
            <UserIcon size={18} /> Your library
          </Link>
          <Link href="/inkverse" className="menu__item" role="menuitem" onClick={() => setOpen(false)}>
            <QuillIcon size={18} /> Your Inkwell
          </Link>
          <button
            type="button"
            className="menu__item"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              signOut();
            }}
          >
            <LogOutIcon size={18} /> Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}

function MobileDrawer({ onClose, pathname }: { onClose: () => void; pathname: string }) {
  const { session, openSignIn, signOut } = useAuth();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    panelRef.current?.querySelector<HTMLElement>("a, button")?.focus();
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return createPortal(
    <div className="drawer" role="dialog" aria-modal="true" aria-label="Main menu">
      <div className="drawer__scrim" onClick={onClose} aria-hidden />
      <div ref={panelRef} className="drawer__panel glass glass--strong">
        <div className="row" style={{ justifyContent: "space-between", marginBottom: 12 }}>
          <Brand />
          <Button variant="ghost" icon onClick={onClose} aria-label="Close menu">
            <CloseIcon size={20} />
          </Button>
        </div>
        <nav aria-label="Mobile">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="nav__link"
              style={{ display: "flex" }}
              aria-current={isActive(pathname, link.href) ? "page" : undefined}
              onClick={onClose}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div style={{ marginTop: "auto", display: "grid", gap: 10, paddingTop: 20 }}>
          {session ? (
            <>
              <ButtonLink href="/profile" variant="glass" block onClick={onClose}>
                <UserIcon size={18} /> Your library
              </ButtonLink>
              <Button
                variant="ghost"
                block
                onClick={() => {
                  signOut();
                  onClose();
                }}
              >
                <LogOutIcon size={18} /> Sign out
              </Button>
            </>
          ) : (
            <Button
              variant="primary"
              block
              onClick={() => {
                onClose();
                openSignIn();
              }}
            >
              Sign in
            </Button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

export function Navbar() {
  const pathname = usePathname();
  const { session, ready, openSignIn } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => setMenuOpen(false), [pathname]);

  return (
    <header className="nav-wrap">
      <div className="shell">
        <nav className="nav glass glass--strong" aria-label="Main">
          <Brand />
          <ul className="nav__links">
            {links.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="nav__link" aria-current={isActive(pathname, link.href) ? "page" : undefined}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="nav__actions">
            <ButtonLink href="/explore" variant="ghost" icon aria-label="Search audiobooks" className="nav__desktop-only">
              <SearchIcon size={19} />
            </ButtonLink>
            <ThemeToggle />
            {ready && session ? (
              <AccountMenu />
            ) : (
              <Button variant="primary" size="sm" className="nav__desktop-only" onClick={() => openSignIn()} style={{ visibility: ready ? "visible" : "hidden" }}>
                Sign in
              </Button>
            )}
            <Button variant="glass" icon className="nav__menu-btn" onClick={() => setMenuOpen(true)} aria-label="Open menu" aria-expanded={menuOpen}>
              <MenuIcon size={20} />
            </Button>
          </div>
        </nav>
      </div>
      {menuOpen ? <MobileDrawer pathname={pathname} onClose={() => setMenuOpen(false)} /> : null}
    </header>
  );
}
