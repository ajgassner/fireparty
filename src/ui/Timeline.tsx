import { useDraggable, useDroppable } from "@dnd-kit/core";
import { TriangleAlert } from "lucide-react";
import { type PointerEvent, useState } from "react";
import { formatHour, formatShortRange, range } from "../domain/time";
import type { Hour, Location, Shift } from "../domain/types";
import { usePlanStore } from "../store";
import { useDerived } from "./derived";
import { report } from "./notify";
import { type DropPreview, useUi } from "./uiStore";

export const HOUR_WIDTH = 76;
const LABEL_WIDTH = 132;
const LANE_HEIGHT = 46;
const ROW_PADDING = 8;

export type DragData = { kind: "person"; personId: string } | { kind: "shift"; shiftId: string };
export type DropData = { locationId: string; hour: Hour };

/** How many hours from its start a shift was grabbed – set on pointer down, read on drop. */
export const grab = { hours: 0 };

/** Time of the last finished drag, to ignore the click that follows a drop. */
export const lastDrag = { endedAt: 0 };

const PREVIEW_ID = "preview";

/**
 * The shifts as they will be after the pending drop – the moved shift keeps its array position (like updateShift),
 * a new one is appended (like addShift). Laying out this list gives exactly the lanes the plan will have afterwards.
 */
function projectShifts(shifts: readonly Shift[], preview: DropPreview | null): readonly Shift[] {
	if (!preview) return shifts;
	const { personId, locationId, from, to, shiftId } = preview;
	return shiftId
		? shifts.map((s) => (s.id === shiftId ? { ...s, locationId, from, to } : s))
		: [...shifts, { id: PREVIEW_ID, personId, locationId, from, to }];
}

/** Assigns overlapping shifts of one location to separate lanes. */
function assignLanes(shifts: Shift[]): { lanes: number; laneOf: Map<string, number> } {
	const laneEnds: Hour[] = [];
	const laneOf = new Map<string, number>();
	for (const s of [...shifts].sort((a, b) => a.from - b.from || a.to - b.to)) {
		let lane = laneEnds.findIndex((end) => end <= s.from);
		if (lane < 0) lane = laneEnds.length;
		laneEnds[lane] = s.to;
		laneOf.set(s.id, lane);
	}
	return { lanes: Math.max(1, laneEnds.length), laneOf };
}

export function Timeline() {
	const { plan, window } = useDerived();
	const setSideTab = useUi((s) => s.setSideTab);
	const hours = range(window.startHour, window.endHour);
	const width = hours.length * HOUR_WIDTH;

	if (plan.locations.length === 0) {
		return (
			<div className="flex flex-col items-center gap-3 rounded-lg border border-line bg-surface px-6 py-16 text-center">
				<p className="text-sm font-medium">Noch keine Standorte</p>
				<p className="max-w-sm text-[13px] text-pretty text-muted">
					Lege zuerst Standorte wie Schank, Grill oder Kassa an. Danach ziehst du Personen in die Zeitleiste.
				</p>
				<button type="button" className="btn" onClick={() => setSideTab("locations")}>
					Standorte anlegen
				</button>
			</div>
		);
	}

	return (
		<div className="overflow-auto rounded-lg border border-line bg-surface">
			<div style={{ width: LABEL_WIDTH + width }}>
				<div className="sticky top-0 z-20 flex h-9 border-b border-line bg-surface">
					<div
						className="sticky left-0 z-10 flex shrink-0 items-center border-r border-line bg-surface px-4 text-xs text-muted"
						style={{ width: LABEL_WIDTH }}
					>
						Standort
					</div>
					{hours.map((h) => (
						<div
							key={h}
							className={`flex shrink-0 items-center border-r pl-2 font-mono text-xs ${(h + 1) % 24 === 0 ? "border-line-strong" : "border-line"} ${h % 24 === 0 ? "font-semibold text-ink" : "text-muted"}`}
							style={{ width: HOUR_WIDTH }}
						>
							{formatHour(h)}
						</div>
					))}
				</div>
				{plan.locations.map((location) => (
					<LocationRow key={location.id} location={location} startHour={window.startHour} hours={hours} />
				))}
			</div>
		</div>
	);
}

