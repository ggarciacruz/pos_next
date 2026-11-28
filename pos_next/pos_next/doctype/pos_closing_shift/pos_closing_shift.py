# Copyright (c) 2020, Youssef Restom and contributors
# For license information, please see license.txt

import json
from collections import defaultdict

import frappe
from erpnext.accounts.doctype.pos_invoice_merge_log.pos_invoice_merge_log import (
	consolidate_pos_invoices,
)
from frappe import _
from frappe.model.document import Document
from frappe.utils import cint, flt


def get_base_value(doc, fieldname, base_fieldname=None, conversion_rate=None):
	"""Return the value for a field in company currency."""

	base_fieldname = base_fieldname or f"base_{fieldname}"
	base_value = doc.get(base_fieldname)

	if base_value not in (None, ""):
		return flt(base_value)

	value = doc.get(fieldname)
	if value in (None, ""):
		return 0

	if conversion_rate is None:
		conversion_rate = (
			doc.get("conversion_rate")
			or doc.get("exchange_rate")
			or doc.get("target_exchange_rate")
			or doc.get("plc_conversion_rate")
			or 1
		)

	return flt(value) * flt(conversion_rate or 1)


class POSClosingShift(Document):
	def validate(self):
		existing_closing = frappe.get_all(
			"POS Closing Shift",
			filters={
				"docstatus": 1,
				"pos_opening_shift": self.pos_opening_shift,
				"name": ["!=", self.name],
			},
			pluck="name",
			limit=1,
		)

		if existing_closing:
			frappe.throw(
				_("Este turno de apertura ({0}) ya fue cerrado en {1}.").format(
					frappe.bold(self.pos_opening_shift),
					frappe.bold(existing_closing[0]),
				),
				title=_("Invalid Period"),
			)

		if frappe.db.get_value("POS Opening Shift", self.pos_opening_shift, "status") != "Open":
			frappe.throw(
				_("Selected POS Opening Shift should be open."),
				title=_("Invalid Opening Entry"),
			)
		self._compute_denominations_and_expenses()
		self.update_payment_reconciliation()

	def _compute_denominations_and_expenses(self):
		"""Normalize denomination subtotals and compute total shift petty-cash expenses."""
		kept_denoms = []
		for row in self.get("closing_denominations") or []:
			qty = cint(row.get("quantity") or 0)
			val = flt(row.get("denomination_value") or 0)
			row.subtotal = round(qty * val, 2)
			if qty > 0 and val > 0:
				kept_denoms.append(row)
		if self.get("closing_denominations") and len(kept_denoms) != len(self.get("closing_denominations")):
			self.set("closing_denominations", kept_denoms)

		kept_expenses = []
		total_exp = 0.0
		for exp in self.get("shift_expenses") or []:
			amt = round(flt(exp.get("amount") or 0), 2)
			if amt < 0:
				frappe.throw(_("El monto de un gasto de caja no puede ser negativo."))
			if amt > 0 or (exp.get("description") or "").strip():
				exp.amount = amt
				total_exp = round(total_exp + amt, 2)
				kept_expenses.append(exp)
		if self.get("shift_expenses") and len(kept_expenses) != len(self.get("shift_expenses")):
			self.set("shift_expenses", kept_expenses)
		self.total_shift_expenses = round(total_exp, 2)

	def _calculate_gross_cash_expected(self, cash_mode):
		"""Deterministically compute expected cash before shift expenses from opening + invoices + payments."""
		cash_row = next((d for d in self.payment_reconciliation if d.mode_of_payment == cash_mode), None)
		opening_cash = flt(cash_row.opening_amount) if cash_row else 0.0
		known_modes = {d.mode_of_payment for d in self.payment_reconciliation}

		net_sales_cash = 0.0
		inv_names = []
		for row in self.get("pos_transactions") or []:
			inv_name = row.get("sales_invoice")
			if inv_name:
				inv_names.append(inv_name)

		if inv_names:
			invoices_meta = {
				d.name: d
				for d in frappe.get_all(
					"Sales Invoice",
					filters={"name": ["in", inv_names]},
					fields=["name", "is_return", "conversion_rate", "change_amount", "base_change_amount"],
					limit_page_length=0,
				)
			}
			inv_payments = frappe.get_all(
				"Sales Invoice Payment",
				filters={"parent": ["in", inv_names]},
				fields=["parent", "mode_of_payment", "amount", "base_amount"],
				limit_page_length=0,
			)
			payments_by_parent = defaultdict(list)
			for p in inv_payments:
				payments_by_parent[p.parent].append(p)

			for inv_name in inv_names:
				inv = invoices_meta.get(inv_name)
				if not inv:
					continue
				rows = payments_by_parent.get(inv_name, [])
				if inv.is_return and not rows:
					continue
				conv = inv.get("conversion_rate") or 1
				for p in rows:
					mode = p.mode_of_payment
					if inv.is_return and mode not in known_modes:
						mode = cash_mode
					if mode == cash_mode:
						net_sales_cash += get_base_value(p, "amount", "base_amount", conv)
				base_change = get_base_value(inv, "change_amount", "base_change_amount", conv)
				if base_change:
					net_sales_cash -= base_change

		pe_names = [row.get("payment_entry") for row in (self.get("pos_payments") or []) if row.get("payment_entry")]
		if pe_names:
			for pe in frappe.get_all(
				"Payment Entry",
				filters={"name": ["in", pe_names], "docstatus": 1},
				fields=["name", "mode_of_payment", "paid_amount", "base_paid_amount"],
				limit_page_length=0,
			):
				if pe.mode_of_payment == cash_mode:
					net_sales_cash += get_base_value(pe, "paid_amount", "base_paid_amount")

		return flt(opening_cash + net_sales_cash)

	def update_payment_reconciliation(self):
		# update the difference values in Payment Reconciliation child table
		# get default precision for site
		precision = frappe.get_cached_value("System Settings", None, "currency_precision") or 3
		cash_mode = _get_cash_mode_of_payment(self.pos_profile)
		total_expenses = flt(self.get("total_shift_expenses") or 0)
		cash_diff = 0.0

		for d in self.payment_reconciliation:
			if d.mode_of_payment == cash_mode:
				gross_expected = self._calculate_gross_cash_expected(cash_mode)
				d.expected_amount = flt(gross_expected - total_expenses, precision)
			d.difference = +flt(d.closing_amount, precision) - flt(d.expected_amount, precision)
			if d.mode_of_payment == cash_mode:
				cash_diff += flt(d.difference)

		self.cash_difference_amount = round(cash_diff, 2)

	def on_submit(self):
		opening_entry = frappe.get_doc("POS Opening Shift", self.pos_opening_shift)
		opening_entry.pos_closing_shift = self.name
		opening_entry.set_status()
		self.delete_draft_invoices()
		opening_entry.save()
		# link invoices with this closing shift so ERPNext can block edits
		self._set_closing_entry_invoices()

		pos_settings_flags = (
			frappe.db.get_value(
				"POS Settings",
				{"pos_profile": self.pos_profile, "enabled": 1},
				["auto_post_cash_expenses", "auto_post_cash_differences"],
				as_dict=True,
			)
			or {}
		)

		# Auto-post petty-cash expense Journal Entry if enabled in POS Settings
		if flt(self.get("total_shift_expenses") or 0) > 0 and not self.get("expense_journal_entry"):
			if cint(pos_settings_flags.get("auto_post_cash_expenses") or 0):
				self.expense_journal_entry = create_shift_expense_journal_entry(self.name)

		# Auto-post cash reconciliation difference Journal Entry if enabled in POS Settings
		if abs(flt(self.get("cash_difference_amount") or 0)) >= 0.01 and not self.get("difference_journal_entry"):
			if cint(pos_settings_flags.get("auto_post_cash_differences") or 0):
				self.difference_journal_entry = create_cash_difference_journal_entry(self.name)

	def on_cancel(self):
		for je_field in ("expense_journal_entry", "difference_journal_entry"):
			je_name = self.get(je_field)
			if je_name and frappe.db.exists("Journal Entry", je_name):
				je_doc = frappe.get_doc("Journal Entry", je_name)
				if je_doc.docstatus == 1:
					je_doc.flags.ignore_permissions = True
					je_doc.cancel()
				self.db_set(je_field, None)

		if frappe.db.exists("POS Opening Shift", self.pos_opening_shift):
			opening_entry = frappe.get_doc("POS Opening Shift", self.pos_opening_shift)
			if opening_entry.pos_closing_shift == self.name:
				opening_entry.pos_closing_shift = ""
				opening_entry.set_status()
				opening_entry.save()
		# remove links from invoices so they can be cancelled
		self._clear_closing_entry_invoices()

	def _set_closing_entry_invoices(self):
		"""Set `pos_closing_entry` on linked invoices."""
		for d in self.pos_transactions:
			invoice = d.get("sales_invoice") or d.get("pos_invoice")
			if not invoice:
				continue
			doctype = "Sales Invoice" if d.get("sales_invoice") else "POS Invoice"
			if frappe.db.has_column(doctype, "pos_closing_entry"):
				frappe.db.set_value(doctype, invoice, "pos_closing_entry", self.name)

	def _clear_closing_entry_invoices(self):
		"""Clear closing shift links, cancel merge logs and cancel consolidated sales invoices."""
		consolidated_sales_invoices = set()
		for d in self.pos_transactions:
			pos_invoice = d.get("pos_invoice")
			sales_invoice = d.get("sales_invoice")
			if pos_invoice:
				if frappe.db.has_column("POS Invoice", "pos_closing_entry"):
					frappe.db.set_value("POS Invoice", pos_invoice, "pos_closing_entry", None)

				merge_logs = frappe.get_all(
					"POS Invoice Merge Log",
					filters={"pos_invoice": pos_invoice},
					pluck="name",
				)
				for log in merge_logs:
					log_doc = frappe.get_doc("POS Invoice Merge Log", log)
					for field in (
						"consolidated_invoice",
						"consolidated_credit_note",
					):
						si = log_doc.get(field)
						if si:
							consolidated_sales_invoices.add(si)
					if log_doc.docstatus == 1:
						log_doc.cancel()
					frappe.delete_doc("POS Invoice Merge Log", log_doc.name, force=1)

				if frappe.db.has_column("POS Invoice", "consolidated_invoice"):
					frappe.db.set_value("POS Invoice", pos_invoice, "consolidated_invoice", None)

				if frappe.db.has_column("POS Invoice", "status"):
					pos_doc = frappe.get_doc("POS Invoice", pos_invoice)
					pos_doc.set_status(update=True)

			if sales_invoice:
				if frappe.db.has_column("Sales Invoice", "pos_closing_entry"):
					frappe.db.set_value("Sales Invoice", sales_invoice, "pos_closing_entry", None)
				if self._is_consolidated_sales_invoice(sales_invoice):
					consolidated_sales_invoices.add(sales_invoice)

		for si in consolidated_sales_invoices:
			if frappe.db.exists("Sales Invoice", si):
				si_doc = frappe.get_doc("Sales Invoice", si)
				if si_doc.docstatus == 1:
					si_doc.cancel()

	def _is_consolidated_sales_invoice(self, sales_invoice):
		"""Return True if the Sales Invoice was generated by consolidating POS Invoices."""

		if not sales_invoice:
			return False

		if frappe.db.exists("POS Invoice Merge Log", {"consolidated_invoice": sales_invoice}):
			return True

		return bool(frappe.db.exists("POS Invoice Merge Log", {"consolidated_credit_note": sales_invoice}))

	def delete_draft_invoices(self):
		if frappe.get_value("POS Profile", self.pos_profile, "posa_allow_delete"):
			doctype = "Sales Invoice"
			data = frappe.db.sql(
				f"""
		select
		    name
		from
		    `tab{doctype}`
		where
		    docstatus = 0 and posa_is_printed = 0 and posa_pos_opening_shift = %s
		""",
				(self.pos_opening_shift),
				as_dict=1,
			)

			for invoice in data:
				frappe.delete_doc(doctype, invoice.name, force=1)

	@frappe.whitelist()
	def get_payment_reconciliation_details(self):
		company_currency = frappe.get_cached_value("Company", self.company, "default_currency")

		sales_breakdown = defaultdict(float)
		net_breakdown = defaultdict(float)
		payment_breakdown = {}

		def update_payment_breakdown(mode_of_payment, base_amount=0, currency=None, amount=0):
			if not mode_of_payment:
				return

			row = payment_breakdown.setdefault(
				mode_of_payment,
				{"base": 0.0, "currencies": defaultdict(float)},
			)
			row["base"] += flt(base_amount)
			if currency:
				row["currencies"][currency] += flt(amount)

		cash_mode_of_payment = (
			frappe.db.get_value("POS Profile", self.pos_profile, "posa_cash_mode_of_payment") or "Cash"
		)

		for row in self.get("pos_transactions", []):
			invoice = row.get("sales_invoice") or row.get("pos_invoice")
			if not invoice:
				continue

			doctype = "Sales Invoice" if row.get("sales_invoice") else "POS Invoice"
			if not frappe.db.exists(doctype, invoice):
				continue

			invoice_doc = frappe.get_cached_doc(doctype, invoice)
			currency = invoice_doc.get("currency") or company_currency
			conversion_rate = (
				invoice_doc.get("conversion_rate")
				or invoice_doc.get("exchange_rate")
				or invoice_doc.get("target_exchange_rate")
				or invoice_doc.get("plc_conversion_rate")
				or 1
			)

			sales_breakdown[currency] += flt(invoice_doc.get("grand_total") or 0)
			net_breakdown[currency] += flt(invoice_doc.get("net_total") or 0)

			for payment in invoice_doc.get("payments", []):
				update_payment_breakdown(
					payment.mode_of_payment,
					get_base_value(payment, "amount", "base_amount", conversion_rate),
					currency,
					payment.amount,
				)

			change_amount = invoice_doc.get("change_amount") or 0
			if change_amount:
				update_payment_breakdown(
					cash_mode_of_payment,
					-get_base_value(
						invoice_doc,
						"change_amount",
						"base_change_amount",
						conversion_rate,
					),
					currency,
					-change_amount,
				)

		for row in self.get("pos_payments", []):
			payment_entry = row.get("payment_entry")
			if not payment_entry or not frappe.db.exists("Payment Entry", payment_entry):
				continue

			payment_doc = frappe.get_cached_doc("Payment Entry", payment_entry)
			currency = (
				payment_doc.get("paid_from_account_currency")
				or payment_doc.get("paid_to_account_currency")
				or payment_doc.get("party_account_currency")
				or payment_doc.get("currency")
				or company_currency
			)
			base_amount = flt(payment_doc.get("base_paid_amount") or 0)
			paid_amount = flt(payment_doc.get("paid_amount") or 0)
			mode_of_payment = row.get("mode_of_payment") or payment_doc.get("mode_of_payment")

			update_payment_breakdown(mode_of_payment, base_amount, currency, paid_amount)

		mode_summaries = []
		payment_breakdown_copy = payment_breakdown.copy()
		for detail in self.get("payment_reconciliation", []):
			mop = detail.mode_of_payment
			breakdown = payment_breakdown_copy.pop(mop, None)
			currencies = []
			if breakdown:
				currencies = [
					frappe._dict({"currency": currency, "amount": amount})
					for currency, amount in sorted(breakdown["currencies"].items())
					if amount
				]

			base_total = flt(detail.expected_amount) - flt(detail.opening_amount)

			mode_summaries.append(
				frappe._dict(
					{
						"mode_of_payment": mop,
						"base_amount": base_total,
						"opening_amount": flt(detail.opening_amount),
						"expected_amount": flt(detail.expected_amount),
						"difference": flt(detail.difference),
						"currency_breakdown": currencies,
					}
				)
			)

		for mop, breakdown in payment_breakdown_copy.items():
			mode_summaries.append(
				frappe._dict(
					{
						"mode_of_payment": mop,
						"base_amount": breakdown["base"],
						"opening_amount": 0,
						"expected_amount": breakdown["base"],
						"difference": 0,
						"currency_breakdown": [
							frappe._dict({"currency": currency, "amount": amount})
							for currency, amount in sorted(breakdown["currencies"].items())
							if amount
						],
					}
				)
			)

		sales_currency_breakdown = [
			frappe._dict({"currency": currency, "amount": amount})
			for currency, amount in sorted(sales_breakdown.items())
			if amount
		]
		net_currency_breakdown = [
			frappe._dict({"currency": currency, "amount": amount})
			for currency, amount in sorted(net_breakdown.items())
			if amount
		]

		return frappe.render_template(
			"pos_next/pos_next/doctype/pos_closing_shift/closing_shift_details.html",
			{
				"data": self,
				"currency": company_currency,
				"company_currency": company_currency,
				"mode_summaries": mode_summaries,
				"sales_currency_breakdown": sales_currency_breakdown,
				"net_currency_breakdown": net_currency_breakdown,
			},
		)


