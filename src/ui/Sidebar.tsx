import { useDraggable } from "@dnd-kit/core";
import { ChevronDown, ChevronUp, FileUp, GripVertical, Plus, Trash2 } from "lucide-react";
import { type FormEvent, useState } from "react";
import { sortByName } from "../domain/plan";
import { formatHourLabel, range } from "../domain/time";
import { usePlanStore } from "../store";
import { useDerived } from "./derived";
import { createExamplePlan } from "./example";
import { HourSelect } from "./HourSelect";
import { report } from "./notify";
import type { DragData } from "./Timeline";
import { type SideTab, useUi } from "./uiStore";

const TABS: { id: SideTab; label: string }[] = [
	{ id: "people", label: "Personen" },
	{ id: "locations", label: "Standorte" },
	{ id: "settings", label: "Einstellungen" },
];

export function Sidebar() {
	const tab = useUi((s) => s.sideTab);
	const setTab = useUi((s) => s.setSideTab);

	return (
		<aside className="flex min-h-0 flex-col border-line bg-white max-lg:border-t lg:w-80 lg:shrink-0 lg:border-l">
			<div role="tablist" className="flex h-12 shrink-0 items-end gap-5 border-b border-line px-5 text-[13px]">
				{TABS.map((t) => (
					<button
						key={t.id}
						type="button"
						role="tab"
						aria-selected={tab === t.id}
						onClick={() => setTab(t.id)}
						className={`border-b-2 pb-3 ${tab === t.id ? "border-ink font-semibold" : "border-transparent text-muted hover:text-ink"}`}
					>
						{t.label}
					</button>
				))}
			</div>
			<div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
				{tab === "people" && <PeopleTab />}
				{tab === "locations" && <LocationsTab />}
				{tab === "settings" && <SettingsTab />}
			</div>
		</aside>
	);
}

function AddForm({ placeholder, onAdd }: { placeholder: string; onAdd: (name: string) => string | undefined }) {
	const [name, setName] = useState("");
	const submit = (e: FormEvent) => {
		e.preventDefault();
		if (report(onAdd(name))) setName("");
	};
	return (
		<form onSubmit={submit} className="flex gap-2 px-5 pt-4 pb-2">
			<input className="field" placeholder={placeholder} value={name} onChange={(e) => setName(e.target.value)} />
			<button type="submit" aria-label="Hinzufügen" className="btn btn-primary w-[34px] justify-center px-0">
				<Plus className="size-4" />
			</button>
		</form>
	);
}

/** Name that turns into an input on double click. */
function EditableName({
	name,
	onRename,
	className = "",
}: {
	name: string;
	onRename: (name: string) => string | undefined;
	className?: string;
}) {
	const [editing, setEditing] = useState(false);
	if (editing) {
		return (
			<input
				// biome-ignore lint/a11y/noAutofocus: opened explicitly by the user
				autoFocus
				defaultValue={name}
				className="field h-7 px-1.5"
				onPointerDown={(e) => e.stopPropagation()}
				onKeyDown={(e) => {
					e.stopPropagation();
					if (e.key === "Enter") e.currentTarget.blur();
					if (e.key === "Escape") setEditing(false);
				}}
				onBlur={(e) => {
					if (e.target.value.trim() === name || report(onRename(e.target.value))) setEditing(false);
				}}
			/>
		);
	}
	return (
		<button
			type="button"
			title="Doppelklick zum Umbenennen"
			onDoubleClick={() => setEditing(true)}
			className={`truncate text-left text-[13px] font-medium ${className}`}
		>
			{name}
		</button>
	);
}

function confirmRemoval(name: string, shiftCount: number): boolean {
	if (shiftCount === 0) return true;
	return window.confirm(`„${name}“ hat ${shiftCount} ${shiftCount === 1 ? "Schicht" : "Schichten"}. Wirklich löschen?`);
}

