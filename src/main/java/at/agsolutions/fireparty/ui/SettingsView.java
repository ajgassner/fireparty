package at.agsolutions.fireparty.ui;

import javafx.geometry.Insets;
import javafx.scene.control.Label;
import javafx.scene.control.TextField;
import javafx.scene.layout.GridPane;
import javafx.scene.layout.Priority;

public class SettingsView extends GridPane {

	private static final String SHEET_NAME = "Sheet name";
	private static final int SPACING = 10;

	private final Model model;

	public SettingsView(Model model) {
		this.model = model;
		initView();
	}

	private void initView() {
		setHgap(SPACING);
		setVgap(SPACING);
		setPadding(new Insets(SPACING));

		TextField sheetName = new TextField();
		sheetName.textProperty().bindBidirectional(model.getSheetName());

		final Label sheetNameLabel = new Label(SHEET_NAME);
		sheetNameLabel.setLabelFor(sheetName);

		add(sheetNameLabel, 0, 0);
		setHgrow(sheetName, Priority.ALWAYS);
		add(sheetName, 1, 0);
	}

}
