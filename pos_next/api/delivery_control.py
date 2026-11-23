import json

import frappe
from frappe import _
from frappe.utils import cint, flt, now_datetime, nowdate


def _table_ready() -> bool:
	return bool(frappe.db.table_exists("POS Delivery Control"))


def _assert_authenticated():
	if frappe.session.user == "Guest":
		frappe.throw(_("Autenticación requerida"), frappe.AuthenticationError)


def _assert_profile_access(pos_profile: str = None, company: str = None):
	_assert_authenticated()
	if frappe.session.user == "Administrator":
		return
	if frappe.has_permission("POS Delivery Control", "read"):
		return
	if pos_profile and frappe.db.exists(
		"POS Profile User", {"parent": pos_profile, "user": frappe.session.user}
	):
		return
	if company:
		user_profiles = frappe.get_all(
			"POS Profile User", filters={"user": frappe.session.user}, pluck="parent"
		)
		if user_profiles and frappe.db.exists(
			"POS Profile", {"name": ["in", user_profiles], "company": company}
		):
			return
	frappe.throw(_("No tiene permisos para gestionar el control de entregas."), frappe.PermissionError)


def _format_qty(val: float) -> str:
	n = flt(val, 4)
	if abs(n - round(n)) < 1e-6:
		return str(int(round(n)))
	return f"{n:.2f}".rstrip("0").rstrip(".")


def _build_items_summary(entries: list) -> str:
	parts = []
	for e in entries:
		qty_str = _format_qty(e.get("qty", 0))
		uom = (e.get("uom") or "").strip()
		name = (e.get("item_name") or e.get("item_code") or "").strip()
		cov_uom = (e.get("coverage_uom") or "").strip()
		cov_qty = flt(e.get("coverage_qty") or 0)
		cov_suffix = f" ({_format_qty(cov_qty)} {cov_uom})" if cov_uom and cov_qty > 0 else ""
		uom_part = f" {uom}" if uom else ""
		parts.append(f"{qty_str}{uom_part}{cov_suffix} {name}")
	return "; ".join(parts)


def _resolve_coverage_map(item_codes: list, pos_profile: str = None) -> tuple[str, dict]:
	"""Resolve generic coverage UOM & factor per unit from POS Settings (zero hardcoding)."""
	from pos_next.api.constants import get_safe_pos_settings_dict

	settings = get_safe_pos_settings_dict(pos_profile, require_enabled=False) if pos_profile else {}
	if not cint(settings.get("enable_coverage_calculator")):
		return "", {}

	coverage_uom = (settings.get("coverage_uom") or "").strip()
	if not coverage_uom or not item_codes:
		return "", {}

	mode = (settings.get("coverage_factor_mode") or "Multiply").strip()
	rows = frappe.get_all(
		"UOM Conversion Detail",
		filters={"parent": ["in", list(set(item_codes))], "uom": coverage_uom},
		fields=["parent", "conversion_factor"],
		limit_page_length=0,
	)
	factor_map = {}
	for r in rows:
		raw = flt(r.conversion_factor)
		if raw > 0:
			factor_map[r.parent] = (1.0 / raw) if mode == "Divide" else raw
	return coverage_uom, factor_map


