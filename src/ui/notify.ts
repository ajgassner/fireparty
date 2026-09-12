import { create } from "zustand";

type Kind = "info" | "error";

interface Notice {
	id: number;
	kind: Kind;
	text: string;
}

interface NoticeState {
	notices: Notice[];
	dismiss: (id: number) => void;
}

let nextId = 1;

export const useNotices = create<NoticeState>()((set) => ({
	notices: [],
	dismiss: (id) => set((s) => ({ notices: s.notices.filter((n) => n.id !== id) })),
}));

export function notify(text: string, kind: Kind = "info"): void {
	const id = nextId++;
	useNotices.setState((s) => ({ notices: [...s.notices, { id, kind, text }] }));
	setTimeout(() => useNotices.getState().dismiss(id), kind === "error" ? 6000 : 3500);
}

/** Shows the error message returned by a store action, if any. */
export function report(error: string | undefined): boolean {
	if (error) notify(error, "error");
	return !error;
}
