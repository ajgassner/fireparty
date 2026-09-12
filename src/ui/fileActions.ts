import { PlanFileError, parsePlanFile, serializePlan } from "../domain/file";
import type { Plan, Shift } from "../domain/types";
import { downloadBlob, safeFileName } from "../export/download";
import { usePlanStore } from "../store";
import { notify } from "./notify";

const fileName = (plan: Plan, extension: string) => `${safeFileName(plan.name, "fireparty")}.${extension}`;

export function savePlan(): void {
	const { plan } = usePlanStore.getState();
	downloadBlob(new Blob([serializePlan(plan)], { type: "application/json" }), fileName(plan, "json"));
}

export async function openPlan(file: File): Promise<void> {
	try {
		const { plan, legacy, warnings } = parsePlanFile(await file.text());
		usePlanStore.getState().replacePlan(plan);
		notify(legacy ? `Alte FireParty-Datei „${file.name}“ importiert.` : `„${file.name}“ geöffnet.`);
		for (const warning of warnings) notify(warning, "error");
	} catch (error) {
		notify(error instanceof PlanFileError ? error.message : "Die Datei konnte nicht geöffnet werden.", "error");
	}
}

export async function exportPlanPdf(): Promise<void> {
	await run(async () => {
		const { exportPdf } = await import("../export/pdf");
		const { plan } = usePlanStore.getState();
		downloadBlob(await exportPdf(plan), fileName(plan, "pdf"));
	});
}

export async function exportPlanExcel(): Promise<void> {
	await run(async () => {
		const { exportExcel } = await import("../export/excel");
		const { plan } = usePlanStore.getState();
		downloadBlob(await exportExcel(plan, plan.shifts, plan.name, true), fileName(plan, "xlsx"));
	});
}

export async function exportLocationExcel(locationId: string): Promise<void> {
	await run(async () => {
		const { exportExcel } = await import("../export/excel");
		const { plan } = usePlanStore.getState();
		const location = plan.locations.find((l) => l.id === locationId);
		if (!location) return;
		const shifts: Shift[] = plan.shifts.filter((s) => s.locationId === locationId);
		downloadBlob(
			await exportExcel(plan, shifts, location.name, false),
			`${safeFileName(location.name, "standort")}.xlsx`,
		);
	});
}

async function run(task: () => Promise<void>): Promise<void> {
	try {
		await task();
	} catch (error) {
		console.error(error);
		notify("Der Export ist fehlgeschlagen.", "error");
	}
}
