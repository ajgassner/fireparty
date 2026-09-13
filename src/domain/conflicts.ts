import { intersects } from "./time";
import type { Shift } from "./types";

/** Maps each shift id to the ids of other shifts of the same person that overlap it. */
export type ConflictMap = Map<string, string[]>;

export function computeConflicts(shifts: readonly Shift[]): ConflictMap {
	const result: ConflictMap = new Map();
	const byPerson = Map.groupBy(shifts, (s) => s.personId);

	for (const personShifts of byPerson.values()) {
		for (const a of personShifts) {
			const overlapping = personShifts.filter((b) => b.id !== a.id && intersects(a.from, a.to, b.from, b.to));
			if (overlapping.length > 0) {
				result.set(
					a.id,
					overlapping.map((b) => b.id),
				);
			}
		}
	}

	return result;
}

export function peopleWithConflicts(shifts: readonly Shift[], conflicts: ConflictMap): Set<string> {
	return new Set(shifts.filter((s) => conflicts.has(s.id)).map((s) => s.personId));
}
