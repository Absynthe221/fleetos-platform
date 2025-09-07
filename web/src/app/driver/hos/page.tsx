"use client";

import { useEffect, useMemo, useState } from "react";
import { authHeaders, useRequireAuth } from "@/lib/authClient";
import { toast } from "react-hot-toast";
import { enqueue, startAutoSync } from "@/lib/offlineQueue";

const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type DutyState = "OFF_DUTY" | "SLEEPER_BERTH" | "ON_DUTY" | "DRIVING";

export default function DriverHosPage() {
  useRequireAuth({ requiredRole: "DRIVER" });
  const [status, setStatus] = useState<{ state: DutyState; since: string | null; truckId?: string | null } | null>(null);
  const [summaries, setSummaries] = useState<{ today?: any; seven?: any; fourteen?: any }>({});
  const [remaining, setRemaining] = useState<{ remainingDrivingMins?: number; remainingDutyMins?: number }>({});
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [nudgeShown, setNudgeShown] = useState(false);
  const [showReason, setShowReason] = useState(false);
  const [pendingState, setPendingState] = useState<DutyState | null>(null);
  const [reasonCode, setReasonCode] = useState("");
  const [note, setNote] = useState("");

  async function load() {
    setLoading(true);
    const headers = await authHeaders({ requiredRole: "DRIVER" });
    const [sRes, tRes, wRes, rRes] = await Promise.all([
      fetch(`${api}/driver/hos/status`, { headers }),
      fetch(`${api}/driver/hos/summary?days=1`, { headers }),
      fetch(`${api}/driver/hos/summary?days=7`, { headers }),
      fetch(`${api}/driver/hos/remaining`, { headers }),
    ]);
    setStatus(sRes.ok ? await sRes.json() : null);
    const today = tRes.ok ? await tRes.json() : null;
    const seven = wRes.ok ? await wRes.json() : null;
    const fRes = await fetch(`${api}/driver/hos/summary?days=14`, { headers });
    const fourteen = fRes.ok ? await fRes.json() : null;
    setSummaries({ today, seven, fourteen });
    setRemaining(rRes.ok ? await rRes.json() : {});
    setLoading(false);
  }

  useEffect(() => { load(); }, []);
  useEffect(() => { startAutoSync(); }, []);

  async function commitState(next: DutyState, reason?: string, n?: string) {
    setUpdating(true);
    const headers = await authHeaders({ requiredRole: "DRIVER" });
    try {
      const res = await fetch(`${api}/driver/hos/state`, { method: 'POST', headers, body: JSON.stringify({ state: next, reasonCode: reason || undefined, note: n || undefined }) });
      if (res.ok) { setNudgeShown(false); toast.success('Status updated'); await load(); }
      else {
        enqueue({ endpoint: '/driver/hos/state', method: 'POST', body: { state: next, reasonCode: reason || undefined, note: n || undefined }, requiredRole: 'DRIVER' });
        toast.success('Offline: queued status update');
      }
    } catch (_) {
      enqueue({ endpoint: '/driver/hos/state', method: 'POST', body: { state: next, reasonCode: reason || undefined, note: n || undefined }, requiredRole: 'DRIVER' });
      toast.success('Offline: queued status update');
    }
    setUpdating(false);
  }

  function requestStateChange(next: DutyState) {
    setPendingState(next);
    setReasonCode("");
    setNote("");
    setShowReason(true);
  }

  const sinceMs = useMemo(() => status?.since ? new Date(status.since).getTime() : null, [status?.since]);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const elapsed = sinceMs ? Math.max(0, Math.floor((now - sinceMs) / 1000)) : 0;

  // Soft nudge if driving over 5 hours without stopping
  useEffect(() => {
    if (status?.state === 'DRIVING') {
      const mins = Math.floor(elapsed / 60);
      if (mins >= 300 && !nudgeShown) {
        setNudgeShown(true);
        if (confirm("You’ve been in Driving mode for 5+ hours. Are you still driving?")) {
          // keep driving
        } else {
          commitState('ON_DUTY');
        }
      }
    }
  }, [status?.state, elapsed, nudgeShown]);

  function fmtMins(mins: number | undefined) {
    if (!mins && mins !== 0) return "—";
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  }

  const todayTotals = summaries.today?.totals || {};

  return (
    <main className="max-w-3xl mx-auto p-6 grid gap-6">
      <h1 className="text-xl font-semibold">Driver HOS</h1>

      {/* Violation / warning banners */}
      {remaining.remainingDrivingMins === 0 && (
        <div className="border border-red-400 bg-red-50 text-red-800 text-sm rounded p-2">Driving hours limit reached. Switch to OFF DUTY or SLEEPER.</div>
      )}
      {remaining.remainingDutyMins === 0 && (
        <div className="border border-red-400 bg-red-50 text-red-800 text-sm rounded p-2">On-duty hours limit reached. End shift required.</div>
      )}
      {remaining.remainingDrivingMins !== undefined && remaining.remainingDrivingMins > 0 && remaining.remainingDrivingMins <= 30 && (
        <div className="border border-yellow-400 bg-yellow-50 text-yellow-800 text-sm rounded p-2">Approaching driving limit: {fmtMins(remaining.remainingDrivingMins)} left.</div>
      )}
      {remaining.remainingDutyMins !== undefined && remaining.remainingDutyMins > 0 && remaining.remainingDutyMins <= 30 && (
        <div className="border border-yellow-400 bg-yellow-50 text-yellow-800 text-sm rounded p-2">Approaching on-duty limit: {fmtMins(remaining.remainingDutyMins)} left.</div>
      )}

      <section className="rounded-lg border p-4 grid gap-3">
        <div className="text-sm text-gray-600">Current Status</div>
        <div className="text-2xl font-bold">{status?.state || 'OFF_DUTY'}</div>
        <div className="text-sm text-gray-600">Since: {status?.since ? new Date(status.since).toLocaleString() : '—'}</div>
        <div className="text-sm">Elapsed: {Math.floor(elapsed/3600)}h {Math.floor((elapsed%3600)/60)}m {elapsed%60}s</div>
        <div className="text-sm text-gray-600">Remaining Driving: {fmtMins(remaining.remainingDrivingMins)}</div>
        <div className="text-sm text-gray-600">Remaining Duty: {fmtMins(remaining.remainingDutyMins)}</div>
        <div className="flex flex-wrap gap-2 mt-2">
          {(["OFF_DUTY","SLEEPER_BERTH","ON_DUTY","DRIVING"] as DutyState[]).map((s)=> (
            <button key={s} disabled={updating} onClick={()=> requestStateChange(s)} className={`px-3 py-2 border rounded text-sm ${status?.state===s? 'bg-black text-white' : ''}`}>{s.replace('_',' ')}</button>
          ))}
        </div>
      </section>

      <section className="rounded-lg border p-4 grid gap-3">
        <div className="font-medium">Today</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
          <div className="border rounded p-2"><div className="text-gray-500">Driving</div><div className="font-medium">{fmtMins(todayTotals.DRIVING)}</div></div>
          <div className="border rounded p-2"><div className="text-gray-500">On Duty</div><div className="font-medium">{fmtMins(todayTotals.ON_DUTY)}</div></div>
          <div className="border rounded p-2"><div className="text-gray-500">Off Duty</div><div className="font-medium">{fmtMins(todayTotals.OFF_DUTY)}</div></div>
          <div className="border rounded p-2"><div className="text-gray-500">Sleeper</div><div className="font-medium">{fmtMins(todayTotals.SLEEPER_BERTH)}</div></div>
        </div>
      </section>

      <section className="rounded-lg border p-4 grid gap-3">
        <div className="font-medium">Summaries</div>
        <div className="text-sm text-gray-600">7-day total driving: {fmtMins(summaries.seven?.totals?.DRIVING)}</div>
        <div className="text-sm text-gray-600">14-day total driving: {fmtMins(summaries.fourteen?.totals?.DRIVING)}</div>
      </section>

      <Modal
        open={showReason}
        onClose={() => setShowReason(false)}
        onConfirm={() => { if (pendingState) { setShowReason(false); commitState(pendingState, reasonCode, note); } }}
        updating={updating}
        pendingState={pendingState}
        reasonCode={reasonCode}
        setReasonCode={setReasonCode}
        note={note}
        setNote={setNote}
      />
    </main>
  );
}

