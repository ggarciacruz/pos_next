import { call } from "@/utils/apiWrapper";
import { logger } from "@/utils/logger";
import { getOfflineReceiptPayload } from "@/utils/offline/offlineReceiptCache";
import { getOfflineInvoiceByOfflineId } from "@/utils/offline/sync";
import { offlineWorker } from "@/utils/offline/workerClient";
import { printHTML as qzPrintHTML } from "@/utils/qzTray";
import { getCurrencySymbol } from "@/utils/currency";
import { db } from "@/utils/offline/db";
import { session } from "@/data/session";
import { userData } from "@/data/user";

const log = logger.create("PrintInvoice");

const DEFAULT_PRINT_FORMAT = "MDX POS Receipt";

// ============================================================================
// Shared helpers
// ============================================================================

function formatCurrency(amount) {
	return Number.parseFloat(amount || 0).toFixed(2);
}

function getInvoiceNumber(name) {
	if (!name) return "0";
	const match = name.match(/-(\d+)$/);
	return match ? parseInt(match[1], 10) : name;
}

function getCUF(invoiceData) {
	if (invoiceData.cuf) return invoiceData.cuf;
	const seed = invoiceData.name || "MOCK";
	let hash = "";
	for (let i = 0; i < 64; i++) {
		const charCode = (seed.charCodeAt(i % seed.length) + i * 17) % 16;
		hash += charCode.toString(16).toUpperCase();
	}
	return hash;
}

function numberToSpanishWords(amount) {
	const number = Math.floor(amount);
	const cents = Math.round((amount - number) * 100);
	
	const formatCents = String(cents).padStart(2, "0") + "/100 Bolivianos";
	
	if (number === 0) return "Cero " + formatCents;
	
	const unidades = ["", "Uno", "Dos", "Tres", "Cuatro", "Cinco", "Seis", "Siete", "Ocho", "Nueve"];
	const decenas = ["", "Diez", "Veinte", "Treinta", "Cuarenta", "Cincuenta", "Sesenta", "Setenta", "Ochenta", "Noventa"];
	const especiales = ["Diez", "Once", "Doce", "Trece", "Catorce", "Quince", "Dieciséis", "Diecisiete", "Dieciocho", "Diecinueve"];
	const centenas = ["", "Ciento", "Doscientos", "Trescientos", "Cuatrocientos", "Quinientos", "Seiscientos", "Setecientos", "Ochocientos", "Novecientos"];
	
	function convertGroup(n) {
		let output = "";
		const c = Math.floor(n / 100);
		const d = Math.floor((n % 100) / 10);
		const u = n % 10;
		
		if (c > 0) {
			if (c === 1 && d === 0 && u === 0) {
				output += "Cien ";
			} else {
				output += centenas[c] + " ";
			}
		}
		
		if (d === 1) {
			output += especiales[u] + " ";
		} else if (d > 1) {
			output += decenas[d] + (u > 0 ? " y " + unidades[u] : "") + " ";
		} else if (u > 0) {
			if (u === 1) {
				output += "Un ";
			} else {
				output += unidades[u] + " ";
			}
		}
		return output;
	}
	
	let words = "";
	const millones = Math.floor(number / 1000000);
	const miles = Math.floor((number % 1000000) / 1000);
	const resto = number % 1000;
	
	if (millones > 0) {
		words += millones === 1 ? "Un Millón " : convertGroup(millones) + "Millones ";
	}
	if (miles > 0) {
		words += miles === 1 ? "Mil " : convertGroup(miles) + "Mil ";
	}
	if (resto > 0) {
		words += convertGroup(resto);
	}
	
	words = words.trim().replace(/\s+/g, " ");
	words = words.charAt(0).toUpperCase() + words.slice(1);
	
	if (words === "Un") words = "Uno";
	
	return "Son: " + words + " " + formatCents;
}

/**
 * Fall back to summing payment rows when paid_amount is not set —
 * offline invoices lack paid_amount until server submission.
 */
function derivePaidAmount(invoiceData) {
	if (invoiceData.paid_amount != null) return invoiceData.paid_amount;
	if (!Array.isArray(invoiceData.payments)) return 0;
	return invoiceData.payments.reduce((sum, p) => sum + (Number.parseFloat(p.amount) || 0), 0);
}

/** Sales Invoices not yet on the server (offline queue / local receipt id). */
export function isLocalOnlyInvoiceName(name) {
	return (
		typeof name === "string" &&
		(name.startsWith("OFFLINE-") || name.startsWith("pos_offline_"))
	);
}

