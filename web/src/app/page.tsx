import Image from "next/image";

import { KpiCard } from "@/components/ui/KpiCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import ReportsToolbarClient from "./ReportsToolbarClient";
import RecentTrucksClient from "./RecentTrucksClient";

export default async function Home() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  const [kpisRes, upcomingRes, expiringRes, recentRes] = await Promise.all([
    fetch(`${apiUrl}/dashboard/kpis`, { next: { revalidate: 0 } }),
    fetch(`${apiUrl}/maintenance/upcoming?days=30`, { next: { revalidate: 0 } }),
    fetch(`${apiUrl}/documents/expiring?days=30`, { next: { revalidate: 0 } }),
    fetch(`${apiUrl}/dashboard/recent`, { next: { revalidate: 0 } }),
  ]);
  const [kpis, upcoming, expiring, recent] = await Promise.all([kpisRes.json(), upcomingRes.json(), expiringRes.json(), recentRes.json()]);
  const total = kpis?.fleet?.total ?? 0;
  const ready = kpis?.fleet?.active ?? 0;
  const inService = kpis?.fleet?.inService ?? 0;
  const availableSpots = Array.isArray(kpis?.yard) ? kpis.yard.reduce((acc: number, d: any) => acc + (d.available ?? 0), 0) : 0;

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-6">
      <section className="rounded-lg border p-5 bg-[var(--muted-bg)]">
        <div className="text-2xl font-bold">Fleet OS — Centralize, Simplify, Stay Compliant</div>
        <div className="text-sm text-[var(--muted)] mt-1">
          Real-time yard, inspections & HOS, maintenance schedules, alerts, and role-based workflows in one place.
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <a href="/trucks" className="border rounded px-3 py-2 text-sm hover:bg-[var(--muted)]/10">View Trucks</a>
          <a href="/yard" className="border rounded px-3 py-2 text-sm hover:bg-[var(--muted)]/10">Open Yard</a>
          <a href="/alerts" className="border rounded px-3 py-2 text-sm hover:bg-[var(--muted)]/10">See Alerts</a>
        </div>
      </section>

      <h1 className="text-xl font-semibold">Manager Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Trucks" value={total} />
        <KpiCard label="Ready" value={ready} tone="ok" />
        <KpiCard label="In Service" value={inService} tone="due" />
        <KpiCard label="Available Spots" value={availableSpots} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="lg:col-span-2 flex items-center justify-end">
          {/* Reports toolbar */}
          <ReportsToolbarClient />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Fleet</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentTrucksClient />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Services</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {Array.isArray(upcoming) && upcoming.length > 0 ? (
                upcoming.slice(0, 8).map((u: any) => (
                  <div key={u.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-medium">{u.truck?.plate} · {u.truck?.vin}</div>
                      <div className="text-sm text-[var(--muted)]">Next: {u.nextServiceDate ? new Date(u.nextServiceDate).toLocaleDateString() : '—'}</div>
                    </div>
                    <Badge color="due">Due</Badge>
                  </div>
                ))
              ) : (
                <div className="p-4 text-[var(--muted)]">No upcoming services in 30 days.</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Inspections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {Array.isArray(recent?.inspections) && recent.inspections.length > 0 ? (
                recent.inspections.slice(0,8).map((i: any) => (
                  <div key={i.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-medium">{i.inspectionType} · {i.status}</div>
                      <div className="text-sm text-[var(--muted)]">Truck: {i.truckId?.slice(0,8)} · {new Date(i.createdAt).toLocaleString()}</div>
                    </div>
                    <Badge color={i.status === 'PASS' ? 'ok' : 'alert'}>{i.status}</Badge>
                  </div>
                ))
              ) : (
                <div className="p-4 text-[var(--muted)]">No recent inspections.</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Expiring Documents (30 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {Array.isArray(expiring) && expiring.length > 0 ? (
                expiring.slice(0, 8).map((d: any) => (
                  <div key={d.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-medium">{d.type} {d.docNumber ? `· ${d.docNumber}` : ''}</div>
                      <div className="text-sm text-[var(--muted)]">Truck: {d.truckId?.slice(0,8)} · Exp: {d.expiryDate ? new Date(d.expiryDate).toLocaleDateString() : '—'}</div>
                    </div>
                    <Badge color="due">Expiring</Badge>
                  </div>
                ))
              ) : (
                <div className="p-4 text-[var(--muted)]">No documents expiring in 30 days.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
