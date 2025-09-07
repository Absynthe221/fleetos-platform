export function Badge({ color = "idle", children }: { color?: "ok" | "due" | "alert" | "idle"; children: React.ReactNode }) {
	return <span className={`badge badge-${color}`}>{children}</span>;
}


