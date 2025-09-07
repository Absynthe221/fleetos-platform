"use client";

export function ThemeSwitcher() {
	function setTheme(name: 'light' | 'dark') {
		if (name === 'dark') {
			document.documentElement.style.setProperty('--background', '#0a0a0a');
			document.documentElement.style.setProperty('--foreground', '#ededed');
		} else {
			document.documentElement.style.setProperty('--background', '#ffffff');
			document.documentElement.style.setProperty('--foreground', '#0f172a');
		}
	}
	return (
		<div className="grid gap-2">
			<div className="text-xs text-[var(--muted)]">Theme</div>
			<div className="flex gap-2">
				<button className="border px-2 py-1 rounded" onClick={() => setTheme('light')}>Light</button>
				<button className="border px-2 py-1 rounded" onClick={() => setTheme('dark')}>Dark</button>
			</div>
		</div>
	);
}


