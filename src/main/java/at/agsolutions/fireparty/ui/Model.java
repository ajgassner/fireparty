package at.agsolutions.fireparty.ui;

import at.agsolutions.fireparty.domain.Disposition;
import at.agsolutions.fireparty.domain.Location;
import at.agsolutions.fireparty.domain.Person;
import javafx.beans.property.SimpleStringProperty;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import lombok.Getter;

import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Getter
public class Model {

	private Map<DispositionTableView, ObservableList<Disposition>> tableData = new HashMap<>();
	private ObservableList<Person> people = FXCollections.observableArrayList();
	private ObservableList<Location> locations = FXCollections.observableArrayList();

	private SimpleStringProperty sheetName = new SimpleStringProperty();

	public List<Disposition> extractDispositions() {
		return getTableData().values().stream().flatMap(Collection::stream).collect(Collectors.toList());
	}
}
