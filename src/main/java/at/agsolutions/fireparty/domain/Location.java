package at.agsolutions.fireparty.domain;

import javafx.beans.property.SimpleStringProperty;
import org.apache.commons.lang3.ObjectUtils;

import java.io.Serializable;
import java.util.Objects;

public class Location implements Serializable, Comparable<Location> {
	private static final long serialVersionUID = 1L;

	private SimpleStringProperty name;

	public Location(final SimpleStringProperty name) {
		this.name = name;
	}

	public SimpleStringProperty nameProperty() {
		return name;
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