/**
 * Fire-and-forget: flag the queued invoice as printed so a later edit
 * can warn the cashier a physical receipt is already in the customer's hands.
 * Silently no-ops for synced / server-side invoices.
 */
function flagOfflineInvoicePrinted(invoiceName) {
	if (!isLocalOnlyInvoiceName(invoiceName)) return;
	// Don't await — printing should never block on this bookkeeping call.
	offlineWorker.markOfflineInvoicePrinted(invoiceName).catch((err) => {
		log.warn("Failed to mark offline invoice printed:", err?.message || err);
	});
}

/**
 * Build a minimal printable receipt doc from a raw queued invoice payload
 * (the dict stored in IndexedDB invoice_queue.data). Used when sessionStorage
 * has been wiped but the invoice is still in the local queue.
 */
function receiptDocFromQueuedInvoice(offlineId, raw) {
	const items = Array.isArray(raw.items) ? raw.items : [];
	const payments = Array.isArray(raw.payments) ? raw.payments : [];
	const grandTotal = Number.parseFloat(raw.grand_total) || 0;
	const paidAmount = payments.reduce((sum, p) => sum + (Number.parseFloat(p.amount) || 0), 0);
	return {
		name: offlineId,
		doctype: "Sales Invoice",
		is_offline: true,
		pos_profile: raw.pos_profile,
		posting_date: raw.posting_date || new Date().toISOString().slice(0, 10),
		company: raw.company,
		customer_name: raw.customer,
		items: items.map((item) => ({
			...item,
			quantity: item.quantity ?? item.qty,
		})),
		grand_total: grandTotal,
		total_taxes_and_charges: Number.parseFloat(raw.total_tax) || 0,
		discount_amount: Number.parseFloat(raw.total_discount) || 0,
		payments,
		paid_amount: paidAmount,
		change_amount: Number.parseFloat(raw.change_amount) || 0,
		outstanding_amount: Math.max(0, grandTotal - paidAmount),
		status: grandTotal - paidAmount < 0.01 ? "Paid" : "Unpaid",
		docstatus: 0,
	};
}

/**
 * Hydrate a local-only invoice from cache. Checks sessionStorage first
 * (fast path, survives within the tab), then falls back to IndexedDB
 * (survives page reloads while the invoice is still in the offline queue).
 * Prevents server print / get_invoice for synthetic pos_offline_* ids.
 */
export async function hydrateLocalOnlyInvoice(invoiceData) {
	if (!invoiceData?.name || !isLocalOnlyInvoiceName(invoiceData.name)) return invoiceData;
	if (invoiceData.items?.length > 0) return invoiceData;

	const cached = getOfflineReceiptPayload(invoiceData.name);
	if (cached?.items?.length > 0) return cached;

	// sessionStorage wiped (page reload) — rebuild from IndexedDB queue.
	try {
		const queued = await getOfflineInvoiceByOfflineId(invoiceData.name);
		if (queued?.items?.length > 0) {
			return receiptDocFromQueuedInvoice(invoiceData.name, queued);
		}
	} catch (err) {
		log.warn("IndexedDB hydrate fallback failed:", err?.message || err);
	}

	return invoiceData;
}

const userFullNameCache = {};
const companyInfoCache = {};

