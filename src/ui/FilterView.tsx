import { TriangleAlert } from "lucide-react";
import { useState } from "react";
import { shiftsInWindow } from "../domain/plan";
import { formatHour } from "../domain/time";
import type { Hour } from "../domain/types";
import { useDerived } from "./derived";
import { HourSelect } from "./HourSelect";

const COLUMNS =
	"grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_72px_72px] sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_120px_120px]";

export function FilterView() {
	const { plan, people, locations, conflicts, hourOptions, window } = useDerived();
	const [from, setFrom] = useState<Hour>(window.startHour);
	const [to, setTo] = useState<Hour>(Math.min(window.startHour + 2, window.endHour));
	const hits = shiftsInWindow(plan.shifts, from, to).sort(
		(a, b) =>
			a.from - b.from || (people.get(a.personId)?.name ?? "").localeCompare(people.get(b.personId)?.name ?? "", "de"),
	);

	return (
		<>
			<div className="flex flex-wrap items-end gap-3">
				<div className="flex flex-col gap-1.5">
					<span className="label">Von</span>
					<HourSelect
						label="Von"
						className="w-[120px]"
						value={from}
						options={hourOptions}
						onChange={(h) => {
							setFrom(h);
							if (h >= to) setTo(h + 1);
						}}
					/>
				</div>
				<div className="flex flex-col gap-1.5">
					<span className="label">Bis</span>
					<HourSelect
						label="Bis"
						className="w-[120px]"
						value={to}
						options={hourOptions.filter((h) => h > from)}
						onChange={setTo}
					/>
				</div>
				<span className="ml-2 pb-2 text-[13px] text-muted" aria-live="polite">
					{hits.length === 1 ? "1 Einteilung" : `${hits.length} Einteilungen`} im Zeitraum
				</span>
			</div>
			<div className="shrink-0 overflow-hidden rounded-lg border border-line bg-surface">
				<div className={`grid ${COLUMNS} h-[38px] items-center gap-4 px-4 text-xs text-muted`}>
					<span>Name</span>
					<span>Standort</span>
					<span>Von</span>
					<span>Bis</span>
				</div>
				{hits.length === 0 && (
					<p className="border-t border-line px-4 py-5 text-[13px] text-muted">
						In diesem Zeitraum ist niemand eingeteilt.
					</p>
				)}
				{hits.map((s) => {
					const conflict = conflicts.has(s.id);
					return (
						<div
							key={s.id}
							className={`grid ${COLUMNS} h-11 items-center gap-4 border-t border-line px-4 ${conflict ? "bg-alarm-soft" : ""}`}
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
