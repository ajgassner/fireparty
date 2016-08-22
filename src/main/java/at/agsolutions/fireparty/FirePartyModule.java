package at.agsolutions.fireparty;

import at.agsolutions.fireparty.service.IDataService;
import at.agsolutions.fireparty.service.IExportService;
import at.agsolutions.fireparty.service.impl.DataService;
import at.agsolutions.fireparty.service.impl.ExportService;
import com.google.inject.AbstractModule;

public class FirePartyModule extends AbstractModule {

	@Override
	protected void configure() {
		bind(IDataService.class).to(DataService.class);
		bind(IExportService.class).to(ExportService.class);
	}
}
