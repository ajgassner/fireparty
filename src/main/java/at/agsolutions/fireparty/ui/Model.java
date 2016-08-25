package at.agsolutions.fireparty.ui;

import at.agsolutions.fireparty.domain.Disposition;
import at.agsolutions.fireparty.domain.Location;
import at.agsolutions.fireparty.domain.Person;
import javafx.beans.property.SimpleStringProperty;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import lombok.Getter;

import java.util.HashMap;
import java.util.Map;

@Getter
public class Model {

	private Map<DispositionTableView, ObservableList<Disposition>> tableData = new HashMap<>();
	private ObservableList<Person> people = FXCollections.observableArrayList();
	private ObservableList<Location> locations = FXCollections.observableArrayList();

	private SimpleStringProperty sheetName = new SimpleStringProperty();
}
