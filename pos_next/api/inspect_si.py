import frappe

@frappe.whitelist()
def inspect_fields():
	company = frappe.get_doc("Company", "NUEVA ERA")
	print("COMPANY TAX ID (NIT):", company.tax_id)
	
	customer = frappe.get_doc("Customer", "Cliente Nueva era")
	print("CUSTOMER TAX ID:", customer.tax_id)
