# Copyright (c) 2024, POS Next and contributors
# For license information, please see license.txt

"""
Shared constants for POS Next API modules.

This module contains shared constants, field lists, and default values
used across multiple API modules to maintain DRY principles.

Note: Some settings are derived from POS Profile as single source of truth:
- allow_write_off_change: derived from POS Profile (write_off_account + write_off_limit > 0)
- disable_rounded_total: uses POS Profile value directly
"""

# Fields to fetch from POS Settings
# Used by both bootstrap.py and pos_profile.py
POS_SETTINGS_FIELDS = [
	"name",
	"enabled",
	"tax_inclusive",
	"allow_user_to_edit_additional_discount",
	"allow_user_to_edit_item_discount",
	"allow_user_to_edit_rate",
	"enable_promotions",
	"use_percentage_discount",
	"max_discount_allowed",
	"allow_credit_sale",
	"allow_customer_credit_payment",
	"allow_return",
	"allow_cancel_invoice",
	"allow_partial_payment",
	"use_exact_amount",
	"decimal_precision",
	"allow_negative_stock",
	"low_stock_threshold",
	"allow_stock_entry",
	"allow_item_management",
	"cost_price_visibility",
	"enable_sales_persons",
	"silent_print",
	"enable_whatsapp_send",
	"receipt_header_title",
	"enable_siat_fiscal_format",
	"allow_print_draft_invoices",
	"enable_shift_management",
	"share_open_shift_across_users",
	"auto_post_cash_expenses",
	"auto_post_cash_differences",
	"allow_sales_order",
	"allow_quotation",
	"quotation_validity_days",
	"allow_select_sales_order",
	"create_only_sales_order",
	"create_payment_on_sales_order",
	"allow_delivery_note_on_sales_order",
	"enable_coverage_calculator",
	"coverage_uom",
	"coverage_factor_mode",
	"lock_coverage_uom_direct_sale",
	"invoice_print_format",
	"sales_order_print_format",
	"quotation_print_format",
	"default_print_mode",
	"enable_pickup_tracking",
	"enable_delivery_dispatch",
	"enable_session_lock",
	"session_lock_timeout",
	"show_variants_as_items",
	"display_item_code",
	"item_title_display",
]

# Default POS Settings values
# Used when no POS Settings found or on error
DEFAULT_POS_SETTINGS = {
	"enabled": 0,
	"tax_inclusive": 0,
	"allow_user_to_edit_additional_discount": 0,
	"allow_user_to_edit_item_discount": 1,
	"allow_user_to_edit_rate": 0,
	"enable_promotions": 0,
	"use_percentage_discount": 0,
	"max_discount_allowed": 0,
	"disable_rounded_total": 0,  # Derived from POS Profile
	"allow_credit_sale": 0,
	"allow_customer_credit_payment": 0,
	"allow_return": 0,
	"allow_cancel_invoice": 0,
	"allow_write_off_change": 0,  # Derived from POS Profile
	"allow_partial_payment": 0,
	"use_exact_amount": 0,
	"decimal_precision": "2",
	"allow_negative_stock": 0,
	"low_stock_threshold": 10,
	"allow_stock_entry": 0,
	"allow_item_management": 0,
	"cost_price_visibility": "Managers Only",
	"enable_sales_persons": "Disabled",
	"silent_print": 0,
	"default_print_mode": "Thermal Ticket (80mm)",
	"enable_whatsapp_send": 1,
	"receipt_header_title": "Recibo de Venta",
	"enable_siat_fiscal_format": 0,
	"allow_print_draft_invoices": 0,
	"enable_shift_management": 1,
	"share_open_shift_across_users": 0,
	"auto_post_cash_expenses": 0,
	"auto_post_cash_differences": 0,
	"allow_sales_order": 0,
	"allow_quotation": 0,
	"quotation_validity_days": 3,
	"allow_select_sales_order": 0,
	"create_only_sales_order": 0,
	"create_payment_on_sales_order": 0,
	"allow_delivery_note_on_sales_order": 0,
	"enable_coverage_calculator": 0,
	"coverage_uom": "",
	"coverage_factor_mode": "Multiply",
	"lock_coverage_uom_direct_sale": 1,
	"invoice_print_format": "",
	"sales_order_print_format": "",
	"quotation_print_format": "",
	"resolved_invoice_print_format": "",
	"resolved_sales_order_print_format": "",
	"resolved_quotation_print_format": "",
	"resolved_invoice_no_letterhead": 0,
	"resolved_sales_order_no_letterhead": 0,
	"resolved_quotation_no_letterhead": 0,
	"enable_pickup_tracking": 0,
	"enable_delivery_dispatch": 0,
	"enable_session_lock": 0,
	"session_lock_timeout": 5,
	"show_variants_as_items": 0,
	"display_item_code": 0,
	"item_title_display": "Item Name",
}


