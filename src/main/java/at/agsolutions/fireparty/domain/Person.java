package at.agsolutions.fireparty.domain;

import lombok.AllArgsConstructor;
import lombok.Data;
import org.apache.commons.lang3.ObjectUtils;

import java.io.Serializable;

@Data
@AllArgsConstructor
public class Person implements Serializable, Comparable<Person> {
	private static final long serialVersionUID = 1L;

	private String name;

	@Override
	public int compareTo(final Person o) {
		return ObjectUtils.compare(getName(), o.getName());
	}
}
