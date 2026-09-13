import { FileText, FolderOpen, Menu, Save, Sheet, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { compareShifts, sortByName } from "../domain/plan";
import { formatHour, formatShortRange } from "../domain/time";
import type { Shift } from "../domain/types";
import { usePlanStore } from "../store";
import { useDerived } from "./derived";
import { createExamplePlan } from "./example";
import { exportPlanExcel, exportPlanPdf, savePlan } from "./fileActions";
import { Logo, useOpenFile } from "./Header";
import { ThemeSwitch } from "./ThemeSwitch";

type Group = "locations" | "people";

/** Read-only phone view – planning happens on a bigger screen. */
export function MobileView() {
	const { plan, people, locations, window, conflicts, conflictedPeople } = useDerived();
	const [group, setGroup] = useState<Group>("locations");
	const [menuOpen, setMenuOpen] = useState(false);
	const file = useOpenFile();

	const sections =
		group === "locations"
			? plan.locations.map((l) => ({
					id: l.id,
					title: l.name,
					shifts: plan.shifts.filter((s) => s.locationId === l.id),
				}))
			: sortByName(plan.people).map((p) => ({
					id: p.id,
					title: p.name,
					shifts: plan.shifts.filter((s) => s.personId === p.id),
				}));
	const label = (s: Shift) =>
		group === "locations" ? (people.get(s.personId)?.name ?? "?") : (locations.get(s.locationId)?.name ?? "?");
	const conflictNames = [...conflictedPeople].map((id) => people.get(id)?.name).filter(Boolean);

	return (
		<div className="flex min-h-full flex-col bg-canvas">
			<header className="sticky top-0 z-10 flex h-[60px] items-center gap-2.5 border-b border-line bg-surface pr-2 pl-4">
				<Logo />
				<div className="flex min-w-0 flex-1 flex-col leading-tight">
					<span className="truncate text-base font-semibold">{plan.name || "FireParty"}</span>
					<span className="font-mono text-xs text-muted">
						{formatHour(window.startHour)} – {formatHour(window.endHour)}
					</span>
				</div>
				<div className="relative">
					<button
						type="button"
						aria-label="Menü"
						aria-expanded={menuOpen}
						className="flex size-11 items-center justify-center"
						onClick={() => setMenuOpen((o) => !o)}
					>
						<Menu className="size-[22px]" />
					</button>
					{menuOpen && (
						<div className="absolute top-12 right-0 flex w-64 flex-col rounded-lg border border-line bg-surface p-1 shadow-lg">
							{[
								{ icon: Save, label: "Als Datei speichern", run: savePlan },
								{ icon: Sheet, label: "Excel exportieren", run: exportPlanExcel },
								{
									icon: FolderOpen,
									label: "Beispielplan laden",
									run: () => usePlanStore.getState().replacePlan(createExamplePlan()),
								},
							].map((item) => (
								<button
									key={item.label}
									type="button"
									className="flex h-11 items-center gap-2.5 rounded-md px-3 text-left text-[15px] hover:bg-soft"
									onClick={() => {
										setMenuOpen(false);
										item.run();
									}}
								>
									<item.icon className="size-[18px] text-muted" />
									{item.label}
								</button>
							))}
							<div className="mt-1 flex flex-col gap-1.5 border-t border-line px-2 pt-2.5 pb-1.5">
								<span className="label">Darstellung</span>
								<ThemeSwitch large />
							</div>
						</div>
					)}
				</div>
			</header>

			<div className="flex flex-col gap-3 px-4 pt-3.5">
				<div role="tablist" className="grid grid-cols-2 rounded-lg bg-track p-[3px]">
					{(["locations", "people"] as const).map((g) => (
						<button
							key={g}
							type="button"
							role="tab"
							aria-selected={group === g}
							onClick={() => setGroup(g)}
							className={`h-[38px] rounded-md text-sm ${group === g ? "bg-surface font-semibold shadow-xs" : "text-muted"}`}
						>
							{g === "locations" ? "Standorte" : "Personen"}
						</button>
					))}
				</div>
				{conflictNames.length > 0 && (
					<div className="flex items-center gap-2 rounded-lg bg-alarm-soft px-3 py-2.5 text-sm text-alarm">
						<TriangleAlert className="size-4 shrink-0" />
						<span>
							{conflictNames.join(", ")} {conflictNames.length === 1 ? "ist" : "sind"} doppelt eingeteilt
						</span>
					</div>
				)}
			</div>

			<div className="flex flex-col gap-3 px-4 pt-3 pb-4">
				{sections.length === 0 && (
					<p className="py-10 text-center text-sm text-pretty text-muted">
						Noch kein Plan. Öffne eine gespeicherte Datei oder plane am Computer.
					</p>
				)}
				{sections.map((section) => (
					<section key={section.id} className="overflow-hidden rounded-[10px] border border-line bg-surface">
						<div className="flex items-baseline gap-2 px-4 py-3">
							<h2 className="text-base font-semibold">{section.title}</h2>
							<span className="text-[13px] text-muted">
								{section.shifts.length === 1 ? "1 Schicht" : `${section.shifts.length} Schichten`}
							</span>
						</div>
						{[...section.shifts]
							.sort((a, b) => compareShifts(a, b) || label(a).localeCompare(label(b), "de"))
							.map((s) => {
								const conflict = conflicts.has(s.id);
								return (
									<div
										key={s.id}
										className={`flex min-h-[52px] items-center gap-3.5 border-t border-line px-4 ${conflict ? "bg-alarm-soft text-alarm" : ""}`}
									>
										<span className={`w-16 font-mono text-sm ${conflict ? "" : "text-muted"}`}>
											{formatShortRange(s.from, s.to)}
										</span>
										<span className="flex-1 text-[15px] font-medium">{label(s)}</span>
										{conflict && <TriangleAlert className="size-4" />}
									</div>
								);
							})}
					</section>
				))}
			</div>

			<div className="sticky bottom-0 mt-auto grid grid-cols-2 gap-2.5 border-t border-line bg-surface px-4 pt-3 pb-5">
				<button type="button" className="btn h-[46px] justify-center rounded-lg text-[15px]" onClick={file.open}>
					<FolderOpen className="size-[18px]" />
					Öffnen
				</button>
				<button
					type="button"
					className="btn btn-primary h-[46px] justify-center rounded-lg text-[15px]"
					onClick={exportPlanPdf}
				>
					<FileText className="size-[18px]" />
					PDF
				</button>
			</div>
			{file.element}
		</div>
	);
}
