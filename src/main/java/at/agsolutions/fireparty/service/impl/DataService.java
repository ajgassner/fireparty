package at.agsolutions.fireparty.service.impl;

import at.agsolutions.fireparty.domain.DataFileHolder;
import at.agsolutions.fireparty.domain.Disposition;
import at.agsolutions.fireparty.domain.Location;
import at.agsolutions.fireparty.domain.Person;
import at.agsolutions.fireparty.service.IDataService;
import at.agsolutions.fireparty.util.TimeUtil;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.File;
import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;

public class DataService implements IDataService {

	private static final Logger LOGGER = LoggerFactory.getLogger(DataService.class);
	private final ObjectMapper objectMapper = new ObjectMapper();

	private DataFileHolder data;

	@Override
	public List<Disposition> getDispositions() {
		return data != null ? data.getDispositions() : Collections.emptyList();
	}

	@Override
	public List<Person> getPeople() {
		return data != null ? data.getPeople() : Collections.emptyList();
	}

	@Override
	public List<Location> getLocations() {
		return data != null ? data.getLocations() : Collections.emptyList();
	}

	@Override
	public String getSheetName() {
		return data != null ? data.getSheetName() : "";
	}

	@Override
	public Map<Disposition, Disposition> computeOverlaps(final List<Disposition> dispositions) {
		Map<Disposition, Disposition> result = new HashMap<>();

		for (Disposition analyzedDispo : dispositions) {
			for (Disposition currentDispo : dispositions) {
				if (analyzedDispo.equals(currentDispo) || !Objects.equals(currentDispo.getPerson(), analyzedDispo.getPerson())) {
					continue;
				}

				if (TimeUtil.intersects(analyzedDispo.getFrom(), analyzedDispo.getTo(), currentDispo.getFrom(), currentDispo.getTo())) {
					result.put(analyzedDispo, currentDispo);
				}
			}
		}

		LOGGER.debug("Computed overlaps");
		return result;
	}

	@Override
	public void save(File file, DataFileHolder object) throws IOException {
		try {
			objectMapper.writeValue(file, object);
		} catch (IOException ex) {
			LOGGER.error("Cannot perform save of {} with {}", file, object, ex);
			throw ex;
		}
	}

	@Override
	public void load(File file) throws IOException {
		try {
			DataFileHolder tempData = objectMapper.readValue(file, DataFileHolder.class);
			// map people and locations to same objects
			data = new DataFileHolder(
					tempData.getPeople(),
					tempData.getLocations(),
					tempData.getDispositions().stream().map(dispo -> new Disposition(
							tempData.getPeople().stream().filter(person -> person.getName().equals(dispo.getPerson().getName())).findFirst().get(),
							tempData.getLocations().stream().filter(loc -> loc.getName().equals(dispo.getLocation().getName())).findFirst().get(),
							dispo.getFrom(),
							dispo.getTo()
					)).collect(Collectors.toList()), tempData.getSheetName());
		} catch (IOException ex) {
			LOGGER.error("Cannot perform load of {}", file, ex);
			throw ex;
		}
	}
}
