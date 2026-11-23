function escapeHtml(value) {
	return String(value ?? "")
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
}

export function formatPickupQty(val) {
	const n = Number(val || 0);
	if (!Number.isFinite(n)) return "0";
	if (Math.abs(n - Math.round(n)) < 1e-6) {
		return String(Math.round(n));
	}
	return n.toFixed(2).replace(/\.?0+$/, "");
}

function formatDateTimeDisplay(raw) {
	if (!raw) return "";
	try {
		const normalized = String(raw).includes("T") ? String(raw) : String(raw).replace(" ", "T");
		const d = new Date(normalized);
		if (Number.isNaN(d.getTime())) return String(raw);
		return d.toLocaleString("es-BO", {
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
		});
	} catch {
		return String(raw);
	}
}

export function printPickupReceipt(control, logEntry = null) {
	if (!control) return;

	const entry = logEntry || (control.logs && control.logs[0]) || null;
	const deliveredItems = Array.isArray(entry?.items) ? entry.items : [];
	const pendingItems = (control.items || []).filter((it) => Number(it.qty_pending || 0) > 0.0001);

	const deliveredRowsHtml = deliveredItems.length
		? deliveredItems
				.map((it) => {
					const cov =
						it.coverage_uom && Number(it.coverage_qty || 0) > 0
							? ` <span class="muted">(${escapeHtml(formatPickupQty(it.coverage_qty))} ${escapeHtml(it.coverage_uom)})</span>`
							: "";
					return `<tr>
						<td><strong>${escapeHtml(it.item_name || it.item_code)}</strong><br><span class="muted">${escapeHtml(it.item_code)}</span></td>
						<td class="num"><strong>${escapeHtml(formatPickupQty(it.qty))} ${escapeHtml(it.uom || "")}</strong>${cov}</td>
					</tr>`;
				})
				.join("")
		: `<tr><td colspan="2">${escapeHtml(entry?.items_summary || "Entrega registrada")}</td></tr>`;

	const pendingSectionHtml =
		pendingItems.length > 0
			? `<div class="section">
					<div class="section-title">SALDO PENDIENTE POR RETIRAR</div>
					<table>
						<thead><tr><th>Producto</th><th class="num">Pendiente</th></tr></thead>
						<tbody>
							${pendingItems
								.map((it) => {
									const cov =
										it.coverage_uom && Number(it.coverage_pending || 0) > 0
											? ` <span class="muted">(${escapeHtml(formatPickupQty(it.coverage_pending))} ${escapeHtml(it.coverage_uom)})</span>`
											: "";
									return `<tr>
										<td>${escapeHtml(it.item_name || it.item_code)}</td>
										<td class="num"><strong>${escapeHtml(formatPickupQty(it.qty_pending))} ${escapeHtml(it.uom || "")}</strong>${cov}</td>
									</tr>`;
								})
								.join("")}
						</tbody>
					</table>
				</div>`
			: `<div class="complete-box">ENTREGA COMPLETADA AL 100% — SIN SALDO PENDIENTE</div>`;

	const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8" />
<title>Constancia de Retiro - ${escapeHtml(control.reference_name)}</title>
<style>
	* { box-sizing: border-box; }
	body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; margin: 0; padding: 16px; max-width: 720px; margin-inline: auto; font-size: 12px; line-height: 1.45; }
	.header { border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
	.title { font-size: 15px; font-weight: 800; letter-spacing: 0.02em; margin: 0; }
	.subtitle { font-size: 11px; color: #475569; margin-top: 2px; }
	.meta { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; margin-bottom: 14px; }
	.meta-item { font-size: 11px; }
	.meta-label { color: #64748b; display: block; font-size: 10px; text-transform: uppercase; letter-spacing: 0.04em; }
	.meta-val { font-weight: 700; color: #0f172a; }
	.section { margin-bottom: 14px; }
	.section-title { font-size: 11px; font-weight: 800; color: #334155; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px; }
	table { width: 100%; border-collapse: collapse; }
	th, td { border-bottom: 1px solid #e2e8f0; padding: 7px 6px; text-align: left; vertical-align: top; }
	th { background: #f1f5f9; font-size: 10px; text-transform: uppercase; color: #475569; font-weight: 700; }
	.num { text-align: right; white-space: nowrap; }
	.muted { color: #64748b; font-size: 10px; font-weight: 400; }
	.complete-box { background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; font-weight: 700; text-align: center; padding: 8px 10px; border-radius: 8px; margin-bottom: 14px; font-size: 11px; }
	.notes-box { background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 6px; padding: 8px 10px; margin-bottom: 16px; font-size: 11px; }
	.signatures { display: grid; grid-template-columns: repeat(2, 1fr); gap: 28px; margin-top: 38px; }
	.sig-line { border-top: 1px solid #334155; padding-top: 5px; text-align: center; font-size: 11px; color: #334155; }
	@media print { body { padding: 4mm; } }
</style>
</head>
<body>
	<div class="header">
		<div>
			<h1 class="title">CONSTANCIA DE RETIRO DE MERCADERÍA</h1>
			<div class="subtitle">${escapeHtml(control.company || "")} · Control ${escapeHtml(control.name)}</div>
		</div>
		<div style="text-align:right">
			<div class="meta-label">Venta de Referencia</div>
			<div class="meta-val">${escapeHtml(control.reference_name)}</div>
		</div>
	</div>

	<div class="meta">
		<div class="meta-item"><span class="meta-label">Cliente</span><span class="meta-val">${escapeHtml(control.customer_name || control.customer)}</span></div>
		<div class="meta-item"><span class="meta-label">Fecha y Hora del Retiro</span><span class="meta-val">${escapeHtml(formatDateTimeDisplay(entry?.delivery_datetime || control.last_delivery_date || control.posting_date))}</span></div>
		<div class="meta-item"><span class="meta-label">Retirado por</span><span class="meta-val">${escapeHtml(entry?.received_by || control.customer_name || "-")}</span></div>
		<div class="meta-item"><span class="meta-label">Entregado por</span><span class="meta-val">${escapeHtml(entry?.delivered_by_name || entry?.delivered_by || "-")}</span></div>
	</div>

	<div class="section">
		<div class="section-title">MERCADERÍA ENTREGADA EN ESTE RETIRO</div>
		<table>
			<thead><tr><th>Producto</th><th class="num">Cantidad Retirada</th></tr></thead>
			<tbody>${deliveredRowsHtml}</tbody>
		</table>
	</div>

	${pendingSectionHtml}

	${entry?.notes ? `<div class="notes-box"><strong>Observación:</strong> ${escapeHtml(entry.notes)}</div>` : ""}

	<div class="signatures">
		<div class="sig-line">Entregado por<br><span class="muted">${escapeHtml(entry?.delivered_by_name || "")}</span></div>
		<div class="sig-line">Recibí conforme<br><span class="muted">${escapeHtml(entry?.received_by || control.customer_name || "")}</span></div>
	</div>
</body>
</html>`;

	const win = window.open("", "_blank", "width=760,height=820");
	if (!win) return;
	win.document.open();
	win.document.write(html);
	win.document.close();
	win.focus();
	setTimeout(() => {
		try {
			win.print();
		} catch {}
	}, 250);
}

export function openPickupWhatsApp(control, logEntry = null) {
	if (!control) return;
	const entry = logEntry || (control.logs && control.logs[0]) || null;
	const pendingItems = (control.items || []).filter((it) => Number(it.qty_pending || 0) > 0.0001);

	const lines = [
		`Hola ${control.customer_name || ""},`,
		`Confirmamos el registro de entrega de tu compra *${control.reference_name}*:`,
	];

	if (entry?.items_summary) {
		lines.push(`- Entregado hoy: ${entry.items_summary}`);
	}
	if (entry?.received_by) {
		lines.push(`- Retirado por: ${entry.received_by}`);
	}

	if (pendingItems.length > 0) {
		const pendingText = pendingItems
			.map((it) => {
				const cov =
					it.coverage_uom && Number(it.coverage_pending || 0) > 0
						? ` (${formatPickupQty(it.coverage_pending)} ${it.coverage_uom})`
						: "";
				return `${formatPickupQty(it.qty_pending)} ${it.uom || ""} ${it.item_name || it.item_code}${cov}`.trim();
			})
			.join("; ");
		lines.push(`- Saldo pendiente por retirar: ${pendingText}`);
	} else {
		lines.push(`- Tu compra quedó entregada al 100%. Muchas gracias.`);
	}

	const rawPhone = String(control.customer_phone || "").replace(/\D/g, "");
	const encoded = encodeURIComponent(lines.join("\n"));
	const url = rawPhone
		? `https://wa.me/${rawPhone}?text=${encoded}`
		: `https://api.whatsapp.com/send?text=${encoded}`;
	window.open(url, "_blank", "noopener,noreferrer");
}
