"use client";
import { useEffect, useState } from "react";
import { authHeaders, useRequireAuth } from "@/lib/authClient";
import { useToast } from "@/components/ToastProvider";

export default function MechanicDashboard() {
  useRequireAuth({ requiredRole: 'MECHANIC' });
  const toast = useToast();
  const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  const [failing, setFailing] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [resolvedCount, setResolvedCount] = useState(0);
  const [tab, setTab] = useState("inspections");
  const [selectedTruckId, setSelectedTruckId] = useState(null);
  const [history, setHistory] = useState({ inspections: [], logs: [], complaints: [] });
  const [newComplaint, setNewComplaint] = useState({ truckId: "", type: "mechanical", description: "" });

  async function load() {
    try {
      const headers = await authHeaders({ requiredRole: 'MECHANIC' });

      const fRes = await fetch(`${api}/mechanic/failing-trucks`, { headers });
      if (fRes.ok) {
        const f = await fRes.json();
        setFailing(Array.isArray(f) ? f : []);
      } else {
        setFailing([]);
      }

      const cRes = await fetch(`${api}/mechanic/complaints?resolved=false`, { headers });
      if (cRes.ok) {
        const c = await cRes.json();
        setComplaints(Array.isArray(c) ? c : []);
      } else {
        setComplaints([]);
      }

      const rRes = await fetch(`${api}/mechanic/complaints?resolved=true`, { headers });
      if (rRes.ok) {
        const r = await rRes.json();
        setResolvedCount(Array.isArray(r) ? r.length : 0);
      } else {
        setResolvedCount(0);
      }
    } catch (_) {
      setFailing([]);
      setComplaints([]);
      setResolvedCount(0);
    }
  }
  useEffect(()=>{ load(); }, []);

  async function loadHistory(truckId) {
    if (!truckId) return;
    try {
      const headers = await authHeaders({ requiredRole: 'MECHANIC' });
      const res = await fetch(`${api}/mechanic/history/${truckId}`, { headers });
      if (res.ok) {
        const h = await res.json();
        setHistory({
          inspections: Array.isArray(h?.inspections) ? h.inspections : [],
          logs: Array.isArray(h?.logs) ? h.logs : [],
          complaints: Array.isArray(h?.complaints) ? h.complaints : [],
        });
      } else {
        setHistory({ inspections: [], logs: [], complaints: [] });
      }
    } catch (_) {
      setHistory({ inspections: [], logs: [], complaints: [] });
    }
  }

  async function startInspection(truck) {
    try {
      const headers = await authHeaders({ requiredRole: 'MECHANIC' });
      const mechanicId = (typeof window !== 'undefined' && localStorage.getItem('userId')) || prompt('Enter your mechanic user ID');
      if (!mechanicId) return;
      const type = prompt('Inspection type (PRE_TRIP/POST_TRIP)', 'PRE_TRIP');
      if (!type) return;
      const status = prompt('Result (PASS/FAIL)', 'PASS');
      if (!status) return;
      const notes = prompt('Notes (optional)') || undefined;
      const res = await fetch(`${api}/mechanic/inspection`, {
        method: 'POST', headers,
        body: JSON.stringify({ truckId: truck?.truck?.id || truck?.truckId || truck?.id, mechanicId, type, status, notes })
      });
      if (res.ok) {
        await load();
        if (selectedTruckId) await loadHistory(selectedTruckId);
        toast.success('Inspection logged');
      } else {
        const t = await res.text();
        toast.error(`Failed to log inspection: ${t}`);
      }
    } catch (e) {
      toast.error('Failed to log inspection');
    }
  }

  async function resolveComplaint(id) {
    try {
      const headers = await authHeaders({ requiredRole: 'MECHANIC' });
      const res = await fetch(`${api}/mechanic/complaints/${id}/resolve`, { method: 'PATCH', headers });
      if (res.ok) {
        await load();
        toast.success('Complaint resolved');
      } else {
        const t = await res.text();
        toast.error(`Failed to resolve: ${t}`);
      }
    } catch (_) {
      toast.error('Failed to resolve complaint');
    }
  }

  async function submitComplaint(e) {
    e.preventDefault();
    try {
      const headers = await authHeaders({ requiredRole: 'DRIVER' });
      const driverId = (typeof window !== 'undefined' && localStorage.getItem('userId')) || prompt('Enter your user ID');
      if (!driverId) return;
      const res = await fetch(`${api}/mechanic/complaints`, {
        method: 'POST', headers,
        body: JSON.stringify({ truckId: newComplaint.truckId, driverId, type: newComplaint.type, description: newComplaint.description })
      });
      if (res.ok) {
        setNewComplaint({ truckId: "", type: "mechanical", description: "" });
        await load();
        if (selectedTruckId === newComplaint.truckId) await loadHistory(selectedTruckId);
        toast.success('Complaint submitted');
      } else {
        const t = await res.text();
        toast.error(`Failed to submit complaint: ${t}`);
      }
    } catch (_) {
      toast.error('Failed to submit complaint');
    }
  }

  return (
    <main className="max-w-6xl mx-auto p-6 grid gap-6">
      <h1 className="text-xl font-semibold">Mechanic Dashboard</h1>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-lg border p-4">
          <div className="text-sm text-gray-500">Queue</div>
          <div className="text-2xl font-bold">{failing.length}</div>
          <div className="text-xs text-gray-500">Trucks awaiting repair</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm text-gray-500">Failed Inspections</div>
          <div className="text-2xl font-bold">{failing.length}</div>
          <div className="text-xs text-gray-500">Recent</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm text-gray-500">Complaints</div>
          <div className="text-2xl font-bold">{complaints.length}</div>
          <div className="text-xs text-gray-500">Open Issues</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm text-gray-500">Cleared</div>
          <div className="text-2xl font-bold">{resolvedCount}</div>
          <div className="text-xs text-gray-500">Resolved complaints</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b flex gap-4">
        {['inspections','complaints','history'].map((t)=> (
          <button
            key={t}
            onClick={()=> setTab(t)}
            className={`px-3 py-2 text-sm ${tab===t? 'border-b-2 border-blue-600 font-medium' : 'text-gray-600'}`}
          >
            {t === 'inspections' ? 'Failed Inspections' : t === 'complaints' ? 'Driver Complaints' : 'Maintenance History'}
          </button>
        ))}
      </div>

      {tab === 'inspections' && (
        <section className="grid gap-3">
          <div className="rounded-lg border p-4">
            <div className="font-medium mb-2">Failed Pre/Post-Trip Inspections</div>
            <ul className="divide-y divide-gray-200">
              {Array.isArray(failing) && failing.map((x,i)=> (
                <li key={i} className="py-2 flex items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold cursor-pointer" onClick={()=>{ setSelectedTruckId(x?.truck?.id); setTab('history'); loadHistory(x?.truck?.id); }}>
                      {x?.truck?.plate || x?.truck?.id}
                    </div>
                    <div className="text-sm text-gray-500">{x?.type} · {x?.at ? new Date(x.at).toLocaleString() : ''}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="px-3 py-1 text-sm border rounded" onClick={()=> startInspection(x)}>Start Inspection</button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {tab === 'complaints' && (
        <section className="grid gap-3">
          <div className="rounded-lg border p-4">
            <div className="font-medium mb-2">Driver Complaints</div>
            <form onSubmit={submitComplaint} className="mb-3 grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
              <div className="grid gap-1">
                <label className="text-xs text-gray-600">Truck ID</label>
                <input value={newComplaint.truckId} onChange={(e)=> setNewComplaint(v=>({...v, truckId: e.target.value}))} placeholder="truck-id" className="border rounded px-2 py-1 text-sm" required />
              </div>
              <div className="grid gap-1">
                <label className="text-xs text-gray-600">Type</label>
                <select value={newComplaint.type} onChange={(e)=> setNewComplaint(v=>({...v, type: e.target.value}))} className="border rounded px-2 py-1 text-sm">
                  <option value="mechanical">mechanical</option>
                  <option value="safety">safety</option>
                  <option value="comfort">comfort</option>
                  <option value="other">other</option>
                </select>
              </div>
              <div className="grid gap-1 md:col-span-2">
                <label className="text-xs text-gray-600">Description</label>
                <input value={newComplaint.description} onChange={(e)=> setNewComplaint(v=>({...v, description: e.target.value}))} placeholder="Describe the issue" className="border rounded px-2 py-1 text-sm" required />
              </div>
              <button type="submit" className="px-3 py-2 text-sm border rounded">Submit Complaint</button>
            </form>
            <ul className="divide-y divide-gray-200">
              {Array.isArray(complaints) && complaints.map((c)=> (
                <li key={c?.id} className="py-2 flex items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold cursor-pointer" onClick={()=>{ setSelectedTruckId(c?.truckId); setTab('history'); loadHistory(c?.truckId); }}>
                      {c?.truckId}
                    </div>
                    <div className="text-sm text-gray-500">{c?.type}: {c?.description} · {c?.createdAt ? new Date(c.createdAt).toLocaleString() : ''}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="px-3 py-1 text-sm border rounded" onClick={()=> resolveComplaint(c?.id)}>Review / Resolve</button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {tab === 'history' && (
        <section className="grid gap-4">
          <div className="flex items-center gap-2">
            <input value={selectedTruckId || ''} onChange={(e)=> setSelectedTruckId(e.target.value)} placeholder="Truck ID" className="border rounded px-2 py-1 text-sm" />
            <button className="px-3 py-1 text-sm border rounded" onClick={()=> loadHistory(selectedTruckId)}>Load History</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-lg border p-3">
              <div className="font-medium mb-2">Inspections</div>
              <ul className="text-sm space-y-1">
                {history.inspections.map((h,i)=> (
                  <li key={i}>{h.inspectionType} · {h.status} · {new Date(h.createdAt).toLocaleString()}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg border p-3">
              <div className="font-medium mb-2">Maintenance Logs</div>
              <ul className="text-sm space-y-1">
                {history.logs.map((l,i)=> (
                  <li key={i}>{l.type} · {l.date ? new Date(l.date).toLocaleDateString() : ''} · {l.notes}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg border p-3">
              <div className="font-medium mb-2">Complaints</div>
              <ul className="text-sm space-y-1">
                {history.complaints.map((c,i)=> (
                  <li key={i}>{c.type}: {c.description} · {new Date(c.createdAt).toLocaleString()} {c.resolved ? '(resolved)' : ''}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}


