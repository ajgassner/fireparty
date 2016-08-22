package at.agsolutions.fireparty.ui.converter;

import at.agsolutions.fireparty.domain.Person;
import javafx.util.StringConverter;
import org.apache.commons.lang3.StringUtils;

public class PersonConverter extends StringConverter<Person> {

	@Override
	public String toString(final Person person) {
		return person == null ? StringUtils.EMPTY : person.getName();
	}

	@Override
	public Person fromString(final String name) {
		return new Person(name);
	}
}