@frappe.whitelist()
def get_cashiers(doctype, txt, searchfield, start, page_len, filters):
	cashiers_list = frappe.get_all("POS Profile User", filters=filters, fields=["user"])
	result = []
	for cashier in cashiers_list:
		user_email = frappe.get_value("User", cashier.user, "email")
		if user_email:
			# Return list of tuples in format (value, label) where value is user ID and label shows both ID and email
			result.append([cashier.user, f"{cashier.user} ({user_email})"])
	return result


@frappe.whitelist()
def get_pos_invoices(pos_opening_shift, doctype=None):
	if not doctype:
		pos_profile = frappe.db.get_value("POS Opening Shift", pos_opening_shift, "pos_profile")
		use_pos_invoice = False
		doctype = "POS Invoice" if use_pos_invoice else "Sales Invoice"
	submit_printed_invoices(pos_opening_shift, doctype)
	cond = " and ifnull(consolidated_invoice,'') = ''" if doctype == "POS Invoice" else ""
	data = frappe.db.sql(
		f"""
	select
		name
	from
		`tab{doctype}`
	where
		docstatus = 1 and posa_pos_opening_shift = %s{cond}
	""",
		(pos_opening_shift),
		as_dict=1,
	)

	data = [frappe.get_doc(doctype, d.name).as_dict() for d in data]

	return data