def _serialize_control(doc, extra: dict = None) -> dict:
	items = []
	for row in doc.get("items") or []:
		cf = flt(row.coverage_factor)
		items.append(
			{
				"name": row.name,
				"item_code": row.item_code,
				"item_name": row.item_name or row.item_code,
				"uom": row.uom or "",
				"qty_sold": flt(row.qty_sold, 4),
				"qty_delivered": flt(row.qty_delivered, 4),
				"qty_pending": flt(row.qty_pending, 4),
				"coverage_uom": row.coverage_uom or "",
				"coverage_factor": cf,
				"coverage_sold": flt(flt(row.qty_sold) * cf, 4) if cf > 0 else 0.0,
				"coverage_delivered": flt(flt(row.qty_delivered) * cf, 4) if cf > 0 else 0.0,
				"coverage_pending": flt(flt(row.qty_pending) * cf, 4) if cf > 0 else 0.0,
			}
		)

	logs = []
	for lg in reversed(doc.get("logs") or []):
		parsed_items = []
		if lg.items_json:
			try:
				parsed_items = json.loads(lg.items_json)
			except Exception:
				parsed_items = []
		logs.append(
			{
				"name": lg.name,
				"delivery_datetime": str(lg.delivery_datetime) if lg.delivery_datetime else "",
				"delivered_by": lg.delivered_by or "",
				"delivered_by_name": lg.delivered_by_name or lg.delivered_by or "",
				"received_by": lg.received_by or "",
				"notes": lg.notes or "",
				"total_qty": flt(lg.total_qty, 4),
				"items_summary": lg.items_summary or "",
				"items": parsed_items,
			}
		)

	payload = {
		"name": doc.name,
		"reference_doctype": doc.reference_doctype,
		"reference_name": doc.reference_name,
		"pos_profile": doc.pos_profile or "",
		"company": doc.company or "",
		"customer": doc.customer,
		"customer_name": doc.customer_name or doc.customer,
		"posting_date": str(doc.posting_date) if doc.posting_date else "",
		"status": doc.status or "Pendiente",
		"total_qty_sold": flt(doc.total_qty_sold, 4),
		"total_qty_delivered": flt(doc.total_qty_delivered, 4),
		"total_qty_pending": flt(doc.total_qty_pending, 4),
		"last_delivery_date": str(doc.last_delivery_date) if doc.last_delivery_date else "",
		"notes": doc.notes or "",
		"items": items,
		"logs": logs,
	}
	if extra:
		payload.update(extra)
	return payload


def create_delivery_control_for_sale(invoice_doc, pos_profile: str = None, pickup_data=None):
	"""
	Create a POS Delivery Control record after submitting a Sales Order or Sales Invoice
	when the cashier marks the sale as pending / partial pickup.
	Returns created POS Delivery Control name, or None if fully delivered on sale.
	"""
	if not _table_ready() or not invoice_doc or not pickup_data:
		return None

	if isinstance(pickup_data, str):
		try:
			pickup_data = json.loads(pickup_data)
		except Exception:
			return None

	if not isinstance(pickup_data, dict) or not cint(pickup_data.get("is_pending")):
		return None

	# Avoid duplicates for the same reference document
	existing = frappe.db.get_value(
		"POS Delivery Control",
		{
			"reference_doctype": invoice_doc.doctype,
			"reference_name": invoice_doc.name,
			"status": ["!=", "Anulado"],
		},
		"name",
	)
	if existing:
		return existing

	# Aggregate sold quantities by (item_code, uom)
	grouped_items = {}
	ordered_keys = []
	for row in invoice_doc.get("items") or []:
		code = row.get("item_code")
		qty = flt(row.get("qty"))
		if not code or qty <= 0:
			continue
		uom = (row.get("uom") or row.get("stock_uom") or "").strip()
		key = (code, uom)
		if key not in grouped_items:
			grouped_items[key] = {
				"item_code": code,
				"item_name": row.get("item_name") or code,
				"uom": uom,
				"qty_sold": 0.0,
			}
			ordered_keys.append(key)
		grouped_items[key]["qty_sold"] = flt(grouped_items[key]["qty_sold"] + qty, 4)

	if not ordered_keys:
		return None

	# Build map of quantities picked up right away at checkout
	delivered_now_map = {}
	for entry in pickup_data.get("items") or []:
		if not isinstance(entry, dict):
			continue
		code = entry.get("item_code")
		if not code:
			continue
		uom = (entry.get("uom") or "").strip()
		qty_now = max(0.0, flt(entry.get("qty_delivered_now") or 0))
		delivered_now_map[(code, uom)] = flt(delivered_now_map.get((code, uom), 0.0) + qty_now, 4)
		delivered_now_map[(code, "")] = flt(delivered_now_map.get((code, ""), 0.0) + qty_now, 4)

	coverage_uom, factor_map = _resolve_coverage_map(
		[k[0] for k in ordered_keys], pos_profile=pos_profile
	)

	control_items = []
	initial_log_entries = []
	total_pending = 0.0
	total_delivered_now = 0.0

	for key in ordered_keys:
		info = grouped_items[key]
		code, uom = key
		qty_sold = info["qty_sold"]
		raw_now = delivered_now_map.get(key)
		if raw_now is None:
			raw_now = delivered_now_map.get((code, ""), 0.0)
		qty_now = max(0.0, min(qty_sold, flt(raw_now, 4)))
		qty_pending = max(0.0, flt(qty_sold - qty_now, 4))

		cf = factor_map.get(code, 0.0) if (coverage_uom and uom != coverage_uom) else 0.0
		item_cov_uom = coverage_uom if cf > 0 else ""

		control_items.append(
			{
				"item_code": code,
				"item_name": info["item_name"],
				"uom": uom,
				"qty_sold": qty_sold,
				"qty_delivered": qty_now,
				"qty_pending": qty_pending,
				"coverage_uom": item_cov_uom,
				"coverage_factor": cf,
			}
		)
		total_pending += qty_pending
		total_delivered_now += qty_now

		if qty_now > 0.0001:
			initial_log_entries.append(
				{
					"item_code": code,
					"item_name": info["item_name"],
					"uom": uom,
					"qty": qty_now,
					"coverage_uom": item_cov_uom,
					"coverage_qty": flt(qty_now * cf, 4) if cf > 0 else 0.0,
				}
			)

	# If nothing was left pending, no control record is needed
	if total_pending <= 0.0001:
		return None

	posting_date = (
		getattr(invoice_doc, "posting_date", None)
		or getattr(invoice_doc, "transaction_date", None)
		or nowdate()
	)
	received_by = (pickup_data.get("received_by") or "").strip()[:140]
	notes = (pickup_data.get("notes") or "").strip()

	doc = frappe.new_doc("POS Delivery Control")
	doc.reference_doctype = invoice_doc.doctype
	doc.reference_name = invoice_doc.name
	doc.pos_profile = pos_profile or getattr(invoice_doc, "pos_profile", None) or ""
	doc.company = invoice_doc.company
	doc.customer = invoice_doc.customer
	doc.customer_name = getattr(invoice_doc, "customer_name", None) or invoice_doc.customer
	doc.posting_date = posting_date
	doc.notes = notes

	for ci in control_items:
		doc.append("items", ci)

	if total_delivered_now > 0.0001 and initial_log_entries:
		now_ts = now_datetime()
		doc.last_delivery_date = now_ts
		doc.append(
			"logs",
			{
				"delivery_datetime": now_ts,
				"delivered_by": frappe.session.user,
				"delivered_by_name": frappe.utils.get_fullname(frappe.session.user) or frappe.session.user,
				"received_by": received_by or doc.customer_name,
				"notes": notes or _("Entrega parcial en el momento de la venta"),
				"total_qty": flt(total_delivered_now, 4),
				"items_summary": _build_items_summary(initial_log_entries),
				"items_json": json.dumps(initial_log_entries, ensure_ascii=False),
			},
		)

	doc.flags.ignore_permissions = True
	doc.insert()
	return doc.name


