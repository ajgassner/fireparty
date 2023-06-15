package at.agsolutions.fireparty.service;

import at.agsolutions.fireparty.domain.Disposition;
import at.agsolutions.fireparty.domain.Location;
import at.agsolutions.fireparty.domain.Person;
import at.agsolutions.fireparty.domain.DataFileHolder;

import java.io.*;
import java.util.List;
import java.util.Map;

public interface IDataService {
	List<Disposition> getDispositions();

	List<Person> getPeople();

	List<Location> getLocations();

	Map<Disposition, Disposition> computeOverlaps(List<Disposition> dispositions);

	void save(File file, DataFileHolder object) throws IOException;

	void load(File file) throws IOException;

	String getSheetName();
}
