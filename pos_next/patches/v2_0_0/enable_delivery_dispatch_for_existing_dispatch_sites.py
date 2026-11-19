import frappe


def execute():
	"""Preserve delivery dispatch UI for existing sites that already use delivery dispatch custom columns."""
	if not frappe.db.table_exists("POS Settings") or not frappe.db.has_column(
		"POS Settings", "enable_delivery_dispatch"
	):
		return

	has_dispatch_schema = bool(
		frappe.db.has_column("Sales Invoice", "custom_direccion_entrega")
		or frappe.db.has_column("Sales Order", "custom_direccion_entrega")
	)
	if not has_dispatch_schema:
		return

	for name in frappe.get_all("POS Settings", pluck="name"):
		frappe.db.set_value("POS Settings", name, "enable_delivery_dispatch", 1, update_modified=False)
