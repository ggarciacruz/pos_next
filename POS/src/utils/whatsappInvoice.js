import { call } from "@/utils/apiWrapper";
import { db } from "@/utils/offline/db";
import { hydrateLocalOnlyInvoice, isLocalOnlyInvoiceName } from "@/utils/printInvoice";

function formatMoney(amount) {
	const num = Number.parseFloat(amount || 0);
	return num.toLocaleString("es-BO", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	});
}

function formatDateStr(dateStr) {
	if (!dateStr) {
		const now = new Date();
		return `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`;
	}
	const clean = String(dateStr).split(" ")[0];
	const parts = clean.split("-");
	if (parts.length === 3) {
		return `${parts[2]}/${parts[1]}/${parts[0]}`;
	}
	return clean;
}

export function extractLocalPhone(rawPhone) {
	if (!rawPhone) return "";
	const digits = String(rawPhone).replace(/\D/g, "");
	if (digits.startsWith("591") && digits.length >= 11) {
		return digits.slice(3);
	}
	return digits;
}

export function buildWhatsAppPhoneDigits(rawPhone) {
	if (!rawPhone) return "";
	const digits = String(rawPhone).replace(/\D/g, "");
	if (!digits) return "";
	if (digits.length === 8 && (digits.startsWith("6") || digits.startsWith("7"))) {
		return `591${digits}`;
	}
	return digits;
}

/**
 * Hydrates or fetches full invoice/quotation/order data and resolves the customer's phone number.
 */
export async function resolveWhatsAppDocument(inputDoc, fallbackCompany = "Muebles Ruffino") {
	let doc = typeof inputDoc === "string" ? { name: inputDoc } : { ...(inputDoc || {}) };

	if (!doc.name && doc.draft_id) {
		doc.name = doc.draft_id;
	}

	const name = doc.name || "";
	const isQuotation =
		doc.doctype === "Quotation" ||
		doc.status === "Quotation" ||
		name.includes("-QTN-") ||
		name.includes("-COT-") ||
		name.startsWith("QTN-") ||
		name.startsWith("COT-") ||
		name.startsWith("SAL-QTN-");

	const isSalesOrder =
		!isQuotation &&
		(doc.doctype === "Sales Order" ||
			name.includes("-ORD-") ||
			name.startsWith("SAL-ORD-") ||
			name.startsWith("SO-"));

	// Hydrate items if missing
	if (!Array.isArray(doc.items) || doc.items.length === 0) {
		if (isLocalOnlyInvoiceName(name)) {
			try {
				const localDoc = await hydrateLocalOnlyInvoice({ name });
				if (localDoc) {
					doc = { ...doc, ...localDoc };
				}
			} catch (e) {
				console.warn("Could not hydrate local invoice for WhatsApp:", e);
			}
		} else if (name) {
			try {
				if (isQuotation) {
					const fullQtn = await call("frappe.client.get", {
						doctype: "Quotation",
						name,
					});
					if (fullQtn) doc = { ...doc, ...fullQtn, doctype: "Quotation" };
				} else if (isSalesOrder) {
					const fullSo = await call("frappe.client.get", {
						doctype: "Sales Order",
						name,
					});
					if (fullSo) doc = { ...doc, ...fullSo, doctype: "Sales Order" };
				} else {
					const fullInv = await call("pos_next.api.invoices.get_invoice", {
						invoice_name: name,
					});
					if (fullInv) doc = { ...doc, ...fullInv, doctype: "Sales Invoice" };
				}
			} catch (e) {
				console.warn("Could not fetch server document for WhatsApp:", e);
			}
		}
	}

	// Resolve customer name & phone
	const customerId =
		typeof doc.customer === "object"
			? doc.customer?.name || doc.customer?.customer_name
			: doc.customer || doc.party_name || "";
	const customerName =
		(typeof doc.customer === "object" ? doc.customer?.customer_name : null) ||
		doc.customer_name ||
		customerId ||
		"Cliente Mostrador";

	let phone =
		doc.custom_telefono_contacto ||
		doc.contact_mobile ||
		doc.mobile_no ||
		doc.phone ||
		doc.customer_mobile_no ||
		(typeof doc.customer === "object" ? doc.customer?.mobile_no || doc.customer?.phone : "") ||
		"";

	if (!phone && customerId && customerId !== "Cliente Mostrador") {
		try {
			const cachedCust = await db.customers.get(customerId);
			if (cachedCust && (cachedCust.mobile_no || cachedCust.phone)) {
				phone = cachedCust.mobile_no || cachedCust.phone;
			}
		} catch (e) {
			// Ignore IndexedDB lookup error
		}

		if (!phone) {
			try {
				const res = await call("frappe.client.get_value", {
					doctype: "Customer",
					filters: { name: customerId },
					fieldname: ["mobile_no", "phone"],
				});
				const val = res?.message || res;
				if (val && (val.mobile_no || val.phone)) {
					phone = val.mobile_no || val.phone;
				}
			} catch (e) {
				// Ignore server lookup error
			}
		}
	}

	// Ensure signed public PDF URL is resolved for server documents
	const doctypeParam = isQuotation
		? "Quotation"
		: isSalesOrder
			? "Sales Order"
			: "Sales Invoice";

	if (!doc.public_pdf_url && name && !isLocalOnlyInvoiceName(name) && name !== "S/N") {
		try {
			const pdfRes = await call("pos_next.api.invoices.get_public_pdf_url", {
				doctype: doctypeParam,
				name,
			});
			const payload = pdfRes?.message || pdfRes;
			if (payload?.public_pdf_url) {
				doc.public_pdf_url = payload.public_pdf_url;
			}
		} catch (e) {
			console.warn("Could not fetch signed public PDF URL:", e);
		}
	}

	return {
		...doc,
		doctype: doctypeParam,
		name: name || "S/N",
		company: doc.company || fallbackCompany || "Muebles Ruffino",
		customer_display: customerName,
		resolved_phone: extractLocalPhone(phone),
		is_quotation: isQuotation,
		is_sales_order: isSalesOrder,
	};
}

