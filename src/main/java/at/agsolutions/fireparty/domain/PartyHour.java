package at.agsolutions.fireparty.domain;

import com.fasterxml.jackson.annotation.JsonIgnore;

import java.beans.ConstructorProperties;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeFormatterBuilder;
import java.time.temporal.ChronoField;
import java.util.Objects;

/**
 * It's not the happy hour ;)
 */
public class PartyHour implements Comparable<PartyHour> {

	public static final DateTimeFormatter FORMATTER = new DateTimeFormatterBuilder()
			.appendValue(ChronoField.HOUR_OF_DAY, 2)
			.appendLiteral(':')
			.appendValue(ChronoField.MINUTE_OF_HOUR, 2).toFormatter();

	private static final int MIN_HOUR = 0;
	private static final int MAX_HOUR = 23;

	private final int hour;

	@ConstructorProperties({"hour"})
	public PartyHour(final int hour) {
		checkRange(hour);
		this.hour = hour;
	}

	public int getHour() {
		return hour;
	}

	@Override
	public boolean equals(final Object other) {
		if (this == other) return true;
		if (other == null || getClass() != other.getClass()) return false;

		return Objects.equals(getHour(), ((PartyHour) other).getHour());
	}

	@Override
	public int hashCode() {
		return Objects.hash(getHour());
	}

	@Override
	public int compareTo(final PartyHour other) {
		return isBefore(other) ? -1 : (equals(other) ? 0 : 1);
	}

	@Override
	public String toString() {
		return format(FORMATTER);
	}

	public boolean isBefore(final PartyHour other) {
		if (isMorning() && !other.isMorning()) {
			return false;
		}

		if (!isMorning() && other.isMorning()) {
			return true;
		}

		return getHour() < other.getHour();
	}

	public boolean isAfter(final PartyHour other) {
		if (isMorning() && !other.isMorning()) {
			return true;
		}

		if (!isMorning() && other.isMorning()) {
			return false;
		}

		return getHour() > other.getHour();
	}

	@JsonIgnore
	public boolean isMorning() {
		return getHour() >= 0 && getHour() <= 6;
	}

	private void checkRange(final int hour) {
		if (hour < MIN_HOUR || hour > MAX_HOUR) {
			throw new IllegalArgumentException("Hour must be between " + MIN_HOUR + " and " + MAX_HOUR);
		}
	}

	public String format(final DateTimeFormatter formatter) {
		return LocalTime.of(hour, 0).format(formatter);
	}

	public PartyHour addHours(int hoursToAdd) {
		if (hoursToAdd < 0) {
			return this;
		}

		int hoursPerDay = MAX_HOUR + 1;
		int newHour = ((hoursToAdd % hoursPerDay) + hour + hoursPerDay) % hoursPerDay;

		return new PartyHour(newHour);
	}
}
