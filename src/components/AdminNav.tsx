"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearSession } from "@/lib/auth";

const links = [
  { href: "/admin/dashboard", label: "Tableau de bord" },
  { href: "/admin/clients", label: "Clients" },
  { href: "/admin/demandes", label: "Demandes" },
  { href: "/admin/parametres", label: "Paramètres" },
];

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <header className="flex items-center justify-between border-b border-zinc-200 p-4">
      <nav className="flex gap-3 text-sm">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className={pathname.startsWith(link.href) ? "font-semibold" : "text-zinc-500"}>
            {link.label}
          </Link>
        ))}
      </nav>
      <button
        onClick={() => {
          clearSession();
          router.push("/login");
        }}
        className="rounded bg-black px-3 py-1 text-white"
      >
        Déconnexion
      </button>
    </header>
  );
}