export async function hydrateInvoiceItemsWithMedidas(invoiceData) {
	if (!invoiceData) return invoiceData;

	// Resolve company phone and address
	const company = invoiceData.company;
	if (company) {
		if (companyInfoCache[company]) {
			const info = companyInfoCache[company];
			invoiceData.company_phone = info.phone;
			invoiceData.company_address = info.address;
			invoiceData.company_city = info.city;
		} else {
			try {
				const res = await call("frappe.client.get_value", {
					doctype: "Address",
					filters: { is_your_company_address: 1 },
					fieldname: ["phone", "address_line1", "city"],
				});
				const addressData = res?.message || res;
				if (addressData) {
					const info = {
						phone: addressData.phone || "",
						address: addressData.address_line1 || "",
						city: addressData.city || "",
					};
					companyInfoCache[company] = info;
					invoiceData.company_phone = info.phone;
					invoiceData.company_address = info.address;
					invoiceData.company_city = info.city;
				}
			} catch (err) {
				log.warn("Failed to fetch company address details:", err);
			}
		}
	}

	// Resolve seller full name
	const docOwner = invoiceData.owner || session.user;
	if (docOwner) {
		if (docOwner === userData.userId || docOwner === session.user) {
			invoiceData.owner_name = userData.getDisplayName();
		} else if (userFullNameCache[docOwner]) {
			invoiceData.owner_name = userFullNameCache[docOwner];
		} else {
			try {
				const res = await call("frappe.client.get_value", {
					doctype: "User",
					filters: { name: docOwner },
					fieldname: "full_name",
				});
				const fullName = res?.message?.full_name || res?.full_name;
				if (fullName) {
					userFullNameCache[docOwner] = fullName;
					invoiceData.owner_name = fullName;
				} else {
					invoiceData.owner_name = docOwner.split("@")[0].toUpperCase();
				}
			} catch (err) {
				log.warn("Failed to fetch full_name for owner:", err);
				invoiceData.owner_name = docOwner.split("@")[0].toUpperCase();
			}
		}
	}

	// Resolve items measures from IndexedDB
	if (Array.isArray(invoiceData.items)) {
		try {
			const promises = invoiceData.items.map(async (item) => {
				if (!item.custom_medida && item.item_code) {
					const cached = await db.items.get(item.item_code);
					if (cached && cached.custom_medida) {
						item.custom_medida = cached.custom_medida;
					}
				}
			});
			await Promise.all(promises);
		} catch (err) {
			log.warn("Failed to hydrate items with custom_medida from IndexedDB:", err);
		}
	}

	return invoiceData;
}

const RECEIPT_STYLES = `
	* { margin: 0; padding: 0; box-sizing: border-box; }
	body {
		font-family: 'Courier New', monospace;
		padding: 10px; width: 80mm; margin: 0; max-width: 80mm;
		font-weight: bold; color: black;
	}
	.receipt { width: 100%; }
	.header { text-align: center; margin-bottom: 20px; border-bottom: 2px dashed #000; padding-bottom: 10px; }
	.company-name { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
	.invoice-info { margin-bottom: 15px; font-size: 12px; }
	.invoice-info div { display: flex; justify-content: space-between; margin-bottom: 3px; }
	.partial-status { color: #000; font-weight: bold; margin-bottom: 5px; }
	.items-table { width: 100%; margin-bottom: 15px; border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 10px 0; }
	.item-row { margin-bottom: 10px; font-size: 12px; }
	.item-name { font-weight: bold; margin-bottom: 3px; }
	.item-details { display: flex; justify-content: space-between; font-size: 11px; }
	.item-discount { display: flex; justify-content: space-between; font-size: 10px; margin-top: 2px; }
	.item-serials { font-size: 9px; margin-top: 3px; padding: 3px 5px; border: 1px dashed #000; border-radius: 2px; }
	.item-serials-label { font-weight: bold; margin-bottom: 2px; }
	.item-serials-list { word-break: break-all; }
	.totals { margin-top: 15px; border-top: 1px dashed #000; padding-top: 10px; }
	.total-row { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 12px; }
	.grand-total { font-size: 16px; font-weight: bold; border-top: 2px solid #000; padding-top: 10px; margin-top: 10px; }
	.payments { margin-top: 15px; border-top: 1px dashed #000; padding-top: 10px; }
	.payment-row { display: flex; justify-content: space-between; margin-bottom: 3px; font-size: 11px; }
	.total-paid { font-weight: bold; border-top: 1px solid #000; padding-top: 5px; margin-top: 5px; }
	.outstanding-row {
		display: flex; justify-content: space-between; font-size: 13px; font-weight: bold;
		border: 1px solid #000; padding: 8px; margin-top: 8px; border-radius: 4px;
	}
	.offline-badge {
		text-align: center; font-size: 11px; font-weight: bold;
		border: 1px dashed #000; padding: 4px; margin-bottom: 10px;
	}
	.footer { text-align: center; margin-top: 20px; padding-top: 10px; border-top: 2px dashed #000; font-size: 11px; }
	@media print {
		@page { margin: 0; }
		body { width: 80mm; padding: 5mm; margin: 0; }
		.no-print { display: none; }
	}
`;

/**
 * Inner receipt HTML (no shell). Used for local/offline invoices and QZ Tray.
 */
