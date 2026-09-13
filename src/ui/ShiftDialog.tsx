import { Trash2, TriangleAlert, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { computeConflicts } from "../domain/conflicts";
import { sortByName } from "../domain/plan";
import type { Hour, Shift } from "../domain/types";
import { usePlanStore } from "../store";
import { useDerived } from "./derived";
import { HourSelect } from "./HourSelect";
import { report } from "./notify";
import { type ShiftDraft, useUi } from "./uiStore";

export function ShiftDialog() {
	const draft = useUi((s) => s.dialog);
	const close = useUi((s) => s.closeDialog);
	const ref = useRef<HTMLDialogElement>(null);

	useEffect(() => {
		const dialog = ref.current;
		if (!dialog) return;
		if (draft && !dialog.open) dialog.showModal();
		if (!draft && dialog.open) dialog.close();
	}, [draft]);

	return (
		// biome-ignore lint/a11y/useKeyWithClickEvents: backdrop click; Escape closes the dialog natively
		<dialog
			ref={ref}
			onClose={close}
			onClick={(e) => e.target === e.currentTarget && close()}
			className="m-auto w-[440px] max-w-[calc(100vw-32px)] rounded-[10px] bg-surface p-0 text-ink shadow-dialog backdrop:bg-backdrop"
		>
			{draft && <DialogBody key={JSON.stringify(draft)} draft={draft} onClose={close} />}
		</dialog>
	);
}

function DialogBody({ draft, onClose }: { draft: ShiftDraft; onClose: () => void }) {
	const { plan, hourOptions, describeConflicts } = useDerived();
	const { addShift, updateShift, removeShift } = usePlanStore.getState();
	const existing = draft.mode === "edit" ? plan.shifts.find((s) => s.id === draft.shiftId) : undefined;

	const [personId, setPersonId] = useState(existing?.personId ?? (draft.mode === "new" ? draft.personId : "") ?? "");
	const [locationId, setLocationId] = useState(
		existing?.locationId ?? (draft.mode === "new" ? draft.locationId : undefined) ?? plan.locations[0]?.id ?? "",
	);
	const [from, setFrom] = useState<Hour>(existing?.from ?? (draft.mode === "new" ? draft.from : 20));
	const [to, setTo] = useState<Hour>(existing?.to ?? (draft.mode === "new" ? draft.to : 22));

	if (draft.mode === "edit" && !existing) return null;

	const candidate: Shift = { id: existing?.id ?? "draft", personId, locationId, from, to };
	const overlaps = personId
		? (computeConflicts([...plan.shifts.filter((s) => s.id !== candidate.id), candidate]).get(candidate.id) ?? [])
		: [];

	const save = () => {
		if (!personId) return report("Bitte eine Person wählen.");
		const values = { personId, locationId, from, to };
		if (report(existing ? updateShift(existing.id, values) : addShift(values))) onClose();
	};

	return (
		<form
			method="dialog"
			onSubmit={(e) => {
				e.preventDefault();
				save();
			}}
		>
			<div className="flex h-14 items-center border-b border-line pr-3 pl-5">
				<h2 className="flex-1 text-[15px] font-semibold">{existing ? "Schicht bearbeiten" : "Neue Schicht"}</h2>
				<button type="button" aria-label="Schließen" className="btn-icon size-8" onClick={onClose}>
					<X className="size-[18px]" />
				</button>
			</div>

			<div className="flex flex-col gap-4 p-5">
				<label className="flex flex-col gap-1.5">
					<span className="label">Person</span>
					<select className="field h-[38px]" value={personId} onChange={(e) => setPersonId(e.target.value)}>
						<option value="" disabled>
							Person wählen …
						</option>
						{sortByName(plan.people).map((p) => (
							<option key={p.id} value={p.id}>
								{p.name}
							</option>
						))}
					</select>
				</label>
				<label className="flex flex-col gap-1.5">
					<span className="label">Standort</span>
					<select className="field h-[38px]" value={locationId} onChange={(e) => setLocationId(e.target.value)}>
						{plan.locations.map((l) => (
							<option key={l.id} value={l.id}>
								{l.name}
							</option>
						))}
					</select>
				</label>
				<div className="grid grid-cols-2 gap-3">
					<div className="flex flex-col gap-1.5">
						<span className="label">Von</span>
						<HourSelect
							label="Von"
							className="h-[38px]"
							value={from}
							options={hourOptions}
							onChange={(h) => {
								if (h >= to) setTo(h + (to - from));
								setFrom(h);
							}}
						/>
					</div>
					<div className="flex flex-col gap-1.5">
						<span className="label">Bis</span>
						<HourSelect
							label="Bis"
							className="h-[38px]"
							value={to}
							options={hourOptions.filter((h) => h > from)}
							onChange={setTo}
						/>
					</div>
				</div>
				{overlaps.length > 0 && (
					<div className="flex gap-2.5 rounded-md border border-alarm-line bg-alarm-soft px-3 py-2.5 text-[13px] leading-snug text-alarm">
						<TriangleAlert className="mt-px size-4 shrink-0" />
						<span className="text-pretty">
							Überschneidet sich mit <b className="font-semibold">{describeConflicts(overlaps).join(", ")}</b>.
							Speichern ist trotzdem möglich.
						</span>
					</div>
				)}
			</div>

			<div className="flex items-center gap-2 border-t border-line px-5 py-3.5">
				{existing && (
					<button
						type="button"
						className="btn border-transparent px-2 text-alarm hover:bg-alarm-soft"
						onClick={() => {
							removeShift(existing.id);
							onClose();
						}}
					>
						<Trash2 className="size-[15px]" />
						Löschen
					</button>
				)}
				<div className="flex-1" />
				<button type="button" className="btn" onClick={onClose}>
					Abbrechen
				</button>
				<button type="submit" className="btn btn-primary px-3.5">
					Speichern
				</button>
			</div>
		</form>
	);
}