// Simple modal for reason code / note capture
function Modal({ open, onClose, onConfirm, updating, pendingState, reasonCode, setReasonCode, note, setNote }: any) {
  if (!open) return null;
  const reasons = ["Break", "Fuel", "Inspection", "Traffic", "EndOfShift", "Correction"];
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded shadow p-4 w-full max-w-md">
        <div className="font-medium mb-2">Change status to {pendingState}</div>
        <div className="text-sm text-gray-600 mb-2">Provide a reason (required by compliance when editing duty status).</div>
        <select className="border rounded w-full px-2 py-2 text-sm mb-2" value={reasonCode} onChange={(e)=> setReasonCode(e.target.value)}>
          <option value="">Select reason</option>
          {reasons.map(r=> <option key={r} value={r}>{r}</option>)}
        </select>
        <textarea className="border rounded w-full px-2 py-2 text-sm mb-3" rows={3} placeholder="Optional note" value={note} onChange={(e)=> setNote(e.target.value)} />
        <div className="flex justify-end gap-2">
          <button className="px-3 py-2 text-sm border rounded" onClick={onClose} disabled={updating}>Cancel</button>
          <button className="px-3 py-2 text-sm border rounded bg-black text-white disabled:opacity-50" disabled={!reasonCode || updating} onClick={onConfirm}>Confirm</button>
        </div>
      </div>
    </div>
  );
}