export function buildReceiptHTML(invoiceData) {
	const isQuotation = invoiceData.doctype === "Quotation" || invoiceData.header === "Quotation" || (invoiceData.name && (invoiceData.name.startsWith("QTN-") || invoiceData.name.startsWith("COT-")));
	const isSalesOrder = invoiceData.doctype === "Sales Order" || invoiceData.header === "Draft" || (invoiceData.name && (invoiceData.name.startsWith("SAL-ORD-") || invoiceData.name.startsWith("PRE-")));
	const isInvoice = !isQuotation && !isSalesOrder;
	const currencySymbol = getCurrencySymbol(invoiceData.currency || "BOB");
	const owner = invoiceData.owner || session.user || "Administrator";
	const sellerName = invoiceData.owner_name || owner.split("@")[0].toUpperCase();

	function formatPrintDate(dateStr) {
		const date = new Date(dateStr || Date.now());
		const day = String(date.getDate()).padStart(2, '0');
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const year = date.getFullYear();
		const hours = String(date.getHours()).padStart(2, '0');
		const minutes = String(date.getMinutes()).padStart(2, '0');
		return `${day}/${month}/${year} ${hours}:${minutes}`;
	}

	const items = invoiceData.items || [];
	const paidAmount = derivePaidAmount(invoiceData);
	const itemsHtml = items
		.map((item) => {
			const hasDiscount =
				(item.discount_percentage && Number.parseFloat(item.discount_percentage) > 0) ||
				(item.discount_amount && Number.parseFloat(item.discount_amount) > 0);
			const isFree = item.is_free_item;
			const qty = item.quantity || item.qty || 0;
			const displayRate = item.price_list_rate || item.rate || 0;
			const subtotal = qty * displayRate;

			if (!isInvoice) {
				// Formato de una sola línea ultra-compacta para pre-ventas y cotizaciones
				const qtyText = qty !== 1 ? `x${qty}` : "";
				const customMedida = item.custom_medida || item.medida || "";
				const measureText = customMedida ? `(${customMedida})` : "";
				const discountText = hasDiscount ? `[Desc: -${formatCurrency(item.discount_amount || 0)}]` : "";
				
				const leftParts = [item.item_code, measureText, qtyText, discountText].filter(Boolean).join(" ");

				return `
						<div class="item-row" style="margin-bottom: 4px; font-size: 11px; color: black; font-weight: bold;">
							<div style="display: flex; justify-content: space-between; align-items: baseline;">
								<span style="word-break: break-word; padding-right: 8px;">${leftParts}</span>
								<span style="white-space: nowrap;">${formatCurrency(subtotal)}</span>
							</div>
						</div>`;
			}

			// Formato estándar para facturas
			const customMedida = item.custom_medida || item.medida || "";
			return `
						<div class="item-row" style="margin-bottom: 8px; font-size: 11px;">
							<div class="item-name" style="font-weight: bold;">
								${item.item_code} - ${item.item_name} ${isFree ? __("(GRATIS)") : ""}
								${customMedida ? `<div style="font-size: 9px; color: #555; font-weight: normal; margin-top: 1px;">Medida: ${customMedida}</div>` : ""}
							</div>
							<div class="item-details" style="display: flex; justify-content: space-between; font-size: 10px; margin-top: 2px;">
								<span>${qty} × ${formatCurrency(displayRate)}</span>
								<span><strong>${formatCurrency(subtotal)}</strong></span>
							</div>
							${
								hasDiscount
									? `<div class="item-discount" style="display: flex; justify-content: space-between; font-size: 9px; color: #28a745; margin-top: 1px;">
											<span>Descuento (${Number(item.discount_percentage).toFixed(1)}%)</span>
											<span>-${formatCurrency(item.discount_amount || 0)}</span>
									   </div>`
									: ""
							}
						</div>`;
		})
		.join("");

	const docLabel = isQuotation ? __("Cotización #:") : (isSalesOrder ? __("Pre-venta #:") : __("Factura #:"));
	const displayHeader = isQuotation ? __("COTIZACIÓN") : (isSalesOrder ? __("PRE-VENTA") : __("FACTURA"));

	if (isInvoice) {
		const invoiceNumber = getInvoiceNumber(invoiceData.name);
		const cuf = getCUF(invoiceData);
		const customerName = (invoiceData.customer_name || invoiceData.customer || "SIN NOMBRE").toUpperCase();
		const customerTaxId = invoiceData.tax_id || invoiceData.customer_tax_id || "0";
		const qrData = `https://siat.impuestos.gob.bo/consulta/QR?nit=102384729023&cuf=${cuf}&numero=${invoiceNumber}&fecha=${invoiceData.posting_date || new Date().toISOString().slice(0,10)}&monto=${formatCurrency(invoiceData.grand_total)}`;
		const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=${encodeURIComponent(qrData)}`;
		const amountInWords = numberToSpanishWords(invoiceData.grand_total);

		return `
			<div class="receipt">
				<div class="header" style="text-align: center; margin-bottom: 12px; padding-bottom: 8px;">
					<div class="company-name" style="font-size: 16px; font-weight: bold; margin-bottom: 2px;">${invoiceData.company || ""}</div>
					<div style="font-size: 9px; font-weight: normal; margin-bottom: 1px;">CASA MATRIZ</div>
					<div style="font-size: 9px; font-weight: normal; margin-bottom: 1px;">${invoiceData.company_address || "Av. Banzer entre 3er y 4to Anillo"}</div>
					<div style="font-size: 9px; font-weight: normal; margin-bottom: 1px;">Teléfono: ${invoiceData.company_phone || "3345678"}</div>
					<div style="font-size: 9px; font-weight: normal; margin-bottom: 2px;">${invoiceData.company_city || "Santa Cruz - Bolivia"}</div>
					<div style="font-size: 8px; font-weight: normal; text-transform: uppercase; line-height: 1.2; padding: 0 4px; color: #333;">
						Actividad: VENTA DE AUTO PARTES Y ACCESORIOS DE VEHÍCULOS
					</div>
					<div style="font-size: 13px; font-weight: bold; letter-spacing: 0.5px; margin-top: 8px; border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 4px 0;">
						${displayHeader}
					</div>
				</div>

				<div class="tributary-panel" style="font-size: 10px; margin: 10px 0; border: 1px solid #000; padding: 6px; border-radius: 4px; line-height: 1.4; font-family: monospace;">
					<div><strong>NIT EMISOR:</strong> 102384729023</div>
					<div><strong>NRO. FACTURA:</strong> ${invoiceNumber}</div>
					<div><strong>NRO. AUTORIZACIÓN (CUF):</strong></div>
					<div style="font-size: 7.5px; word-break: break-all; margin-top: 2px; line-height: 1.1; font-weight: normal;">${cuf}</div>
				</div>

				<div class="invoice-info" style="font-size: 10.5px; margin-bottom: 10px; line-height: 1.4; border-bottom: 1px dashed #000; padding-bottom: 8px;">
					<div style="display: flex; justify-content: space-between;"><span><strong>Fecha:</strong></span><span>${new Date(invoiceData.posting_date || Date.now()).toLocaleDateString()}</span></div>
					<div style="display: flex; justify-content: space-between;"><span><strong>Nombre/Razón Social:</strong></span><span>${customerName}</span></div>
					<div style="display: flex; justify-content: space-between;"><span><strong>NIT/CI:</strong></span><span>${customerTaxId}</span></div>
					${
						sellerName
							? `<div style="display: flex; justify-content: space-between;"><span><strong>Vendedor:</strong></span><span>${sellerName}</span></div>`
							: ""
					}
				</div>

				<div class="items-table">
					${itemsHtml}
				</div>

				<div class="totals" style="margin-top: 10px; border-top: 1px dashed #000; padding-top: 8px;">
					${
						invoiceData.total_taxes_and_charges &&
						invoiceData.total_taxes_and_charges > 0
							? `
					<div class="total-row" style="display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 11px;"><span>${__("Subtotal:")}</span><span>${formatCurrency(
									(invoiceData.grand_total || 0) -
										(invoiceData.total_taxes_and_charges || 0)
							  )}</span></div>
					<div class="total-row" style="display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 11px;"><span>${__("IVA 13%:")}</span><span>${formatCurrency(
									invoiceData.total_taxes_and_charges
							  )}</span></div>`
							: ""
					}
					${
						invoiceData.discount_amount
							? `
					<div class="total-row" style="display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 11px; color: #28a745;"><span>${__("Descuento Adicional")}${
						invoiceData.additional_discount_percentage
							? ` (${Number(invoiceData.additional_discount_percentage).toFixed(
									1
							  )}%)`
							: ""
					}:</span><span>-${formatCurrency(
									Math.abs(invoiceData.discount_amount)
							  )}</span></div>`
							: ""
					}
					<div class="total-row grand-total" style="display: flex; justify-content: space-between; font-size: 14px; font-weight: bold; border-top: 2px solid #000; padding-top: 6px; margin-top: 6px;">
						<span>${__("TOTAL A PAGAR {0}:", [currencySymbol])}</span><span>${formatCurrency(invoiceData.grand_total)}</span>
					</div>
					<div class="total-row" style="display: flex; justify-content: space-between; font-size: 10.5px; margin-top: 4px; font-weight: normal;">
						<span>${__("Importe Base Crédito Fiscal:")}</span><span>${formatCurrency(invoiceData.grand_total)}</span>
					</div>
				</div>

				<div style="font-size: 9.5px; font-style: italic; margin-top: 8px; line-height: 1.3; font-weight: normal; text-align: center; border-bottom: 1px dashed #000; padding-bottom: 8px;">
					${amountInWords}
				</div>

				${
					invoiceData.payments && invoiceData.payments.length > 0
						? `
				<div class="payments" style="margin-top: 10px; padding-bottom: 8px; border-bottom: 1px dashed #000;">
					<div style="font-weight: bold; margin-bottom: 4px; font-size: 11px;">${__("Detalle Pagos:")}</div>
					${invoiceData.payments
						.map(
							(p) =>
								`<div class="payment-row" style="display: flex; justify-content: space-between; margin-bottom: 2px; font-size: 10px;"><span>${
									p.mode_of_payment
								}:</span><span>${formatCurrency(p.amount)}</span></div>`
						)
						.join("")}
					<div class="payment-row total-paid" style="display: flex; justify-content: space-between; font-weight: bold; border-top: 1px solid #000; padding-top: 4px; margin-top: 4px; font-size: 10.5px;"><span>${__("Total Pagado:")}</span><span>${formatCurrency(
								paidAmount
						  )}</span></div>
					${
						invoiceData.change_amount && invoiceData.change_amount > 0
							? `<div class="payment-row" style="display: flex; justify-content: space-between; font-weight: bold; margin-top: 2px; font-size: 10.5px;"><span>${__(
									"Cambio:"
							  )}</span><span>${formatCurrency(
									invoiceData.change_amount
							  )}</span></div>`
							: ""
					}
				</div>`
						: ""
				}

				<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; margin: 15px 0;">
					<img src="${qrUrl}" alt="QR Factura" style="width: 110px; height: 110px; border: 1px solid #ddd; padding: 4px; border-radius: 4px;" />
				</div>

				<div class="footer" style="text-align: center; font-size: 8.5px; font-weight: normal; line-height: 1.3; margin-top: 10px; color: #333;">
					<div style="margin-bottom: 5px; font-weight: bold;">"ESTA FACTURA CONTRIBUYE AL DESARROLLO DEL PAÍS, EL USO ILÍCITO DE ÉSTA SERÁ SANCIONADO DE ACUERDO A LEY"</div>
					<div style="margin-bottom: 5px; font-style: italic;">"Este documento es la representación gráfica de un Documento Digital Emitido en una Modalidad de Facturación en Línea"</div>
					<div>${invoiceData.footer || __("¡Gracias por su preferencia!")}</div>
				</div>
			</div>`;
	}

	// For Quotations and Sales Orders (Pre-ventas / Cotizaciones)
	return `
			<div class="receipt">
				<div class="header" style="text-align: center; margin-bottom: 8px; border-bottom: 1px dashed #000; padding-bottom: 4px;">
					<div class="company-name" style="font-size: 15px; font-weight: bold; margin-bottom: 2px;">${invoiceData.company || ""}</div>
					${invoiceData.company_address ? `<div style="font-size: 9px; font-weight: normal; margin-bottom: 1px;">${invoiceData.company_address}</div>` : ""}
					${invoiceData.company_phone ? `<div style="font-size: 9px; font-weight: normal; margin-bottom: 1px;">Teléfono: ${invoiceData.company_phone}</div>` : ""}
					<div style="font-size: 11px; font-weight: bold; letter-spacing: 0.5px; margin-top: 2px;">${displayHeader}</div>
				</div>

				${invoiceData.is_offline ? `<div class="offline-badge" style="text-align: center; font-size: 10px; font-weight: bold; border: 1px dashed #000; padding: 3px; margin-bottom: 6px;">${__("OFFLINE — PENDING SYNC")}</div>` : ""}

				<div class="invoice-info" style="font-size: 10px; margin-bottom: 6px; line-height: 1.3; border-bottom: 1px dashed #000; padding-bottom: 4px;">
					<div style="display: flex; justify-content: space-between;"><span>${docLabel}</span><span><strong>${invoiceData.name}</strong></span></div>
					<div style="display: flex; justify-content: space-between;"><span>${__("Fecha:")}</span><span>${formatPrintDate(invoiceData.posting_date)}</span></div>
					${
						invoiceData.customer_name || invoiceData.customer
							? `<div style="display: flex; justify-content: space-between;"><span>${__("Cliente:")}</span><span>${(
									invoiceData.customer_name || invoiceData.customer
							  ).toUpperCase()}</span></div>`
							: ""
					}
					${
						sellerName
							? `<div style="display: flex; justify-content: space-between;"><span>${__("Vendedor:")}</span><span>${sellerName}</span></div>`
							: ""
					}
				</div>

				<div class="items-table" style="margin-bottom: 6px; padding: 4px 0;">
					${itemsHtml}
				</div>

				<div class="totals">
					<div class="total-row grand-total" style="display: flex; justify-content: space-between; font-size: 13px; font-weight: bold; border-top: 1px solid #000; padding-top: 4px;">
						<span>${__("TOTAL {0}:", [currencySymbol])}</span>
						<span>${formatCurrency(invoiceData.grand_total)}</span>
					</div>
				</div>

				<div class="footer" style="text-align: center; margin-top: 8px; padding-top: 4px; border-top: 1px dashed #000; font-size: 9px; font-weight: normal;">
					<div>${invoiceData.footer || __("¡Gracias por su preferencia!")}</div>
				</div>
			</div>`;
}

function buildReceiptDocumentHTML(invoiceData, { includeControls = false } = {}) {
	const controls = includeControls
		? `
			<div class="no-print" style="text-align: center; margin-top: 20px;">
				<button onclick="window.print()" style="padding: 10px 20px; font-size: 14px; cursor: pointer;">${__(
					"Print Receipt"
				)}</button>
				<button onclick="window.close()" style="padding: 10px 20px; font-size: 14px; cursor: pointer; margin-left: 10px;">${__(
					"Close"
				)}</button>
			</div>`
		: "";
	return `
		<!DOCTYPE html>
		<html>
		<head>
			<meta charset="UTF-8">
			<title>${__("Invoice - {0}", [invoiceData.name])}</title>
			<style>${RECEIPT_STYLES}</style>
		</head>
		<body>
			${buildReceiptHTML(invoiceData)}
			${controls}
		</body>
		</html>`;
}

/**
 * Resolve print format & letterhead from a POS Profile.
 * Returns defaults when the profile lookup fails so callers always get a value.
 */
async function resolvePrintSettings(posProfile, printFormat, letterhead) {
	if (printFormat) return { printFormat, letterhead };

	if (posProfile) {
		try {
			const doc = await call("frappe.client.get", {
				doctype: "POS Profile",
				name: posProfile,
			});
			if (doc) {
				return {
					printFormat: doc.print_format || DEFAULT_PRINT_FORMAT,
					letterhead: letterhead || doc.letter_head || null,
				};
			}
		} catch (err) {
			log.warn("Could not fetch POS Profile print settings:", err);
		}
	}

	return { printFormat: DEFAULT_PRINT_FORMAT, letterhead };
}

// ============================================================================
// Browser printing (opens /printview in a new window)
// ============================================================================

/**
 * Open Frappe's /printview in a new browser window.
 * The page includes trigger_print=1 so the OS print dialog appears automatically.
 * Falls back to the hardcoded receipt template if the popup is blocked.
 */
export async function printInvoice(invoiceData, printFormat = null, letterhead = null) {
	try {
		if (!invoiceData?.name) throw new Error("Invalid invoice data");

		invoiceData = await hydrateLocalOnlyInvoice(invoiceData);
		invoiceData = await hydrateInvoiceItemsWithMedidas(invoiceData);

		// Always use the unified short, simple thermal receipt layout
		return printInvoiceCustom(invoiceData);
	} catch (error) {
		log.error("Print failed:", error);
		return false;
	}
}

/**
 * Fetch an invoice by name, resolve its POS Profile print settings,
 * then open the browser print window.
 */
export async function printInvoiceByName(invoiceName, printFormat = null, letterhead = null) {
	if (isLocalOnlyInvoiceName(invoiceName)) {
		let localDoc = await hydrateLocalOnlyInvoice({ name: invoiceName });
		if (!localDoc.items?.length) {
			throw new Error(
				__(
					"This offline receipt is no longer in browser storage. Complete checkout again or sync, then print from history."
				)
			);
		}
		localDoc = await hydrateInvoiceItemsWithMedidas(localDoc);
		const settings = await resolvePrintSettings(localDoc.pos_profile, printFormat, letterhead);
		return printInvoice(localDoc, settings.printFormat, settings.letterhead);
	}
	let invoiceDoc = await call("pos_next.api.invoices.get_invoice", {
		invoice_name: invoiceName,
	});
	if (!invoiceDoc) throw new Error("Invoice not found");

	invoiceDoc = await hydrateInvoiceItemsWithMedidas(invoiceDoc);
	const settings = await resolvePrintSettings(invoiceDoc.pos_profile, printFormat, letterhead);
	return printInvoice(invoiceDoc, settings.printFormat, settings.letterhead);
}

// ============================================================================
// Silent printing (QZ Tray — no browser dialog)
// ============================================================================

export async function silentPrintDoc(doctype, name, printFormat) {
	const result = await call("frappe.www.printview.get_html_and_style", {
		doc: doctype,
		name,
		print_format: printFormat,
		no_letterhead: 1,
	});

	const html = result?.html || result?.message?.html;
	const style = result?.style || result?.message?.style || "";
	if (!html) throw new Error("Failed to get print HTML from server");

	const fullHTML = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><style>${style}</style></head>
<body>${html}</body>
</html>`;

	await qzPrintHTML(fullHTML);
	return true;
}

/**
 * Fetch the server-rendered print HTML and send it to a thermal printer
 * via QZ Tray. Uses Frappe's get_html_and_style API which returns the
 * print format HTML + its inline styles (standard.css, print style, custom CSS).
 * Note: print.bundle.css (Bootstrap grid/tables) is NOT included — print
 * formats that rely on Bootstrap layout classes may render differently.
 * Paper size and margins are controlled by the QZ Tray config in qzTray.js.
 */
export async function silentPrintInvoice(invoiceName, printFormat = null) {
	if (isLocalOnlyInvoiceName(invoiceName)) {
		let doc = await hydrateLocalOnlyInvoice({ name: invoiceName });
		if (doc.items?.length > 0) {
			doc = await hydrateInvoiceItemsWithMedidas(doc);
			return silentPrintInvoiceFromDoc(doc);
		}
		throw new Error(
			__(
				"This offline receipt is no longer in browser storage. Use browser print from the success dialog after checkout."
			)
		);
	}

	let doc = await call("pos_next.api.invoices.get_invoice", {
		invoice_name: invoiceName,
	});
	if (doc?.items?.length > 0) {
		doc = await hydrateInvoiceItemsWithMedidas(doc);
		return silentPrintInvoiceFromDoc(doc);
	}
	throw new Error("Invoice not found");
}

/**
 * Silent-print a full invoice dict using the same HTML as the offline receipt fallback.
 */
export async function silentPrintInvoiceFromDoc(invoiceData) {
	const fullHTML = buildReceiptDocumentHTML(invoiceData, { includeControls: false });
	await qzPrintHTML(fullHTML);
	log.info(`Silent print (local receipt) for ${invoiceData?.name}`);
	flagOfflineInvoicePrinted(invoiceData?.name);
	return true;
}

/**
 * Try silent print, fall back to browser print on failure.
 * silentPrintInvoice → qzPrintHTML → connect() handles auto-reconnect
 * internally, so no separate connection logic is needed here.
 */
export async function printWithSilentFallback(invoiceData, printFormat = null) {
	invoiceData = await hydrateLocalOnlyInvoice(invoiceData);
	invoiceData = await hydrateInvoiceItemsWithMedidas(invoiceData);
	const invoiceName = invoiceData?.name;
	if (!invoiceName) throw new Error("Invalid invoice data — missing name");

	try {
		await silentPrintInvoiceFromDoc(invoiceData);
		return { method: "silent", success: true };
	} catch (err) {
		log.warn("Silent local receipt failed, falling back to browser:", err?.message || err);
	}
	try {
		printInvoiceCustom(invoiceData);
		return { method: "browser", success: true };
	} catch (err) {
		log.error("Browser print for local receipt failed:", err);
		return { method: "browser", success: false };
	}
}

// ============================================================================
// Hardcoded receipt fallback (used only when /printview popup is blocked)
// ============================================================================

/**
 * Renders the receipt locally in a popup window. Used offline, for pending
 * local-only invoices, and as the fallback when /printview is unavailable.
 */
export function printInvoiceCustom(invoiceData) {
	const printWindow = window.open("", "_blank", "width=350,height=600");
	if (!printWindow) {
		log.error("Cannot open print window — popup blocked.");
		throw new Error(__("Popup blocked — check your browser settings."));
	}

	const printContent = buildReceiptDocumentHTML(invoiceData, { includeControls: true });

	printWindow.document.write(printContent);
	printWindow.document.close();
	flagOfflineInvoicePrinted(invoiceData?.name);
	return true;
}
