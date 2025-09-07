export default async function TruckAuditPage({ params }: { params: { truckId: string } }) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  const res = await fetch(`${apiUrl}/admin/audit/trucks/${params.truckId}`, { next: { revalidate: 0 } });
  const items = res.ok ? await res.json() : [];
  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-xl font-semibold mb-4">Truck Audit Timeline</h1>
      <div className="space-y-3">
        {items.length === 0 && <div className="text-[var(--muted)]">No items.</div>}
        {items.map((it: any, idx: number) => (
          <div key={idx} className="border rounded p-3">
            <div className="text-sm text-[var(--muted)]">{new Date(it.ts).toLocaleString()} · {it.type}</div>
            <pre className="text-xs overflow-auto">{JSON.stringify(it.data, null, 2)}</pre>
          </div>
        ))}
      </div>
    </main>
  );
}


