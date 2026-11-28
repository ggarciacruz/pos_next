import { call } from "@/utils/apiWrapper";
import { qzConnected } from "@/utils/qzTray";
import { silentPrintDoc } from "./printInvoice";

const EOD_PRINT_FORMAT = "POS Next EOD Report";

/**
 * Print EOD Report using a hidden iframe (avoids popup blockers and works without QZ Tray).
 */
export async function browserPrintEODReport(closingShiftName) {
	const result = await call("frappe.www.printview.get_html_and_style", {
		doc: "POS Closing Shift",
		name: closingShiftName,
		print_format: EOD_PRINT_FORMAT,
		no_letterhead: 1,
	});

	const html = result?.html || result?.message?.html;
	const style = result?.style || result?.message?.style || "";
	if (!html) {
		throw new Error("No se pudo generar el HTML del reporte de cierre");
	}

	const fullHTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Reporte de Cierre - ${closingShiftName}</title>
<style>
@page { size: 80mm auto; margin: 2mm; }
${style}
</style>
</head>
<body>${html}</body>
</html>`;

	await new Promise((resolve, reject) => {
		try {
			const iframe = document.createElement("iframe");
			iframe.style.position = "fixed";
			iframe.style.right = "0";
			iframe.style.bottom = "0";
			iframe.style.width = "0";
			iframe.style.height = "0";
			iframe.style.border = "0";
			iframe.setAttribute("aria-hidden", "true");
			document.body.appendChild(iframe);

			const cleanup = () => {
				setTimeout(() => {
					try {
						iframe.remove();
					} catch {
						// Ignore cleanup error
					}
				}, 1500);
			};

			const doc = iframe.contentDocument || iframe.contentWindow?.document;
			if (!doc || !iframe.contentWindow) {
				cleanup();
				reject(new Error("Iframe print document unavailable"));
				return;
			}

			doc.open();
			doc.write(fullHTML);
			doc.close();

			setTimeout(() => {
				try {
					iframe.contentWindow.focus();
					iframe.contentWindow.print();
					cleanup();
					resolve(true);
				} catch (err) {
					cleanup();
					reject(err);
				}
			}, 180);
		} catch (err) {
			reject(err);
		}
	}).catch(() => {
		const fallbackUrl =
			`/printview?doctype=${encodeURIComponent("POS Closing Shift")}` +
			`&name=${encodeURIComponent(closingShiftName)}` +
			`&format=${encodeURIComponent(EOD_PRINT_FORMAT)}` +
			`&no_letterhead=1&trigger_print=1`;
		const win = window.open(fallbackUrl, "_blank");
		if (!win) {
			throw new Error("Popup blocked");
		}
	});

	return true;
}

/**
 * Print End-of-Day report via QZ Tray when connected, or browser print when manually triggered.
 */
export async function printEODReport(closingShiftName, { manual = false } = {}) {
	if (!closingShiftName) {
		throw new Error("Missing closing shift name");
	}

	if (qzConnected.value) {
		try {
			await silentPrintDoc("POS Closing Shift", closingShiftName, EOD_PRINT_FORMAT);
			return { method: "qz", success: true };
		} catch (err) {
			if (!manual) throw err;
			await browserPrintEODReport(closingShiftName);
			return { method: "browser", success: true };
		}
	}

	if (manual) {
		await browserPrintEODReport(closingShiftName);
		return { method: "browser", success: true };
	}

	throw new Error("QZ Tray no conectado");
}

const LETTER_CLOSING_PRINT_FORMAT = "Arqueo y Cierre de Caja Nueva Era";

/**
 * Open formal Letter Print Format ("Arqueo y Cierre de Caja Nueva Era") via safe Blob HTML preview.
 */
export async function printLetterClosingSheet(closingShiftName) {
	if (!closingShiftName) {
		throw new Error("Missing closing shift name");
	}
	const result = await call("frappe.www.printview.get_html_and_style", {
		doc: "POS Closing Shift",
		name: closingShiftName,
		print_format: LETTER_CLOSING_PRINT_FORMAT,
		no_letterhead: 1,
	});
	const html = result?.html || result?.message?.html;
	const style = result?.style || result?.message?.style || "";
	if (!html) {
		throw new Error("No se pudo generar la hoja de cierre");
	}
	const safeName = String(closingShiftName).replace(/[^A-Za-z0-9_.-]/g, "");
	const fullHTML = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Cierre de Caja - ${safeName}</title>
<style>
@page { size: letter; margin: 10mm; }
body { font-family: Arial, sans-serif; margin: 0; padding: 14px; }
.no-print { margin-bottom: 12px; text-align: right; }
@media print { .no-print { display: none !important; } body { padding: 0; } }
${style}
</style>
</head>
<body>
<div class="no-print"><button type="button" onclick="window.print()" style="background:#0f172a;color:#fff;border:none;padding:8px 16px;border-radius:6px;font-weight:600;cursor:pointer;">Imprimir / Guardar PDF</button></div>
${html}
</body>
</html>`;
	const blob = new Blob([fullHTML], { type: "text/html;charset=utf-8" });
	const url = URL.createObjectURL(blob);
	const win = window.open(url, "_blank");
	if (!win) {
		URL.revokeObjectURL(url);
		throw new Error("Permita ventanas emergentes para imprimir la hoja de cierre");
	}
	setTimeout(() => URL.revokeObjectURL(url), 60000);
	return true;
}
