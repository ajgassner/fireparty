import pdfMake from "pdfmake/build/pdfmake";
import vfs from "pdfmake/build/vfs_fonts";
import type { Content, TDocumentDefinitions } from "pdfmake/interfaces";
import { formatRange } from "../domain/time";
import type { Plan } from "../domain/types";
import { buildLocationLists } from "./matrix";

pdfMake.addVirtualFileSystem(vfs);

export async function exportPdf(plan: Plan): Promise<Blob> {
	const lists = buildLocationLists(plan);

	const body: Content[][] = lists.flatMap(({ location, entries }) => [
		[
			{ text: location.name, bold: true, fillColor: "#eeeeee" },
			{ text: "", fillColor: "#eeeeee" },
		],
		...entries.map((e) => [formatRange(e.from, e.to), e.person]),
	]);

	const definition: TDocumentDefinitions = {
		pageSize: "A4",
		pageMargins: 30,
		info: { title: plan.name || "FireParty", creator: "FireParty" },
		defaultStyle: { fontSize: 10 },
		content: [
			...(plan.name ? [{ text: plan.name, fontSize: 14, bold: true, margin: [0, 0, 0, 10] } as Content] : []),
			lists.length
				? { table: { headerRows: 0, widths: [100, "*"], body, dontBreakRows: true } }
				: { text: "Keine Daten vorhanden" },
		],
	};

	return pdfMake.createPdf(definition).getBlob();
}
