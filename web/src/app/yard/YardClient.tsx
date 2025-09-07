"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/ToastProvider";

export default function YardClient() {
	const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
	const toast = useToast();
	const [depots, setDepots] = useState<any[]>([]);
	const [selectedDepot, setSelectedDepot] = useState<string>("");
	const [spots, setSpots] = useState<any[]>([]);
	const [trucks, setTrucks] = useState<any[]>([]);
	const [selectedTruck, setSelectedTruck] = useState<string>("");
	const [creating, setCreating] = useState(false);
	const [form, setForm] = useState<any>({ spotNumber: "", spotType: "MEDIUM", lengthCm: "", widthCm: "", heightCm: "", maxWeightKg: "", isCovered: false, hasCharger: false });
	const [scan, setScan] = useState("");
	const [driverInput, setDriverInput] = useState("");
	const [recent, setRecent] = useState<any>({ inspections: [], security: [] });

	useEffect(() => {
		fetch(`${apiUrl}/depots`).then(r=>r.json()).then(setDepots);
		fetch(`${apiUrl}/trucks`).then(r=>r.json()).then(setTrucks);
	}, [apiUrl]);

	useEffect(() => {
		let timer: any;
		let es: EventSource | null = null;
		async function load() {
			if (!selectedDepot) return;
			const sum = await fetch(`${apiUrl}/yard/depot/${selectedDepot}/summary`).then(r=>r.json());
			setSpots(sum?.spots ?? []);
			setTrucks(await (await fetch(`${apiUrl}/trucks`)).json());
			setRecent(await (await fetch(`${apiUrl}/dashboard/recent`)).json());
		}
		load();
		timer = setInterval(load, 15000);
		try {
			es = new EventSource(`${apiUrl}/events`);
			es.onmessage = (e) => {
				try { const evt = JSON.parse(e.data); if (evt?.type === 'gate') load(); } catch {}
			};
		} catch {}
		return () => { timer && clearInterval(timer); es && es.close(); };
	}, [apiUrl, selectedDepot]);

	async function assign(spotId: string) {
		if (!selectedTruck) return toast.info('Select a truck first');
		await fetch(`${apiUrl}/parking-spots/assign`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ spotId, truckId: selectedTruck }) });
		setTrucks(await (await fetch(`${apiUrl}/trucks`)).json());
	}

	async function scanTruck(e: React.FormEvent) {
		e.preventDefault();
		const q = scan.trim(); if (!q) return;
		const res = await fetch(`${apiUrl}/trucks/lookup?q=${encodeURIComponent(q)}`).then(r=>r.json());
		if (Array.isArray(res) && res.length > 0) {
			setSelectedTruck(res[0].id);
		}
	}

	async function assignDriver() {
		if (!selectedTruck) return toast.info('Select a truck first');
		await fetch(`${apiUrl}/security/driver/${selectedTruck}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ driverId: driverInput || null }) });
		// refresh yard summary to see driver
		if (selectedDepot) {
			const sum = await fetch(`${apiUrl}/yard/depot/${selectedDepot}/summary`).then(r=>r.json());
			setSpots(sum?.spots ?? []);
		}
	}

	async function createSpot(e: React.FormEvent) {
		e.preventDefault();
		if (!selectedDepot) return;
		const payload: any = {
			depotId: selectedDepot,
			spotNumber: form.spotNumber,
			spotType: form.spotType,
			lengthCm: form.lengthCm ? Number(form.lengthCm) : undefined,
			widthCm: form.widthCm ? Number(form.widthCm) : undefined,
			heightCm: form.heightCm ? Number(form.heightCm) : undefined,
			maxWeightKg: form.maxWeightKg ? Number(form.maxWeightKg) : undefined,
			isCovered: !!form.isCovered,
			hasCharger: !!form.hasCharger,
		};
		await fetch(`${apiUrl}/parking-spots`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
		// refresh summary
		const sum = await fetch(`${apiUrl}/yard/depot/${selectedDepot}/summary`).then(r=>r.json());
		setSpots(sum?.spots ?? []);
		setCreating(false);
		setForm({ spotNumber: "", spotType: "MEDIUM", lengthCm: "", widthCm: "", heightCm: "", maxWeightKg: "", isCovered: false, hasCharger: false });
	}

	const occupiedCount = spots.filter((s:any)=> trucks.find((t:any)=> t.currentParkingSpotId === s.id)).length;
	const totalCount = spots.length;
	const availableCount = totalCount - occupiedCount;
	return (
		<main className="max-w-6xl mx-auto p-6 space-y-4">
			<h1 className="text-2xl font-semibold">Yard</h1>
			<div className="flex gap-4 items-end">
				<label className="grid">
					<span className="text-sm text-[var(--muted)]">Depot</span>
					<select className="border p-2 rounded" value={selectedDepot} onChange={e=>setSelectedDepot(e.target.value)}>
						<option value="">Select</option>
						{depots.map((d:any)=> <option key={d.id} value={d.id}>{d.name}</option>)}
					</select>
				</label>
				<label className="grid">
					<span className="text-sm text-[var(--muted)]">Truck</span>
					<select className="border p-2 rounded" value={selectedTruck} onChange={e=>setSelectedTruck(e.target.value)}>
						<option value="">Select</option>
						{trucks.map((t:any)=> <option key={t.id} value={t.id}>{t.plate}</option>)}
					</select>
				</label>
				<form onSubmit={scanTruck} className="grid">
					<span className="text-sm text-[var(--muted)]">Scan/Type plate, VIN, or barcode</span>
					<input className="border p-2 rounded" value={scan} onChange={e=>setScan(e.target.value)} placeholder="Scan here" />
				</form>
			</div>

			<div className="text-sm text-[var(--muted)]">Occupied {occupiedCount} / {totalCount} · Available {availableCount}</div>

			{/* Visual example layout to help illustrate numbering scheme */}
			<div className="border rounded p-3">
				<div className="flex items-center justify-between">
					<div className="font-medium">Example Yard Layout (rows × spot numbers)</div>
					<div className="text-xs text-[var(--muted)]">Static demo: A1–D10</div>
				</div>
				<div className="mt-2 grid grid-cols-10 gap-1">
					{['A','B','C','D'].flatMap((row) => Array.from({ length: 10 }, (_, i) => ({ row, n: i+1 }))).map((s:any) => (
						<div key={`${s.row}${s.n}`} className="h-10 flex items-center justify-center rounded border text-[10px] bg-white">
							<span className="font-medium">{s.row}{s.n}</span>
						</div>
					))}
				</div>
				<div className="mt-2 text-xs text-[var(--muted)]">Use any row-letter + number scheme when creating real spots (e.g., A1, A2…).</div>
			</div>
			{selectedDepot && (
				<div className="border rounded p-3">
					<div className="flex items-center justify-between">
						<div className="font-medium">Create parking spot</div>
						<button className="text-sm underline" onClick={() => setCreating(v=>!v)}>{creating ? 'Cancel' : 'New spot'}</button>
					</div>
					{creating && (
						<form onSubmit={createSpot} className="grid grid-cols-8 gap-2 mt-3 items-end">
							<label className="grid col-span-2">
								<span className="text-xs text-[var(--muted)]">Spot Number</span>
								<input className="border p-2 rounded" value={form.spotNumber} onChange={e=>setForm((f:any)=>({ ...f, spotNumber: e.target.value }))} required />
							</label>
							<label className="grid col-span-2">
								<span className="text-xs text-[var(--muted)]">Type</span>
								<select className="border p-2 rounded" value={form.spotType} onChange={e=>setForm((f:any)=>({ ...f, spotType: e.target.value }))}>
									<option>SMALL</option>
									<option>MEDIUM</option>
									<option>LARGE</option>
									<option>XL</option>
								</select>
							</label>
							<label className="grid">
								<span className="text-xs text-[var(--muted)]">Length (cm)</span>
								<input className="border p-2 rounded" value={form.lengthCm} onChange={e=>setForm((f:any)=>({ ...f, lengthCm: e.target.value }))} />
							</label>
							<label className="grid">
								<span className="text-xs text-[var(--muted)]">Width (cm)</span>
								<input className="border p-2 rounded" value={form.widthCm} onChange={e=>setForm((f:any)=>({ ...f, widthCm: e.target.value }))} />
							</label>
							<label className="grid">
								<span className="text-xs text-[var(--muted)]">Height (cm)</span>
								<input className="border p-2 rounded" value={form.heightCm} onChange={e=>setForm((f:any)=>({ ...f, heightCm: e.target.value }))} />
							</label>
							<label className="grid">
								<span className="text-xs text-[var(--muted)]">Max Weight (kg)</span>
								<input className="border p-2 rounded" value={form.maxWeightKg} onChange={e=>setForm((f:any)=>({ ...f, maxWeightKg: e.target.value }))} />
							</label>
							<label className="flex items-center gap-2">
								<input type="checkbox" checked={form.isCovered} onChange={e=>setForm((f:any)=>({ ...f, isCovered: e.target.checked }))} />
								<span className="text-xs">Covered</span>
							</label>
							<label className="flex items-center gap-2">
								<input type="checkbox" checked={form.hasCharger} onChange={e=>setForm((f:any)=>({ ...f, hasCharger: e.target.checked }))} />
								<span className="text-xs">Charger</span>
							</label>
							<button className="col-span-2 bg-[var(--color-brand-600)] text-white rounded p-2">Create</button>
						</form>
					)}
				</div>
			)}
			<div className="grid grid-cols-8 gap-2 mt-2">
				{spots.map((s:any) => {
					const occupied = trucks.find((t:any)=> t.currentParkingSpotId === s.id);
					const status = (s.occupiedBy && s.occupiedBy.status) || occupied?.status;
					const driver = s.occupiedBy?.driver || null;
					const statusColor = status === 'ACTIVE' ? 'bg-green-100 text-green-800 border-green-400' : status === 'IN_SERVICE' ? 'bg-yellow-100 text-yellow-800 border-yellow-400' : 'bg-gray-100 text-gray-700 border-gray-300';
					return (
						<button key={s.id} onClick={() => assign(s.id)} className={`h-24 rounded border ${occupied ? 'bg-[var(--color-brand-100)] border-[var(--color-brand-700)]' : 'bg-white'} flex items-center justify-center p-2 text-left`}>
							<div className="text-xs w-full">
								<div className="flex items-center justify-between">
									<span className="font-medium text-sm">{s.spotNumber}</span>
									<span className="px-1 py-0.5 rounded bg-[var(--color-brand-50)] border text-[10px]">{s.spotType || '—'}</span>
								</div>
								<div className="flex items-center justify-between">
									<div className="text-[10px] text-[var(--muted)]">{occupied ? occupied.plate : 'Empty'}</div>
									{status && <span className={`border rounded px-1 py-0.5 text-[10px] ${statusColor}`}>{status}</span>}
								</div>
								<div className="text-[10px] text-[var(--muted)]">{s.lengthCm||'—'}×{s.widthCm||'—'}×{s.heightCm||'—'}cm · {s.maxWeightKg||'—'}kg · {s.isCovered? 'Covered' : 'Open'} · {s.hasCharger? 'Charger' : 'No charger'}</div>
								{driver && <div className="text-[10px] text-[var(--muted)]">Driver: {driver.name}</div>}
							</div>
						</button>
					);
				})}
			</div>

			{/* Security + driver association and live log */}
			<div className="grid md:grid-cols-3 gap-4 mt-6">
				<div className="md:col-span-2 border rounded p-3">
					<div className="font-medium mb-2">Driver & Access</div>
					<div className="grid sm:grid-cols-3 gap-2 items-end">
						<label className="grid gap-1 sm:col-span-2">
							<span className="text-sm">Driver ID (scan or type)</span>
							<input className="border p-2 rounded" value={driverInput} onChange={e=>setDriverInput(e.target.value)} placeholder="Driver ID" />
						</label>
						<button className="border rounded px-3 py-2" onClick={assignDriver} disabled={!selectedTruck}>Assign Driver</button>
					</div>
					<div className="text-xs text-[var(--muted)] mt-2">Lock/Unlock is managed in Security Console</div>
				</div>
				<div className="border rounded p-3">
					<div className="font-medium mb-2">Recent Activity</div>
					<div className="text-xs text-[var(--muted)] mb-1">Security</div>
					<div className="grid gap-1 max-h-48 overflow-auto">
						{(recent.security||[]).map((e:any, idx:number)=> (
							<div key={idx} className="text-xs">{e.action} · {new Date(e.timestamp).toLocaleString()}</div>
						))}
					</div>
					<div className="text-xs text-[var(--muted)] mt-3 mb-1">Inspections</div>
					<div className="grid gap-1 max-h-48 overflow-auto">
						{(recent.inspections||[]).map((i:any, idx:number)=> (
							<div key={idx} className="text-xs">{i.inspectionType} · {i.status} · {new Date(i.createdAt).toLocaleString()}</div>
						))}
					</div>
				</div>
			</div>
		</main>
	);
}