@frappe.whitelist()
def get_payments_entries(pos_opening_shift):
	return frappe.get_all(
		"Payment Entry",
		filters={
			"docstatus": 1,
			"reference_no": pos_opening_shift,
			"payment_type": "Receive",
		},
		fields=[
			"name",
			"mode_of_payment",
			"paid_amount",
			"base_paid_amount",
			"target_exchange_rate",
			"reference_no",
			"posting_date",
			"party",
		],
	)


def _get_cash_mode_of_payment(pos_profile):
	"""Get the cash mode of payment for a POS profile."""
	cash_mode = frappe.get_value("POS Profile", pos_profile, "posa_cash_mode_of_payment")
	return cash_mode or "Cash"


def _aggregate_payment(payments, mode_of_payment, amount, opening_amount=0):
	"""Add or update payment amount for a mode of payment."""
	for pay in payments:
		if pay.mode_of_payment == mode_of_payment:
			pay.expected_amount += flt(amount)
			return
	payments.append(
		frappe._dict(
			{
				"mode_of_payment": mode_of_payment,
				"opening_amount": opening_amount,
				"expected_amount": flt(amount) + opening_amount,
			}
		)
	)


def _aggregate_tax(taxes, account_head, rate, amount):
	"""Add or update tax amount for an account."""
	for tax in taxes:
		if tax.account_head == account_head and tax.rate == rate:
			tax.amount += amount
			return
	taxes.append(
		frappe._dict(
			{
				"account_head": account_head,
				"rate": rate,
				"amount": amount,
			}
		)
	)


