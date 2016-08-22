package at.agsolutions.fireparty.ui;

import javafx.scene.control.Alert;

public class MessageProvider {

	private static final String LABEL_WARNING = "Warning";
	private static final String LABEL_ERROR = "Error";

	private MessageProvider() {}

	public static void showWarning(String message) {
		Alert alert = new Alert(Alert.AlertType.WARNING);
		alert.setTitle(LABEL_WARNING);
		alert.setHeaderText(message);
		alert.show();
	}

	public static void showError(final String message) {
		Alert alert = new Alert(Alert.AlertType.ERROR);
		alert.setTitle(LABEL_ERROR);
		alert.setHeaderText(message);
		alert.show();
	}
}
