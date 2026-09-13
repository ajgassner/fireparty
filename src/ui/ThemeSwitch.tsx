import { Monitor, Moon, Sun } from "lucide-react";
import { THEME_OPTIONS, useTheme } from "./theme";

const ICONS = { system: Monitor, light: Sun, dark: Moon };

export function ThemeSwitch({ large = false }: { large?: boolean }) {
	const preference = useTheme((s) => s.preference);
	const setPreference = useTheme((s) => s.setPreference);

	return (
		<div role="radiogroup" aria-label="Darstellung" className="grid grid-cols-3 rounded-lg bg-track p-[3px]">
			{THEME_OPTIONS.map(({ id, label }) => {
				const Icon = ICONS[id];
				const active = preference === id;
				return (
					// biome-ignore lint/a11y/useSemanticElements: segmented control styled as buttons
					<button
						key={id}
						type="button"
						role="radio"
						aria-checked={active}
						onClick={() => setPreference(id)}
						className={`flex items-center justify-center gap-1.5 rounded-md ${large ? "h-[38px] text-sm" : "h-7 text-[13px]"} ${
							active ? "bg-surface font-medium shadow-xs" : "text-muted hover:text-ink"
						}`}
					>
						<Icon className="size-3.5" />
						{label}
					</button>
				);
			})}
		</div>
	);
}