def _process_invoice(invoice, invoice_field, company_currency, cash_mode, payments, taxes, summary):
	"""Process a single invoice and update aggregates."""
	conversion_rate = invoice.get("conversion_rate")
	is_return = invoice.get("is_return", 0)

	base_grand_total = get_base_value(invoice, "grand_total", "base_grand_total", conversion_rate)
	base_net_total = get_base_value(invoice, "net_total", "base_net_total", conversion_rate)

	# Credit returns with no payment rows were added to customer credit —
	# no money entered or left the drawer.  Skip entirely.
	if is_return and not invoice.payments:
		return frappe._dict(
			{
				invoice_field: invoice.name,
				"posting_date": invoice.posting_date,
				"grand_total": 0,
				"transaction_currency": invoice.get("currency") or company_currency,
				"transaction_amount": flt(invoice.get("grand_total")),
				"customer": invoice.customer,
				"is_return": is_return,
				"return_against": invoice.get("return_against"),
			}
		)

	# Build transaction record
	transaction = frappe._dict(
		{
			invoice_field: invoice.name,
			"posting_date": invoice.posting_date,
			"grand_total": base_grand_total,
			"transaction_currency": invoice.get("currency") or company_currency,
			"transaction_amount": flt(invoice.get("grand_total")),
			"customer": invoice.customer,
			"is_return": is_return,
			"return_against": invoice.get("return_against") if is_return else None,
		}
	)

	# Update summary totals
	summary["grand_total"] += base_grand_total
	summary["net_total"] += base_net_total
	summary["total_quantity"] += flt(invoice.total_qty)

	if is_return:
		summary["returns_total"] += abs(base_grand_total)
		summary["returns_count"] += 1
	else:
		summary["sales_total"] += base_grand_total
		summary["sales_count"] += 1

	# Process taxes
	for t in invoice.taxes:
		tax_amount = get_base_value(t, "tax_amount", "base_tax_amount", conversion_rate)
		_aggregate_tax(taxes, t.account_head, t.rate, tax_amount)

	# Process payments
	#
	# Cross-branch return safety net (Layer 3):
	# Return invoices may carry foreign payment modes from the original
	# invoice's POS profile.  Remap unknown modes to the cash mode so the
	# reconciliation table stays clean.
	known_modes = {pay.mode_of_payment for pay in payments}

	# Aggregate each payment row's amount into the reconciliation buckets.
	for p in invoice.payments:
		amount = get_base_value(p, "amount", "base_amount", conversion_rate)
		mode = p.mode_of_payment

		if is_return and mode not in known_modes:
			mode = cash_mode

		_aggregate_payment(payments, mode, amount)

	# Subtract change_amount once from the cash mode.  change_amount is an
	# invoice-level field — the customer overpaid and received change back,
	# so the drawer's net gain is (sum of cash rows - change).  Handling it
	# outside the loop avoids double-subtraction when multiple payment rows
	# share the same cash mode.
	base_change = get_base_value(invoice, "change_amount", "base_change_amount", conversion_rate)
	if base_change:
		_aggregate_payment(payments, cash_mode, -base_change)

	return transaction


