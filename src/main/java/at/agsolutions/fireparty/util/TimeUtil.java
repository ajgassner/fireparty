package at.agsolutions.fireparty.util;

import at.agsolutions.fireparty.domain.PartyHour;

public class TimeUtil {

	private static final PartyHour[] HOURS = new PartyHour[24];

	static {
		for (int i = 0; i < HOURS.length; i++) {
			HOURS[i] = new PartyHour(i);
		}
	}

	private TimeUtil() {}

	public static PartyHour[] getHours() {
		return HOURS;
	}

	public static boolean intersects(PartyHour fromA, PartyHour toA, PartyHour fromB, PartyHour toB) {
		return fromA.isBefore(toB) && toA.isAfter(fromB);
	}
}
