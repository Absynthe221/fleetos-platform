import { PropsWithChildren } from "react";

export function Card({ children }: PropsWithChildren) {
	return <div className="card p-4 shadow-sm">{children}</div>;
}

export function CardHeader({ children }: PropsWithChildren) {
	return <div className="mb-2 text-sm text-[var(--muted)]">{children}</div>;
}

export function CardTitle({ children }: PropsWithChildren) {
	return <div className="text-lg font-semibold">{children}</div>;
}

export function CardContent({ children }: PropsWithChildren) {
	return <div>{children}</div>;
}


