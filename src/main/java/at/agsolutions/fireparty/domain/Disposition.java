package at.agsolutions.fireparty.domain;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalTime;

@Data
@AllArgsConstructor
public class Disposition implements Serializable {
	private static final long serialVersionUID = 1L;

	private Person person;
	private Location location;
	private LocalTime from;
	private LocalTime to;
}
