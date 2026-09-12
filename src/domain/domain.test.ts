import { describe, expect, it } from "vitest";
import { computeConflicts, peopleWithConflicts } from "./conflicts";
import { PlanFileError, parsePlanFile, serializePlan } from "./file";
import { createPlan, effectiveWindow, hasName, isDuplicateShift, shiftsInWindow } from "./plan";
import { formatHour, formatHourSlot, formatRange, intersects } from "./time";
import type { Shift } from "./types";

const shift = (id: string, personId: string, from: number, to: number, locationId = "l1"): Shift => ({
	id,
	personId,
	locationId,
	from,
	to,
});

describe("time", () => {
	it("formats hours after midnight as clock time", () => {
		expect(formatHour(20)).toBe("20:00");
		expect(formatHour(26)).toBe("02:00");
		expect(formatRange(22, 26)).toBe("22:00 - 02:00");
		expect(formatHourSlot(23)).toBe("23-0h");
	});

	it("treats intervals as half-open", () => {
		expect(intersects(20, 22, 22, 24)).toBe(false);
		expect(intersects(20, 23, 22, 24)).toBe(true);
		expect(intersects(20, 30, 22, 24)).toBe(true);
	});
});

describe("conflicts", () => {
	it("detects overlapping shifts of the same person only", () => {
		const shifts = [
			shift("a", "p1", 20, 23),
			shift("b", "p1", 22, 26, "l2"),
			shift("c", "p1", 26, 28),
			shift("d", "p2", 20, 23),
		];
		const conflicts = computeConflicts(shifts);

		expect(conflicts.get("a")).toEqual(["b"]);
		expect(conflicts.get("b")).toEqual(["a"]);
		expect(conflicts.has("c")).toBe(false);
		expect(conflicts.has("d")).toBe(false);
		expect(peopleWithConflicts(shifts, conflicts)).toEqual(new Set(["p1"]));
	});
});

describe("plan helpers", () => {
	it("finds shifts in a time window", () => {
		const shifts = [shift("a", "p1", 18, 20), shift("b", "p2", 20, 22), shift("c", "p3", 25, 27)];
		expect(shiftsInWindow(shifts, 19, 21).map((s) => s.id)).toEqual(["a", "b"]);
	});

	it("checks names case-insensitively", () => {
		const people = [{ id: "1", name: "HUBER Stefan" }];
		expect(hasName(people, "  huber   stefan ")).toBe(true);
		expect(hasName(people, "huber stefan", "1")).toBe(false);
	});

	it("detects exact duplicates", () => {
		const shifts = [shift("a", "p1", 18, 20)];
		expect(isDuplicateShift(shifts, { personId: "p1", locationId: "l1", from: 18, to: 20 })).toBe(true);
		expect(isDuplicateShift(shifts, { personId: "p1", locationId: "l1", from: 18, to: 20 }, "a")).toBe(false);
	});

	it("extends the window to contain all shifts", () => {
		const plan = { ...createPlan(), shifts: [shift("a", "p", 10, 32)] };
		expect(effectiveWindow(plan)).toEqual({ startHour: 10, endHour: 32 });
	});
});

describe("plan file", () => {
	it("round-trips the v2 format", () => {
		const plan = {
			...createPlan("Sommerfest"),
			people: [{ id: "p1", name: "Karl" }],
			locations: [{ id: "l1", name: "Schank" }],
			shifts: [shift("s1", "p1", 20, 26)],
		};
		expect(parsePlanFile(serializePlan(plan))).toEqual({ plan, legacy: false, warnings: [] });
	});

	it("imports files of the JavaFX version", () => {
		const legacy = {
			people: [{ name: "GASSNER Alexander" }, { name: "LECHNER Simon" }, { name: "HUBER Stefan" }],
			locations: [{ name: "Schank" }, { name: "Bar" }],
			dispositions: [
				{ person: { name: "LECHNER Simon" }, location: { name: "Schank" }, from: { hour: 22 }, to: { hour: 2 } },
				{ person: { name: "GASSNER Alexander" }, location: { name: "Bar" }, from: { hour: 7 }, to: { hour: 6 } },
				{ person: { name: "HUBER Stefan" }, location: { name: "Bar" }, from: { hour: 20 }, to: { hour: 20 } },
			],
			sheetName: "Zeltfest",
		};

		const { plan, legacy: isLegacy, warnings } = parsePlanFile(JSON.stringify(legacy));

		expect(isLegacy).toBe(true);
		expect(plan.name).toBe("Zeltfest");
		expect(plan.people.map((p) => p.name)).toEqual(["GASSNER Alexander", "LECHNER Simon", "HUBER Stefan"]);
		expect(plan.locations.map((l) => l.name)).toEqual(["Schank", "Bar"]);
		expect(plan.shifts.map(({ from, to }) => [from, to])).toEqual([
			[22, 26],
			[7, 30],
		]);
		expect(plan.startHour).toBe(7);
		expect(plan.endHour).toBe(30);
		expect(warnings).toHaveLength(1);

		const simon = plan.people.find((p) => p.name === "LECHNER Simon");
		expect(plan.shifts[0].personId).toBe(simon?.id);
	});

	it("rejects garbage", () => {
		expect(() => parsePlanFile("nope")).toThrow(PlanFileError);
		expect(() => parsePlanFile("{}")).toThrow(PlanFileError);
		expect(() => parsePlanFile(JSON.stringify({ ...createPlan(), shifts: [shift("x", "missing", 1, 2)] }))).toThrow(
			PlanFileError,
		);
	});
});
