import { create } from "zustand";
import type { Hour } from "../domain/types";

export type View = "timeline" | "tables" | "filter";
export type SideTab = "people" | "locations" | "settings";

export type ShiftDraft =
	| { mode: "edit"; shiftId: string }
	| { mode: "new"; locationId?: string; personId?: string; from: Hour; to: Hour };

export interface DropPreview {
	personId: string;
	locationId: string;
	from: Hour;
	to: Hour;
	/** set when an existing shift is moved, unset when a person is dropped */
	shiftId?: string;
	label: string;
}

export interface FilterState {
	personId: string | null;
	locationId: string | null;
	/** null = whole plan window, follows changes of the window */
	range: { from: Hour; to: Hour } | null;
}

export const EMPTY_FILTER: FilterState = { personId: null, locationId: null, range: null };

interface UiState {
	view: View;
	setView: (view: View) => void;
	sideTab: SideTab;
	setSideTab: (tab: SideTab) => void;
	/** person whose shifts are highlighted in the timeline */
	highlightPersonId: string | null;
	setHighlightPerson: (id: string | null) => void;
	dialog: ShiftDraft | null;
	openDialog: (draft: ShiftDraft) => void;
	closeDialog: () => void;
	dropPreview: DropPreview | null;
	setDropPreview: (preview: DropPreview | null) => void;
	/** kept here so the filter survives switching views */
	filter: FilterState;
	setFilter: (changes: Partial<FilterState>) => void;
}

export const useUi = create<UiState>()((set) => ({
	view: "timeline",
	setView: (view) => set({ view }),
	sideTab: "people",
	setSideTab: (sideTab) => set({ sideTab }),
	highlightPersonId: null,
	setHighlightPerson: (highlightPersonId) => set({ highlightPersonId }),
	dialog: null,
	openDialog: (dialog) => set({ dialog }),
	closeDialog: () => set({ dialog: null }),
	dropPreview: null,
	setDropPreview: (dropPreview) => set({ dropPreview }),
	filter: EMPTY_FILTER,
	setFilter: (changes) => set((s) => ({ filter: { ...s.filter, ...changes } })),
}));
