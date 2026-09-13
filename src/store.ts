import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createPlan, hasName, isDuplicateShift, newId, normalizeName } from "./domain/plan";
import type { Hour, Plan, Shift } from "./domain/types";

const HISTORY_LIMIT = 100;

/** Actions return an error message for the user, or undefined on success. */
type Result = string | undefined;

interface PlanState {
	plan: Plan;
	past: Plan[];
	future: Plan[];

	replacePlan: (plan: Plan) => void;
	setName: (name: string) => void;
	setWindow: (startHour: Hour, endHour: Hour) => void;

	addPerson: (name: string) => Result;
	renamePerson: (id: string, name: string) => Result;
	removePerson: (id: string) => void;

	addLocation: (name: string) => Result;
	renameLocation: (id: string, name: string) => Result;
	removeLocation: (id: string) => void;
	moveLocation: (id: string, delta: -1 | 1) => void;

	addShift: (shift: Omit<Shift, "id">) => Result;
	updateShift: (id: string, changes: Partial<Omit<Shift, "id">>) => Result;
	removeShift: (id: string) => void;

	undo: () => void;
	redo: () => void;
}

export const usePlanStore = create<PlanState>()(
	persist(
		(set, get) => {
			/** Applies a change and records the previous plan for undo. */
			const commit = (update: (plan: Plan) => Plan) =>
				set(({ plan, past }) => ({
					plan: update(plan),
					past: [...past, plan].slice(-HISTORY_LIMIT),
					future: [],
				}));

			const validateName = (items: Plan["people"], name: string, label: string, exceptId?: string): Result => {
				if (!normalizeName(name)) return `Bitte einen Namen eingeben.`;
				if (hasName(items, name, exceptId)) return `${label} „${normalizeName(name)}“ gibt es bereits.`;
			};

			const validateShift = (shift: Omit<Shift, "id">, exceptId?: string): Result => {
				if (shift.to <= shift.from) return "„Bis“ muss nach „Von“ liegen.";
				if (isDuplicateShift(get().plan.shifts, shift, exceptId)) {
					return "Die Person ist für diese Zeit und diesen Standort bereits eingeteilt.";
				}
			};

			return {
				plan: createPlan(),
				past: [],
				future: [],

				replacePlan: (plan) => commit(() => plan),
				setName: (name) => commit((p) => ({ ...p, name })),
				setWindow: (startHour, endHour) => commit((p) => ({ ...p, startHour, endHour })),

				addPerson: (name) => {
					const error = validateName(get().plan.people, name, "Person");
					if (error) return error;
					commit((p) => ({ ...p, people: [...p.people, { id: newId(), name: normalizeName(name) }] }));
				},
				renamePerson: (id, name) => {
					const error = validateName(get().plan.people, name, "Person", id);
					if (error) return error;
					commit((p) => ({
						...p,
						people: p.people.map((x) => (x.id === id ? { ...x, name: normalizeName(name) } : x)),
					}));
				},
				removePerson: (id) =>
					commit((p) => ({
						...p,
						people: p.people.filter((x) => x.id !== id),
						shifts: p.shifts.filter((s) => s.personId !== id),
					})),

				addLocation: (name) => {
					const error = validateName(get().plan.locations, name, "Standort");
					if (error) return error;
					commit((p) => ({ ...p, locations: [...p.locations, { id: newId(), name: normalizeName(name) }] }));
				},
				renameLocation: (id, name) => {
					const error = validateName(get().plan.locations, name, "Standort", id);
					if (error) return error;
					commit((p) => ({
						...p,
						locations: p.locations.map((x) => (x.id === id ? { ...x, name: normalizeName(name) } : x)),
					}));
				},
				removeLocation: (id) =>
					commit((p) => ({
						...p,
						locations: p.locations.filter((x) => x.id !== id),
						shifts: p.shifts.filter((s) => s.locationId !== id),
					})),
				moveLocation: (id, delta) =>
					commit((p) => {
						const index = p.locations.findIndex((l) => l.id === id);
						const target = index + delta;
						if (index < 0 || target < 0 || target >= p.locations.length) return p;
						const locations = [...p.locations];
						[locations[index], locations[target]] = [locations[target], locations[index]];
						return { ...p, locations };
					}),

				addShift: (shift) => {
					const error = validateShift(shift);
					if (error) return error;
					commit((p) => ({ ...p, shifts: [...p.shifts, { ...shift, id: newId() }] }));
				},
				updateShift: (id, changes) => {
					const current = get().plan.shifts.find((s) => s.id === id);
					if (!current) return;
					const next = { ...current, ...changes };
					if (
						next.from === current.from &&
						next.to === current.to &&
						next.personId === current.personId &&
						next.locationId === current.locationId
					) {
						return;
					}
					const error = validateShift(next, id);
					if (error) return error;
					commit((p) => ({ ...p, shifts: p.shifts.map((s) => (s.id === id ? next : s)) }));
				},
				removeShift: (id) => commit((p) => ({ ...p, shifts: p.shifts.filter((s) => s.id !== id) })),

				undo: () =>
					set(({ plan, past, future }) =>
						past.length ? { plan: past[past.length - 1], past: past.slice(0, -1), future: [plan, ...future] } : {},
					),
				redo: () =>
					set(({ plan, past, future }) =>
						future.length ? { plan: future[0], past: [...past, plan], future: future.slice(1) } : {},
					),
			};
		},
		{
			name: "fireparty-plan",
			version: 2,
			partialize: (state) => ({ plan: state.plan }),
		},
	),
);
