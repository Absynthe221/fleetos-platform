"use client";
import { useState } from "react";
import { authHeaders } from "@/lib/authClient";
import { useToast } from "@/components/ToastProvider";

export default function NewYardForm() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [address, setAddress] = useState("");
  const [totalSpots, setTotalSpots] = useState(50);
  const [pattern, setPattern] = useState("A{n}");
  const toast = useToast();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const headers: HeadersInit = await authHeaders({ requiredRole: "ADMIN" });

    const depotRes = await fetch(`${apiUrl}/depots`, {
      method: "POST",
      headers,
      body: JSON.stringify({ name, code, address }),
    });
    if (!depotRes.ok) { toast.error(`Failed to create depot: ${await depotRes.text()}`); return; }
    const depot = await depotRes.json();

    const genRes = await fetch(`${apiUrl}/yard/depot/${depot.id}/generate-spots`, {
      method: "POST",
      headers,
      body: JSON.stringify({ totalSpots, pattern }),
    });
    if (!genRes.ok) { toast.error(`Failed to generate spots: ${await genRes.text()}`); return; }

    toast.success(`Depot ${name} created with ${totalSpots} spots`);
  }

  return (
    <form onSubmit={submit} className="grid gap-3 border p-4 rounded">
      <input className="border p-2 rounded" placeholder="Yard (Depot) Name" value={name} onChange={e=>setName(e.target.value)} required />
      <input className="border p-2 rounded" placeholder="Depot Code" value={code} onChange={e=>setCode(e.target.value)} required />
      <input className="border p-2 rounded" placeholder="Address" value={address} onChange={e=>setAddress(e.target.value)} />
      <input className="border p-2 rounded" type="number" placeholder="Total Spots" value={totalSpots} onChange={e=>setTotalSpots(Number(e.target.value))} min={1} required />
      <div className="text-sm text-gray-600">Pattern supports A{`{n}`} → A1, A2, ...</div>
      <input className="border p-2 rounded" placeholder="Spot Pattern e.g. A{n}" value={pattern} onChange={e=>setPattern(e.target.value)} />
      <button className="bg-black text-white rounded px-4 py-2" type="submit">Create Yard + Spots</button>
    </form>
  );
}


