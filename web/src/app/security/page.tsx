"use client";
import { useState } from "react";
import { useToast } from "@/components/ToastProvider";

export default function SecurityPage() {
  const toast = useToast();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  const [q, setQ] = useState("");
  const [trucks, setTrucks] = useState<any[]>([]);
  const [selectedTruckId, setSelectedTruckId] = useState("");
  const [selectedTruck, setSelectedTruck] = useState<any|null>(null);
  const [spotId, setSpotId] = useState("");
  const [userId, setUserId] = useState("");
  const [locked, setLocked] = useState<boolean|undefined>(undefined);

  async function search() {
    const r = await fetch(`${apiUrl}/security/trucks?q=${encodeURIComponent(q)}`);
    if (r.ok) setTrucks(await r.json());
  }
  async function outbound() {
    if (!selectedTruckId) return;
    await fetch(`${apiUrl}/security/outbound`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ truckId: selectedTruckId, recordedBy: userId }) });
    await loadTruck(selectedTruckId);
    toast.success('Outbound recorded (spot freed)');
  }
  async function loadTruck(id: string) {
    if (!id) { setSelectedTruck(null); setLocked(undefined); return; }
    const r = await fetch(`${apiUrl}/trucks/${id}`);
    if (r.ok) {
      const t = await r.json();
      setSelectedTruck(t);
      setLocked(!!t.isLocked);
    }
  }
  async function inbound() {
    if (!selectedTruckId) return;
    await fetch(`${apiUrl}/security/inbound`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ truckId: selectedTruckId, recordedBy: userId }) });
    toast.success('Inbound recorded');
  }
  async function assign() {
    if (!selectedTruckId || !spotId) return;
    await fetch(`${apiUrl}/security/parking/${selectedTruckId}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ parkingSpotId: spotId, recordedBy: userId }) });
    toast.success('Parking assigned');
  }
  async function setLockState(nextLocked: boolean) {
    if (!selectedTruckId) return;
    const r = await fetch(`${apiUrl}/security/lock/${selectedTruckId}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ locked: nextLocked }) });
    if (r.ok) setLocked(nextLocked);
  }

  return (
    <main className="max-w-4xl mx-auto p-6 grid gap-4">
      <h1 className="text-xl font-semibold">Security Console</h1>
      <label className="grid gap-1">
        <span className="text-sm">Security User ID</span>
        <input className="border p-2 rounded" value={userId} onChange={e=>setUserId(e.target.value)} />
      </label>
      <div className="grid sm:grid-cols-3 gap-2 items-end">
        <label className="grid gap-1 sm:col-span-2">
          <span className="text-sm">Search trucks</span>
          <input className="border p-2 rounded" value={q} onChange={e=>setQ(e.target.value)} />
        </label>
        <button className="border rounded px-3 py-2" onClick={search}>Search</button>
      </div>
      {trucks.length > 0 && (
        <select className="border p-2 rounded" value={selectedTruckId} onChange={e=>{ setSelectedTruckId(e.target.value); loadTruck(e.target.value); }}>
          <option value="">Select truck</option>
          {trucks.map(t => <option key={t.id} value={t.id}>{t.plate} · {t.vin}</option>)}
        </select>
      )}
      <div className="flex items-center gap-4">
        {selectedTruck && (
          <div className="flex items-center gap-3 text-sm">
            <span>Lock state</span>
            <span className={`ml-1 px-2 py-0.5 rounded border ${locked? 'bg-red-50 border-red-400 text-red-700':'bg-green-50 border-green-400 text-green-700'}`}>{locked? 'Locked':'Unlocked'}</span>
          </div>
        )}
        <label className="flex items-center gap-1 text-sm">
          <input type="radio" name="lock" checked={locked === true} onChange={()=>setLockState(true)} disabled={!selectedTruckId} />
          <span>Lock</span>
        </label>
        <label className="flex items-center gap-1 text-sm">
          <input type="radio" name="unlocked" checked={locked === false} onChange={()=>setLockState(false)} disabled={!selectedTruckId} />
          <span>Unlock</span>
        </label>
      </div>
      <div className="flex items-center gap-4">
        <button className="border rounded px-3 py-2" onClick={outbound}>Outbound</button>
        <button className="border rounded px-3 py-2" onClick={inbound}>Inbound</button>
      </div>
      {/* Removed code-based control; radios below control lock state */}
      <div className="grid sm:grid-cols-3 gap-2 items-end">
        <label className="grid gap-1 sm:col-span-2">
          <span className="text-sm">Parking Spot ID</span>
          <input className="border p-2 rounded" value={spotId} onChange={e=>setSpotId(e.target.value)} />
        </label>
        <button className="border rounded px-3 py-2" onClick={assign} disabled={locked === true}>Assign Spot</button>
      </div>
    </main>
  );
}


