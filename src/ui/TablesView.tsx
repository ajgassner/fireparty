import { Plus, Sheet, Trash2, TriangleAlert } from "lucide-react";
import { DEFAULT_SHIFT_LENGTH, shiftsOfLocation, sortByName } from "../domain/plan";
import type { Location, Shift } from "../domain/types";
import { usePlanStore } from "../store";
import { useDerived } from "./derived";
import { exportLocationExcel } from "./fileActions";
import { HourSelect } from "./HourSelect";
import { report } from "./notify";
import { useUi } from "./uiStore";

const COLUMNS = "grid-cols-[124px_124px_minmax(0,1fr)_32px]";

export function TablesView() {
	const { plan } = useDerived();
	const setSideTab = useUi((s) => s.setSideTab);

	if (plan.locations.length === 0) {
		return (
			<div className="flex flex-col items-center gap-3 rounded-lg border border-line bg-white px-6 py-16 text-center">
				<p className="text-sm font-medium">Noch keine Standorte</p>
				<button type="button" className="btn" onClick={() => setSideTab("locations")}>
					Standorte anlegen
				</button>
			</div>
		);
	}

	return (
		<div className="grid items-start gap-4 xl:grid-cols-2">
			{plan.locations.map((location) => (
				<LocationCard key={location.id} location={location} />
			))}
		</div>
	);
}

function LocationCard({ location }: { location: Location }) {
	const { plan, window } = useDerived();
	const openDialog = useUi((s) => s.openDialog);
	const shifts = shiftsOfLocation(plan, location.id);
	// same default as the old app: 20:00 - 22:00, as long as it fits the window
	const defaultFrom = 20 >= window.startHour && 20 < window.endHour ? 20 : window.startHour;

	return (
		<section className="flex flex-col overflow-hidden rounded-lg border border-line bg-white">
			<header className="flex h-[52px] items-center gap-2 border-b border-line pr-3 pl-4">
				<h3 className="truncate text-sm font-semibold">{location.name}</h3>
				<span className="text-xs whitespace-nowrap text-muted">
					{shifts.length === 1 ? "1 Schicht" : `${shifts.length} Schichten`}
				</span>
				<div className="flex-1" />
				<button
					type="button"
					className="btn"
					onClick={() =>
						openDialog({
							mode: "new",
							locationId: location.id,
							from: defaultFrom,
							to: defaultFrom + DEFAULT_SHIFT_LENGTH,
						})
					}
				>
					<Plus className="size-[15px]" />
					Schicht
				</button>
				<button
					type="button"
					className="btn px-2"
					aria-label={`${location.name} als Excel exportieren`}
					title="Als Excel exportieren"
					onClick={() => exportLocationExcel(location.id)}
				>
					<Sheet className="size-[15px]" />
				</button>
			</header>
			{shifts.length === 0 ? (
				<p className="px-4 py-5 text-[13px] text-muted">Noch keine Schichten.</p>
			) : (
				<div className="overflow-x-auto">
					<div className="min-w-[420px] pb-2">
						<div className={`grid ${COLUMNS} gap-2 px-3 pt-2 pb-1 text-xs text-muted`}>
							<span>Von</span>
							<span>Bis</span>
							<span>Person</span>
							<span />
						</div>
						{shifts.map((shift) => (
							<ShiftRow key={shift.id} shift={shift} />
						))}
					</div>
				</div>
			)}
		</section>
	);
}

function ShiftRow({ shift }: { shift: Shift }) {
	const { plan, conflicts, describeConflicts, hourOptions } = useDerived();
	const { updateShift, removeShift } = usePlanStore.getState();
	const conflictWith = conflicts.get(shift.id);

	return (
		<div
			className={`grid ${COLUMNS} items-center gap-2 px-3 py-[5px] ${conflictWith ? "bg-alarm-soft" : ""}`}
			title={conflictWith ? `Überschneidet sich mit: ${describeConflicts(conflictWith).join(", ")}` : undefined}
		>
			<HourSelect
				label="Von"
				value={shift.from}
				options={hourOptions}
				onChange={(from) =>
					report(updateShift(shift.id, { from, to: from >= shift.to ? from + (shift.to - shift.from) : shift.to }))
				}
			/>
			<HourSelect
				label="Bis"
				value={shift.to}
				options={hourOptions.filter((h) => h > shift.from)}
				onChange={(to) => report(updateShift(shift.id, { to }))}
			/>
			<div className="relative">
				{conflictWith && (
					<TriangleAlert className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-alarm" />
				)}
				<select
					aria-label="Person"
					className={`field ${conflictWith ? "pl-7 text-alarm" : ""}`}
					value={shift.personId}
					onChange={(e) => report(updateShift(shift.id, { personId: e.target.value }))}
				>
					{sortByName(plan.people).map((p) => (
						<option key={p.id} value={p.id} className="text-ink">
							{p.name}
						</option>
					))}
				</select>
			</div>
			<button type="button" aria-label="Schicht löschen" className="btn-icon" onClick={() => removeShift(shift.id)}>
				<Trash2 className="size-[15px]" />
			</button>
		</div>
	);
}
