package at.agsolutions.fireparty.ui.converter;

import at.agsolutions.fireparty.domain.Person;
import javafx.beans.property.SimpleStringProperty;
import javafx.util.StringConverter;

public class PersonConverter extends StringConverter<Person> {

	@Override
	public String toString(final Person person) {
		return person.nameProperty().getValueSafe();
	}

	@Override
	public Person fromString(final String name) {
		return new Person(name);
	}
}