@frappe.whitelist()
def make_closing_shift_from_opening(opening_shift):
	from pos_next.api.shifts import _is_shared_shift_enabled, user_can_access_pos_profile

	opening_shift = json.loads(opening_shift)
	doctype = "Sales Invoice"
	invoice_field = "sales_invoice"
	pos_profile = opening_shift.get("pos_profile")
	if (
		frappe.session
		and frappe.session.user
		and frappe.session.user != "Guest"
		and not user_can_access_pos_profile(frappe.session.user, pos_profile)
	):
		frappe.throw(_("No tiene permisos para cerrar este Perfil de POS."), frappe.PermissionError)

	submit_printed_invoices(opening_shift.get("name"), doctype)

	opening_user = opening_shift.get("user")
	shared_shift = _is_shared_shift_enabled(pos_profile)
	closing_user = (
		frappe.session.user
		if (shared_shift and frappe.session and frappe.session.user and frappe.session.user != "Guest")
		else opening_user
	)

	# Initialize closing shift document
	closing_shift = frappe.new_doc("POS Closing Shift")
	closing_shift.update(
		{
			"pos_opening_shift": opening_shift.get("name"),
			"period_start_date": opening_shift.get("period_start_date"),
			"period_end_date": frappe.utils.get_datetime(),
			"pos_profile": pos_profile,
			"user": closing_user,
			"company": opening_shift.get("company"),
		}
	)

	company_currency = frappe.get_cached_value("Company", closing_shift.company, "default_currency")
	cash_mode = _get_cash_mode_of_payment(pos_profile)

	# Initialize collections
	payments = []
	taxes = []
	pos_transactions = []
	cashier_totals = {}

	# Summary for tracking totals
	summary = {
		"grand_total": 0,
		"net_total": 0,
		"total_quantity": 0,
		"returns_total": 0,
		"returns_count": 0,
		"sales_total": 0,
		"sales_count": 0,
	}

	# Add opening balances to payments
	for detail in opening_shift.get("balance_details", []):
		opening_amount = flt(detail.get("amount"))
		payments.append(
			frappe._dict(
				{
					"mode_of_payment": detail.get("mode_of_payment"),
					"opening_amount": opening_amount,
					"expected_amount": opening_amount,
				}
			)
		)

	# Process invoices
	invoices = get_pos_invoices(opening_shift.get("name"), doctype)
	for invoice in invoices:
		txn = _process_invoice(invoice, invoice_field, company_currency, cash_mode, payments, taxes, summary)
		pos_transactions.append(txn)

		is_credit_only_return = bool(invoice.get("is_return") and not invoice.get("payments"))
		if not is_credit_only_return:
			owner_user = invoice.get("owner") or opening_user
			u_row = cashier_totals.setdefault(
				owner_user,
				{"user": owner_user, "sales_count": 0, "returns_count": 0, "net_total": 0.0},
			)
			if invoice.get("is_return"):
				u_row["returns_count"] += 1
			else:
				u_row["sales_count"] += 1
			u_row["net_total"] = round(u_row["net_total"] + flt(txn.get("grand_total")), 2)

	# Process payment entries
	pos_payments_table = []
	for py in get_payments_entries(opening_shift.get("name")):
		pos_payments_table.append(
			frappe._dict(
				{
					"payment_entry": py.name,
					"mode_of_payment": py.mode_of_payment,
					"paid_amount": py.paid_amount,
					"posting_date": py.posting_date,
					"customer": py.party,
				}
			)
		)
		amount = get_base_value(py, "paid_amount", "base_paid_amount")
		_aggregate_payment(payments, py.mode_of_payment, amount)

	# Update closing shift with totals
	closing_shift.grand_total = summary["grand_total"]
	closing_shift.net_total = summary["net_total"]
	closing_shift.total_quantity = summary["total_quantity"]

	# Set child tables (without return info - that's for display only)
	closing_shift.set(
		"pos_transactions",
		[
			{k: v for k, v in txn.items() if k not in ("is_return", "return_against")}
			for txn in pos_transactions
		],
	)
	for p in payments:
		p["gross_expected_amount"] = flt(p.get("expected_amount"))
	closing_shift.set("payment_reconciliation", payments)
	closing_shift.set("taxes", taxes)
	closing_shift.set("pos_payments", pos_payments_table)
	closing_shift.usd_exchange_rate = flt(opening_shift.get("usd_exchange_rate") or 6.96)
	closing_shift.total_shift_expenses = 0

	# Resolve display names for opening cashier, closing cashier, and invoice participants
	user_ids = {u for u in (opening_user, closing_user, *cashier_totals.keys()) if u}
	full_name_map = {}
	if user_ids:
		for u in frappe.get_all(
			"User",
			filters={"name": ["in", list(user_ids)]},
			fields=["name", "full_name"],
			limit_page_length=0,
		):
			full_name_map[u.name] = u.full_name or u.name

	cashier_breakdown = sorted(
		[
			{
				**row,
				"full_name": full_name_map.get(row["user"], row["user"]),
			}
			for row in cashier_totals.values()
		],
		key=lambda r: r["net_total"],
		reverse=True,
	)

	# Build response with display-only fields
	result = closing_shift.as_dict()
	result.update(
		{
			"returns_total": summary["returns_total"],
			"returns_count": summary["returns_count"],
			"sales_total": summary["sales_total"],
			"sales_count": summary["sales_count"],
			"cash_mode_of_payment": cash_mode,
			"opened_by_user": opening_user,
			"opened_by_full_name": full_name_map.get(opening_user, opening_user or ""),
			"closed_by_user": closing_user,
			"closed_by_full_name": full_name_map.get(closing_user, closing_user or ""),
			"cashier_breakdown": cashier_breakdown,
			"opening_denominations": opening_shift.get("opening_denominations") or [],
			"opening_observations": opening_shift.get("opening_observations") or "",
			"closing_denominations": [],
			"shift_expenses": [],
			"closing_observations": "",
			"payment_reconciliation": payments,
			"pos_transactions": pos_transactions,  # Include return info for display
		}
	)

	return result


