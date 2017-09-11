package at.agsolutions.fireparty;

import at.agsolutions.fireparty.ui.RootPane;
import com.google.inject.Guice;
import com.google.inject.Injector;
import javafx.application.Application;
import javafx.scene.Scene;
import javafx.scene.image.Image;
import javafx.stage.Stage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Arrays;

public class FirePartyApplication extends Application {

	private static final Logger LOGGER = LoggerFactory.getLogger(FirePartyApplication.class);

	private static Stage stage;
	private static Injector injector;

	private static final String APP_TITLE = "FireParty Planner";
	private static final String THREAD_NAME = "UI thread";
	private static final int APP_WIDTH = 800;
	private static final int APP_HEIGHT = 600;
	private static final String[] APP_ICONS = new String[]{
			"calendar_16.png",
			"calendar_24.png",
			"calendar_32.png",
			"calendar_64.png",
			"calendar_128.png"
	};

	public static void main(String[] args) {
		launch(args);
	}

	@Override
	public void start(final Stage primaryStage) throws Exception {
		Thread.currentThread().setName(THREAD_NAME);
		LOGGER.info("Starting application");

		stage = primaryStage;
		primaryStage.setTitle(APP_TITLE);
		Arrays.stream(APP_ICONS).forEach(iconName -> primaryStage.getIcons().add(new Image(FirePartyApplication.class.getResourceAsStream
				(iconName))));

		injector = Guice.createInjector(new FirePartyModule());

		primaryStage.setScene(new Scene(injector.getInstance(RootPane.class), APP_WIDTH, APP_HEIGHT));
		primaryStage.show();
	}

	public static Stage getStage() {
		return stage;
	}

	public static Injector getInjector() {
		return injector;
	}
}
