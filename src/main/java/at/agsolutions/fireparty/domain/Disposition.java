package at.agsolutions.fireparty.domain;

import java.beans.ConstructorProperties;

public class Disposition {

	private Person person;
	private Location location;
	private PartyHour from;
	private PartyHour to;

	@ConstructorProperties({"person", "location", "from", "to"})
	public Disposition(final Person person, final Location location, final PartyHour from, final PartyHour to) {
		this.person = person;
		this.location = location;
		this.from = from;
		this.to = to;
	}

	public Person getPerson() {
		return person;
	}

	public Location getLocation() {
		return location;
	}

	public PartyHour getFrom() {
		return from;
	}

	public PartyHour getTo() {
		return to;
	}

	public void setPerson(final Person person) {
		this.person = person;
	}

	public void setFrom(final PartyHour from) {
		this.from = from;
	}

	public void setTo(final PartyHour to) {
		this.to = to;
	}
}