LEGACY_PRINT_FORMATS_BY_DOCTYPE = {
	"Sales Invoice": "Nota de Venta Muebles Ruffino",
	"Sales Order": "Nota de Pre-venta de Muebles",
	"Quotation": "Cotización de Venta de Muebles",
}

SETTINGS_PRINT_FORMAT_FIELD_BY_DOCTYPE = {
	"Sales Invoice": "invoice_print_format",
	"Sales Order": "sales_order_print_format",
	"Quotation": "quotation_print_format",
}


def get_safe_pos_settings_dict(pos_profile, require_enabled=True):
	"""
	Fetch POS Settings safely across both migrated and unmigrated multi-tenant sites.
	Intersects requested fields with actual MariaDB columns on `tabPOS Settings`
	and merges defaults for any column not yet migrated on that site.
	"""
	import frappe

	base = DEFAULT_POS_SETTINGS.copy()
	if not pos_profile:
		return base

	try:
		if not frappe.db.table_exists("POS Settings"):
			return base
		existing_cols = set(frappe.db.get_table_columns("POS Settings") or [])
		safe_fields = [f for f in POS_SETTINGS_FIELDS if f == "name" or f in existing_cols]
		if not safe_fields:
			return base

		filters = {"pos_profile": pos_profile}
		if require_enabled and "enabled" in existing_cols:
			filters["enabled"] = 1

		row = frappe.db.get_value("POS Settings", filters, safe_fields, as_dict=True)
		if not row:
			return base

		merged = base.copy()
		for k, v in row.items():
			if v is not None:
				merged[k] = v

		# Backward-compatible multi-tenant guard: on unmigrated sites that already have
		# delivery dispatch columns (e.g. fleet/truck dispatch tenants), keep it active.
		if "enable_delivery_dispatch" not in existing_cols:
			merged["enable_delivery_dispatch"] = (
				1
				if (
					frappe.db.has_column("Sales Invoice", "custom_direccion_entrega")
					or frappe.db.has_column("Sales Order", "custom_direccion_entrega")
				)
				else 0
			)
		if not merged.get("quotation_validity_days") or int(merged["quotation_validity_days"]) <= 0:
			merged["quotation_validity_days"] = 3
		return merged
	except Exception:
		frappe.log_error(frappe.get_traceback(), "Safe POS Settings Lookup Error")
		return base


THERMAL_RECEIPT_PRINT_FORMATS = {
	"POS Next Receipt",
	"MDX POS Receipt",
	"POS Invoice",
}