function LocationRow({ location, startHour, hours }: { location: Location; startHour: Hour; hours: Hour[] }) {
	const plan = usePlanStore((s) => s.plan);
	const preview = useUi((s) => s.dropPreview);
	const shifts = plan.shifts.filter((s) => s.locationId === location.id);
	const projected = projectShifts(plan.shifts, preview).filter((s) => s.locationId === location.id);
	const { lanes, laneOf } = assignLanes(projected);
	const placeholder =
		preview?.locationId === location.id ? projected.find((s) => s.id === (preview.shiftId ?? PREVIEW_ID)) : undefined;
	const midnightOffsets = hours.filter((h) => h % 24 === 0 && h !== startHour).map((h) => (h - startHour) * HOUR_WIDTH);

	return (
		<div className="flex border-b border-line last:border-b-0">
			<div
				className="sticky left-0 z-10 flex shrink-0 flex-col justify-center gap-0.5 border-r border-line bg-surface px-4"
				style={{ width: LABEL_WIDTH }}
			>
				<span className="truncate text-sm font-semibold">{location.name}</span>
				<span className="text-xs text-muted">{shifts.length === 1 ? "1 Schicht" : `${shifts.length} Schichten`}</span>
			</div>
			<div
				className="relative transition-[height] duration-150"
				style={{
					width: hours.length * HOUR_WIDTH,
					height: lanes * LANE_HEIGHT + ROW_PADDING * 2,
					backgroundImage: `repeating-linear-gradient(to right, transparent 0 ${HOUR_WIDTH - 1}px, var(--color-line) ${HOUR_WIDTH - 1}px ${HOUR_WIDTH}px)`,
				}}
			>
				{midnightOffsets.map((left) => (
					<div key={left} className="absolute inset-y-0 w-px bg-line-strong" style={{ left: left - 1 }} />
				))}
				{hours.map((h) => (
					<DropCell key={h} locationId={location.id} hour={h} left={(h - startHour) * HOUR_WIDTH} />
				))}
				{shifts.map((shift) => (
					<ShiftBlock
						key={shift.id}
						shift={shift}
						startHour={startHour}
						// the moved shift stays mounted (dnd-kit needs its node) but is hidden while the placeholder shows it
						hidden={preview?.shiftId === shift.id}
						lane={laneOf.get(shift.id) ?? 0}
					/>
				))}
				{placeholder && preview && (
					<div
						className="pointer-events-none absolute z-[2] flex flex-col justify-center gap-px rounded-md border-[1.5px] border-dashed border-line-strong bg-soft/60 px-2.5 transition-[top] duration-150"
						style={geometry(placeholder.from, placeholder.to, startHour, laneOf.get(placeholder.id) ?? 0)}
					>
						<span className="truncate text-[13px] font-medium text-muted">{preview.label}</span>
						<span className="font-mono text-[11px] text-muted">
							{formatShortRange(placeholder.from, placeholder.to)}
						</span>
					</div>
				)}
			</div>
		</div>
	);
}

function geometry(from: Hour, to: Hour, startHour: Hour, lane: number) {
	return {
		left: (from - startHour) * HOUR_WIDTH + 3,
		width: (to - from) * HOUR_WIDTH - 6,
		top: ROW_PADDING + lane * LANE_HEIGHT,
		height: LANE_HEIGHT - 6,
	};
}

function DropCell({ locationId, hour, left }: { locationId: string; hour: Hour; left: number }) {
	const { setNodeRef } = useDroppable({
		id: `cell:${locationId}:${hour}`,
		data: { locationId, hour } satisfies DropData,
	});
	return <div ref={setNodeRef} className="absolute inset-y-0" style={{ left, width: HOUR_WIDTH }} />;
}

