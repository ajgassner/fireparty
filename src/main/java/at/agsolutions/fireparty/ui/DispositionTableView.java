package at.agsolutions.fireparty.ui;

import at.agsolutions.fireparty.domain.Disposition;
import at.agsolutions.fireparty.domain.Location;
import at.agsolutions.fireparty.domain.Person;
import javafx.beans.property.SimpleObjectProperty;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.scene.control.Alert;
import javafx.scene.control.Alert.AlertType;
import javafx.scene.control.TableColumn;
import javafx.scene.control.TableRow;
import javafx.scene.control.TableView;
import javafx.scene.control.cell.ComboBoxTableCell;
import javafx.scene.input.*;
import javafx.util.converter.LocalTimeStringConverter;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.helpers.FormattingTuple;
import org.slf4j.helpers.MessageFormatter;

import java.time.LocalTime;
import java.time.format.FormatStyle;

@Slf4j
public class DispositionTableView extends TableView<Disposition> {

	private static final DataFormat SERIALIZED_MIME_TYPE = new DataFormat("application/x-java-serialized-object");

	private static final String PERSON_COLUMN_TITLE = "Person";
	private static final String FROM_COLUMN_TITLE = "From";
	private static final String TO_COLUMN_TITLE = "To";
	private static final String LABEL_WARNING = "Warning";

	private static final LocalTime[] HOURS = new LocalTime[24];

	static {
		for (int i = 0; i < HOURS.length; i++) {
			HOURS[i] = LocalTime.of(i, 0);
		}
	}

	private static final int TABLE_HEIGHT = 290;
	private static final int TABLE_WIDTH = 300;

	private boolean currentDragAndDrop = false;

	@Getter
	private Location location;

	public DispositionTableView(ObservableList<Disposition> dispositions, Location location) {
		this.location = location;

		// check other entries
		if (dispositions.stream().anyMatch(d -> !d.getLocation().equals(location))) {
			throw new IllegalArgumentException("Dispositions must not have different locations");
		}

		setItems(dispositions);
		init();
	}

	private void init() {
		setEditable(true);
		setPrefWidth(TABLE_WIDTH);
		setPrefHeight(TABLE_HEIGHT);
		setOnDragDropped(this::dragDropped);
		setOnDragOver(this::dragOver);
		setOnDragDone(e -> currentDragAndDrop = false);

		setRowFactory(tableView -> {
			TableRow<Disposition> row = new TableRow<>();

			row.setOnDragDetected(event -> {
				Disposition dispo = tableView.getSelectionModel().getSelectedItem();

				if (dispo == null) {
					return;
				}

				currentDragAndDrop = true;

				Dragboard dragBoard = row.startDragAndDrop(TransferMode.MOVE);
				dragBoard.setDragView(row.snapshot(null, null));
				ClipboardContent clipboardContent = new ClipboardContent();
				clipboardContent.put(SERIALIZED_MIME_TYPE, dispo);
				dragBoard.setContent(clipboardContent);
				event.consume();
			});

			return row;
		});
	}

	public DispositionTableView withPersonSelectionColumn(ObservableList<Person> availablePeople) {
		TableColumn<Disposition, Person> personCol = new TableColumn<>(PERSON_COLUMN_TITLE);
		personCol.setCellValueFactory(cellData -> new SimpleObjectProperty<>(cellData.getValue().getPerson()));
		personCol.setCellFactory(ComboBoxTableCell.forTableColumn(new PersonConverter(), availablePeople));
		personCol.setOnEditCommit(e -> {
			if (!getItems().contains(new Disposition(e.getNewValue(), e.getRowValue().getLocation(), e.getRowValue().getFrom(), e
					.getRowValue().getTo()))) {
				ObservableList<Disposition> items = e.getTableView().getItems();
				int index = e.getTablePosition().getRow();

				items.get(index).setPerson(e.getNewValue());
				// hack to fire list change
				items.add(index, items.remove(index));
			} else {
				showIntegrityWarning();
				refresh();
			}
		});

		getColumns().add(personCol);
		return this;
	}

