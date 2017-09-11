package at.agsolutions.fireparty.ui;

import at.agsolutions.fireparty.domain.Disposition;
import javafx.beans.property.SimpleObjectProperty;
import javafx.collections.ObservableList;
import javafx.scene.control.*;
import javafx.scene.layout.Priority;
import javafx.scene.layout.VBox;
import javafx.scene.paint.Color;
import org.apache.commons.lang3.StringUtils;
import org.kordamp.ikonli.fontawesome.FontAwesome;
import org.kordamp.ikonli.javafx.FontIcon;

import java.util.HashMap;
import java.util.Map;
import java.util.function.BiConsumer;
import java.util.function.Function;

public class SidebarEditor<T> extends VBox {

	private static final String COL_NAME = "Name";
	private static final String ADD = "Add";
	private static final String REMOVE = "Remove";
	private static final String EDIT = "Edit";

	private static final String ADD_DIALOG_HEADER = "Please enter a name";
	private static final String ADD_DIALOG_TITLE = "Add ";
	private static final String EDIT_DIALOG_TITLE = "Edit ";
	private static final String ADD_DIALOG_LABEL = "Name:";

	private static final String TOOLTIP_SEPARATOR = " <-> ";

	private final String label;
	private final BiConsumer<T, String> objectModifier;
	private Function<String, T> stringToObject;
	private Function<T, String> objectToString;
	private final ObservableList<T> data;
	private TableView<T> table;
	private Button remove;
	private Button edit;

	private Map<Disposition, Disposition> invalidData = new HashMap<>();

	public SidebarEditor(ObservableList<T> data, String label, Function<String, T> stringToObject, Function<T, String> objectToString,
						 BiConsumer<T, String> objectModifier) {
		this.data = data;
		this.label = label;
		this.stringToObject = stringToObject;
		this.objectToString = objectToString;
		this.objectModifier = objectModifier;

		initToolbar();
		initTable();
	}

	public void setInvalidData(final Map<Disposition, Disposition> invalidData) {
		this.invalidData = invalidData;
	}

	public void refresh() {
		table.refresh();
	}

	private void initToolbar() {
		Button add = new Button(ADD);
		add.setGraphic(new FontIcon(FontAwesome.PLUS_SQUARE));
		add.setOnAction(e -> {
			TextInputDialog dialog = new TextInputDialog();
			dialog.setTitle(ADD_DIALOG_TITLE + label);
			dialog.setHeaderText(ADD_DIALOG_HEADER);
			dialog.setContentText(ADD_DIALOG_LABEL);

			dialog.showAndWait().ifPresent(name -> data.add(stringToObject.apply(name)));
		});

		edit = new Button(EDIT);
		edit.setGraphic(new FontIcon(FontAwesome.EDIT));
		edit.setDisable(true);
		edit.setOnAction(e -> {
			TextInputDialog dialog = new TextInputDialog();
			dialog.setTitle(EDIT_DIALOG_TITLE + objectToString.apply(table.getSelectionModel().getSelectedItem()));
			dialog.setHeaderText(ADD_DIALOG_HEADER);
			dialog.setContentText(ADD_DIALOG_LABEL);

			dialog.showAndWait().ifPresent(name -> {
				objectModifier.accept(table.getSelectionModel().getSelectedItem(), name);
				table.refresh();
			});
		});

		remove = new Button(REMOVE);
		remove.setGraphic(new FontIcon(FontAwesome.TRASH));
		remove.setDisable(true);
		remove.setOnAction(e -> data.remove(table.getSelectionModel().getSelectedItem()));

		ToolBar toolbar = new ToolBar();
		toolbar.setStyle("-fx-background-color:transparent;");
		toolbar.getItems().addAll(add, edit, remove);

		getChildren().add(toolbar);
	}

	private void initTable() {
		TableColumn<T, String> nameCol = new TableColumn<>(COL_NAME);
		nameCol.setCellValueFactory(cellData -> new SimpleObjectProperty<>(objectToString.apply(cellData.getValue())));
		nameCol.setCellFactory(column -> new TableCell<T, String>() {
			@Override
			protected void updateItem(String item, boolean empty) {
				super.updateItem(item, empty);

				Map<String, String> addedItems = new HashMap<>();
				StringBuilder tooltipText = new StringBuilder();

				invalidData.keySet().forEach(key -> {
					if (key.getPerson().nameProperty().getValue().equals(item)) {
						setTextFill(Color.RED);

						String fromLocation = key.getLocation().nameProperty().getValue();
						String toLocation = invalidData.get(key).getLocation().nameProperty().getValue();
						if (addedItems.get(fromLocation) != null && addedItems.get(fromLocation).equals(toLocation)) {
							// already added to tooltip
							return;
						}

						tooltipText.append(fromLocation);
						tooltipText.append(TOOLTIP_SEPARATOR);
						tooltipText.append(toLocation);
						tooltipText.append(StringUtils.LF);

						addedItems.put(fromLocation, toLocation);
					}
				});

				String toolTip = tooltipText.toString();
				if (!toolTip.equals(StringUtils.EMPTY)) {
					setTooltip(new Tooltip(toolTip));
				}
				setText(item);
			}
		});

		table = new TableView<>();
		table.setItems(data);
		table.getColumns().add(nameCol);
		setVgrow(table, Priority.ALWAYS);

		table.getSelectionModel().selectedItemProperty().addListener((obs, oldSelection, newSelection) -> {
			boolean disable = newSelection == null;
			remove.setDisable(disable);
			edit.setDisable(disable);
		});

		getChildren().add(table);
	}
}
