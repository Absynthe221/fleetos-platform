export function KpiCard({ label, value, tone = "default" }: { label: string; value: string | number; tone?: "default" | "ok" | "due" | "alert" }) {
	const color = tone === "ok" ? "text-[var(--color-status-ok)]" : tone === "due" ? "text-[var(--color-status-due)]" : tone === "alert" ? "text-[var(--color-status-alert)]" : "text-[var(--color-brand-700)]";
	return (
		<div className="card p-5">
			<div className="text-sm text-[var(--muted)] mb-1">{label}</div>
			<div className={`text-2xl font-semibold ${color}`}>{value}</div>
		</div>
	);
}


