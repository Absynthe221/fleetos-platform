"use client";
import { useEffect, useState } from "react";
import { authHeaders, currentRole } from "@/lib/authClient";
import { toast } from "react-hot-toast";

export default function ReportsToolbarClient() {
  const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  const [mounted, setMounted] = useState(false);
  const [role, setRole] = useState(null);
  useEffect(() => { setMounted(true); setRole(currentRole()); }, []);

  async function download(path, filename, requiredRole = 'FLEET_MANAGER') {
    try {
      const headers = await authHeaders({ requiredRole });
      const res = await fetch(`${api}${path}`, { headers });
      if (res.status === 403) {
        toast.error('Requires Admin or Fleet Manager');
        return;
      }
      if (!res.ok) throw new Error('Failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (_) {
      toast.error('Download failed');
    }
  }

  if (!mounted) return null;
  const canExport = role === 'ADMIN' || role === 'FLEET_MANAGER';

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <button
        onClick={() => download('/reports/maintenance.pdf', 'maintenance.pdf')}
        disabled={!canExport}
        title={!canExport ? 'Requires Admin or Fleet Manager' : undefined}
        className="border rounded px-3 py-2 text-sm disabled:opacity-50 hover:bg-[var(--muted-bg)]"
      >
        Maintenance PDF
      </button>
      <button
        onClick={() => download('/reports/routes.pdf', 'routes.pdf')}
        disabled={!canExport}
        title={!canExport ? 'Requires Admin or Fleet Manager' : undefined}
        className="border rounded px-3 py-2 text-sm disabled:opacity-50 hover:bg-[var(--muted-bg)]"
      >
        Routes PDF
      </button>
    </div>
  );
}


