"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useRef, useState } from "react";
import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import {
  MoreVertical,
  Disc,
  Waves,
  Hexagon,
  Fingerprint,
  LogOut,
  Calendar,
  Menu,
  X,
  UserCircle2,
} from "lucide-react";
import { clearSession } from "@/lib/auth";
import { cn } from "@/lib/utils";

const ADMIN_NAV_LINKS = [
  { href: "/admin/dashboard", icon: Disc, key: "dashboard", label: "Dashboard" },
  { href: "/admin/clients", icon: Waves, key: "clients", label: "Client" },
  { href: "/admin/demandes", icon: Hexagon, key: "demandes", label: "Demande" },
  { href: "/admin/agenda", icon: Calendar, key: "agenda", label: "Agenda" },
  { href: "/admin/parametres", icon: Fingerprint, key: "parametres", label: "Calendrier" },
] as const;

export function GlobalStyles() {
  return (
    <style jsx global>{`
      .admin-y2k {
        background-color: #000;
        color: #fff;
        font-family: var(--font-montserrat), ui-sans-serif, system-ui, sans-serif;
        overflow-x: hidden;
        scrollbar-width: thin;
        scrollbar-color: #6366f1 transparent;
      }

      .admin-y2k ::-webkit-scrollbar {
        width: 6px;
        height: 6px;
      }
      .admin-y2k ::-webkit-scrollbar-track {
        background: transparent;
      }
      .admin-y2k ::-webkit-scrollbar-thumb {
        background: #6366f1;
        border-radius: 10px;
      }

      .font-mono {
        font-family: var(--font-montserrat), ui-sans-serif, system-ui, sans-serif;
        font-variant-numeric: tabular-nums;
      }

      .admin-y2k select,
      .admin-y2k input,
      .admin-y2k textarea {
        background: rgba(10, 10, 10, 0.7);
        color: #ffffff;
        border: 1px solid rgba(255, 255, 255, 0.25);
      }

      .admin-y2k select:focus,
      .admin-y2k input:focus,
      .admin-y2k textarea:focus {
        outline: none;
        border-color: rgba(129, 140, 248, 0.8);
        box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
      }

      .admin-y2k select option {
        background: #0a0a0a;
        color: #ffffff;
      }

      @keyframes drift {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }

      .liquid-blob {
        position: absolute;
        filter: blur(80px);
        opacity: 0.6;
        border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%;
        animation: drift 20s infinite linear;
        mix-blend-mode: exclusion;
      }

      .chrome-border {
        box-shadow:
          inset 1px 1px 0px rgba(255, 255, 255, 0.5),
          inset -1px -1px 0px rgba(255, 255, 255, 0.1),
          0px 0px 0px 1px rgba(0, 0, 0, 1),
          0px 10px 20px -10px rgba(0, 0, 0, 0.5);
      }

      .text-glow {
        text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
      }
    `}</style>
  );
}

export function LiquidBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-black">
      <div className="liquid-blob top-[-10%] left-[-10%] h-[60vw] w-[60vw] bg-indigo-600" />
      <div className="liquid-blob top-[20%] right-[-20%] h-[50vw] w-[50vw] bg-purple-600" />
      <div className="liquid-blob bottom-[-20%] left-[20%] h-[60vw] w-[60vw] bg-blue-600" />
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[80px]" />
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
    </div>
  );
}

export function ChromeCard({
  children,
  className,
  title,
  subtitle,
  innerClassName,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  innerClassName?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set(e.clientX - rect.left);
    y.set(e.clientY - rect.top);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("chrome-border group relative overflow-hidden rounded-3xl bg-neutral-900/60 backdrop-blur-3xl", className)}
    >
      <motion.div
        className="pointer-events-none absolute -inset-px opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          background: useMotionTemplate`radial-gradient(600px circle at ${x}px ${y}px, rgba(255,255,255,0.15), transparent 80%)`,
        }}
      />
      <div className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-br from-white/20 via-transparent to-black/50 opacity-20 mix-blend-overlay" />

      <div className={cn("relative z-10 flex h-full min-h-0 flex-col p-4 sm:p-6", innerClassName)}>
        {(title || subtitle) && (
          <div className="mb-4 flex items-start justify-between gap-3 sm:mb-6">
            <div className="min-w-0 flex-1">
              {title && <h3 className="text-lg font-bold uppercase tracking-tight text-white sm:text-xl">{title}</h3>}
              {subtitle && <p className="mt-1 font-mono text-xs text-neutral-400">{subtitle}</p>}
            </div>
            <MoreVertical className="h-5 w-5 shrink-0 cursor-pointer text-neutral-500 hover:text-white" />
          </div>
        )}
        {children}
      </div>
    </motion.div>
  );
}

