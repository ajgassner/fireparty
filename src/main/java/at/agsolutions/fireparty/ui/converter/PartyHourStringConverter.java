package at.agsolutions.fireparty.ui.converter;

import at.agsolutions.fireparty.domain.PartyHour;
import javafx.util.StringConverter;

public class PartyHourStringConverter extends StringConverter<PartyHour> {

	@Override
	public String toString(final PartyHour partyHour) {
		return partyHour.toString();
	}

	@Override
	public PartyHour fromString(final String partyHour) {
		return new PartyHour(Integer.valueOf(partyHour));
	}
}
