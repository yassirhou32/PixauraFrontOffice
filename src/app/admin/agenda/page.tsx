"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getUser } from "@/lib/auth";
import { AdminY2KLayout } from "@/components/admin/Y2KAdminLayout";
import { ValidatedAgendaCalendar } from "@/components/admin/ValidatedAgendaCalendar";

export default function AdminAgendaPage() {
  const router = useRouter();

  useEffect(() => {
    const user = getUser();
    if (!user || user.role !== "admin") router.push("/login");
  }, [router]);

  return (
    <AdminY2KLayout>
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <ValidatedAgendaCalendar />
      </div>
    </AdminY2KLayout>
  );
}
