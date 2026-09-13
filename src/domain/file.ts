import { DEFAULT_END_HOUR, DEFAULT_START_HOUR, newId, normalizeName } from "./plan";
import type { Hour, Location, Person, Plan, Shift } from "./types";

export class PlanFileError extends Error {}

export interface ParseResult {
	plan: Plan;
	/** true if the file was created by the old JavaFX version (*.fp) */
	legacy: boolean;
	/** human readable notes about entries that had to be dropped */
	warnings: string[];
}

export function serializePlan(plan: Plan): string {
	return JSON.stringify(plan, null, 2);
}

export function parsePlanFile(text: string): ParseResult {
	let data: unknown;
	try {
		data = JSON.parse(text);
	} catch {
		throw new PlanFileError("Die Datei ist kein gültiges JSON.");
	}

	if (!isObject(data)) {
		throw new PlanFileError("Unbekanntes Dateiformat.");
	}
	if (data.version === 2) {
		return { plan: parseV2(data), legacy: false, warnings: [] };
	}
	if (Array.isArray(data.dispositions)) {
		return parseLegacy(data);
	}
	throw new PlanFileError("Unbekanntes Dateiformat.");
}

function parseV2(data: Record<string, unknown>): Plan {
	const people = arrayOf(data.people, "people").map((p) => ({ id: str(p.id), name: str(p.name) }));
	const locations = arrayOf(data.locations, "locations").map((l) => ({ id: str(l.id), name: str(l.name) }));
	const personIds = new Set(people.map((p) => p.id));
	const locationIds = new Set(locations.map((l) => l.id));

	const shifts = arrayOf(data.shifts, "shifts").map((s) => {
		const shift: Shift = {
			id: str(s.id),
			personId: str(s.personId),
			locationId: str(s.locationId),
			from: int(s.from),
			to: int(s.to),
		};
		if (!personIds.has(shift.personId) || !locationIds.has(shift.locationId) || shift.to <= shift.from) {
			throw new PlanFileError("Die Datei enthält ungültige Einteilungen.");
		}
		return shift;
	});

	const startHour = int(data.startHour);
	const endHour = int(data.endHour);
	if (endHour <= startHour) {
		throw new PlanFileError("Das Zeitfenster in der Datei ist ungültig.");
	}

	return {
		version: 2,
		name: typeof data.name === "string" ? data.name : "",
		startHour,
		endHour,
		people,
		locations,
		shifts,
	};
}

/**
 * Old format (Jackson serialization of DataFileHolder):
 * { people: [{name}], locations: [{name}], sheetName,
 *   dispositions: [{ person: {name}, location: {name}, from: {hour}, to: {hour} }] }
 * Hours 0-6 meant "after midnight".
 */
const LEGACY_LAST_MORNING_HOUR = 6;

function parseLegacy(data: Record<string, unknown>): ParseResult {
	const warnings: string[] = [];
	const people = new Map<string, Person>();
	const locations = new Map<string, Location>();

	const person = (name: string) => getOrCreate(people, name);
	const location = (name: string) => getOrCreate(locations, name);

	for (const p of arrayOf(data.people ?? [], "people")) person(str(p.name));
	for (const l of arrayOf(data.locations ?? [], "locations")) location(str(l.name));

	const shifts: Shift[] = [];
	for (const d of arrayOf(data.dispositions, "dispositions")) {
		const personName = isObject(d.person) ? str(d.person.name) : "";
		const locationName = isObject(d.location) ? str(d.location.name) : "";
		const from = legacyHour(d.from);
		let to = legacyHour(d.to);

		if (!normalizeName(personName) || !normalizeName(locationName)) {
			warnings.push("Eine Einteilung ohne Person oder Standort wurde übersprungen.");
			continue;
		}
		if (to === from) {
			warnings.push(`Einteilung von ${personName} (${locationName}) ohne Dauer wurde übersprungen.`);
			continue;
		}
		if (to < from) {
			// e.g. 06:00 - 07:00 crosses the old "morning" boundary
			to += 24;
		}
		shifts.push({ id: newId(), personId: person(personName).id, locationId: location(locationName).id, from, to });
	}

	const startHour = Math.min(DEFAULT_START_HOUR, ...shifts.map((s) => s.from));
	const endHour = Math.max(DEFAULT_END_HOUR, ...shifts.map((s) => s.to));

	return {
		plan: {
			version: 2,
			name: typeof data.sheetName === "string" ? data.sheetName : "",
			startHour,
			endHour,
			people: [...people.values()],
			locations: [...locations.values()],
			shifts,
		},
		legacy: true,
		warnings,
	};
}

function legacyHour(value: unknown): Hour {
	const hour = isObject(value) ? int(value.hour) : Number.NaN;
	if (!(hour >= 0 && hour <= 23)) {
		throw new PlanFileError("Die alte Datei enthält eine ungültige Uhrzeit.");
	}
	return hour <= LEGACY_LAST_MORNING_HOUR ? hour + 24 : hour;
}

function getOrCreate<T extends { id: string; name: string }>(map: Map<string, T>, rawName: string): T {
	const name = normalizeName(rawName);
	let item = map.get(name);
	if (!item) {
		item = { id: newId(), name } as T;
		map.set(name, item);
	}
	return item;
}

function isObject(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function arrayOf(value: unknown, field: string): Record<string, unknown>[] {
	if (!Array.isArray(value) || !value.every(isObject)) {
		throw new PlanFileError(`Feld "${field}" fehlt oder ist ungültig.`);
	}
	return value;
}

function str(value: unknown): string {
	if (typeof value !== "string") {
		throw new PlanFileError("Die Datei enthält ungültige Werte.");
	}
	return value;
}

function int(value: unknown): number {
	if (typeof value !== "number" || !Number.isInteger(value)) {
		throw new PlanFileError("Die Datei enthält ungültige Zahlen.");
	}
	return value;
}
