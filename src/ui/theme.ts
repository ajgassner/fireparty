import { create } from "zustand";

export type ThemePreference = "system" | "light" | "dark";

// keep in sync with the inline script in index.html, which applies the theme before first paint
const STORAGE_KEY = "fireparty-theme";
const darkQuery = matchMedia("(prefers-color-scheme: dark)");

function readPreference(): ThemePreference {
	try {
		const value = localStorage.getItem(STORAGE_KEY);
		return value === "light" || value === "dark" ? value : "system";
	} catch {
		return "system";
	}
}

function apply(preference: ThemePreference): void {
	const dark = preference === "dark" || (preference === "system" && darkQuery.matches);
	document.documentElement.dataset.theme = dark ? "dark" : "light";
}

interface ThemeState {
	preference: ThemePreference;
	setPreference: (preference: ThemePreference) => void;
}

export const useTheme = create<ThemeState>()((set) => ({
	preference: readPreference(),
	setPreference: (preference) => {
		try {
			if (preference === "system") localStorage.removeItem(STORAGE_KEY);
			else localStorage.setItem(STORAGE_KEY, preference);
		} catch {
			// storage unavailable: the choice lasts until reload
		}
		apply(preference);
		set({ preference });
	},
}));

apply(useTheme.getState().preference);
darkQuery.addEventListener("change", () => apply(useTheme.getState().preference));

export const THEME_OPTIONS: { id: ThemePreference; label: string }[] = [
	{ id: "system", label: "System" },
	{ id: "light", label: "Hell" },
	{ id: "dark", label: "Dunkel" },
];
