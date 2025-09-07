"use client";

import { useEffect, useMemo, useState } from "react";
import { authHeaders } from "@/lib/authClient";
import { useToast } from "@/components/ToastProvider";

export default function NewTruckClient() {
	const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
	const toast = useToast();
	const [name, setName] = useState("");
	const [vin, setVin] = useState("");
	const [plate, setPlate] = useState("");
	const [year, setYear] = useState<number>(2020);
	const [colorTag, setColorTag] = useState("green");
	const [barcode, setBarcode] = useState("TRK-" + Math.random().toString(36).slice(2, 8).toUpperCase());
	const [barcodeType, setBarcodeType] = useState<"BARCODE" | "QR">("BARCODE");
	const [depotId, setDepotId] = useState("");
	const [createdId, setCreatedId] = useState<string | null>(null);
	const [depots, setDepots] = useState<any[]>([]);
	const [docs, setDocs] = useState<Array<{ type: string; docNumber: string; expiryDate: string }>>([
		{ type: "Registration", docNumber: "", expiryDate: "" },
		{ type: "Insurance", docNumber: "", expiryDate: "" },
		{ type: "Inspection", docNumber: "", expiryDate: "" },
	]);
	const [plateError, setPlateError] = useState<string | null>(null);
	const [vinError, setVinError] = useState<string | null>(null);

	useEffect(() => {
		fetch(`${apiUrl}/depots`).then((r) => r.json()).then(setDepots).catch(() => setDepots([]));
	}, [apiUrl]);

	const qrUrl = useMemo(() => (createdId ? `${apiUrl}/trucks/${createdId}/qr` : null), [apiUrl, createdId]);
	const barcodeUrl = useMemo(() => (createdId ? `${apiUrl}/trucks/${createdId}/barcode` : null), [apiUrl, createdId]);

	function generateRandomVin() {
		const chars = "ABCDEFGHJKLMNPRSTUVWXYZ0123456789"; // exclude I,O,Q
		let out = "";
		for (let i = 0; i < 17; i++) out += chars[Math.floor(Math.random() * chars.length)];
		return out;
	}

	function resetForm() {
		setName("");
		setVin("");
		setPlate("");
		setYear(2020);
		setColorTag("green");
		setBarcode("TRK-" + Math.random().toString(36).slice(2, 8).toUpperCase());
		setDepotId("");
		setCreatedId(null);
		setPlateError(null);
		setVinError(null);
		setDocs([
			{ type: "Registration", docNumber: "", expiryDate: "" },
			{ type: "Insurance", docNumber: "", expiryDate: "" },
			{ type: "Inspection", docNumber: "", expiryDate: "" },
		]);
	}

	async function suggestUniqueVin(headers: any) {
		for (let i = 0; i < 5; i++) {
			const candidate = generateRandomVin();
			try {
				const look = await fetch(`${apiUrl}/trucks/lookup?q=${candidate}`, { headers });
				if (look.ok) {
					const list = await look.json();
					const exists = Array.isArray(list) && list.some((t: any) => ((t.vin || '') as string).toUpperCase() === candidate);
					if (!exists) return candidate;
				}
			} catch {}
		}
		return generateRandomVin();
	}

	function normalizePlateInput(p: string) {
		return p.trim().toUpperCase().replace(/\s+/g, '');
	}

	async function suggestUniquePlate(headers: any, base?: string) {
		for (let i = 0; i < 7; i++) {
			const suffix = Math.random().toString(36).slice(2,5).toUpperCase();
			const candidate = `${(base || 'PLT').slice(0,8)}-${suffix}`;
			try {
				const look = await fetch(`${apiUrl}/trucks/lookup?q=${encodeURIComponent(candidate)}`, { headers });
				if (look.ok) {
					const list = await look.json();
					const exists = Array.isArray(list) && list.some((t: any) => ((t.plate || '') as string).toUpperCase() === candidate);
					if (!exists) return candidate;
				}
			} catch {}
		}
		return `${(base || 'PLT').slice(0,8)}-${Math.random().toString(36).slice(2,5).toUpperCase()}`;
	}

	async function ensureAdminToken() {
		try {
			const res = await fetch(`${apiUrl}/auth/dev-token`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ role: "ADMIN" }),
			});
			if (res.ok) {
				const data = await res.json();
				const t = data?.access_token;
				if (t && typeof window !== 'undefined') {
					localStorage.setItem('token', t);
				}
				return t || null;
			}
		} catch {}
		return null;
	}

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		setPlateError(null);
		setVinError(null);
		const normalizedVin = vin.trim().toUpperCase();
		let normalizedPlate = normalizePlateInput(plate);
		const body: any = { name: name?.trim() || undefined, vin: normalizedVin, plate: normalizedPlate, year: Number(year), colorTag, barcode, depotId };
		const headers: any = await authHeaders({ requiredRole: "ADMIN" });
		// Preflight duplicate plate check
		try {
			const look = await fetch(`${apiUrl}/trucks/lookup?q=${encodeURIComponent(normalizedPlate)}`, { headers });
			if (look.ok) {
				const results = await look.json();
				const exists = Array.isArray(results) && results.some((t: any) => ((t.plate || '') as string).toUpperCase() === normalizedPlate);
				if (exists) {
					// auto-suggest and proceed
					const suggested = await suggestUniquePlate(headers, normalizedPlate);
					normalizedPlate = suggested;
					setPlate(suggested);
					setPlateError(null);
				}
			}
		} catch {}
		// Preflight duplicate VIN check
		try {
			const lookVin = await fetch(`${apiUrl}/trucks/lookup?q=${encodeURIComponent(normalizedVin)}`, { headers });
			if (lookVin.ok) {
				const results = await lookVin.json();
				const vinExists = Array.isArray(results) && results.some((t: any) => ((t.vin || '') as string).toUpperCase() === normalizedVin);
				if (vinExists) {
					setVinError('VIN already exists. Click Suggest VIN to auto-fill a unique value.');
					return;
				}
			}
		} catch {}
		// attempt create (with possibly new plate)
		body.plate = normalizedPlate;
		let res = await fetch(`${apiUrl}/trucks`, { method: "POST", headers, body: JSON.stringify(body) });
		if (!res.ok) {
			if (res.status === 409) {
				let j: any = null;
				try { j = await res.json(); } catch {}
				const msg = (j?.message || '').toString().toUpperCase();
				if (msg.includes('VIN')) {
					const suggestion = await suggestUniqueVin(headers);
					setVin(suggestion);
					setVinError((j?.message || 'VIN duplicate detected.') + ` Suggested: ${suggestion}`);
				} else if (msg.includes('PLATE')) {
					// Auto-suggest and retry once
					const suggestion = await suggestUniquePlate(headers, normalizedPlate);
					setPlate(suggestion);
					setPlateError(null);
					body.plate = suggestion;
					res = await fetch(`${apiUrl}/trucks`, { method: "POST", headers, body: JSON.stringify(body) });
					if (!res.ok) {
						const errText = await res.text().catch(()=>"Failed");
						toast.error(`Failed to create truck (${res.status}): ${errText}`);
						return;
					}
				} else {
					setPlateError(j?.message || 'Duplicate detected.');
					return;
				}
				// if we handled retry for plate, res may now be ok
			}
			if (!res.ok) {
				const msgTxt = await res.text().catch(()=>"Failed");
				toast.error(`Failed to create truck (${res.status}): ${msgTxt}`);
				return;
			}
		}
		const json = await res.json();
		setCreatedId(json.id);
		// auto-save any entered documents for this truck
		const toCreate = docs.filter(d => d.type && d.expiryDate);
		for (const d of toCreate) {
			await fetch(`${apiUrl}/documents`, { method: "POST", headers, body: JSON.stringify({
				truckId: json.id,
				type: d.type,
				docNumber: d.docNumber || undefined,
				expiryDate: d.expiryDate ? new Date(d.expiryDate) : undefined,
			}) });
		}
		toast.success("Truck created successfully.");
		resetForm();
	}

	async function saveDocuments() {
		if (!createdId) return;
		const toCreate = docs.filter(d => d.type && d.expiryDate);
		if (toCreate.length === 0) { toast.info("Add at least one document with expiry"); return; }
		let ok = true;
		const headers: any = await authHeaders({ requiredRole: "ADMIN" });
		for (const d of toCreate) {
			const payload = {
				truckId: createdId,
				type: d.type,
				docNumber: d.docNumber || undefined,
				expiryDate: d.expiryDate ? new Date(d.expiryDate) : undefined,
			};
			const r = await fetch(`${apiUrl}/documents`, { method: "POST", headers, body: JSON.stringify(payload) });
			if (!r.ok) ok = false;
		}
		if (!ok) {
			toast.error("Some documents failed to save (login required).");
		} else {
			toast.success("Documents saved");
		}
	}

	return (
		<main className="max-w-3xl mx-auto p-6">
			<h1 className="text-xl font-semibold mb-4">Create Truck</h1>
			<form onSubmit={onSubmit} className="grid gap-4">
				<label className="grid gap-1">
					<span className="text-sm">Truck Name (optional)</span>
					<input className="border p-2 rounded" placeholder="e.g., Freightliner Cascadia" value={name} onChange={(e) => setName(e.target.value)} />
				</label>
				<label className="grid gap-1">
					<span className="text-sm">VIN</span>
					<div className="flex gap-2">
						<input className="border p-2 rounded flex-1" value={vin} onChange={(e) => { setVin(e.target.value); setVinError(null); }} onBlur={() => setVin((v) => v.trim().toUpperCase())} required />
						<button type="button" className="border rounded px-2 py-2 text-sm" onClick={async () => {
							setVinError(null);
							const headersSuggest: any = { "Content-Type": "application/json" };
							const t = (typeof window !== 'undefined' && localStorage.getItem('token')) || process.env.NEXT_PUBLIC_API_TOKEN;
							if (t) headersSuggest["Authorization"] = `Bearer ${t}`;
							const s = await suggestUniqueVin(headersSuggest);
							setVin(s);
						}}>Suggest VIN</button>
					</div>
				</label>
				{vinError && <span className="text-xs text-red-600">{vinError}</span>}
				<label className="grid gap-1">
					<span className="text-sm">Plate</span>
					<div className="flex gap-2">
						<input className="border p-2 rounded flex-1" value={plate} onChange={(e) => { setPlate(e.target.value); setPlateError(null); }} onBlur={() => setPlate((p) => p.trim().toUpperCase().replace(/\s+/g, ''))} required />
						<button type="button" className="border rounded px-2 py-2 text-sm" onClick={() => setPlate((p) => (p && p.trim() ? p.trim().toUpperCase().replace(/\s+/g,'') + '-' + Math.random().toString(36).slice(2,5).toUpperCase() : 'DEMO-' + Math.random().toString(36).slice(2,6).toUpperCase()))}>Suggest unique</button>
					</div>
					{plateError && <span className="text-xs text-red-600">{plateError}</span>}
				</label>
				<label className="grid gap-1">
					<span className="text-sm">Year</span>
					<input type="number" className="border p-2 rounded" value={year} onChange={(e) => setYear(parseInt(e.target.value,10))} required />
				</label>
				<label className="grid gap-1">
					<span className="text-sm">Color Tag</span>
					<select className="border p-2 rounded" value={colorTag} onChange={(e) => setColorTag(e.target.value)}>
						<option value="green">green</option>
						<option value="yellow">yellow</option>
						<option value="red">red</option>
						<option value="grey">grey</option>
					</select>
				</label>
				<label className="grid gap-1">
					<span className="text-sm">Barcode</span>
					<input className="border p-2 rounded" value={barcode} onChange={(e) => setBarcode(e.target.value)} required />
				</label>
				<label className="grid gap-1">
					<span className="text-sm">Barcode Type</span>
					<div className="flex items-center gap-4">
						<label className="flex items-center gap-1"><input type="radio" name="barcodeType" checked={barcodeType==='BARCODE'} onChange={() => setBarcodeType('BARCODE')} /> Code 128</label>
						<label className="flex items-center gap-1"><input type="radio" name="barcodeType" checked={barcodeType==='QR'} onChange={() => setBarcodeType('QR')} /> QR Code</label>
					</div>
				</label>
				<label className="grid gap-1">
					<span className="text-sm">Depot</span>
					<select className="border p-2 rounded" value={depotId} onChange={(e) => setDepotId(e.target.value)} required>
						<option value="">Select depot</option>
						{depots.map((d) => (
							<option key={d.id} value={d.id}>{d.name}</option>
						))}
					</select>
				</label>
				<div className="space-y-3">
					<h2 className="font-medium">Documents & Expiry</h2>
					{docs.map((d, idx) => (
						<div key={idx} className="grid grid-cols-1 sm:grid-cols-6 gap-3">
							<select className="border p-2 rounded sm:col-span-2" value={d.type} onChange={(e) => {
								const next = [...docs]; next[idx].type = e.target.value; setDocs(next);
							}}>
								<option>Registration</option>
								<option>Insurance</option>
								<option>Inspection</option>
								<option>Other</option>
							</select>
							<input className="border p-2 rounded sm:col-span-2" placeholder="Document # (optional)" value={d.docNumber}
								onChange={(e) => { const next = [...docs]; next[idx].docNumber = e.target.value; setDocs(next); }} />
							<input type="date" className="border p-2 rounded sm:col-span-2" value={d.expiryDate}
								onChange={(e) => { const next = [...docs]; next[idx].expiryDate = e.target.value; setDocs(next); }} />
						</div>
					))}
					<div className="flex gap-3">
						<button type="button" className="border rounded px-3 py-2" onClick={() => setDocs([...docs, { type: "Other", docNumber: "", expiryDate: "" }])}>Add Row</button>
						<button type="button" className="bg-black text-white rounded px-4 py-2 disabled:opacity-50" onClick={saveDocuments} disabled={!createdId}>Save Documents</button>
					</div>
					<p className="text-xs text-[var(--muted)]">Enter documents now; they will be saved after creating the truck (login required).</p>
				</div>
				<button className="bg-black text-white rounded px-4 py-2" type="submit">Create</button>
			</form>

			{createdId && (
				<div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
					<div>
						<h2 className="font-medium mb-2">{barcodeType === 'QR' ? 'QR' : 'Barcode'}</h2>
						{barcodeType === 'QR' ? (
							qrUrl && <img src={qrUrl} alt="QR" className="border rounded" />
						) : (
							barcodeUrl && <img src={barcodeUrl} alt="Barcode" className="border rounded bg-white" />
						)}
					</div>
					<div>
						<h2 className="font-medium mb-2">Switch Type</h2>
						<div className="flex items-center gap-4">
							<button type="button" className="border rounded px-3 py-2" onClick={() => setBarcodeType('BARCODE')}>Show Barcode</button>
							<button type="button" className="border rounded px-3 py-2" onClick={() => setBarcodeType('QR')}>Show QR</button>
						</div>
					</div>
				</div>
			)}
		</main>
	);
}


