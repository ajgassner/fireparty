import { create } from "zustand";
import type { Hour } from "../domain/types";

export type View = "timeline" | "tables" | "filter";
export type SideTab = "people" | "locations" | "settings";

export type ShiftDraft =
	| { mode: "edit"; shiftId: string }
	| { mode: "new"; locationId?: string; personId?: string; from: Hour; to: Hour };

export interface DropPreview {
	locationId: string;
	from: Hour;
	to: Hour;
	label: string;
}

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
}));
