import { FileText, FolderOpen, Save, Sheet, Undo2 } from "lucide-react";
import { useRef } from "react";
import { usePlanStore } from "../store";
import { exportPlanExcel, exportPlanPdf, openPlan, savePlan } from "./fileActions";

export function Logo() {
	return <div aria-hidden className="size-[22px] shrink-0 rounded-[5px] bg-alarm" />;
}

/** Hidden file input plus a function to open the picker. */
export function useOpenFile() {
	const input = useRef<HTMLInputElement>(null);
	const element = (
		<input
			ref={input}
			type="file"
			accept=".json,.fp,application/json"
			hidden
			onChange={(e) => {
				const file = e.target.files?.[0];
				if (file) openPlan(file);
				e.target.value = "";
			}}
		/>
	);
	return { element, open: () => input.current?.click() };
}

export function Header() {
	const name = usePlanStore((s) => s.plan.name);
	const canUndo = usePlanStore((s) => s.past.length > 0);
	const undo = usePlanStore((s) => s.undo);
	const file = useOpenFile();

	return (
		<header className="flex h-14 shrink-0 items-center gap-4 border-b border-line bg-white px-6">
			<div className="flex items-center gap-2">
				<Logo />
				<span className="text-[15px] font-semibold">FireParty</span>
			</div>
			<span className="text-xl text-line">/</span>
			<span className={`min-w-0 truncate text-[15px] font-medium ${name ? "" : "text-faint"}`}>
				{name || "Unbenannter Plan"}
			</span>
			<div className="flex-1" />
			<div className="flex gap-2">
				<button type="button" className="btn" disabled={!canUndo} onClick={undo} title="Rückgängig (Strg+Z)">
					<Undo2 className="size-[15px]" />
					Rückgängig
				</button>
				<button type="button" className="btn" onClick={file.open}>
					<FolderOpen className="size-[15px]" />
					Öffnen
				</button>
				<button type="button" className="btn" onClick={exportPlanPdf}>
					<FileText className="size-[15px]" />
					PDF
				</button>
				<button type="button" className="btn" onClick={exportPlanExcel}>
					<Sheet className="size-[15px]" />
					Excel
				</button>
				<button type="button" className="btn btn-primary" onClick={savePlan} title="Speichern (Strg+S)">
					<Save className="size-[15px]" />
					Speichern
				</button>
			</div>
			{file.element}
		</header>
	);
}