@frappe.whitelist()
def submit_closing_shift(closing_shift):
	from pos_next.api.shifts import _is_shared_shift_enabled, user_can_access_pos_profile

	closing_shift = json.loads(closing_shift)
	closing_shift_doc = frappe.get_doc(closing_shift)
	if (
		frappe.session
		and frappe.session.user
		and frappe.session.user != "Guest"
		and not user_can_access_pos_profile(frappe.session.user, closing_shift_doc.pos_profile)
	):
		frappe.throw(_("No tiene permisos para cerrar este Perfil de POS."), frappe.PermissionError)
	if (
		_is_shared_shift_enabled(closing_shift_doc.pos_profile)
		and frappe.session
		and frappe.session.user
		and frappe.session.user != "Guest"
	):
		closing_shift_doc.user = frappe.session.user
	closing_shift_doc.flags.ignore_permissions = True
	closing_shift_doc.save()
	closing_shift_doc.submit()
	return closing_shift_doc.name


def _resolve_company_account(company, number_prefixes=(), name_hints=(), root_type="Expense"):
	"""Resolve an active leaf Account in company without hardcoding tenant suffixes."""
	accounts = frappe.get_all(
		"Account",
		filters={"company": company, "is_group": 0},
		fields=["name", "account_number", "account_name", "root_type", "account_type"],
		limit_page_length=0,
	)
	for prefix in number_prefixes:
		for acc in accounts:
			if (acc.get("account_number") or "").startswith(prefix) or (acc.get("name") or "").startswith(prefix):
				return acc["name"]
	for hint in name_hints:
		hint_lower = hint.lower()
		for acc in accounts:
			if hint_lower in (acc.get("account_name") or "").lower():
				if not root_type or acc.get("root_type") == root_type:
					return acc["name"]
	if root_type:
		for acc in accounts:
			if acc.get("root_type") == root_type:
				return acc["name"]
	return None


def _resolve_cash_account_for_shift(company, cash_mode):
	acc = frappe.db.get_value(
		"Mode of Payment Account",
		{"parent": cash_mode, "company": company},
		"default_account",
	)
	if acc and frappe.db.exists("Account", acc):
		return acc
	company_cash = frappe.get_cached_value("Company", company, "default_cash_account")
	if company_cash and frappe.db.exists("Account", company_cash):
		return company_cash
	return _resolve_company_account(company, number_prefixes=("1.1.1.001",), name_hints=("Caja",), root_type="Asset")


