import { createPlan, newId } from "../domain/plan";
import type { Plan } from "../domain/types";

export function createExamplePlan(): Plan {
	const people = ["Berger Anna", "Huber Stefan", "Maier Lisa", "Wagner Thomas", "Gruber Eva", "Pichler Markus"].map(
		(name) => ({ id: newId(), name }),
	);
	const locations = ["Schank", "Grill", "Kassa", "Bar"].map((name) => ({ id: newId(), name }));
	const [anna, stefan, lisa, thomas, eva, markus] = people;
	const [schank, grill, kassa, bar] = locations;

	const shift = (person: (typeof people)[number], location: (typeof locations)[number], from: number, to: number) => ({
		id: newId(),
		personId: person.id,
		locationId: location.id,
		from,
		to,
	});

	return {
		...createPlan("Sommerfest (Beispiel)"),
		startHour: 16,
		endHour: 28,
		people,
		locations,
		shifts: [
			shift(anna, schank, 17, 21),
			shift(stefan, schank, 21, 25),
			shift(lisa, grill, 17, 20),
			shift(thomas, grill, 20, 23),
			shift(eva, kassa, 17, 22),
			shift(markus, kassa, 22, 26),
			shift(anna, bar, 20, 23),
			shift(lisa, bar, 23, 27),
		],
	};
}
