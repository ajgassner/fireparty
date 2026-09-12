/**
 * Hours are whole numbers counted from 00:00 of the first day of the party.
 * 20 = 20:00, 26 = 02:00 the next morning. This avoids the old
 * "0-6 o'clock means after midnight" special case and allows multi-day plans.
 */
export type Hour = number;

export interface Person {
	id: string;
	name: string;
}

export interface Location {
	id: string;
	name: string;
}

export interface Shift {
	id: string;
	personId: string;
	locationId: string;
	/** inclusive start hour */
	from: Hour;
	/** exclusive end hour, always > from */
	to: Hour;
}

export interface Plan {
	version: 2;
	name: string;
	/** first visible hour of the timeline */
	startHour: Hour;
	/** last visible hour of the timeline (exclusive) */
	endHour: Hour;
	people: Person[];
	locations: Location[];
	shifts: Shift[];
}
