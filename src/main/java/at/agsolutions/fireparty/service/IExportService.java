package at.agsolutions.fireparty.service;

import at.agsolutions.fireparty.domain.Disposition;

import java.io.File;
import java.io.IOException;
import java.util.List;

public interface IExportService {
	void exportPdf(List<Disposition> dispositions, File file) throws IOException;

	void exportExcel(List<Disposition> dispositions, File file) throws IOException;
}
