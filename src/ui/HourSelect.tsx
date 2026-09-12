import { formatHourLabel } from "../domain/time";
import type { Hour } from "../domain/types";

interface Props {
	value: Hour;
	options: readonly Hour[];
	onChange: (hour: Hour) => void;
	label: string;
	className?: string;
}

export function HourSelect({ value, options, onChange, label, className = "" }: Props) {
	const all = options.includes(value) ? options : [...options, value].sort((a, b) => a - b);
	return (
		<select
			aria-label={label}
			className={`field font-mono ${className}`}
			value={value}
			onChange={(e) => onChange(Number(e.target.value))}
		>
			{all.map((h) => (
				<option key={h} value={h}>
					{formatHourLabel(h)}
				</option>
			))}
		</select>
	);
}
