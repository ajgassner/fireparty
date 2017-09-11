package at.agsolutions.fireparty.domain;

import java.io.Serializable;
import java.util.List;

public class SerializableFileHolder implements Serializable {
	private static final long serialVersionUID = 1L;

	private List<Person> people;
	private List<Location> locations;
	private List<Disposition> dispositions;

	private String sheetName;

	public SerializableFileHolder(final List<Person> people, final List<Location> locations, final List<Disposition> dispositions, final
	String sheetName) {
		this.people = people;
		this.locations = locations;
		this.dispositions = dispositions;
		this.sheetName = sheetName;
	}

	public List<Person> getPeople() {
		return people;
	}

	public List<Location> getLocations() {
		return locations;
	}

	public List<Disposition> getDispositions() {
		return dispositions;
	}

	public String getSheetName() {
		return sheetName;
	}
}