function PeopleTab() {
	const { plan } = useDerived();
	const addPerson = usePlanStore((s) => s.addPerson);

	return (
		<>
			<AddForm placeholder="Name hinzufügen …" onAdd={addPerson} />
			{plan.people.length === 0 ? (
				<p className="px-5 py-3 text-[13px] text-muted">Noch keine Personen.</p>
			) : (
				<ul className="flex flex-col gap-0.5 px-2.5 py-1">
					{sortByName(plan.people).map((p) => (
						<PersonRow key={p.id} personId={p.id} />
					))}
				</ul>
			)}
			<p className="mt-auto border-t border-line px-5 py-4 text-xs text-pretty text-muted">
				In die Zeitleiste ziehen, um eine Schicht anzulegen.
			</p>
		</>
	);
}

function PersonRow({ personId }: { personId: string }) {
	const { plan, people, conflictedPeople, conflictsOfPerson } = useDerived();
	const renamePerson = usePlanStore((s) => s.renamePerson);
	const removePerson = usePlanStore((s) => s.removePerson);
	const setHighlight = useUi((s) => s.setHighlightPerson);
	const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
		id: `person:${personId}`,
		data: { kind: "person", personId } satisfies DragData,
	});

	const person = people.get(personId);
	if (!person) return null;
	const shifts = plan.shifts.filter((s) => s.personId === personId);
	const hours = shifts.reduce((sum, s) => sum + s.to - s.from, 0);
	const conflict = conflictedPeople.has(personId);

	return (
		<li
			ref={setNodeRef}
			onPointerEnter={() => setHighlight(personId)}
			onPointerLeave={() => setHighlight(null)}
			className={`group flex h-11 items-center gap-2.5 rounded-md px-2.5 ${conflict ? "bg-alarm-soft" : "hover:bg-canvas"} ${isDragging ? "opacity-50" : ""}`}
		>
			<button
				type="button"
				{...attributes}
				{...listeners}
				aria-label={`${person.name} in die Zeitleiste ziehen`}
				className="flex cursor-grab touch-none text-faint"
			>
				<GripVertical className="size-3.5" />
			</button>
			<div className="flex min-w-0 flex-1 flex-col">
				<EditableName
					name={person.name}
					onRename={(n) => renamePerson(personId, n)}
					className={conflict ? "text-alarm" : ""}
				/>
				{conflict && <span className="truncate text-[11px] text-alarm">{conflictsOfPerson(personId).join(" ↔ ")}</span>}
			</div>
			<span className={`font-mono text-xs group-hover:hidden ${hours ? "text-muted" : "text-faint"}`}>
				{hours ? `${hours} h` : "frei"}
			</span>
			<button
				type="button"
				aria-label={`${person.name} löschen`}
				className="btn-icon hidden group-hover:inline-flex"
				onClick={() => confirmRemoval(person.name, shifts.length) && removePerson(personId)}
			>
				<Trash2 className="size-3.5" />
			</button>
		</li>
	);
}

function LocationsTab() {
	const { plan } = useDerived();
	const { addLocation, renameLocation, removeLocation, moveLocation } = usePlanStore.getState();

	return (
		<>
			<AddForm placeholder="Standort hinzufügen …" onAdd={addLocation} />
			{plan.locations.length === 0 ? (
				<p className="px-5 py-3 text-[13px] text-muted">Noch keine Standorte.</p>
			) : (
				<ul className="flex flex-col gap-0.5 px-2.5 py-1">
					{plan.locations.map((location, index) => {
						const count = plan.shifts.filter((s) => s.locationId === location.id).length;
						return (
							<li key={location.id} className="flex h-11 items-center gap-2.5 rounded-md pr-1.5 pl-2.5 hover:bg-canvas">
								<div className="flex min-w-0 flex-1">
									<EditableName name={location.name} onRename={(n) => renameLocation(location.id, n)} />
								</div>
								<span className="font-mono text-xs text-muted">{count} Sch.</span>
								<div className="flex gap-0.5">
									<button
										type="button"
										aria-label="Nach oben"
										className="btn-icon"
										disabled={index === 0}
										onClick={() => moveLocation(location.id, -1)}
									>
										<ChevronUp className="size-3.5" />
									</button>
									<button
										type="button"
										aria-label="Nach unten"
										className="btn-icon"
										disabled={index === plan.locations.length - 1}
										onClick={() => moveLocation(location.id, 1)}
									>
										<ChevronDown className="size-3.5" />
									</button>
									<button
										type="button"
										aria-label={`${location.name} löschen`}
										className="btn-icon"
										onClick={() => confirmRemoval(location.name, count) && removeLocation(location.id)}
									>
										<Trash2 className="size-3.5" />
									</button>
								</div>
							</li>
						);
					})}
				</ul>
			)}
			<p className="mt-auto border-t border-line px-5 py-4 text-xs text-pretty text-muted">
				Die Reihenfolge gilt für Zeitleiste und Tabellen. Doppelklick auf einen Namen zum Umbenennen.
			</p>
		</>
	);
}

