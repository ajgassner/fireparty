package at.agsolutions.fireparty.ui;

import at.agsolutions.fireparty.FirePartyApplication;
import at.agsolutions.fireparty.domain.DataFileHolder;
import at.agsolutions.fireparty.service.IDataService;
import at.agsolutions.fireparty.service.IExportService;
import at.agsolutions.fireparty.util.InjectorUtil;
import javafx.event.ActionEvent;
import javafx.scene.control.Menu;
import javafx.scene.control.MenuItem;
import javafx.stage.FileChooser;
import org.kordamp.ikonli.Ikon;
import org.kordamp.ikonli.fontawesome.FontAwesome;
import org.kordamp.ikonli.javafx.FontIcon;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.inject.Inject;
import java.io.File;
import java.util.ArrayList;
import java.util.function.Consumer;

public class FileMenu extends Menu {

	private static final Logger LOGGER = LoggerFactory.getLogger(FileMenu.class);

	private final IFileMenuListener listener;
	private IDataService dataService;
	private IExportService exportService;
	private final Model model;

	public FileMenu(Model model, IFileMenuListener listener) {
		super("File", new FontIcon(FontAwesome.FILE_O));

		InjectorUtil.injectInto(this);
		this.model = model;
		this.listener = listener;
		createMenuItems();
	}

	private void createMenuItems() {
		MenuItem exit = buildMenuItem("Exit application", FontAwesome.SIGN_OUT, e -> System.exit(0));

		MenuItem load = buildFileChooserMenuItem("Load data", FontAwesome.UPLOAD, "FireParty files (*.fp)", "*.fp", "Load data",
				fileChooser -> {
					File file = fileChooser.showOpenDialog(FirePartyApplication.getStage());
					if (file != null) {
						try {
							dataService.load(file);
						} catch (Exception e) {
							showAndLogError("Failed to load data", e);
						}
						listener.loadCompleted();
					}
				});

		MenuItem save = buildFileChooserMenuItem("Save data", FontAwesome.FLOPPY_O, "FireParty files (*.fp)", "*.fp", "Save data",
				fileChooser -> {
					File file = fileChooser.showSaveDialog(FirePartyApplication.getStage());
					if (file != null) {
						try {
							dataService.save(file, new DataFileHolder(
									new ArrayList<>(model.getPeople()),
									new ArrayList<>(model.getLocations()),
									model.extractDispositions(),
									model.sheetNameProperty().getValueSafe()));
						} catch (Exception e) {
							showAndLogError("Failed to save data", e);
						}
					}
				});

		MenuItem pdf = buildFileChooserMenuItem("Generate PDF", FontAwesome.FILE_PDF_O, "PDF files (*.pdf)", "*.pdf", "Save PDF",
				fileChooser -> {
					try {
						File file = fileChooser.showSaveDialog(FirePartyApplication.getStage());
						if (file != null) {
							exportService.exportPdf(model.extractDispositions(), file, model.sheetNameProperty().getValueSafe());
						}
					} catch (Exception ex) {
						showAndLogError("Failed to generate overview PDF", ex);
					}
				});

		MenuItem excel = buildFileChooserMenuItem("Generate Excel", FontAwesome.FILE_EXCEL_O, "Excel files (*.xlsx)", "*.xlsx",
				"Save Excel", fileChooser -> {
					try {
						File file = fileChooser.showSaveDialog(FirePartyApplication.getStage());
						if (file != null) {
							exportService.exportExcel(model.extractDispositions(true /* unallocated people */), file, model
									.sheetNameProperty().getValueSafe());
						}
					} catch (Exception ex) {
						showAndLogError("Failed to generate overview Excel", ex);
					}
				});

		getItems().addAll(save, load, pdf, excel, exit);
	}

	private MenuItem buildMenuItem(final String label, final Ikon icon, final Consumer<ActionEvent> action) {
		MenuItem item = new MenuItem(label);
		item.setGraphic(new FontIcon(icon));
		item.setOnAction(action::accept);
		return item;
	}

	private MenuItem buildFileChooserMenuItem(final String label, final Ikon icon, final String extensionDescription, final String
			extensionFilter, final String chooserTitle, final Consumer<FileChooser> action) {
		return buildMenuItem(label, icon, e -> {
			FileChooser fileChooser = new FileChooser();
			fileChooser.getExtensionFilters().add(new FileChooser.ExtensionFilter(extensionDescription, extensionFilter));
			fileChooser.setTitle(chooserTitle);
			fileChooser.setInitialFileName(model.sheetNameProperty().getValueSafe());
			action.accept(fileChooser);
		});
	}

	private void showAndLogError(String message, Throwable throwable) {
		LOGGER.error(message, throwable);
		MessageProvider.showError(message);
	}

	@Inject
	public void setDataService(final IDataService dataService) {
		this.dataService = dataService;
	}

	@Inject
	public void setExportService(final IExportService exportService) {
		this.exportService = exportService;
	}

	public interface IFileMenuListener {
		void loadCompleted();
	}
}
