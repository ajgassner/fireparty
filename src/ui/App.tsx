import {
	DndContext,
	type DragEndEvent,
	type DragOverEvent,
	DragOverlay,
	type DragStartEvent,
	PointerSensor,
	pointerWithin,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import { TriangleAlert, X } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";
import { DEFAULT_SHIFT_LENGTH, effectiveWindow } from "../domain/plan";
import type { Hour } from "../domain/types";
import { usePlanStore } from "../store";
import { useDerived } from "./derived";
import { FilterView } from "./FilterView";
import { savePlan } from "./fileActions";
import { Header } from "./Header";
import { MobileView } from "./MobileView";
import { report, useNotices } from "./notify";
import { ShiftDialog } from "./ShiftDialog";
import { Sidebar } from "./Sidebar";
import { TablesView } from "./TablesView";
import { type DragData, type DropData, grab, lastDrag, Timeline } from "./Timeline";
import { useUi, type View } from "./uiStore";

const VIEWS: { id: View; label: string }[] = [
	{ id: "timeline", label: "Zeitplan" },
	{ id: "tables", label: "Tabellen" },
	{ id: "filter", label: "Filter" },
];

const mobileQuery = "(max-width: 767px)";
function useIsMobile() {
	return useSyncExternalStore(
		(onChange) => {
			const media = matchMedia(mobileQuery);
			media.addEventListener("change", onChange);
			return () => media.removeEventListener("change", onChange);
		},
		() => matchMedia(mobileQuery).matches,
	);
}

export function App() {
	useShortcuts();
	const isMobile = useIsMobile();
	return (
		<>
			{isMobile ? <MobileView /> : <Planner />}
			<ShiftDialog />
			<Notices />
		</>
	);
}

/** Where a dragged person or shift would land, or null if not over the timeline. */
function dropTarget(active: DragData | undefined, over: DropData | undefined) {
	if (!active || !over) return null;
	const { plan } = usePlanStore.getState();
	if (active.kind === "person") {
		const { endHour } = effectiveWindow(plan);
		const from = over.hour;
		const to = Math.max(from + 1, Math.min(from + DEFAULT_SHIFT_LENGTH, endHour));
		return { personId: active.personId, locationId: over.locationId, from, to, shiftId: undefined };
	}
	const shift = plan.shifts.find((s) => s.id === active.shiftId);
	if (!shift) return null;
	const from: Hour = Math.max(0, over.hour - grab.hours);
	return {
		personId: shift.personId,
		locationId: over.locationId,
		from,
		to: from + shift.to - shift.from,
		shiftId: shift.id,
	};
}

function Planner() {
	const { plan, conflictedPeople, people } = useDerived();
	const view = useUi((s) => s.view);
	const setView = useUi((s) => s.setView);
	const setDropPreview = useUi((s) => s.setDropPreview);
	const [dragLabel, setDragLabel] = useState<string | null>(null);
	const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

	const labelOf = (data: DragData) => {
		const personId = data.kind === "person" ? data.personId : plan.shifts.find((s) => s.id === data.shiftId)?.personId;
		return people.get(personId ?? "")?.name ?? "";
	};

	const onDragStart = ({ active }: DragStartEvent) => {
		const data = active.data.current as DragData;
		setDragLabel(data.kind === "person" ? labelOf(data) : null);
	};
	const onDragOver = ({ active, over }: DragOverEvent) => {
		const target = dropTarget(active.data.current as DragData, over?.data.current as DropData | undefined);
		setDropPreview(target && { ...target, label: labelOf(active.data.current as DragData) });
	};
	const onDragEnd = ({ active, over }: DragEndEvent) => {
		setDragLabel(null);
		setDropPreview(null);
		lastDrag.endedAt = Date.now();
		const target = dropTarget(active.data.current as DragData, over?.data.current as DropData | undefined);
		if (!target) return;
		const { shiftId, ...values } = target;
		const { addShift, updateShift } = usePlanStore.getState();
		report(shiftId ? updateShift(shiftId, values) : addShift(values));
	};
	const onDragCancel = () => {
		setDragLabel(null);
		setDropPreview(null);
	};

	return (
		<DndContext
			sensors={sensors}
			collisionDetection={pointerWithin}
			onDragStart={onDragStart}
			onDragOver={onDragOver}
			onDragEnd={onDragEnd}
			onDragCancel={onDragCancel}
		>
			<div className="flex h-full flex-col">
				<Header />
				<div className="flex min-h-0 flex-1 max-lg:flex-col">
					<main className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-y-auto px-6 py-5">
						<div className="flex items-center gap-1">
							<div role="tablist" className="flex gap-1">
								{VIEWS.map((v) => (
									<button
										key={v.id}
										type="button"
										role="tab"
										aria-selected={view === v.id}
										onClick={() => setView(v.id)}
										className={`rounded-md border px-3 py-1.5 text-[13px] ${view === v.id ? "border-line bg-surface font-semibold" : "border-transparent text-muted hover:text-ink"}`}
									>
										{v.label}
									</button>
								))}
							</div>
							<div className="flex-1" />
							{conflictedPeople.size > 0 && (
								<span className="flex items-center gap-1.5 text-[13px] text-alarm">
									<TriangleAlert className="size-[15px]" />
									{conflictedPeople.size === 1 ? "1 Doppelbelegung" : `${conflictedPeople.size} Doppelbelegungen`}
								</span>
							)}
						</div>
						{view === "timeline" && <Timeline />}
						{view === "tables" && <TablesView />}
						{view === "filter" && <FilterView />}
					</main>
					<Sidebar />
				</div>
			</div>
			<DragOverlay dropAnimation={null}>
				{dragLabel && (
					<div className="mt-5 ml-5 inline-flex h-9 cursor-grabbing items-center rounded-md border border-line-strong bg-surface px-3 text-[13px] font-medium shadow-lg">
						{dragLabel}
					</div>
				)}
			</DragOverlay>
		</DndContext>
	);
}

function useShortcuts() {
	useEffect(() => {
		const onKeyDown = (e: KeyboardEvent) => {
			if (!(e.metaKey || e.ctrlKey)) return;
			const key = e.key.toLowerCase();
			if (key === "s") {
				e.preventDefault();
				savePlan();
				return;
			}
			const target = e.target as HTMLElement;
			if (target.matches("input, textarea") || document.querySelector("dialog[open]")) return;
			const { undo, redo } = usePlanStore.getState();
			if (key === "z") {
				e.preventDefault();
				e.shiftKey ? redo() : undo();
			} else if (key === "y") {
				e.preventDefault();
				redo();
			}
		};
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, []);
}

function Notices() {
	const notices = useNotices((s) => s.notices);
	const dismiss = useNotices((s) => s.dismiss);
	return (
		<div
			className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex flex-col items-center gap-2 px-4"
			aria-live="polite"
		>
			{notices.map((n) => (
				<div
					key={n.id}
					className={`pointer-events-auto flex max-w-md items-center gap-2 rounded-lg border py-2 pr-2 pl-3.5 text-[13px] shadow-lg ${
						n.kind === "error" ? "border-alarm-line bg-alarm-soft text-alarm" : "border-line bg-surface"
					}`}
				>
					{n.kind === "error" && <TriangleAlert className="size-4 shrink-0" />}
					<span className="text-pretty">{n.text}</span>
					<button type="button" aria-label="Schließen" className="btn-icon size-6" onClick={() => dismiss(n.id)}>
						<X className="size-3.5" />
					</button>
				</div>
			))}
		</div>
	);
}
