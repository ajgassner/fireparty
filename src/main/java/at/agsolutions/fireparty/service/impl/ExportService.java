package at.agsolutions.fireparty.service.impl;

import at.agsolutions.fireparty.domain.Disposition;
import at.agsolutions.fireparty.domain.PartyHour;
import at.agsolutions.fireparty.service.IExportService;
import be.quodlibet.boxable.BaseTable;
import be.quodlibet.boxable.datatable.DataTable;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.WorkbookUtil;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
public class ExportService implements IExportService {

	private static final String SPACES = StringUtils.repeat(StringUtils.SPACE, 50);
	private static final int PDF_MARGIN = 30;
	private static final String TIME_SEPARATOR = " - ";

	@Override
	public void exportPdf(final List<Disposition> dispositions, final File file) throws IOException {
		List<List> tableData = new ArrayList<>();
		dispositions.stream().map(Disposition::getLocation).collect(Collectors.toCollection(TreeSet::new)).forEach(l -> {
			tableData.add(new ArrayList<>(Arrays.asList(l.getName(), SPACES)));
			dispositions.stream().filter(d -> d.getLocation().equals(l)).sorted((d1, d2) -> d1.getFrom().compareTo(d2.getFrom()))
					.forEach(d -> tableData.add(new ArrayList<>(Arrays.asList(d.getFrom().format(PartyHour.FORMATTER) + TIME_SEPARATOR + d
							.getTo()
							.format(PartyHour.FORMATTER), d.getPerson().getName()))));
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

	@Override
	public void exportExcel(final List<Disposition> dispositions, final File file) throws IOException {
		try (Workbook workBook = new XSSFWorkbook(); FileOutputStream outputStream = new FileOutputStream(file)) {
			Sheet sheet = workBook.createSheet(WorkbookUtil.createSafeSheetName("Dispositions"));

			//sheet.setDisplayGridlines(false);
			//sheet.setPrintGridlines(false);
			sheet.setFitToPage(true);
			sheet.setHorizontallyCenter(true);
			PrintSetup printSetup = sheet.getPrintSetup();
			printSetup.setLandscape(true);
			printSetup.setPaperSize(PrintSetup.A4_PAPERSIZE);

			SortedSet<PartyHour> hours = new TreeSet<>();
			dispositions.forEach(d -> {
				hours.add(d.getFrom());
				hours.add(d.getTo());
			});

			Row headerRow = sheet.createRow(0);
			int columnIndex = 0;
			PartyHour last;
			PartyHour current;

			try {
				last = hours.last();
				current = hours.first();
			} catch (NoSuchElementException e) {
				log.warn("Aborting generation of Excel. No data available");
				workBook.write(outputStream);
				return;
			}

			while (current.isBefore(last)) {
				PartyHour nextHour = current.addHours(1);
				Cell cell = headerRow.createCell(columnIndex);
				cell.setCellValue(current.toString() + TIME_SEPARATOR + nextHour);
				current = nextHour;
				columnIndex++;
			}

			// TODO: to be done

			workBook.write(outputStream);
		}
	}
}
