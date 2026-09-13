import ExcelJS from "exceljs";
import { formatHourSlot } from "../domain/time";
import type { Plan, Shift } from "../domain/types";
import { buildMatrix } from "./matrix";

const FONT = { name: "Arial", size: 10 };
const BORDER: Partial<ExcelJS.Borders> = { top: { style: "thin" }, bottom: { style: "thin" } };
const fill = (argb: string): ExcelJS.Fill => ({ type: "pattern", pattern: "solid", fgColor: { argb } });
const GRAY = fill("FFD9D9D9");
const YELLOW = fill("FFFFFF00");

export async function exportExcel(
	plan: Plan,
	shifts: readonly Shift[],
	title: string,
	includeUnassigned: boolean,
): Promise<Blob> {
	const { hours, rows } = buildMatrix(plan, shifts, includeUnassigned);

	const workbook = new ExcelJS.Workbook();
	workbook.creator = "FireParty";
	const sheet = workbook.addWorksheet("Einteilung", {
		pageSetup: {
			paperSize: 9, // A4
			orientation: "landscape",
			fitToPage: true,
			fitToWidth: 1,
			fitToHeight: 0,
			horizontalCentered: true,
			showGridLines: false,
		},
	});

	const titleRow = sheet.addRow([title]);
	titleRow.height = 25;
	titleRow.getCell(1).font = { ...FONT, size: 12, bold: true };
	titleRow.getCell(1).alignment = { vertical: "middle" };

	if (hours.length === 0) {
		sheet.addRow(["Keine Daten vorhanden"]).getCell(1).font = FONT;
		return toBlob(workbook);
	}

	const addHeader = () => {
		const row = sheet.addRow(["", ...hours.map(formatHourSlot)]);
		row.eachCell({ includeEmpty: true }, (cell) => {
			cell.font = { ...FONT, bold: true };
			cell.fill = YELLOW;
			cell.border = BORDER;
		});
	};

	addHeader();
	rows.forEach(({ person, cells }, index) => {
		const striped = index % 2 === 0;
		const row = sheet.addRow([person.name, ...cells.map((names) => names.join(" / "))]);
		row.eachCell({ includeEmpty: true }, (cell, column) => {
			const conflict = column > 1 && cells[column - 2].length > 1;
			cell.font = { ...FONT, bold: column === 1, italic: conflict, color: conflict ? { argb: "FFFF0000" } : undefined };
			cell.border = BORDER;
			if (striped) cell.fill = GRAY;
		});
	});
	addHeader();

	sheet.addRow([]);
	sheet.addRow([`Erstellt: ${new Date().toLocaleString("de-AT")}`]).getCell(1).font = FONT;

	sheet.getColumn(1).width = Math.max(12, ...rows.map((r) => r.person.name.length + 2));
	hours.forEach((_, i) => {
		const longest = Math.max(0, ...rows.map((r) => r.cells[i].join(" / ").length));
		sheet.getColumn(i + 2).width = Math.max(8, longest + 2);
	});

	return toBlob(workbook);
}

async function toBlob(workbook: ExcelJS.Workbook): Promise<Blob> {
	const buffer = await workbook.xlsx.writeBuffer();
	return new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}
