# Copyright (c) 2026, Mandox and contributors
# For license information, please see license.txt

from frappe.model.document import Document
from frappe.utils import flt


class POSDeliveryControl(Document):
	def validate(self):
		total_sold = 0.0
		total_delivered = 0.0
		total_pending = 0.0

		for row in self.get("items") or []:
			sold = max(0.0, flt(row.qty_sold))
			delivered = max(0.0, min(sold, flt(row.qty_delivered)))
			pending = max(0.0, flt(sold - delivered, 4))

			row.qty_sold = sold
			row.qty_delivered = delivered
			row.qty_pending = pending

			total_sold += sold
			total_delivered += delivered
			total_pending += pending

		self.total_qty_sold = flt(total_sold, 4)
		self.total_qty_delivered = flt(total_delivered, 4)
		self.total_qty_pending = flt(total_pending, 4)

		if self.status != "Anulado":
			if self.total_qty_pending <= 0.0001:
				self.status = "Entregado"
			elif self.total_qty_delivered > 0.0001:
				self.status = "Parcial"
			else:
				self.status = "Pendiente"