	public DispositionTableView withFromSelectionColumn() {
		TableColumn<Disposition, LocalTime> fromCol = new TableColumn<>(FROM_COLUMN_TITLE);
		fromCol.setCellValueFactory(cellData -> new SimpleObjectProperty<>(cellData.getValue().getFrom()));
		fromCol.setCellFactory(ComboBoxTableCell.forTableColumn(new LocalTimeStringConverter(FormatStyle.SHORT), FXCollections
				.observableArrayList(HOURS)));
		fromCol.setOnEditCommit(e -> {
			boolean commit = true;

			// From has to be lower than to
			if (e.getNewValue().isAfter(e.getRowValue().getTo()) || e.getNewValue().equals(e.getRowValue().getTo())) {
				commit = false;
				showWrongTimeSelection(e.getNewValue(), e.getRowValue().getTo());
			}

			// row exists in table
			if (getItems().contains(new Disposition(e.getRowValue().getPerson(), e.getRowValue().getLocation(), e.getNewValue(), e
					.getRowValue().getTo()))) {
				commit = false;
				showIntegrityWarning();
			}

			if (commit) {
				ObservableList<Disposition> items = e.getTableView().getItems();
				int index = e.getTablePosition().getRow();

				items.get(index).setFrom(e.getNewValue());
				// hack to fire list change
				items.add(index, items.remove(index));
			} else {
				refresh();
			}
		});

		getColumns().add(fromCol);
		return this;
	}

	public DispositionTableView withToSelectionColumn() {
		TableColumn<Disposition, LocalTime> toCol = new TableColumn<>(TO_COLUMN_TITLE);
		toCol.setCellValueFactory(cellData -> new SimpleObjectProperty<>(cellData.getValue().getTo()));
		toCol.setCellFactory(ComboBoxTableCell.forTableColumn(new LocalTimeStringConverter(FormatStyle.SHORT), FXCollections
				.observableArrayList(HOURS)));
		toCol.setOnEditCommit(e -> e.getTableView().getItems().get(e.getTablePosition().getRow()).setTo(e.getNewValue()));

		toCol.setOnEditCommit(e -> {
			boolean commit = true;

			// To has to be grater than from
			if (e.getNewValue().isBefore(e.getRowValue().getFrom()) || e.getNewValue().equals(e.getRowValue().getFrom())) {
				commit = false;
				showWrongTimeSelection(e.getRowValue().getFrom(), e.getNewValue());
			}

			// row exists in table
			if (getItems().contains(new Disposition(e.getRowValue().getPerson(), e.getRowValue().getLocation(), e.getRowValue().getFrom()
					, e.getNewValue()))) {
				commit = false;
				showIntegrityWarning();
			}

			if (commit) {
				ObservableList<Disposition> items = e.getTableView().getItems();
				int index = e.getTablePosition().getRow();

				items.get(index).setTo(e.getNewValue());
				// hack to fire list change
				items.add(index, items.remove(index));
			} else {
				refresh();
			}
		});

		getColumns().add(toCol);
		return this;
	}

	private void showIntegrityWarning() {
		log.warn("The person is already planned for this time and location.");
		showWarning("The person is already planned for this time and location.");
	}

	private void showWrongTimeSelection(LocalTime from, LocalTime to) {
		FormattingTuple message = MessageFormatter.format("The timespan {} to {} is invalid", from, to);
		log.warn(message.getMessage());
		showWarning(message.getMessage());
	}

	private void showWarning(String message) {
		Alert alert = new Alert(AlertType.WARNING);
		alert.setTitle(LABEL_WARNING);
		alert.setHeaderText(message);
		alert.show();
	}

	private void dragDropped(DragEvent event) {
		Object content = event.getDragboard().getContent(SERIALIZED_MIME_TYPE);
		if (!(event.getGestureSource() instanceof TableRow) || !(content instanceof Disposition)) {
			return;
		}

		Disposition sourceDispo = (Disposition) content;
		// set location of target table
		Disposition targetDispo = new Disposition(sourceDispo.getPerson(), location, sourceDispo.getFrom(), sourceDispo.getTo());
		if (getItems().contains(targetDispo)) {
			showIntegrityWarning();
			return;
		}

		((TableRow) event.getGestureSource()).getTableView().getItems().remove(sourceDispo);
		getItems().add(targetDispo);

		event.setDropCompleted(true);
		getSelectionModel().select(targetDispo);
		event.consume();
	}

	private void dragOver(DragEvent event) {
		if (!(event.getGestureSource() instanceof TableRow) || currentDragAndDrop || !(event
				.getDragboard().getContent(SERIALIZED_MIME_TYPE) instanceof
				Disposition)) {
			return;
		}

		event.acceptTransferModes(TransferMode.MOVE);
		event.consume();
	}
}