function ShiftBlock({
	shift,
	startHour,
	lane,
	hidden,
}: {
	shift: Shift;
	startHour: Hour;
	lane: number;
	hidden: boolean;
}) {
	const { people, conflicts, describeConflicts } = useDerived();
	const updateShift = usePlanStore((s) => s.updateShift);
	const openDialog = useUi((s) => s.openDialog);
	const highlight = useUi((s) => s.highlightPersonId);
	const [resize, setResize] = useState<{ edge: "from" | "to"; startX: number; from: Hour; to: Hour } | null>(null);

	const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
		id: `shift:${shift.id}`,
		data: { kind: "shift", shiftId: shift.id } satisfies DragData,
		disabled: resize !== null,
	});

	const from = resize?.from ?? shift.from;
	const to = resize?.to ?? shift.to;
	const conflictWith = conflicts.get(shift.id);
	const dimmed = highlight !== null && highlight !== shift.personId;
	const name = people.get(shift.personId)?.name ?? "?";

	const startResize = (edge: "from" | "to") => (e: PointerEvent<HTMLDivElement>) => {
		e.stopPropagation();
		e.currentTarget.setPointerCapture(e.pointerId);
		setResize({ edge, startX: e.clientX, from: shift.from, to: shift.to });
	};
	const moveResize = (e: PointerEvent<HTMLDivElement>) => {
		if (!resize) return;
		const delta = Math.round((e.clientX - resize.startX) / HOUR_WIDTH);
		setResize((r) =>
			r?.edge === "from"
				? { ...r, from: Math.max(0, Math.min(shift.to - 1, shift.from + delta)) }
				: r && { ...r, to: Math.max(shift.from + 1, shift.to + delta) },
		);
	};
	const endResize = () => {
		if (!resize) return;
		setResize(null);
		report(updateShift(shift.id, { from: resize.from, to: resize.to }));
	};

	return (
		<button
			type="button"
			ref={setNodeRef}
			{...attributes}
			{...listeners}
			aria-label={`${name}, ${formatHour(from)} bis ${formatHour(to)}${conflictWith ? ", Doppelbelegung" : ""}`}
			title={conflictWith ? `Überschneidet sich mit: ${describeConflicts(conflictWith).join(", ")}` : undefined}
			onPointerDownCapture={(e) => {
				const rect = e.currentTarget.getBoundingClientRect();
				grab.hours = Math.floor((e.clientX - rect.left) / HOUR_WIDTH);
			}}
			onClick={() => {
				if (Date.now() - lastDrag.endedAt > 150) openDialog({ mode: "edit", shiftId: shift.id });
			}}
			className={`group absolute z-[1] flex cursor-grab touch-none flex-col justify-center gap-px overflow-hidden rounded-md border px-2.5 text-left select-none focus-visible:outline-2 focus-visible:outline-ink ${
				conflictWith ? "border-alarm bg-alarm-block" : "border-soft-line bg-soft hover:border-line-strong"
			} ${hidden ? "invisible" : isDragging ? "opacity-40" : dimmed ? "opacity-30" : ""} ${resize ? "z-10 shadow-md" : "transition-[top,opacity] duration-150"}`}
			style={geometry(from, to, startHour, lane)}
		>
			<span className="flex min-w-0 items-center gap-1.5">
				{conflictWith && <TriangleAlert className="size-3.5 shrink-0 text-alarm" />}
				<span className="truncate text-[13px] font-medium">{name}</span>
			</span>
			<span className={`font-mono text-[11px] ${conflictWith ? "text-alarm" : "text-muted"}`}>
				{formatShortRange(from, to)}
			</span>
			{(["from", "to"] as const).map((edge) => (
				<span
					key={edge}
					aria-hidden
					className={`absolute inset-y-0 w-2 cursor-ew-resize opacity-0 group-hover:opacity-100 ${edge === "from" ? "left-0" : "right-0"}`}
					onPointerDown={startResize(edge)}
					onPointerMove={moveResize}
					onPointerUp={endResize}
					onPointerCancel={() => setResize(null)}
					onClick={(e) => e.stopPropagation()}
				>
					<span
						className={`absolute inset-y-2.5 w-0.5 rounded bg-line-strong ${edge === "from" ? "left-1" : "right-1"}`}
					/>
				</span>
			))}
		</button>
	);
}
