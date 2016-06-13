package at.agsolutions.fireparty.service;

import at.agsolutions.fireparty.domain.Disposition;
import at.agsolutions.fireparty.domain.Location;
import at.agsolutions.fireparty.domain.Person;
import at.agsolutions.fireparty.domain.SerializableFileHolder;
import be.quodlibet.boxable.BaseTable;
import be.quodlibet.boxable.datatable.DataTable;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.common.PDRectangle;

import java.io.*;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.FormatStyle;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
public class DataService implements IDataService {

	private static final String SPACES = StringUtils.repeat(StringUtils.SPACE, 50);
	private static final int PDF_MARGIN = 30;
	private static final String TIME_SEPARATOR = " - ";

	private SerializableFileHolder data;

	@Override
	public List<Disposition> getDispositions() {
		return data != null ? data.getDispositions() : Collections.emptyList();
	}

	@Override
	public List<Person> getPeople() {
		return data != null ? data.getPeople() : Collections.emptyList();
	}

	@Override
	public List<Location> getLocations() {
		return data != null ? data.getLocations() : Collections.emptyList();
	}

	@Override
	public Map<Disposition, Disposition> computeOverlaps(final List<Disposition> dispositions) {
		Map<Disposition, Disposition> result = new HashMap<>();

		for (Disposition analyzedDispo : dispositions) {
			for (Disposition currentDispo : dispositions) {
				if (analyzedDispo.equals(currentDispo) || !Objects.equals(currentDispo.getPerson(), analyzedDispo.getPerson())) {
					continue;
				}

				if (intersects(analyzedDispo.getFrom(), analyzedDispo.getTo(), currentDispo.getFrom(), currentDispo.getTo())) {
					result.put(analyzedDispo, currentDispo);
				}
			}
		}

		log.debug("Computed overlaps");
		return result;
	}

	@Override
	public void save(File file, SerializableFileHolder object) throws IOException {
		try (ObjectOutput output = new ObjectOutputStream(new FileOutputStream(file))) {
			output.writeObject(object);
		} catch (IOException ex) {
			log.error("Cannot perform save of {} with {}", file, object, ex);
			throw ex;
		}
	}

	@Override
	public void load(File file) throws IOException, ClassNotFoundException {
		try (ObjectInput input = new ObjectInputStream(new FileInputStream(file))) {
			data = (SerializableFileHolder) input.readObject();
		} catch (ClassNotFoundException | IOException ex) {
			log.error("Cannot perform load of {}", file, ex);
			throw ex;
		}
	}

	@Override
	public void generatePdf(final List<Disposition> dispositions, final File file) throws IOException {
		DateTimeFormatter formatter = DateTimeFormatter.ofLocalizedTime(FormatStyle.SHORT);

		List<List> tableData = new ArrayList<>();
		dispositions.stream().map(Disposition::getLocation).collect(Collectors.toCollection(TreeSet::new)).forEach(l -> {
			tableData.add(new ArrayList<>(Arrays.asList(l.getName(), SPACES)));
			dispositions.stream().filter(d -> d.getLocation().equals(l)).sorted((d1, d2) -> d1.getFrom().compareTo(d2.getFrom()))
					.forEach(d -> tableData.add(new ArrayList<>(Arrays.asList(d.getFrom().format(formatter) + TIME_SEPARATOR + d.getTo()
							.format(formatter), d.getPerson().getName()))));
		});

		try (PDDocument doc = new PDDocument()) {
			PDPage page = new PDPage();
			page.setMediaBox(new PDRectangle(PDRectangle.A4.getWidth(), PDRectangle.A4.getHeight()));
			doc.addPage(page);

			float tableWidth = page.getMediaBox().getWidth() - (2 * PDF_MARGIN);
			float yStartNewPage = page.getMediaBox().getHeight() - (2 * PDF_MARGIN);
			BaseTable dataTable = new BaseTable(yStartNewPage, yStartNewPage, PDF_MARGIN, tableWidth, PDF_MARGIN, doc, page, true, true);
			DataTable t = new DataTable(dataTable, page);
			t.addListToTable(tableData, DataTable.NOHEADER);
			dataTable.draw();

			doc.save(file);
			log.info("Generated PDF successfully");
		} catch (IOException e) {
			log.error("Failed to generate PDF {} with data {}", dispositions, file, e);
			throw e;
		}
	}

	private boolean intersects(LocalTime fromA, LocalTime toA, LocalTime fromB, LocalTime toB) {
		return (fromA.isBefore(toB) || fromA.equals(toB)) && (toA.isAfter(fromB) || toA.equals(fromB));
	}
}