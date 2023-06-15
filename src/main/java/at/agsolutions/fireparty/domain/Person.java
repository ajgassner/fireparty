package at.agsolutions.fireparty.domain;

import javafx.beans.property.SimpleStringProperty;
import org.apache.commons.lang3.ObjectUtils;

import java.beans.ConstructorProperties;
import java.util.Objects;

public class Person implements Comparable<Person> {

	private SimpleStringProperty name;

	@ConstructorProperties({"name"})
	public Person(final String name) {
		this.name = new SimpleStringProperty(name);
	}

	public SimpleStringProperty nameProperty() {
		return name;
	}

	public String getName() {
		return name.get();
	}

	@Override
	public int compareTo(final Person o) {
		return ObjectUtils.compare(nameProperty().getValue(), o.nameProperty().getValue());
	}

	@Override
	public boolean equals(final Object o) {
		if (this == o) return true;
		if (o == null || getClass() != o.getClass()) return false;
		final Person person = (Person) o;
		return Objects.equals(name.getValue(), person.name.getValue());
	}

	@Override
	public int hashCode() {
		return Objects.hash(name.getValue());
	}
}