@frappe.whitelist()
def create_shift_expense_journal_entry(closing_shift_name):
	"""
	Contabiliza los gastos menores de caja del POS Closing Shift contra la cuenta Caja,
	respetando tanto gastos Sin Factura (100% gasto) como Con Factura (87% gasto + 13% IVA CF)
	y Entregas a Rendir (1.1.2.013 Fondos a rendir).
	"""
	if not frappe.session or frappe.session.user == "Guest":
		frappe.throw(_("Debe iniciar sesión."), frappe.PermissionError)
	if not (
		frappe.has_permission("POS Closing Shift", "write")
		or frappe.has_permission("Journal Entry", "create")
		or "POSNext Cashier" in frappe.get_roles()
		or "System Manager" in frappe.get_roles()
	):
		frappe.throw(_("No tiene permisos para contabilizar gastos de caja."), frappe.PermissionError)

	doc = frappe.get_doc("POS Closing Shift", closing_shift_name)
	if doc.docstatus != 1:
		frappe.throw(_("El Cierre de Caja debe estar validado antes de contabilizar gastos."))
	if doc.get("expense_journal_entry"):
		return doc.expense_journal_entry

	expenses = [e for e in (doc.get("shift_expenses") or []) if flt(e.get("amount")) > 0]
	if not expenses:
		frappe.throw(_("Este Cierre de Caja no tiene gastos registrados para contabilizar."))

	company = doc.company
	cash_mode = _get_cash_mode_of_payment(doc.pos_profile)
	cash_account = _resolve_cash_account_for_shift(company, cash_mode)
	if not cash_account:
		frappe.throw(_("No se encontró la cuenta contable de Caja para la empresa {0}.").format(company))

	cost_center = frappe.get_cached_value("Company", company, "cost_center")
	iva_cf_account = _resolve_company_account(
		company,
		number_prefixes=("1.1.6.001",),
		name_hints=("IVA crédito fiscal", "IVA credito fiscal", "VAT"),
		root_type="Asset",
	)
	default_expense_account = (
		_resolve_company_account(company, number_prefixes=("5.2.2.029", "5.2.6.002"), name_hints=("Otros gastos",), root_type="Expense")
		or frappe.get_cached_value("Company", company, "default_expense_account")
	)

	category_account_specs = {
		"Alimentación y refrigerio": (("5.2.1.014",), ("Alimentación y refrigerio", "Alimentacion"), "Expense"),
		"Pasajes y transporte": (("5.2.1.012",), ("Pasajes",), "Expense"),
		"Agua, limpieza e insumos": (("5.2.2.005", "5.2.2.016"), ("Materiales y suministros", "limpieza"), "Expense"),
		"Fletes y carguío": (("5.2.2.006", "5.2.2.007"), ("Fletes", "Carguío"), "Expense"),
		"Combustible": (("5.2.2.020",), ("Combustible",), "Expense"),
		"Entrega a rendir": (("1.1.2.013",), ("Fondos a rendir",), "Asset"),
		"Otros gastos": (("5.2.2.029", "5.2.6.002"), ("Otros gastos",), "Expense"),
	}

	je_accounts = []
	remark_lines = [f"Gastos de Caja del Turno {doc.name} ({doc.pos_profile}):"]
	total_credit = 0.0

	for exp in expenses:
		amt = round(flt(exp.amount), 2)
		cat = exp.category or "Otros gastos"
		receipt_type = exp.receipt_type or "Sin Factura"
		inv_ref = f" [Doc: {exp.invoice_no}]" if exp.get("invoice_no") else ""
		desc_text = f"{cat}: {exp.description}{inv_ref} ({receipt_type})"
		remark_lines.append(f"- {desc_text}: Bs. {amt:,.2f}")

		prefixes, hints, rtype = category_account_specs.get(cat, (("5.2.2.029",), ("Otros gastos",), "Expense"))
		target_account = _resolve_company_account(company, number_prefixes=prefixes, name_hints=hints, root_type=rtype) or default_expense_account
		if not target_account:
			frappe.throw(_("No se encontró cuenta contable de gasto para la categoría {0}.").format(cat))

		if cat != "Entrega a rendir" and receipt_type == "Con Factura" and iva_cf_account:
			net_amt = round(amt * 0.87, 2)
			iva_amt = round(amt - net_amt, 2)
			if net_amt > 0:
				je_accounts.append(
					{
						"account": target_account,
						"debit_in_account_currency": net_amt,
						"credit_in_account_currency": 0.0,
						"cost_center": cost_center,
						"user_remark": desc_text,
					}
				)
			if iva_amt > 0:
				je_accounts.append(
					{
						"account": iva_cf_account,
						"debit_in_account_currency": iva_amt,
						"credit_in_account_currency": 0.0,
						"cost_center": cost_center,
						"user_remark": f"IVA Crédito Fiscal 13% - {desc_text}",
					}
				)
			total_credit = round(total_credit + net_amt + iva_amt, 2)
		else:
			je_accounts.append(
				{
					"account": target_account,
					"debit_in_account_currency": amt,
					"credit_in_account_currency": 0.0,
					"cost_center": cost_center,
					"user_remark": desc_text,
				}
			)
			total_credit = round(total_credit + amt, 2)

	je_accounts.append(
		{
			"account": cash_account,
			"debit_in_account_currency": 0.0,
			"credit_in_account_currency": total_credit,
			"cost_center": cost_center,
			"user_remark": f"Salida de efectivo por gastos de caja — {doc.name}",
		}
	)

	je = frappe.get_doc(
		{
			"doctype": "Journal Entry",
			"voucher_type": "Cash Entry",
			"company": company,
			"posting_date": doc.posting_date,
			"cheque_no": doc.name,
			"cheque_date": doc.posting_date,
			"user_remark": "\n".join(remark_lines),
			"accounts": je_accounts,
		}
	)
	je.flags.ignore_permissions = True
	je.insert(ignore_permissions=True)
	je.submit()

	doc.db_set("expense_journal_entry", je.name)
	return je.name


