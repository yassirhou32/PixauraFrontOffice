"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Aperture, CalendarDays, Clapperboard, LogOut } from "lucide-react";
import { clearSession } from "@/lib/auth";
import { GlobalStyles, LiquidBackground } from "@/components/admin/Y2KAdminLayout";
import { cn } from "@/lib/utils";

export function MemberY2KLayout({
  children,
  wideMain = false,
}: {
  children: ReactNode;
  /** P2C : formulaires côte à côte sur grand écran */
  wideMain?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="admin-y2k min-h-screen text-white selection:bg-purple-500 selection:text-white">
      <GlobalStyles />
      <LiquidBackground />
      <div className="relative z-10 flex min-h-screen min-w-0 flex-col px-3 pb-6 pt-3 sm:px-4 sm:pb-8 sm:pt-4 md:p-6">
        <header className="mb-4 flex min-w-0 shrink-0 flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-white to-neutral-400 shadow-[0_0_15px_rgba(255,255,255,0.3)] sm:h-12 sm:w-12">
              <Aperture className="h-5 w-5 text-black sm:h-6 sm:w-6" />
            </div>
            <div className="min-w-0">
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-neutral-400 sm:text-[10px]">Pixaura</p>
              <h1 className="truncate text-base font-black uppercase tracking-tight text-white sm:text-lg md:text-2xl">
                Espace membre
              </h1>
            </div>
          </div>
          <nav className="-mx-1 flex min-w-0 flex-nowrap items-center gap-2 overflow-x-auto px-1 pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0 [&::-webkit-scrollbar]:hidden">
            <Link
              href="/membre/p2c"
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide transition-colors sm:gap-2 sm:px-4 sm:py-2 sm:text-xs sm:tracking-widest",
                pathname?.startsWith("/membre/p2c")
                  ? "border-violet-400/50 bg-violet-500/20 text-white"
                  : "border-white/15 bg-white/5 text-neutral-300 hover:border-white/25 hover:bg-white/10 hover:text-white"
              )}
            >
              <Clapperboard className="h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5" strokeWidth={2} />
              P2C
            </Link>
            <Link
              href="/membre/demandes"
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide transition-colors sm:gap-2 sm:px-4 sm:py-2 sm:text-xs sm:tracking-widest",
                pathname?.startsWith("/membre/demandes")
                  ? "border-violet-400/50 bg-violet-500/20 text-white"
                  : "border-white/15 bg-white/5 text-neutral-300 hover:border-white/25 hover:bg-white/10 hover:text-white"
              )}
            >
              <CalendarDays className="h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5" strokeWidth={2} />
              <span className="whitespace-nowrap">Mes demandes</span>
            </Link>
            <button
              type="button"
              onClick={() => {
                clearSession();
                router.push("/login");
              }}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/20 bg-white/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur-md transition-colors hover:bg-white/15 sm:gap-2 sm:px-4 sm:py-2 sm:text-xs sm:tracking-widest"
            >
              <LogOut className="h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5" strokeWidth={2} />
              <span className="sm:hidden">Déco</span>
              <span className="hidden sm:inline">Déconnexion</span>
            </button>
          </nav>
        </header>
        <main
          className={cn(
            "min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto pb-8 sm:pb-10",
            wideMain && "member-main-wide"
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
