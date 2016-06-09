package at.agsolutions.fireparty;

import at.agsolutions.fireparty.service.*;
import com.google.inject.AbstractModule;

public class FirePartyModule extends AbstractModule {
	@Override
	protected void configure() {
		bind(IDataService.class).to(DataService.class);
	}
}
