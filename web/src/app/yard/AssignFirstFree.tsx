"use client";
import { useState } from "react";
import { authHeaders } from "@/lib/authClient";
import { useToast } from "@/components/ToastProvider";

export default function AssignFirstFree({ depotId }: { depotId: string }) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  const [truckId, setTruckId] = useState("");
  const [userId, setUserId] = useState("");
  const toast = useToast();

  async function assign() {
    const headers: HeadersInit = await authHeaders({ requiredRole: "SECURITY" });

    const r = await fetch(`${apiUrl}/yard/depot/${depotId}/assign-first-free`, {
      method: "POST",
      headers,
      body: JSON.stringify({ truckId, recordedBy: userId }),
    });
    if (!r.ok) { toast.error(await r.text()); return; }
    const json = await r.json();
    toast.success(`Assigned to spot ${json.spotNumber}`);
  }

  return (
    <div className="grid gap-2 border p-3 rounded">
      <input className="border p-2 rounded" placeholder="Truck ID" value={truckId} onChange={e=>setTruckId(e.target.value)} />
      <input className="border p-2 rounded" placeholder="Security User ID" value={userId} onChange={e=>setUserId(e.target.value)} />
      <button className="border rounded px-3 py-2" onClick={assign}>Assign First Free Spot</button>
    </div>
  );
}