def resolve_pos_print_format(doctype, pos_profile=None, pos_settings=None):
	"""
	Multi-tenant safe Letter/PDF Print Format resolution cascade:
	1. Explicit POS Settings override (`invoice_print_format` / `sales_order_print_format` / `quotation_print_format`)
	2. DocType's Property Setter / Meta `default_print_format` (excluding 80mm thermal receipt formats)
	3. Legacy site Print Format ONLY if that Print Format record exists on the active site
	4. POS Profile `print_format` (for Sales Invoice, excluding 80mm thermal receipt formats)
	5. None (Frappe Standard fallback)
	"""
	import frappe

	doctype = doctype or "Sales Invoice"
	settings = pos_settings if isinstance(pos_settings, dict) else get_safe_pos_settings_dict(pos_profile)

	# 1. Explicit POS Settings field
	settings_field = SETTINGS_PRINT_FORMAT_FIELD_BY_DOCTYPE.get(doctype)
	if settings_field:
		candidate = (settings.get(settings_field) or "").strip()
		if candidate and frappe.db.exists("Print Format", candidate):
			return candidate

	# 2. Site's default_print_format (Property Setter or Meta)
	prop_pf = (
		frappe.db.get_value(
			"Property Setter",
			{"doc_type": doctype, "property": "default_print_format", "doctype_or_field": "DocType"},
			"value",
		)
		or ""
	).strip()
	if prop_pf and prop_pf not in THERMAL_RECEIPT_PRINT_FORMATS and frappe.db.exists("Print Format", prop_pf):
		return prop_pf

	try:
		meta_pf = (frappe.get_meta(doctype).default_print_format or "").strip()
		if meta_pf and meta_pf not in THERMAL_RECEIPT_PRINT_FORMATS and frappe.db.exists("Print Format", meta_pf):
			return meta_pf
	except Exception:
		pass

	# 3. Legacy fallback ONLY if that Print Format exists in this site's DB
	legacy_pf = LEGACY_PRINT_FORMATS_BY_DOCTYPE.get(doctype)
	if legacy_pf and frappe.db.exists("Print Format", legacy_pf):
		return legacy_pf

	# 4. POS Profile print_format (Sales Invoice, only if it is a custom Letter format)
	if doctype == "Sales Invoice" and pos_profile:
		profile_pf = (frappe.db.get_value("POS Profile", pos_profile, "print_format") or "").strip()
		if (
			profile_pf
			and profile_pf not in THERMAL_RECEIPT_PRINT_FORMATS
			and frappe.db.exists("Print Format", profile_pf)
		):
			return profile_pf

	return None


def _print_format_embeds_letterhead(pf_name: str) -> int:
	"""Return 1 when a custom Print Format embeds its own Letter Head HTML."""
	import frappe

	if not pf_name:
		return 0
	html = frappe.db.get_value("Print Format", pf_name, "html") or ""
	return int(
		"print-letter-head" in html
		or 'get_doc("Letter Head"' in html
		or "get_doc('Letter Head'" in html
	)


def attach_resolved_print_formats(settings, pos_profile=None):
	"""Attach resolved print format names and Sales Order-aware cancel permission to settings dict."""
	import frappe
	from frappe.utils import cint

	if not isinstance(settings, dict):
		return settings

	settings["resolved_invoice_print_format"] = (
		resolve_pos_print_format("Sales Invoice", pos_profile=pos_profile, pos_settings=settings) or ""
	)
	settings["resolved_sales_order_print_format"] = (
		resolve_pos_print_format("Sales Order", pos_profile=pos_profile, pos_settings=settings) or ""
	)
	settings["resolved_quotation_print_format"] = (
		resolve_pos_print_format("Quotation", pos_profile=pos_profile, pos_settings=settings) or ""
	)
	settings["resolved_invoice_no_letterhead"] = _print_format_embeds_letterhead(
		settings["resolved_invoice_print_format"]
	)
	settings["resolved_sales_order_no_letterhead"] = _print_format_embeds_letterhead(
		settings["resolved_sales_order_print_format"]
	)
	settings["resolved_quotation_no_letterhead"] = _print_format_embeds_letterhead(
		settings["resolved_quotation_print_format"]
	)

	target_cancel_dt = "Sales Order" if cint(settings.get("create_only_sales_order")) else "Sales Invoice"
	settings["user_can_cancel_invoice"] = cint(
		bool(
			frappe.has_permission(target_cancel_dt, "cancel")
			or "Nexus POS Manager" in frappe.get_roles()
		)
	)
	return settings
