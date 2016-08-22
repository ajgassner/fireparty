package at.agsolutions.fireparty;

import at.agsolutions.fireparty.service.IDataService;
import at.agsolutions.fireparty.service.IExportService;
import at.agsolutions.fireparty.service.impl.DataService;
import at.agsolutions.fireparty.service.impl.ExportService;
import com.google.inject.AbstractModule;

import javax.inject.Singleton;

public class FirePartyModule extends AbstractModule {

	@Override
	protected void configure() {
		bind(IDataService.class).to(DataService.class).in(Singleton.class);
		bind(IExportService.class).to(ExportService.class).in(Singleton.class);
	}
}