function AdminNavLinkList({
  pathname,
  onNavigate,
  variant,
}: {
  pathname: string;
  onNavigate?: () => void;
  variant: "sidebar" | "drawer";
}) {
  return (
    <div className={cn("flex flex-col", variant === "sidebar" ? "gap-6" : "gap-1")}>
      {ADMIN_NAV_LINKS.map((item) => {
        const Icon = item.icon;
        const active = pathname.startsWith(item.href);
        return (
          <Link
            key={item.key}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "group relative flex items-center gap-3 rounded-full px-3 py-2 transition-colors hover:bg-white/10",
              active && "bg-white/10",
              variant === "drawer" && "py-3"
            )}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
              <Icon className={cn("h-6 w-6 text-neutral-400 transition-colors group-hover:text-white", active && "text-white")} />
            </span>
            <span className={cn("font-mono text-sm transition-colors group-hover:text-white", active ? "text-white" : "text-neutral-400")}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

function AdminPillSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <aside className="z-30 hidden w-56 shrink-0 flex-col justify-between rounded-[40px] border border-white/10 bg-neutral-900/40 px-4 py-8 backdrop-blur-xl md:flex">
      <Link
        href="/admin/dashboard"
        className="flex w-full shrink-0 items-center justify-center rounded-2xl outline-none ring-offset-2 ring-offset-black transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-white/40"
        title="Tableau de bord"
      >
        <img
          src={encodeURI("/images/PIXaura-soft white.png")}
          alt="Pixaura"
          width={200}
          height={48}
          className="mx-auto h-9 w-auto max-w-[10rem] object-contain object-center"
          loading="eager"
          decoding="async"
        />
      </Link>

      <AdminNavLinkList pathname={pathname} variant="sidebar" />

      <button
        type="button"
        onClick={() => {
          clearSession();
          router.push("/login");
        }}
        className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 p-[1px]"
        title="Deconnexion"
      >
        <div className="flex h-full w-full items-center justify-center rounded-full bg-black">
          <LogOut className="h-5 w-5 text-white" />
        </div>
      </button>
    </aside>
  );
}

function AdminMobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <>
      <header className="fixed left-0 right-0 top-0 z-50 flex items-center gap-2 border-b border-white/10 bg-black/85 px-3 py-2.5 backdrop-blur-xl md:hidden">
        <button
          type="button"
          aria-expanded={open}
          aria-controls="admin-mobile-drawer"
          aria-label="Ouvrir le menu"
          onClick={() => setOpen(true)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-white transition-colors hover:bg-white/10"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Link
          href="/admin/dashboard"
          className="flex min-w-0 flex-1 items-center justify-center py-0.5"
          onClick={close}
        >
          <img
            src={encodeURI("/images/PIXaura-soft white.png")}
            alt="Pixaura"
            width={200}
            height={48}
            className="h-7 w-auto max-w-[9rem] object-contain"
            loading="eager"
            decoding="async"
          />
        </Link>
        <div className="w-10 shrink-0" aria-hidden />
      </header>

      <div
        id="admin-mobile-drawer"
        className={cn(
          "fixed inset-0 z-[60] md:hidden transition-[visibility,opacity]",
          open ? "visible opacity-100" : "invisible pointer-events-none opacity-0"
        )}
        aria-hidden={!open}
      >
        <button
          type="button"
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          aria-label="Fermer le menu"
          onClick={close}
        />
        <aside
          className={cn(
            "absolute left-0 top-0 flex h-full w-[min(100%,19rem)] flex-col border-r border-white/10 bg-neutral-950/95 px-4 pb-6 pt-4 shadow-2xl backdrop-blur-xl transition-transform duration-200 ease-out",
            open ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500">Admin</span>
            <button
              type="button"
              aria-label="Fermer"
              onClick={close}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-white hover:bg-white/10"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <AdminNavLinkList pathname={pathname} onNavigate={close} variant="drawer" />
            <p className="mt-6 px-3 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500">Autre espace</p>
            <Link
              href="/membre/demandes"
              onClick={close}
              className="mt-2 flex items-center gap-3 rounded-full px-3 py-3 text-neutral-300 transition-colors hover:bg-white/10 hover:text-white"
            >
              <UserCircle2 className="h-6 w-6 shrink-0 text-indigo-400" />
              <span className="font-mono text-sm">Espace membre</span>
            </Link>
          </div>
          <button
            type="button"
            onClick={() => {
              close();
              clearSession();
              router.push("/login");
            }}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border border-white/15 py-3 font-mono text-sm text-white hover:bg-white/10"
          >
            <LogOut className="h-4 w-4" />
            Déconnexion
          </button>
        </aside>
      </div>
    </>
  );
}

export function AdminY2KLayout({ children }: { children: ReactNode }) {
  return (
    <div className="admin-y2k min-h-screen text-white selection:bg-purple-500 selection:text-white">
      <GlobalStyles />
      <LiquidBackground />
      <AdminMobileNav />
      <div className="flex h-screen min-h-0 overflow-hidden gap-0 p-2 pt-[3.25rem] sm:p-3 md:gap-6 md:p-6 md:pt-6">
        <AdminPillSidebar />
        <main className="z-20 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