/**
 * Generates the formatted WhatsApp receipt message for a Sales Invoice, Quotation, or Sales Order.
 * Follows international retail receipt standards (Stripe / Square / Shopify POS):
 * - Zero icons/emojis for 100% cross-device compatibility
 * - Zero ASCII dashed lines that wrap awkwardly on narrow screens
 * - Word-joiner (\u2060) in document code so WhatsApp never mistakes "2026-00016" for a phone number
 * - Unit price shown only when qty > 1
 * - Walk-in generic customer ("Cliente Mostrador") omitted for cleanliness
 */
export function buildWhatsAppReceiptMessage(doc) {
	if (!doc) return "";

	const company = (doc.company || "Muebles Ruffino").replace(/ - [A-Z0-9]+$/i, "").toUpperCase();
	const isQuotation = Boolean(doc.is_quotation || doc.doctype === "Quotation");
	const isSalesOrder = Boolean(doc.is_sales_order || doc.doctype === "Sales Order");

	const docTitle = isQuotation
		? "Cotización"
		: isSalesOrder
			? "Nota de Pre-venta"
			: "Nota de Venta";

	const rawDocName = String(doc.name || doc.draft_id || "S/N");
	// Prevent WhatsApp from auto-linking numeric parts like "2026-00016" as a telephone number
	const safeDocName = rawDocName.replace(/-/g, "\u2060-");
	const dateFormatted = formatDateStr(doc.posting_date || doc.transaction_date);

	const rawCustomer = String(
		doc.customer_display ||
			doc.customer_name ||
			(typeof doc.customer === "object" ? doc.customer?.customer_name : doc.customer) ||
			""
	).trim();
	const isWalkIn =
		!rawCustomer ||
		rawCustomer.toLowerCase() === "cliente mostrador" ||
		rawCustomer.toLowerCase() === "walk-in customer" ||
		rawCustomer.toLowerCase() === "s/n";

	const items = Array.isArray(doc.items) ? doc.items : [];
	let calculatedTotal = 0;

	const itemLines = items.map((it) => {
		const qty = Number.parseFloat(it.qty ?? it.quantity ?? 1) || 1;
		const rate = Number.parseFloat(it.rate ?? it.price_list_rate ?? 0) || 0;
		const lineAmt = Number.parseFloat(it.amount ?? qty * rate) || qty * rate;
		calculatedTotal += lineAmt;
		const qtyStr = Number.isInteger(qty) ? String(qty) : qty.toFixed(2);
		const itemName = it.item_name || it.item_code || "Producto";
		if (qty > 1) {
			return `${qtyStr}x ${itemName} — *Bs. ${formatMoney(lineAmt)}* _(Bs. ${formatMoney(rate)} c/u)_`;
		}
		return `${qtyStr}x ${itemName} — *Bs. ${formatMoney(lineAmt)}*`;
	});

	const grandTotal =
		Number.parseFloat(doc.grand_total ?? doc.rounded_total ?? calculatedTotal) || calculatedTotal;

	let paidAmount = 0;
	if (doc.paid_amount != null) {
		paidAmount = Number.parseFloat(doc.paid_amount) || 0;
	} else if (Array.isArray(doc.payments) && doc.payments.length > 0) {
		paidAmount = doc.payments.reduce((acc, p) => acc + (Number.parseFloat(p.amount) || 0), 0);
	} else if (doc.custom_anticipo != null) {
		paidAmount = Number.parseFloat(doc.custom_anticipo) || 0;
	}

	const outstanding =
		doc.outstanding_amount != null
			? Number.parseFloat(doc.outstanding_amount) || 0
			: Math.max(0, grandTotal - paidAmount);

	const headerLines = [
		`*${company}*`,
		`${docTitle} *${safeDocName}* · ${dateFormatted}`,
	];
	if (!isWalkIn) {
		headerLines.push(`Cliente: ${rawCustomer}`);
	}

	const totalLines = [`*Total: Bs. ${formatMoney(grandTotal)}*`];
	if (!isQuotation) {
		if (outstanding > 0.01) {
			if (paidAmount > 0.01) {
				totalLines.push(`A cuenta: Bs. ${formatMoney(paidAmount)}`);
			}
			totalLines.push(`Saldo pendiente: *Bs. ${formatMoney(outstanding)}*`);
		} else {
			totalLines.push(`Estado: Pagado`);
		}
	} else {
		totalLines.push(`_Validez de la oferta: 3 días_`);
	}

	const sections = [
		headerLines.join("\n"),
		itemLines.length > 0 ? itemLines.join("\n") : "",
		totalLines.join("\n"),
	].filter(Boolean);

	if (doc.custom_fecha_entrega || doc.custom_direccion_entrega) {
		const deliveryLines = [];
		if (doc.custom_fecha_entrega) {
			deliveryLines.push(`Entrega: ${formatDateStr(doc.custom_fecha_entrega)}`);
		}
		if (doc.custom_direccion_entrega) {
			deliveryLines.push(`Dirección: ${doc.custom_direccion_entrega}`);
		}
		if (deliveryLines.length > 0) {
			sections.push(deliveryLines.join(" · "));
		}
	}

	if (doc.public_pdf_url) {
		const fullPdfUrl = doc.public_pdf_url.startsWith("http")
			? doc.public_pdf_url
			: `${window.location.origin}${doc.public_pdf_url}`;
		sections.push(`Comprobante PDF:\n${fullPdfUrl}`);
	}

	sections.push(`Gracias por su preferencia.`);
	return sections.join("\n\n");
}

