package at.agsolutions.fireparty.ui;

import at.agsolutions.fireparty.domain.Disposition;
import at.agsolutions.fireparty.domain.Location;
import at.agsolutions.fireparty.domain.PartyHour;
import at.agsolutions.fireparty.domain.Person;
import at.agsolutions.fireparty.service.IDataService;
import javafx.collections.FXCollections;
import javafx.collections.ListChangeListener;
import javafx.collections.ObservableList;
import javafx.geometry.Insets;
import javafx.geometry.Orientation;
import javafx.scene.control.*;
import javafx.scene.control.ScrollPane.ScrollBarPolicy;
import javafx.scene.layout.BorderPane;
import javafx.scene.layout.FlowPane;
import javafx.scene.layout.VBox;
import javafx.scene.text.Font;
import javafx.scene.text.FontWeight;
import javafx.scene.text.Text;
import lombok.extern.slf4j.Slf4j;
import org.kordamp.ikonli.fontawesome.FontAwesome;
import org.kordamp.ikonli.javafx.FontIcon;

import javax.inject.Inject;
import java.util.Collection;
import java.util.stream.Collectors;

@Slf4j
public class RootPane extends BorderPane {

	private static final int SPACING = 5;
	private static final int LOCATION_FONT_SIZE = 14;
	private static final String LOCATION_FONT_FACE = "Arial";

	private static final String PEOPLE_TAB_TITLE = "People";
	private static final String LOCATIONS_TAB_TITLE = "Locations";

	private final SidebarEditor<Person> personEditor;
	private IDataService dataService;
	private Model model = new Model();
	private FlowPane flowPane;

	@Inject
	public RootPane(IDataService dataService) {
		this.dataService = dataService;

		addMenuBar();
		personEditor = new SidebarEditor<>(model.getPeople(), "person", Person::new, Person::getName);
		populateModel();

		model.getLocations().addListener((ListChangeListener<Location>) e -> {
			while (e.next()) {
				if (e.wasAdded()) {
					e.getAddedSubList().forEach(this::addLocationTo);
				}

				if (e.wasRemoved()) {
					Location location = e.getRemoved().stream().findFirst().get();
					Collection<DispositionTableView> tables = model.getTableData().keySet().stream().filter(t -> t.getLocation().equals
							(location)).collect(Collectors.toList());
					tables.forEach(t -> {
						model.getTableData().remove(t);
						flowPane.getChildren().remove(t.getParent());
					});
				}
			}
		});

		model.getPeople().addListener((ListChangeListener<Person>) e -> {
			while (e.next()) {
				if (e.wasRemoved()) {
					model.getTableData().forEach((k, v) -> v.removeIf(d -> e.getRemoved().contains(d.getPerson())));
				}
			}
		});

		ScrollPane scrollPane = new ScrollPane();
		scrollPane.setFitToHeight(true);
		scrollPane.setFitToWidth(true);
		scrollPane.setVbarPolicy(ScrollBarPolicy.ALWAYS);
		scrollPane.setStyle("-fx-background-color:transparent;");
		initFlowPane();
		scrollPane.setContent(flowPane);
		setCenter(scrollPane);

		setRight(buildTabPane());
	}

	private TabPane buildTabPane() {
		TabPane tabPane = new TabPane();
		tabPane.setMinWidth(300);

		Tab personTab = new Tab(PEOPLE_TAB_TITLE);
		personTab.setClosable(false);
		personTab.setGraphic(new FontIcon(FontAwesome.USER));
		personTab.setContent(personEditor);

		Tab locationTab = new Tab(LOCATIONS_TAB_TITLE);
		locationTab.setClosable(false);
		locationTab.setGraphic(new FontIcon(FontAwesome.HOME));
		locationTab.setContent(new SidebarEditor<>(model.getLocations(), "locations", Location::new, Location::getName));

		tabPane.getTabs().addAll(personTab, locationTab);
		return tabPane;
	}

	private void populateModel() {
		model.getPeople().clear();
		model.getLocations().clear();
		model.getTableData().clear();

		model.getPeople().addAll(dataService.getPeople());
		model.getLocations().addAll(dataService.getLocations());

		validateData();
	}

	private void addMenuBar() {
		MenuBar menuBar = new MenuBar();
		Menu menuFile = new FileMenu(model, () -> {
			flowPane.getChildren().clear();
			populateModel();
		});
		menuBar.getMenus().add(menuFile);
		setTop(menuBar);
	}

	private void initFlowPane() {
		flowPane = new FlowPane(Orientation.HORIZONTAL, SPACING, SPACING);
		flowPane.setPadding(new Insets(SPACING));

		model.getLocations().forEach(this::addLocationTo);
	}

	private void addLocationTo(Location loc) {
		VBox box = new VBox(SPACING);
		Text location = new Text(loc.getName());
		location.setFont(Font.font(LOCATION_FONT_FACE, FontWeight.BOLD, LOCATION_FONT_SIZE));
		box.getChildren().add(location);

		ObservableList<Disposition> dispos = FXCollections.observableArrayList();
		dispos.addAll(dataService.getDispositions().stream().filter(d -> d.getLocation().equals(loc)).collect(Collectors.toList()));
		dispos.addListener((ListChangeListener<Disposition>) e -> {
			personEditor.setInvalidData(dataService.computeOverlaps(model.getTableData().values().stream().flatMap
					(Collection::stream).collect(Collectors.toList())));
			personEditor.refresh();
		});

		DispositionTableView table = new DispositionTableView(dispos, loc)
				.withFromSelectionColumn()
				.withToSelectionColumn()
				.withPersonSelectionColumn(model.getPeople());

		Button add = new Button("Add");
		add.setGraphic(new FontIcon(FontAwesome.CALENDAR_PLUS_O));
		add.setOnAction(e -> table.getItems().add(new Disposition(new Person(""), loc, new PartyHour(20), new PartyHour(22))));

		Button remove = new Button("Remove");
		remove.setGraphic(new FontIcon(FontAwesome.TRASH));
		remove.setDisable(true);
		remove.setOnAction(e -> table.getItems().remove(table.getSelectionModel().getSelectedItem()));
		table.getSelectionModel().selectedItemProperty().addListener((obs, oldSelection, newSelection) -> {
			remove.setDisable(newSelection == null);
		});

		ButtonBar bar = new ButtonBar();
		bar.getButtons().addAll(add, remove);
		box.getChildren().add(bar);

		box.getChildren().add(table);
		flowPane.getChildren().add(box);
		model.getTableData().put(table, dispos);
	}

	private void validateData() {
		personEditor.setInvalidData(dataService.computeOverlaps(model.getTableData().values().stream().flatMap
				(Collection::stream).collect(Collectors.toList())));
		personEditor.refresh();
	}
}
