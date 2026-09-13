import { useMemo } from "react";
import { computeConflicts, peopleWithConflicts } from "../domain/conflicts";
import { effectiveWindow, lookup } from "../domain/plan";
import { formatRange, range } from "../domain/time";
import type { Hour, Plan } from "../domain/types";
import { usePlanStore } from "../store";

/** Frequently needed values computed from the plan. */
export function useDerived() {
	const plan = usePlanStore((s) => s.plan);
	return useMemo(() => derived(plan), [plan]);
}

// shared across all components so e.g. every timeline block does not recompute conflicts
const cache = new WeakMap<Plan, ReturnType<typeof derive>>();

function derived(plan: Plan) {
	let result = cache.get(plan);
	if (!result) {
		result = derive(plan);
		cache.set(plan, result);
	}
	return result;
}

function derive(plan: Plan) {
	const conflicts = computeConflicts(plan.shifts);
	const people = lookup(plan.people);
	const locations = lookup(plan.locations);
	const shifts = lookup(plan.shifts);
	const window = effectiveWindow(plan);

	/** Human readable descriptions of the conflicts of one shift or person. */
	const describeConflicts = (shiftIds: string[]): string[] =>
		shiftIds.flatMap((id) => {
			const s = shifts.get(id);
			return s ? [`${locations.get(s.locationId)?.name ?? "?"} ${formatRange(s.from, s.to)}`] : [];
		});

	const conflictsOfPerson = (personId: string): string[] => {
		const pairs = plan.shifts
			.filter((s) => s.personId === personId && conflicts.has(s.id))
			.map((s) => describeConflicts([s.id]).join(""));
		return [...new Set(pairs)];
	};

	return {
		plan,
		conflicts,
		conflictedPeople: peopleWithConflicts(plan.shifts, conflicts),
		people,
		locations,
		window,
		/** selectable hours from window start up to and including window end */
		hourOptions: range(window.startHour, window.endHour + 1) as Hour[],
		describeConflicts,
		conflictsOfPerson,
	};
}

export type Derived = ReturnType<typeof derive>;
