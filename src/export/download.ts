export function downloadBlob(blob: Blob, fileName: string): void {
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = fileName;
	document.body.append(link);
	link.click();
	link.remove();
	setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function safeFileName(name: string, fallback: string): string {
	const cleaned = name.replace(/[\\/:*?"<>|]+/g, "").trim();
	return cleaned || fallback;
}
