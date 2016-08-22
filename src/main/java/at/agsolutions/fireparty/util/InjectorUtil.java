package at.agsolutions.fireparty.util;

import at.agsolutions.fireparty.FirePartyApplication;

public class InjectorUtil {
	private InjectorUtil() {}

	public static void injectInto(Object object) {
		FirePartyApplication.getInjector().injectMembers(object);
	}
}