def cancel_delivery_control_for_sale(reference_doctype: str, reference_name: str, reason: str = None):
	"""Mark any linked POS Delivery Control as Anulado when the underlying sale is cancelled."""
	if not _table_ready() or not reference_doctype or not reference_name:
		return []

	names = frappe.get_all(
		"POS Delivery Control",
		filters={
			"reference_doctype": reference_doctype,
			"reference_name": reference_name,
			"status": ["!=", "Anulado"],
		},
		pluck="name",
	)
	cancelled = []
	user_fullname = frappe.utils.get_fullname(frappe.session.user) or frappe.session.user
	for name in names:
		doc = frappe.get_doc("POS Delivery Control", name)
		doc.status = "Anulado"
		doc.flags.ignore_permissions = True
		msg = _("Control de entrega anulado automáticamente al cancelar {0} {1} por {2}.").format(
			reference_doctype, reference_name, user_fullname
		)
		if reason:
			msg += f" Motivo: {reason}"
		doc.add_comment("Comment", text=msg)
		doc.save()
		cancelled.append(name)
	return cancelled


def get_delivery_control_summary_for_sale(reference_doctype: str, reference_name: str):
	"""Return serialized POS Delivery Control for a specific sale if one exists, else None."""
	if not _table_ready() or not reference_doctype or not reference_name:
		return None

	name = frappe.db.get_value(
		"POS Delivery Control",
		{
			"reference_doctype": reference_doctype,
			"reference_name": reference_name,
		},
		"name",
		order_by="creation desc",
	)
	if not name:
		return None
	doc = frappe.get_doc("POS Delivery Control", name)
	return _serialize_control(doc)


