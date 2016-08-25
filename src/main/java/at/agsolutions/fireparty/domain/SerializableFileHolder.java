package at.agsolutions.fireparty.domain;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.io.Serializable;
import java.util.List;

@Data
@AllArgsConstructor
public class SerializableFileHolder implements Serializable {
	private static final long serialVersionUID = 1L;

	private List<Person> people;
	private List<Location> locations;
	private List<Disposition> dispositions;

	private String sheetName;
}
