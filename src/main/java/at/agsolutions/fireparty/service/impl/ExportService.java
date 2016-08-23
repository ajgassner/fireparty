package at.agsolutions.fireparty.service.impl;

import at.agsolutions.fireparty.domain.Disposition;
import at.agsolutions.fireparty.domain.PartyHour;
import at.agsolutions.fireparty.domain.Person;
import at.agsolutions.fireparty.service.IExportService;
import be.quodlibet.boxable.BaseTable;
import be.quodlibet.boxable.datatable.DataTable;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.poi.POIXMLProperties;
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
		try (XSSFWorkbook workBook = new XSSFWorkbook(); FileOutputStream outputStream = new FileOutputStream(file)) {
			Sheet sheet = workBook.createSheet(WorkbookUtil.createSafeSheetName("Dispositions"));

			sheet.setPrintGridlines(false);
			sheet.setFitToPage(true);
			sheet.setHorizontallyCenter(true);

			PrintSetup printSetup = sheet.getPrintSetup();
			printSetup.setLandscape(true);
			printSetup.setPaperSize(PrintSetup.A4_PAPERSIZE);

			POIXMLProperties xmlProps = workBook.getProperties();
			POIXMLProperties.CoreProperties coreProps = xmlProps.getCoreProperties();
			coreProps.setCreator("FireParty");

			SortedSet<PartyHour> hours = new TreeSet<>();
			dispositions.forEach(d -> {
				hours.add(d.getFrom());
				hours.add(d.getTo());
			});

			PartyHour last;
			PartyHour current;

			try {
				last = hours.last();
				current = hours.first();
			} catch (NoSuchElementException e) {
				log.warn("Aborting generation of Excel. No data available");
				Cell cell = sheet.createRow(0).createCell(0);
				cell.setCellValue("No data available");
				workBook.write(outputStream);
				return;
			}

			Font font = workBook.createFont();
			font.setFontHeightInPoints((short)10);
			font.setFontName("Arial");
			font.setBold(false);

			Font fontRed = workBook.createFont();
			fontRed.setFontHeightInPoints((short)10);
			fontRed.setFontName("Arial");
			fontRed.setBold(false);
			fontRed.setItalic(true);
			fontRed.setColor(IndexedColors.RED.getIndex());

			Font fontBold = workBook.createFont();
			fontBold.setFontHeightInPoints((short)10);
			fontBold.setFontName("Arial");
			fontBold.setBold(true);

			CellStyle cellStyle = workBook.createCellStyle();
			cellStyle.setBorderBottom(CellStyle.BORDER_THIN);
			cellStyle.setBorderTop(CellStyle.BORDER_THIN);
			cellStyle.setFont(font);

			CellStyle boldCellStyle = workBook.createCellStyle();
			boldCellStyle.cloneStyleFrom(cellStyle);
			boldCellStyle.setFont(fontBold);

			CellStyle cellStyleGray = workBook.createCellStyle();
			cellStyleGray.cloneStyleFrom(cellStyle);
			cellStyleGray.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
			cellStyleGray.setFillPattern(CellStyle.SOLID_FOREGROUND);

			CellStyle cellStyleGrayBold = workBook.createCellStyle();
			cellStyleGrayBold.cloneStyleFrom(cellStyleGray);
			cellStyleGrayBold.setFont(fontBold);

			CellStyle cellStyleYellowBold = workBook.createCellStyle();
			cellStyleYellowBold.cloneStyleFrom(cellStyleGrayBold);
			cellStyleYellowBold.setFillForegroundColor(IndexedColors.YELLOW.getIndex());

			CellStyle cellStyleRed = workBook.createCellStyle();
			cellStyleRed.cloneStyleFrom(cellStyle);
			cellStyleRed.setFont(fontRed);

			CellStyle cellStyleGrayRed = workBook.createCellStyle();
			cellStyleGrayRed.cloneStyleFrom(cellStyleGray);
			cellStyleGrayRed.setFont(fontRed);

			int rowIndex = 0;
			int columnIndex = 1;
			Row headerRow = sheet.createRow(rowIndex);
			headerRow.setRowStyle(cellStyleYellowBold);

			Map<Integer, PartyHour> times = new HashMap<>();

			while (current.isBefore(last)) {
				PartyHour nextHour = current.addHours(1);
				Cell cell = headerRow.createCell(columnIndex);
				cell.setCellValue(current.getHour() + "-" + nextHour.getHour() + "h");
				cell.setCellStyle(cellStyleYellowBold);
				times.put(columnIndex, current);
				current = nextHour;
				columnIndex++;
			}

			Map<Person, List<Disposition>> persons = dispositions.stream().collect(Collectors.groupingBy(Disposition::getPerson,
					TreeMap::new, Collectors.toList()));

			rowIndex++;
			for (Person person : persons.keySet()) {
				columnIndex = 0;
				Row row = sheet.createRow(rowIndex);
				if (rowIndex % 2 == 0) {
					row.setRowStyle(cellStyleGray);
				} else {
					row.setRowStyle(cellStyle);
				}
				Cell cell = row.createCell(columnIndex);
				cell.setCellValue(person.getName());

				if (rowIndex % 2 == 0) {
					cell.setCellStyle(cellStyleGrayBold);
				} else {
					cell.setCellStyle(boldCellStyle);
				}

				for (Integer index : times.keySet()) {
					PartyHour columnTime = times.get(index);
					List<Disposition> dispos = persons.get(person);

					String value = "";
					int count = 0;
					for (Disposition dispo : dispos) {
						if ((columnTime.equals(dispo.getFrom()) || columnTime.isAfter(dispo.getFrom())) && columnTime.isBefore(dispo.getTo
								())) {
							if (count > 0) {
								value += " / ";
							}
							value += dispo.getLocation().getName();
							count++;
						}
					}

					cell = row.createCell(index);
					cell.setCellValue(value);
					boolean even = rowIndex % 2 == 0;
					if (even && count > 1) {
						cell.setCellStyle(cellStyleGrayRed);
					} else if (!even && count > 1) {
						cell.setCellStyle(cellStyleRed);
					} else if (even && count <= 1) {
						cell.setCellStyle(cellStyleGray);
					} else {
						cell.setCellStyle(cellStyle);
					}
				}

				rowIndex++;
			}

			columnIndex = 1;
			current = hours.first();
			Row row = sheet.createRow(rowIndex);
			row.setRowStyle(cellStyleYellowBold);
			sheet.autoSizeColumn(0);

			while (current.isBefore(last)) {
				PartyHour nextHour = current.addHours(1);
				Cell cell = row.createCell(columnIndex);
				cell.setCellValue(current.getHour() + "-" + nextHour.getHour() + "h");
				cell.setCellStyle(cellStyleYellowBold);
				sheet.autoSizeColumn(columnIndex);

				current = nextHour;
				columnIndex++;
			}

			workBook.write(outputStream);
		}
	}
}