export function openWhatsAppChat(rawPhone, messageText) {
	const phoneDigits = buildWhatsAppPhoneDigits(rawPhone);
	const encodedText = encodeURIComponent(messageText || "");
	const url = phoneDigits
		? `https://wa.me/${phoneDigits}?text=${encodedText}`
		: `https://wa.me/?text=${encodedText}`;
	window.open(url, "_blank", "noopener,noreferrer");
}

/**
 * Shares the actual PDF file via Web Share API (mobile/tablet) or downloads the PDF directly (desktop).
 */
export async function shareOrDownloadReceiptPDF(doc, messageText = "") {
	if (!doc?.public_pdf_url) {
		throw new Error("El comprobante aún no tiene un PDF público disponible en el servidor.");
	}
	const fullPdfUrl = doc.public_pdf_url.startsWith("http")
		? doc.public_pdf_url
		: `${window.location.origin}${doc.public_pdf_url}`;
	const fileName = `Comprobante-${doc.name || "Venta"}.pdf`;

	// Try native Web Share API with file attachment (Android / iOS / supported browsers)
	if (typeof navigator !== "undefined" && navigator.share && navigator.canShare) {
		try {
			const response = await fetch(fullPdfUrl, { credentials: "include" });
			if (response.ok) {
				const blob = await response.blob();
				const file = new File([blob], fileName, { type: "application/pdf" });
				if (navigator.canShare({ files: [file] })) {
					await navigator.share({
						title: fileName,
						text: messageText || `Comprobante ${doc.name || ""}`,
						files: [file],
					});
					return { mode: "shared" };
				}
			}
		} catch (err) {
			if (err?.name === "AbortError") {
				return { mode: "cancelled" };
			}
			console.warn("Web Share API falló, descargando PDF directamente:", err);
		}
	}

	// Fallback for desktop PC: download the PDF file directly so the user can attach/drag it into WhatsApp Web
	const downloadUrl = `${fullPdfUrl}${fullPdfUrl.includes("?") ? "&" : "?"}download=1`;
	const link = document.createElement("a");
	link.href = downloadUrl;
	link.download = fileName;
	link.target = "_blank";
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	return { mode: "downloaded" };
}
