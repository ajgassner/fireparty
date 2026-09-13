import { describe, expect, it } from "vitest";
import { createPlan } from "../domain/plan";
import type { Plan } from "../domain/types";
import { buildLocationLists, buildMatrix } from "./matrix";

const plan: Plan = {
	...createPlan("Fest"),
	people: [
		{ id: "k", name: "STARKL Karl" },
		{ id: "h", name: "HUBER Stefan" },
		{ id: "x", name: "ZAUNER Xaver" },
	],
	locations: [
		{ id: "s", name: "Schank" },
		{ id: "b", name: "Bar" },
	],
	shifts: [
		{ id: "1", personId: "k", locationId: "s", from: 20, to: 22 },
		{ id: "2", personId: "k", locationId: "b", from: 21, to: 23 },
		{ id: "3", personId: "h", locationId: "b", from: 22, to: 25 },
	],
};

describe("buildMatrix", () => {
	it("builds a person × hour matrix with overlapping locations", () => {
		const { hours, rows } = buildMatrix(plan, plan.shifts, false);

		expect(hours).toEqual([20, 21, 22, 23, 24]);
		expect(rows.map((r) => r.person.name)).toEqual(["HUBER Stefan", "STARKL Karl"]);
		expect(rows[1].cells).toEqual([["Schank"], ["Schank", "Bar"], ["Bar"], [], []]);
	});

	it("optionally includes people without shifts", () => {
		expect(buildMatrix(plan, plan.shifts, true).rows).toHaveLength(3);
	});
});

describe("buildLocationLists", () => {
	it("keeps the plan's location order and sorts shifts by time, then name", () => {
		const withTie: Plan = {
			...plan,
			shifts: [
				...plan.shifts,
				{ id: "4", personId: "x", locationId: "b", from: 21, to: 23 },
				{ id: "5", personId: "h", locationId: "b", from: 21, to: 23 },
			],
		};
		expect(buildLocationLists(withTie)).toEqual([
			{ location: { id: "s", name: "Schank" }, entries: [{ from: 20, to: 22, person: "STARKL Karl" }] },
			{
				location: { id: "b", name: "Bar" },
				entries: [
					{ from: 21, to: 23, person: "HUBER Stefan" },
					{ from: 21, to: 23, person: "STARKL Karl" },
					{ from: 21, to: 23, person: "ZAUNER Xaver" },
					{ from: 22, to: 25, person: "HUBER Stefan" },
				],
			},
		]);
	});
});
