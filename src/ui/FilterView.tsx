import { TriangleAlert } from "lucide-react";
import { compareShiftsWithNames, shiftsInWindow, sortByName } from "../domain/plan";
import { formatHour } from "../domain/time";
import { useDerived } from "./derived";
import { HourSelect } from "./HourSelect";
import { EMPTY_FILTER, useUi } from "./uiStore";

const COLUMNS =
	"grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_72px_72px] sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_120px_120px]";

export function FilterView() {
	const { plan, people, locations, conflicts, hourOptions, window } = useDerived();
	const filter = useUi((s) => s.filter);
	const setFilter = useUi((s) => s.setFilter);

	// ignore selections that no longer exist, e.g. after deleting a person
	const personId = filter.personId && people.has(filter.personId) ? filter.personId : null;
	const locationId = filter.locationId && locations.has(filter.locationId) ? filter.locationId : null;
	const from = filter.range?.from ?? window.startHour;
	const to = filter.range?.to ?? window.endHour;
	const active = personId !== null || locationId !== null || filter.range !== null;

	const hits = shiftsInWindow(plan.shifts, from, to)
		.filter(
			(s) => (personId === null || s.personId === personId) && (locationId === null || s.locationId === locationId),
		)
		.sort(compareShiftsWithNames(plan));
	// hours inside the selected time range
	const hours = hits.reduce((sum, s) => sum + Math.min(to, s.to) - Math.max(from, s.from), 0);

	return (
		<>
			<div className="flex flex-wrap items-end gap-3">
				<label className="flex flex-col gap-1.5">
					<span className="label">Person</span>
					<select
						className="field w-56"
						value={personId ?? ""}
						onChange={(e) => setFilter({ personId: e.target.value || null })}
					>
						<option value="">Alle Personen</option>
						{sortByName(plan.people).map((p) => (
							<option key={p.id} value={p.id}>
								{p.name}
							</option>
						))}
					</select>
				</label>
				<label className="flex flex-col gap-1.5">
					<span className="label">Standort</span>
					<select
						className="field w-44"
						value={locationId ?? ""}
						onChange={(e) => setFilter({ locationId: e.target.value || null })}
					>
						<option value="">Alle Standorte</option>
						{plan.locations.map((l) => (
							<option key={l.id} value={l.id}>
								{l.name}
							</option>
						))}
					</select>
				</label>
				<div className="flex flex-col gap-1.5">
					<span className="label">Von</span>
					<HourSelect
						label="Von"
						className="w-[120px]"
						value={from}
						options={hourOptions}
						onChange={(h) => setFilter({ range: { from: h, to: h >= to ? h + 1 : to } })}
					/>
				</div>
				<div className="flex flex-col gap-1.5">
					<span className="label">Bis</span>
					<HourSelect
						label="Bis"
						className="w-[120px]"
						value={to}
						options={hourOptions.filter((h) => h > from)}
						onChange={(h) => setFilter({ range: { from, to: h } })}
					/>
				</div>
				<div className="flex items-center gap-3 pb-2 text-[13px]">
					<span className="ml-2 text-muted" aria-live="polite">
						{hits.length === 1 ? "1 Einteilung" : `${hits.length} Einteilungen`}
						{personId !== null && ` · ${hours} h`}
					</span>
					{active && (
						<button
							type="button"
							className="font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink"
							onClick={() => setFilter(EMPTY_FILTER)}
						>
							Filter zurücksetzen
						</button>
					)}
				</div>
			</div>
			<div className="min-h-0 overflow-auto rounded-lg border border-line bg-surface">
				<div
					className={`sticky top-0 z-10 grid ${COLUMNS} h-[38px] items-center gap-4 border-b border-line bg-surface px-4 text-xs text-muted`}
				>
					<span>Name</span>
					<span>Standort</span>
					<span>Von</span>
					<span>Bis</span>
				</div>
				{hits.length === 0 && (
					<p className="px-4 py-5 text-[13px] text-muted">
						{plan.shifts.length === 0 ? "Noch keine Schichten geplant." : "Keine Einteilungen für diese Auswahl."}
					</p>
				)}
				{hits.map((s) => {
					const conflict = conflicts.has(s.id);
					return (
						<div
							key={s.id}
							className={`grid ${COLUMNS} h-11 items-center gap-4 border-b border-line px-4 last:border-b-0 ${conflict ? "bg-alarm-soft" : ""}`}
						>
							<span
								className={`flex min-w-0 items-center gap-1.5 text-[13px] font-medium ${conflict ? "text-alarm" : ""}`}
							>
								{conflict && <TriangleAlert className="size-3.5 shrink-0" />}
								<span className="truncate">{people.get(s.personId)?.name}</span>
							</span>
							<span className="truncate text-[13px]">{locations.get(s.locationId)?.name}</span>
							<span className="font-mono text-xs text-muted">{formatHour(s.from)}</span>
							<span className="font-mono text-xs text-muted">{formatHour(s.to)}</span>
						</div>
					);
				})}
			</div>
		</>
	);
}