@frappe.whitelist()
def get_delivery_control_for_sale(reference_doctype: str, reference_name: str):
	_assert_authenticated()
	if not _table_ready():
		return None
	if reference_doctype not in ("Sales Order", "Sales Invoice"):
		frappe.throw(_("Tipo de documento no válido"))

	name = frappe.db.get_value(
		"POS Delivery Control",
		{
			"reference_doctype": reference_doctype,
			"reference_name": reference_name,
		},
		"name",
		order_by="creation desc",
	)
	if not name:
		return None
	doc = frappe.get_doc("POS Delivery Control", name)
	_assert_profile_access(pos_profile=doc.pos_profile, company=doc.company)
	return _serialize_control(doc)


@frappe.whitelist()
def get_pending_deliveries(
	pos_profile: str,
	status_filter: str = "open",
	search: str = "",
	filter_profile: str = None,
	limit: int = 200,
) -> dict:
	"""
	List POS Delivery Control records for the POS 'Por Entregar' tab along with
	per-product custody summary (for quick physical inventory reconciliation).
	"""
	_assert_authenticated()
	if not _table_ready():
		return {
			"controls": [],
			"counts": {"pending": 0, "partial": 0, "delivered": 0, "total_open": 0},
			"product_summary": [],
		}

	if not pos_profile:
		frappe.throw(_("POS Profile is required"))

	company = frappe.db.get_value("POS Profile", pos_profile, "company")
	warehouse = frappe.db.get_value("POS Profile", pos_profile, "warehouse")
	_assert_profile_access(pos_profile=pos_profile, company=company)

	from pos_next.api.invoices import get_accessible_pos_profiles_for_scope

	target_profiles = get_accessible_pos_profiles_for_scope(
		pos_profile, filter_profile=filter_profile
	)

	base_filters = {"company": company} if company else {}
	if filter_profile and filter_profile != "ALL" and target_profiles:
		base_filters["pos_profile"] = ["in", target_profiles]

	# Counts across all statuses for badge display
	count_rows = frappe.get_all(
		"POS Delivery Control",
		filters=base_filters,
		fields=["status", "count(name) as cnt"],
		group_by="status",
	)
	counts = {"pending": 0, "partial": 0, "delivered": 0, "total_open": 0}
	for cr in count_rows:
		st = cr.get("status")
		c = cint(cr.get("cnt"))
		if st == "Pendiente":
			counts["pending"] = c
		elif st == "Parcial":
			counts["partial"] = c
		elif st == "Entregado":
			counts["delivered"] = c
	counts["total_open"] = counts["pending"] + counts["partial"]

	list_filters = dict(base_filters)
	sf = (status_filter or "open").strip()
	if sf == "open":
		list_filters["status"] = ["in", ["Pendiente", "Parcial"]]
	elif sf in ("Pendiente", "Parcial", "Entregado", "Anulado"):
		list_filters["status"] = sf
	else:
		list_filters["status"] = ["!=", "Anulado"]

	limit = min(max(cint(limit) or 200, 1), 500)
	header_rows = frappe.get_all(
		"POS Delivery Control",
		filters=list_filters,
		fields=["name"],
		order_by="modified desc",
		limit_page_length=limit,
	)
	names = [r.name for r in header_rows]

	controls = []
	so_names = []
	si_names = []
	customer_names = set()
	docs = []

	for n in names:
		d = frappe.get_doc("POS Delivery Control", n)
		docs.append(d)
		customer_names.add(d.customer)
		if d.reference_doctype == "Sales Order":
			so_names.append(d.reference_name)
		elif d.reference_doctype == "Sales Invoice":
			si_names.append(d.reference_name)

	# Batch fetch payment / financial summary for underlying sales
	sale_meta = {}
	if so_names:
		for r in frappe.get_all(
			"Sales Order",
			filters={"name": ["in", list(set(so_names))]},
			fields=["name", "grand_total", "advance_paid", "currency"],
		):
			paid = flt(r.advance_paid)
			total = flt(r.grand_total)
			sale_meta[("Sales Order", r.name)] = {
				"grand_total": total,
				"paid_amount": paid,
				"outstanding_amount": max(0.0, flt(total - paid, 2)),
				"currency": r.currency or "",
			}
	if si_names:
		for r in frappe.get_all(
			"Sales Invoice",
			filters={"name": ["in", list(set(si_names))]},
			fields=["name", "grand_total", "paid_amount", "outstanding_amount", "currency"],
		):
			sale_meta[("Sales Invoice", r.name)] = {
				"grand_total": flt(r.grand_total),
				"paid_amount": flt(r.paid_amount),
				"outstanding_amount": max(0.0, flt(r.outstanding_amount)),
				"currency": r.currency or "",
			}

	# Batch fetch customer mobile numbers for 1-click WhatsApp confirmation
	phone_map = {}
	if customer_names:
		for c in frappe.get_all(
			"Customer",
			filters={"name": ["in", list(customer_names)]},
			fields=["name", "mobile_no"],
		):
			if c.mobile_no:
				phone_map[c.name] = c.mobile_no

	search_q = (search or "").strip().lower()
	for d in docs:
		extra = sale_meta.get((d.reference_doctype, d.reference_name), {}).copy()
		extra["customer_phone"] = phone_map.get(d.customer, "")
		serialized = _serialize_control(d, extra=extra)
		if search_q:
			haystack = " ".join(
				[
					serialized["name"],
					serialized["reference_name"],
					serialized["customer"],
					serialized["customer_name"],
					" ".join(f"{it['item_code']} {it['item_name']}" for it in serialized["items"]),
				]
			).lower()
			if search_q not in haystack:
				continue
		controls.append(serialized)

	# Build per-product custody summary across ALL open controls (Pendiente / Parcial)
	open_filters = dict(base_filters)
	open_filters["status"] = ["in", ["Pendiente", "Parcial"]]
	open_names = frappe.get_all(
		"POS Delivery Control",
		filters=open_filters,
		pluck="name",
		limit_page_length=1000,
	)

	product_summary = []
	if open_names:
		item_rows = frappe.get_all(
			"POS Delivery Control Item",
			filters={"parent": ["in", open_names], "qty_pending": [">", 0]},
			fields=[
				"parent",
				"item_code",
				"item_name",
				"uom",
				"qty_pending",
				"coverage_uom",
				"coverage_factor",
			],
			limit_page_length=0,
		)
		agg = {}
		for r in item_rows:
			key = (r.item_code, r.uom or "")
			if key not in agg:
				agg[key] = {
					"item_code": r.item_code,
					"item_name": r.item_name or r.item_code,
					"uom": r.uom or "",
					"total_pending_qty": 0.0,
					"coverage_uom": r.coverage_uom or "",
					"total_pending_coverage": 0.0,
					"orders": set(),
				}
			q = flt(r.qty_pending, 4)
			cf = flt(r.coverage_factor)
			agg[key]["total_pending_qty"] = flt(agg[key]["total_pending_qty"] + q, 4)
			if cf > 0:
				agg[key]["total_pending_coverage"] = flt(
					agg[key]["total_pending_coverage"] + q * cf, 4
				)
			agg[key]["orders"].add(r.parent)

		# Attach current system stock in POS Profile warehouse for easy physical reconciliation
		stock_map = {}
		if warehouse and agg:
			codes = list({k[0] for k in agg})
			for b in frappe.get_all(
				"Bin",
				filters={"warehouse": warehouse, "item_code": ["in", codes]},
				fields=["item_code", "actual_qty"],
				limit_page_length=0,
			):
				stock_map[b.item_code] = flt(b.actual_qty, 4)

		for entry in sorted(agg.values(), key=lambda x: (-x["total_pending_qty"], x["item_name"])):
			sys_stock = stock_map.get(entry["item_code"], 0.0)
			product_summary.append(
				{
					"item_code": entry["item_code"],
					"item_name": entry["item_name"],
					"uom": entry["uom"],
					"total_pending_qty": entry["total_pending_qty"],
					"coverage_uom": entry["coverage_uom"],
					"total_pending_coverage": entry["total_pending_coverage"],
					"orders_count": len(entry["orders"]),
					"system_stock_qty": sys_stock,
					"expected_physical_qty": flt(sys_stock + entry["total_pending_qty"], 4),
				}
			)

	return {
		"controls": controls,
		"counts": counts,
		"product_summary": product_summary,
	}


