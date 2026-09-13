import { compareShifts, lookup, shiftsOfLocation, sortByName } from "../domain/plan";
import { range } from "../domain/time";
import type { Hour, Location, Person, Plan, Shift } from "../domain/types";

export interface MatrixRow {
	person: Person;
	/** one entry per hour column: location names of all shifts covering that hour */
	cells: string[][];
}

export interface ScheduleMatrix {
	hours: Hour[];
	rows: MatrixRow[];
}

/** Person × hour matrix, as in the original Excel export. */
export function buildMatrix(plan: Plan, shifts: readonly Shift[], includeUnassigned: boolean): ScheduleMatrix {
	const locations = lookup(plan.locations);
	const hours = shifts.length
		? range(Math.min(...shifts.map((s) => s.from)), Math.max(...shifts.map((s) => s.to)))
		: [];

	const assigned = new Set(shifts.map((s) => s.personId));
	const people = sortByName(plan.people).filter((p) => includeUnassigned || assigned.has(p.id));

	const rows = people.map((person) => {
		const own = shifts.filter((s) => s.personId === person.id).sort(compareShifts);
		return {
			person,
			cells: hours.map((h) =>
				own.filter((s) => s.from <= h && h < s.to).map((s) => locations.get(s.locationId)?.name ?? "?"),
			),
		};
	});

	return { hours, rows };
}

export interface LocationList {
	location: Location;
	entries: { from: Hour; to: Hour; person: string }[];
}

/** Shifts grouped by location in the plan's location order, like the tables view. */
export function buildLocationLists(plan: Plan): LocationList[] {
	const people = lookup(plan.people);
	return plan.locations
		.map((location) => ({
			location,
			entries: shiftsOfLocation(plan, location.id).map((s) => ({
				from: s.from,
				to: s.to,
				person: people.get(s.personId)?.name ?? "?",
			})),
		}))
		.filter((list) => list.entries.length > 0);
}
