import { intersects } from "./time";
import type { Hour, Plan, Shift } from "./types";

export const DEFAULT_START_HOUR: Hour = 14;
export const DEFAULT_END_HOUR: Hour = 30; // 06:00 next morning
export const DEFAULT_SHIFT_LENGTH = 2;

export function newId(): string {
	return crypto.randomUUID();
}

export function createPlan(name = ""): Plan {
	return {
		version: 2,
		name,
		startHour: DEFAULT_START_HOUR,
		endHour: DEFAULT_END_HOUR,
		people: [],
		locations: [],
		shifts: [],
	};
}

export function normalizeName(name: string): string {
	return name.trim().replace(/\s+/g, " ");
}

export function sortByName<T extends { name: string }>(items: readonly T[]): T[] {
	return [...items].sort((a, b) => a.name.localeCompare(b.name, "de"));
}

export function hasName(items: readonly { id: string; name: string }[], name: string, exceptId?: string): boolean {
	const normalized = normalizeName(name).toLocaleLowerCase("de");
	return items.some((i) => i.id !== exceptId && i.name.toLocaleLowerCase("de") === normalized);
}

export function isDuplicateShift(shifts: readonly Shift[], candidate: Omit<Shift, "id">, exceptId?: string): boolean {
	return shifts.some(
		(s) =>
			s.id !== exceptId &&
			s.personId === candidate.personId &&
			s.locationId === candidate.locationId &&
			s.from === candidate.from &&
			s.to === candidate.to,
	);
}

export function shiftsOfLocation(plan: Plan, locationId: string): Shift[] {
	return plan.shifts.filter((s) => s.locationId === locationId).sort(compareShiftsWithNames(plan));
}

export function shiftsInWindow(shifts: readonly Shift[], from: Hour, to: Hour): Shift[] {
	return shifts.filter((s) => intersects(from, to, s.from, s.to)).sort(compareShifts);
}

export function compareShifts(a: Shift, b: Shift): number {
	return a.from - b.from || a.to - b.to;
}

/** Orders by start, end and then person name, so shifts with equal times are listed alphabetically. */
export function compareShiftsWithNames(plan: Plan): (a: Shift, b: Shift) => number {
	const people = lookup(plan.people);
	const name = (s: Shift) => people.get(s.personId)?.name ?? "";
	return (a, b) => compareShifts(a, b) || name(a).localeCompare(name(b), "de");
}

export function lookup<T extends { id: string }>(items: readonly T[]): Map<string, T> {
	return new Map(items.map((i) => [i.id, i]));
}

/** Smallest window that contains the plan window and all shifts. */
export function effectiveWindow(plan: Plan): { startHour: Hour; endHour: Hour } {
	return {
		startHour: Math.min(plan.startHour, ...plan.shifts.map((s) => s.from)),
		endHour: Math.max(plan.endHour, ...plan.shifts.map((s) => s.to)),
	};
}