@frappe.whitelist()
def record_delivery_pickup(
	control_name: str,
	items,
	received_by: str = None,
	notes: str = None,
) -> dict:
	"""
	Record a partial or final pickup against an open POS Delivery Control.
	Does NOT alter stock or accounting (100% stock was reserved/deducted at sale time).
	"""
	_assert_authenticated()
	if not _table_ready():
		frappe.throw(_("El módulo de control de entregas no está migrado en este sitio."))

	if not control_name or not frappe.db.exists("POS Delivery Control", control_name):
		frappe.throw(_("Control de entrega no encontrado."))

	if isinstance(items, str):
		try:
			items = json.loads(items)
		except Exception:
			frappe.throw(_("Formato inválido de artículos a entregar."))

	if not isinstance(items, list) or not items:
		frappe.throw(_("Debe indicar al menos un producto a entregar."))

	doc = frappe.get_doc("POS Delivery Control", control_name)
	_assert_profile_access(pos_profile=doc.pos_profile, company=doc.company)

	if doc.status == "Anulado":
		frappe.throw(_("Este control corresponde a una venta anulada."))
	if doc.status == "Entregado":
		frappe.throw(_("Esta venta ya fue entregada al 100%."))

	row_by_name = {r.name: r for r in (doc.get("items") or [])}
	row_by_key = {(r.item_code, r.uom or ""): r for r in (doc.get("items") or [])}

	delivered_entries = []
	total_delivered_now = 0.0

	for req in items:
		if not isinstance(req, dict):
			continue
		qty_now = flt(req.get("qty") or req.get("qty_to_deliver") or 0, 4)
		if qty_now <= 0:
			continue

		target_row = None
		if req.get("name") and req["name"] in row_by_name:
			target_row = row_by_name[req["name"]]
		elif req.get("item_code"):
			target_row = row_by_key.get((req["item_code"], (req.get("uom") or "").strip()))
			if not target_row:
				target_row = next(
					(r for r in (doc.get("items") or []) if r.item_code == req["item_code"]),
					None,
				)

		if not target_row:
			frappe.throw(
				_("El artículo {0} no pertenece a este control de entrega.").format(
					req.get("item_code") or ""
				)
			)

		current_pending = max(0.0, flt(flt(target_row.qty_sold) - flt(target_row.qty_delivered), 4))
		if qty_now > current_pending + 0.0001:
			frappe.throw(
				_("No puede entregar {0} {1} de {2}; el saldo pendiente es {3}.").format(
					_format_qty(qty_now),
					target_row.uom or "",
					target_row.item_name or target_row.item_code,
					_format_qty(current_pending),
				)
			)

		qty_applied = min(qty_now, current_pending)
		target_row.qty_delivered = flt(flt(target_row.qty_delivered) + qty_applied, 4)
		target_row.qty_pending = max(
			0.0, flt(flt(target_row.qty_sold) - flt(target_row.qty_delivered), 4)
		)
		total_delivered_now = flt(total_delivered_now + qty_applied, 4)

		cf = flt(target_row.coverage_factor)
		delivered_entries.append(
			{
				"item_code": target_row.item_code,
				"item_name": target_row.item_name or target_row.item_code,
				"uom": target_row.uom or "",
				"qty": qty_applied,
				"coverage_uom": target_row.coverage_uom or "",
				"coverage_qty": flt(qty_applied * cf, 4) if cf > 0 else 0.0,
			}
		)

	if total_delivered_now <= 0.0001 or not delivered_entries:
		frappe.throw(_("Ingrese una cantidad mayor a cero para registrar la entrega."))

	now_ts = now_datetime()
	clean_received_by = (received_by or "").strip()[:140] or doc.customer_name or doc.customer
	clean_notes = (notes or "").strip()
	user_fullname = frappe.utils.get_fullname(frappe.session.user) or frappe.session.user

	log_row = doc.append(
		"logs",
		{
			"delivery_datetime": now_ts,
			"delivered_by": frappe.session.user,
			"delivered_by_name": user_fullname,
			"received_by": clean_received_by,
			"notes": clean_notes,
			"total_qty": total_delivered_now,
			"items_summary": _build_items_summary(delivered_entries),
			"items_json": json.dumps(delivered_entries, ensure_ascii=False),
		},
	)
	doc.last_delivery_date = now_ts
	doc.flags.ignore_permissions = True
	doc.save()
	frappe.db.commit()

	serialized = _serialize_control(doc)
	latest_log = serialized["logs"][0] if serialized["logs"] else None

	return {
		"status": "success",
		"control": serialized,
		"log": latest_log,
	}