@frappe.whitelist()
def create_cash_difference_journal_entry(closing_shift_name):
	"""
	Contabiliza el faltante (gasto) o sobrante (ingreso) de efectivo del POS Closing Shift
	contra la cuenta Caja del perfil POS usando cuentas configuradas en POS Settings / Perfil POS / Empresa.
	"""
	if not frappe.session or frappe.session.user == "Guest":
		frappe.throw(_("Debe iniciar sesión."), frappe.PermissionError)
	if not (
		frappe.has_permission("POS Closing Shift", "write")
		or frappe.has_permission("Journal Entry", "create")
		or "POSNext Cashier" in frappe.get_roles()
		or "System Manager" in frappe.get_roles()
	):
		frappe.throw(_("No tiene permisos para contabilizar diferencias de caja."), frappe.PermissionError)

	doc = frappe.get_doc("POS Closing Shift", closing_shift_name)
	if doc.docstatus != 1:
		frappe.throw(_("El Cierre de Caja debe estar validado antes de contabilizar diferencias."))
	if doc.get("difference_journal_entry"):
		return doc.difference_journal_entry

	cash_mode = _get_cash_mode_of_payment(doc.pos_profile)
	cash_rows = [r for r in (doc.get("payment_reconciliation") or []) if r.mode_of_payment == cash_mode]
	expected_cash = round(sum(flt(r.expected_amount) for r in cash_rows), 2)
	closing_cash = round(sum(flt(r.closing_amount) for r in cash_rows), 2)
	diff = round(sum(flt(r.difference) for r in cash_rows), 2)
	if abs(diff) < 0.01:
		frappe.throw(_("Este Cierre de Caja no tiene diferencia de efectivo por contabilizar."))

	company = doc.company
	cash_account = _resolve_cash_account_for_shift(company, cash_mode)
	if not cash_account:
		frappe.throw(_("No se encontró la cuenta contable de Caja para la empresa {0}.").format(company))

	profile_vals = (
		frappe.db.get_value(
			"POS Profile",
			doc.pos_profile,
			["write_off_account", "write_off_cost_center", "cost_center"],
			as_dict=True,
		)
		or {}
	)
	cost_center = (
		profile_vals.get("write_off_cost_center")
		or profile_vals.get("cost_center")
		or frappe.get_cached_value("Company", company, "cost_center")
	)
	pos_settings = (
		frappe.db.get_value(
			"POS Settings",
			{"pos_profile": doc.pos_profile, "enabled": 1},
			["cash_shortage_account", "cash_overage_account"],
			as_dict=True,
		)
		or {}
	)

	is_shortage = diff < 0
	amt = round(abs(diff), 2)
	if is_shortage:
		counter_account = (
			pos_settings.get("cash_shortage_account")
			or profile_vals.get("write_off_account")
			or frappe.get_cached_value("Company", company, "write_off_account")
		)
		if not counter_account:
			frappe.throw(
				_("Configure la Cuenta de Gasto para Faltantes de Caja en POS Settings o la Cuenta de Castigo en el Perfil POS.")
			)
		diff_kind = "Faltante en Arqueo de Caja (Gasto)"
	else:
		counter_account = pos_settings.get("cash_overage_account")
		if not counter_account:
			frappe.throw(_("Configure la Cuenta de Ingreso para Sobrantes de Caja en POS Settings."))
		diff_kind = "Sobrante en Arqueo de Caja (Ingreso)"

	counter_meta = (
		frappe.db.get_value(
			"Account",
			counter_account,
			["account_type", "company", "is_group", "disabled"],
			as_dict=True,
		)
		or {}
	)
	if not counter_meta or cint(counter_meta.get("is_group")) or cint(counter_meta.get("disabled")) or counter_meta.get("company") != company:
		frappe.throw(_("La cuenta contable {0} no es válida o no está activa para la empresa {1}.").format(counter_account, company))

	cashier_label = frappe.db.get_value("User", doc.user, "full_name") or doc.name
	obs_text = (doc.get("closing_observations") or "").strip()
	remark_lines = [
		f"{diff_kind} — Cierre {doc.name} ({doc.pos_profile})",
		f"Responsable de Turno: {cashier_label}",
		f"Esperado Neto: Bs. {expected_cash:,.2f} | Contado Real: Bs. {closing_cash:,.2f} | Diferencia: Bs. {diff:,.2f}",
	]
	if obs_text:
		remark_lines.append(f"Observaciones del Cierre: {obs_text}")

	counter_row = {
		"account": counter_account,
		"debit_in_account_currency": amt if is_shortage else 0.0,
		"credit_in_account_currency": 0.0 if is_shortage else amt,
		"cost_center": cost_center,
		"user_remark": f"{diff_kind} — {doc.name}",
	}
	if counter_meta.get("account_type") in ("Receivable", "Payable"):
		employee = frappe.db.get_value("Employee", {"user_id": doc.user}, "name")
		if not employee:
			frappe.throw(
				_("La cuenta {0} exige vincular un Empleado al usuario del cajero. Use una cuenta de Gasto/Ingreso en POS Settings o vincule el Empleado.").format(
					counter_account
				)
			)
		counter_row["party_type"] = "Employee"
		counter_row["party"] = employee

	cash_je_row = {
		"account": cash_account,
		"debit_in_account_currency": 0.0 if is_shortage else amt,
		"credit_in_account_currency": amt if is_shortage else 0.0,
		"cost_center": cost_center,
		"user_remark": f"Ajuste de efectivo por {diff_kind.lower()} — {doc.name}",
	}

	je_accounts = [counter_row, cash_je_row] if is_shortage else [cash_je_row, counter_row]
	je = frappe.get_doc(
		{
			"doctype": "Journal Entry",
			"voucher_type": "Cash Entry",
			"company": company,
			"posting_date": doc.posting_date,
			"cheque_no": doc.name,
			"cheque_date": doc.posting_date,
			"user_remark": "\n".join(remark_lines),
			"accounts": je_accounts,
		}
	)
	je.flags.ignore_permissions = True
	je.insert(ignore_permissions=True)
	je.submit()

	doc.db_set("cash_difference_amount", diff)
	doc.db_set("difference_journal_entry", je.name)
	return je.name


def submit_printed_invoices(pos_opening_shift, doctype):
	invoices_list = frappe.get_all(
		doctype,
		filters={
			"posa_pos_opening_shift": pos_opening_shift,
			"docstatus": 0,
			"posa_is_printed": 1,
		},
	)
	for invoice in invoices_list:
		invoice_doc = frappe.get_doc(doctype, invoice.name)
		invoice_doc.submit()
