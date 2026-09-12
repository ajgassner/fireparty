import type { Hour } from "./types";

export const HOURS_PER_DAY = 24;

export function clockHour(hour: Hour): number {
	return ((hour % HOURS_PER_DAY) + HOURS_PER_DAY) % HOURS_PER_DAY;
}

export function dayIndex(hour: Hour): number {
	return Math.floor(hour / HOURS_PER_DAY);
}

/** "20:00" */
export function formatHour(hour: Hour): string {
	return `${String(clockHour(hour)).padStart(2, "0")}:00`;
}

/** "02:00 (+1)" – marks hours on following days, for selects in multi-day plans */
export function formatHourLabel(hour: Hour): string {
	const day = dayIndex(hour);
	return day === 0 ? formatHour(hour) : `${formatHour(hour)} (${day > 0 ? "+" : ""}${day})`;
}

/** "20–02", compact label inside timeline blocks */
export function formatShortRange(from: Hour, to: Hour): string {
	return `${String(clockHour(from)).padStart(2, "0")}–${String(clockHour(to)).padStart(2, "0")}`;
}

/** "20:00 - 02:00" */
export function formatRange(from: Hour, to: Hour): string {
	return `${formatHour(from)} - ${formatHour(to)}`;
}

/** "20-21h", used as column header in the Excel matrix */
export function formatHourSlot(hour: Hour): string {
	return `${clockHour(hour)}-${clockHour(hour + 1)}h`;
}

/** Half-open intervals [fromA, toA) and [fromB, toB) share at least one hour. */
export function intersects(fromA: Hour, toA: Hour, fromB: Hour, toB: Hour): boolean {
	return fromA < toB && toA > fromB;
}

export function range(from: Hour, to: Hour): Hour[] {
	return Array.from({ length: Math.max(0, to - from) }, (_, i) => from + i);
}
