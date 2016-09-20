package at.agsolutions.fireparty.ui;

import at.agsolutions.fireparty.domain.Disposition;
import at.agsolutions.fireparty.domain.PartyHour;
import at.agsolutions.fireparty.util.TimeUtil;
import javafx.beans.property.SimpleObjectProperty;
import javafx.geometry.Insets;
import javafx.scene.control.ComboBox;
import javafx.scene.control.Label;
import javafx.scene.control.TableColumn;
import javafx.scene.control.TableView;
import javafx.scene.layout.GridPane;
import javafx.scene.layout.Priority;
import javafx.scene.layout.VBox;

import java.util.Arrays;

public class FilterView extends VBox {

	private static final int SPACING = 10;

	private static final String FROM = "From";
	private static final String TO = "To";
	private static final String NAME = "Name";
	private static final String LOC = "Location";

	private Model model;
	private TableView<Disposition> table;
	private ComboBox<PartyHour> from;
	private ComboBox<PartyHour> to;

	public FilterView(Model model) {
		this.model = model;

		setPadding(new Insets(SPACING));

		buildForm();
		buildTable();

		initListeners();
	}

	private void initListeners() {
		from.valueProperty().addListener((observable, oldValue, newValue) -> {
			handleFormChange();
		});

		to.valueProperty().addListener((observable, oldValue, newValue) -> {
			handleFormChange();
		});
	}

	private void handleFormChange() {
		table.getItems().clear();

		model.extractDispositions().forEach(d -> {
			if (TimeUtil.intersects(from.getValue(), to.getValue(), d.getFrom(), d.getTo())) {
				table.getItems().add(d);
			}
		});
	}

	private void buildForm() {
		GridPane grid = new GridPane();
		grid.setHgap(SPACING);
		grid.setVgap(SPACING);
		grid.setPadding(new Insets(0, 0, SPACING, 0));

		from = new ComboBox<>();
		from.getItems().addAll(TimeUtil.getHours());

		to = new ComboBox<>();
		to.getItems().addAll(TimeUtil.getHours());

		final Label fromLabel = new Label(FROM);
		fromLabel.setLabelFor(from);

		final Label toLabel = new Label(TO);
		toLabel.setLabelFor(to);

		grid.add(fromLabel, 0, 0);
		grid.add(from, 1, 0);

		grid.add(toLabel, 2, 0);
		grid.add(to, 3, 0);

		getChildren().add(grid);
	}

	private void buildTable() {
		table = new TableView<>();

		TableColumn<Disposition, String> nameCol = new TableColumn<>(NAME);
		nameCol.setCellValueFactory(cellData -> new SimpleObjectProperty<>(cellData.getValue().getPerson().getName()));

		TableColumn<Disposition, String> locCol = new TableColumn<>(LOC);
		locCol.setCellValueFactory(cellData -> new SimpleObjectProperty<>(cellData.getValue().getLocation().getName()));

		TableColumn<Disposition, PartyHour> fromCol = new TableColumn<>(FROM);
		fromCol.setCellValueFactory(cellData -> new SimpleObjectProperty<>(cellData.getValue().getFrom()));

		TableColumn<Disposition, PartyHour> toCol = new TableColumn<>(TO);
		toCol.setCellValueFactory(cellData -> new SimpleObjectProperty<>(cellData.getValue().getTo()));

		table.getColumns().addAll(Arrays.asList(nameCol, locCol, fromCol, toCol));
		setVgrow(table, Priority.ALWAYS);
		getChildren().add(table);
	}
}
