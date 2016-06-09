package at.agsolutions.fireparty;

import at.agsolutions.fireparty.ui.RootPane;
import com.google.inject.Guice;
import com.google.inject.Injector;
import javafx.application.Application;
import javafx.scene.Scene;
import javafx.stage.Stage;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public class FirePartyApplication extends Application {

	private static Stage stage;

	private static final String APP_TITLE = "FireParty Planner";
	private static final int APP_WIDTH = 800;
	private static final int APP_HEIGHT = 600;

	public static void main(String[] args) {
		launch(args);
	}

	@Override
	public void start(final Stage primaryStage) throws Exception {
		log.info("Starting application");
		stage = primaryStage;
		primaryStage.setTitle(APP_TITLE);

		Injector injector = Guice.createInjector(new FirePartyModule());

		primaryStage.setScene(new Scene(injector.getInstance(RootPane.class), APP_WIDTH, APP_HEIGHT));
		primaryStage.show();
	}

	public static Stage getStage() {
		return stage;
	}
}