function SettingsTab() {
	const plan = usePlanStore((s) => s.plan);
	const { setName, setWindow, replacePlan } = usePlanStore.getState();
	const isEmpty = plan.people.length === 0 && plan.locations.length === 0;

	const replaceWith = (next: () => ReturnType<typeof createExamplePlan>, question: string) => {
		if (isEmpty || window.confirm(question)) replacePlan(next());
	};

	return (
		<div className="flex flex-col gap-5 p-5">
			<label className="flex flex-col gap-1.5">
				<span className="label">Name des Plans</span>
				<input
					key={plan.name}
					className="field"
					defaultValue={plan.name}
					placeholder="z. B. Sommerfest 2026"
					onBlur={(e) => e.target.value !== plan.name && setName(e.target.value)}
					onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
				/>
			</label>
			<div className="flex flex-col gap-1.5">
				<span className="label">Zeitfenster</span>
				<div className="flex items-center gap-2">
					<HourSelect
						label="Beginn"
						className="flex-1"
						value={plan.startHour}
						options={range(0, 24)}
						onChange={(start) => setWindow(start, Math.max(plan.endHour - plan.startHour + start, start + 1))}
					/>
					<span className="text-muted">–</span>
					<HourSelect
						label="Ende"
						className="flex-1"
						value={plan.endHour}
						options={range(plan.startHour + 1, plan.startHour + 73)}
						onChange={(end) => setWindow(plan.startHour, end)}
					/>
				</div>
				<span className="text-xs text-pretty text-muted">
					Schichten außerhalb vergrößern das Fenster automatisch. Nach Mitternacht erscheint z. B.{" "}
					<span className="font-mono">{formatHourLabel(26)}</span>.
				</span>
			</div>
			<div className="h-px bg-line" />
			<div className="flex flex-col gap-2.5">
				<span className="label">Daten</span>
				<p className="text-[13px] leading-relaxed text-pretty">
					Der Plan bleibt nur in diesem Browser. Mit <b className="font-semibold">Speichern</b> sicherst du ihn als
					Datei – auch alte <span className="font-mono text-xs">.fp</span>-Dateien lassen sich öffnen.
				</p>
				<div className="flex flex-wrap gap-2">
					<button
						type="button"
						className="btn"
						onClick={() => replaceWith(createExamplePlan, "Den aktuellen Plan durch den Beispielplan ersetzen?")}
					>
						<FileUp className="size-[15px]" />
						Beispielplan
					</button>
					<button
						type="button"
						className="btn btn-danger"
						onClick={() =>
							replaceWith(
								() => ({ ...plan, name: "", people: [], locations: [], shifts: [] }),
								"Neuen, leeren Plan beginnen? Nicht gespeicherte Daten gehen verloren (Rückgängig ist möglich).",
							)
						}
					>
						<Trash2 className="size-[15px]" />
						Neuer Plan
					</button>
				</div>
			</div>
		</div>
	);
}
