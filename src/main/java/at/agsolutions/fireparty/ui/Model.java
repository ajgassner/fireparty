package at.agsolutions.fireparty.ui;

import at.agsolutions.fireparty.domain.Disposition;
import at.agsolutions.fireparty.domain.Location;
import at.agsolutions.fireparty.domain.PartyHour;
import at.agsolutions.fireparty.domain.Person;
import javafx.beans.property.SimpleStringProperty;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;

import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public class Model {

	private Map<DispositionTableView, ObservableList<Disposition>> tableData = new HashMap<>();
	private ObservableList<Person> people = FXCollections.observableArrayList();
	private ObservableList<Location> locations = FXCollections.observableArrayList();

	private SimpleStringProperty sheetName = new SimpleStringProperty();

	public List<Disposition> extractDispositions(boolean withUnallocatedPeople) {
		List<Disposition> dispositions = getTableData().values().stream().flatMap(Collection::stream).collect(Collectors.toList());

		if (withUnallocatedPeople) {
			for (Person person : people) {
				boolean found = false;

				for (Disposition dispo : dispositions) {
					if (dispo.getPerson().equals(person)) {
						found = true;
						break;
					}
				}

				if (!found) {
					dispositions.add(
							new Disposition(
									person,
									new Location("-"),
									new PartyHour(0),
									new PartyHour(0)));
				}
			}
		}

		return dispositions;
	}

	public List<Disposition> extractDispositions() {
		return extractDispositions(false);
	}

	public Map<DispositionTableView, ObservableList<Disposition>> getTableData() {
		return tableData;
	}

	public ObservableList<Person> getPeople() {
		return people;
	}

	public ObservableList<Location> getLocations() {
		return locations;
	}

	public SimpleStringProperty sheetNameProperty() {
		return sheetName;
	}
}
