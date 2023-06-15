package at.agsolutions.fireparty.domain;

import java.beans.ConstructorProperties;
import java.util.List;

public class DataFileHolder {

	private List<Person> people;
	private List<Location> locations;
	private List<Disposition> dispositions;

	private String sheetName;

	@ConstructorProperties({"people", "locations", "dispositions", "sheetName"})
	public DataFileHolder(final List<Person> people, final List<Location> locations,
						  final List<Disposition> dispositions, final String sheetName) {
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
