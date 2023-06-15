package at.agsolutions.fireparty.domain;

import javafx.beans.property.SimpleStringProperty;
import org.apache.commons.lang3.ObjectUtils;

import java.beans.ConstructorProperties;
import java.util.Objects;

public class Location implements Comparable<Location> {

	private SimpleStringProperty name;

	@ConstructorProperties({"name"})
	public Location(final String name) {
		this.name = new SimpleStringProperty(name);
	}

	public SimpleStringProperty nameProperty() {
		return name;
	}

	public String getName() {
		return name.get();
	}

	@Override
	public int compareTo(final Location o) {
		return ObjectUtils.compare(nameProperty().getValue(), o.nameProperty().getValue());
	}

	@Override
	public boolean equals(final Object o) {
		if (this == o) return true;
		if (o == null || getClass() != o.getClass()) return false;
		final Location location = (Location) o;
		return Objects.equals(name.getValue(), location.name.getValue());
	}

	@Override
	public int hashCode() {
		return Objects.hash(name.getValue());
	}
}
